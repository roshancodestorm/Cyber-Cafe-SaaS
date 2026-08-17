"""
Secure Local Print Agent Architecture
=====================================

The Cyber Cafe Local Print Agent runs on a Windows PC at a cafe, fetches authorized
print jobs from the cloud, sends them to the OS printer, reports status back, and
securely cleans up after itself.

Principles:
  1. Device-bound authentication (device + cafe).
  2. Short-lived, one-time-use document tokens (never raw credentials).
  3. Documents streamed to temporary file, printed, then securely erased.
  4. Retry-safe, idempotent status reporting.
  5. Metadata-only logs (no PII).
  6. No user email/phone exposure.
  7. Extensible to Windows native print (Win32 Print Spooler, GDI, XPS) later.

Auth Protocol:
  POST /api/v1/print/agents/register
    { cafe_id, device_name, device_fingerprint, capabilities }
    -> { device_id, access_token, token_expires_at, polling_interval_seconds }

Poll:
  GET /api/v1/print/agents/me/queued?cafe_id=X&device_id=Y
  Bearer <device access_token>
    -> list of PrintJobForAgent with document_download_token and url

Document download:
  GET <document_download_url> with token as ?token=...
  -> binary stream (time-limited token; scoped to one print job only)

Status report:
  POST /api/v1/print/agents/me/report?cafe_id=X&device_id=Y
    { print_job_id, status, failure_reason?, printed_pages?, metadata? }
  -> { acknowledged: true, new_status }

Retry & Idempotency:
  * Status report for an already-terminal print job is a no-op but acknowledged.
  * Device polls queue repeatedly; claim is idempotent per device_id.

Security:
  * Temp files: random names in per-agent temp directory; delete on exit;
    overwrite with zeros/ones on Windows before deletion (shred-style).
  * Access tokens: rotated; scoped to one device.
  * Document download tokens: single-use, short TTL, signed with server secret.

Windows Print Adaptors (to be added):
  * adaptors/win_spooler.py  -> Win32 EnumPrinters / OpenPrinter / StartDocPrinter
  * adaptors/win_shell.py    -> ShellExecute "printto" verb for simplest deployments
  * adaptors/cups.py         -> fallback on Linux/mac dev agents
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import stat
import sys
import tempfile
import threading
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
from urllib.parse import urljoin


PRINT_STATUSES = {"QUEUED", "PRINTING", "COMPLETED", "FAILED", "CANCELLED"}


@dataclass
class AgentConfig:
    server_base_url: str
    cafe_id: str
    device_id: Optional[str] = None
    access_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    polling_interval_seconds: int = 15
    device_name: str = "CyberCafePrintAgent"
    device_fingerprint_seed: str = ""
    temp_dir: str = field(default_factory=lambda: tempfile.gettempdir())
    log_file: Optional[str] = None


def machine_fingerprint(extra_seed: str = "") -> str:
    parts = [
        os.environ.get("COMPUTERNAME", os.environ.get("HOSTNAME", "unknown")),
        str(os.getpid()),
        sys.platform,
        str(os.getuid()) if hasattr(os, "getuid") else "0",
    ]
    raw = "|".join(parts) + "|" + extra_seed
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class SecureTempFile:
    """Context manager that yields a temp path and securely removes it after use."""

    def __init__(self, suffix: str = ".tmp", dir: Optional[str] = None):
        self.suffix = suffix
        self.dir = dir
        self.path: Optional[Path] = None

    def _shred(self, path: Path):
        if not path.exists():
            return
        try:
            size = path.stat().st_size
            with open(path, "r+b") as f:
                for pattern in (b"\x00", b"\xFF", b"\x55"):
                    f.seek(0)
                    remaining = size
                    chunk = 1024 * 1024
                    while remaining > 0:
                        f.write(pattern * min(chunk, remaining))
                        remaining -= chunk
                    f.flush()
                    os.fsync(f.fileno())
        except Exception:
            pass
        try:
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass
        try:
            path.unlink()
        except Exception:
            pass

    def __enter__(self) -> Path:
        fd, raw = tempfile.mkstemp(suffix=self.suffix, dir=self.dir)
        os.close(fd)
        self.path = Path(raw)
        return self.path

    def __exit__(self, exc_type, exc, tb):
        if self.path is not None:
            self._shred(self.path)


class PrintBackend:
    """Abstract print backend. Concrete implementations target Win32, CUPS, etc."""

    def list_printers(self) -> List[Dict[str, Any]]:
        return []

    def print_file(self, path: str, printer: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> bool:
        raise NotImplementedError


class FallbackShellPrintBackend(PrintBackend):
    """Very simple dev backend: opens the file with OS 'print' verb."""

    def print_file(self, path: str, printer: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> bool:
        try:
            if sys.platform.startswith("win"):
                os.startfile(path, "print")  # type: ignore[attr-defined]
                return True
            if sys.platform == "darwin":
                return os.system(f'lpr "{path}"') == 0
            return os.system(f'lp "{path}"') == 0
        except Exception:
            return False


class CyberCafePrintAgent:
    """Reference implementation of a secure local print agent."""

    def __init__(
        self,
        config: AgentConfig,
        print_backend: Optional[PrintBackend] = None,
        http_client: Optional[Any] = None,
        on_event: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ):
        self.config = config
        self.backend = print_backend or FallbackShellPrintBackend()
        self._http = http_client  # pluggable for tests
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._on_event = on_event
        if not self.config.device_fingerprint_seed:
            self.config.device_fingerprint_seed = machine_fingerprint()

    # ----- events / logs (metadata only) -----
    def _log(self, event: str, **meta: Any):
        line = json.dumps({
            "ts": datetime.utcnow().isoformat(),
            "device_id": self.config.device_id,
            "event": event,
            "meta": meta or {},
        })
        if self._on_event:
            try:
                self._on_event(event, meta or {})
            except Exception:
                pass
        if self.config.log_file:
            try:
                with open(self.config.log_file, "a", encoding="utf-8") as f:
                    f.write(line + "\n")
            except Exception:
                pass

    # ----- auth -----
    def register_or_refresh(self) -> bool:
        # In a real agent: POST register endpoint with signed cafe assertion
        # Here we simulate: idempotent registration (real impl uses requests lib)
        self._log("register_start")
        if self.config.access_token and self.config.token_expires_at and self.config.token_expires_at > datetime.utcnow() + timedelta(hours=1):
            return True
        fp = machine_fingerprint(self.config.device_fingerprint_seed)
        self.config.device_id = self.config.device_id or ("dev_" + fp[:24])
        self.config.access_token = self.config.access_token or ("tok_" + secrets.token_urlsafe(48))
        self.config.token_expires_at = datetime.utcnow() + timedelta(days=30)
        self._log("register_ok")
        return True

    # ----- polling -----
    def fetch_jobs(self) -> List[Dict[str, Any]]:
        self._log("poll")
        # Real impl: GET /api/v1/print/agents/me/queued with headers
        return []

    def download_document(self, url: str, token: str) -> Path:
        self._log("download_start")
        # Real impl: streaming GET with short TTL token -> SecureTempFile
        raise NotImplementedError("Wire up requests/httpx streaming download")

    # ----- print workflow -----
    def handle_job(self, job: Dict[str, Any]) -> None:
        pj_id = job.get("print_job_id")
        self._log("job_start", print_job_id=pj_id)
        try:
            self.report_status(pj_id, "PRINTING")
            tmp_path = None
            try:
                with SecureTempFile(suffix=".pdf", dir=self.config.temp_dir) as path:
                    tmp_path = path
                    # real: download_document(url, token) -> writes to path
                    self._log("job_downloaded", print_job_id=pj_id)
                    ok = self.backend.print_file(
                        str(path),
                        printer=job.get("printer_name"),
                        options=job.get("print_options"),
                    )
                    if not ok:
                        raise RuntimeError("Print backend returned false")
                    self.report_status(pj_id, "COMPLETED", printed_pages=job.get("pages"))
            finally:
                # SecureTempFile already shredded on exit; this extra step is defensive
                if tmp_path and tmp_path.exists():
                    SecureTempFile()._shred(tmp_path)
        except Exception as e:
            self._log("job_failed", print_job_id=pj_id, err_type=type(e).__name__)
            self.report_status(pj_id, "FAILED", failure_reason=type(e).__name__)

    def report_status(self, pj_id: str, status: str, **extra) -> None:
        if status not in PRINT_STATUSES:
            raise ValueError(f"invalid status: {status}")
        self._log("status_report", print_job_id=pj_id, status=status, **extra)
        # Real impl: POST /api/v1/print/agents/me/report

    # ----- lifecycle -----
    def start(self):
        self.register_or_refresh()
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        self._log("agent_started")

    def stop(self):
        self._stop_event.set()
        self._log("agent_stopped")

    def _loop(self):
        while not self._stop_event.is_set():
            try:
                if self.config.token_expires_at and self.config.token_expires_at <= datetime.utcnow() + timedelta(minutes=30):
                    self.register_or_refresh()
                for job in self.fetch_jobs():
                    self.handle_job(job)
            except Exception as e:
                self._log("loop_error", err_type=type(e).__name__)
            time.sleep(max(1, self.config.polling_interval_seconds))


__all__ = [
    "AgentConfig",
    "CyberCafePrintAgent",
    "SecureTempFile",
    "PrintBackend",
    "FallbackShellPrintBackend",
    "machine_fingerprint",
]
