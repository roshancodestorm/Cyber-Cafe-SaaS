import uuid
import hashlib
import json
import hmac
import secrets
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.print_job import (
    PrintJob,
    PRINT_STATUS_QUEUED,
    PRINT_STATUS_PRINTING,
    PRINT_STATUS_COMPLETED,
    PRINT_STATUS_FAILED,
    PRINT_STATUS_CANCELLED,
    PRINT_TERMINAL_STATUSES,
)
from app.models.permission import Permission
from app.models.document import Document
from app.schemas.print_job import PrintJobCreate, PrintJobStatusUpdate


def _idem_key(data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, default=str)
    return "pj_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


class PrintJobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, pj_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> Optional[PrintJob]:
        q = self.db.query(PrintJob).filter(PrintJob.id == pj_id)
        if tenant_id:
            q = q.filter(PrintJob.tenant_id == tenant_id)
        return q.first()

    def find_by_idempotency(self, key: str, tenant_id: uuid.UUID) -> Optional[PrintJob]:
        return self.db.query(PrintJob).filter(PrintJob.idempotency_key == key, PrintJob.tenant_id == tenant_id).first()

    def create(self, **kwargs) -> PrintJob:
        now = datetime.utcnow()
        pj = PrintJob(**kwargs)
        pj.queued_at = now
        pj.status_history = [{"from": None, "to": PRINT_STATUS_QUEUED, "at": now.isoformat()}]
        pj.audit_events = [{"event": "PRINT_QUEUED", "at": now.isoformat()}]
        self.db.add(pj)
        self.db.commit()
        self.db.refresh(pj)
        return pj

    def update_status(self, pj: PrintJob, update: PrintJobStatusUpdate) -> PrintJob:
        now = datetime.utcnow()
        history = list(pj.status_history or [])
        history.append({"from": pj.status, "to": update.new_status, "at": now.isoformat(), "actor": update.actor, "note": update.note})
        audits = list(pj.audit_events or [])
        audits.append({"event": "STATUS_" + update.new_status, "at": now.isoformat(), "actor": update.actor, "metadata": update.metadata or {}})
        pj.status = update.new_status
        pj.status_history = history
        pj.audit_events = audits
        if update.failure_reason is not None:
            pj.failure_reason = update.failure_reason
        if update.printed_pages is not None:
            pj.printed_pages = update.printed_pages
        if update.new_status == PRINT_STATUS_PRINTING and pj.printing_started_at is None:
            pj.printing_started_at = now
        if update.new_status in (PRINT_STATUS_COMPLETED, PRINT_STATUS_FAILED, PRINT_STATUS_CANCELLED):
            pj.completed_at = now
        if update.new_status == PRINT_STATUS_FAILED:
            pj.retry_count = (pj.retry_count or 0) + 1
        self.db.add(pj)
        self.db.commit()
        self.db.refresh(pj)
        return pj

    def list_for_cafe(
        self,
        cafe_id: uuid.UUID,
        tenant_id: uuid.UUID,
        page: int = 1,
        page_size: int = 50,
        status_filter: Optional[List[str]] = None,
        device_id: Optional[str] = None,
    ) -> Tuple[List[PrintJob], int]:
        q = self.db.query(PrintJob).filter(PrintJob.cafe_id == cafe_id, PrintJob.tenant_id == tenant_id)
        if status_filter:
            q = q.filter(PrintJob.status.in_(status_filter))
        if device_id:
            q = q.filter(PrintJob.device_id == device_id)
        total = q.count()
        items = q.order_by(PrintJob.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def list_for_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID, page: int = 1, page_size: int = 50) -> Tuple[List[PrintJob], int]:
        q = self.db.query(PrintJob).filter(PrintJob.user_id == user_id, PrintJob.tenant_id == tenant_id)
        total = q.count()
        items = q.order_by(PrintJob.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def list_queued_for_cafe(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, device_id: Optional[str] = None) -> List[PrintJob]:
        q = self.db.query(PrintJob).filter(
            PrintJob.cafe_id == cafe_id,
            PrintJob.tenant_id == tenant_id,
            PrintJob.status == PRINT_STATUS_QUEUED,
        )
        if device_id is not None:
            q = q.filter((PrintJob.device_id.is_(None) | (PrintJob.device_id == device_id)))
        return q.order_by(PrintJob.created_at.asc()).all()

    def assign_device(self, pj: PrintJob, device_id: str) -> PrintJob:
        pj.device_id = device_id
        self.db.add(pj)
        self.db.commit()
        self.db.refresh(pj)
        return pj

    def retry(self, pj: PrintJob, actor: Optional[str] = None) -> PrintJob:
        if (pj.retry_count or 0) >= (pj.max_retries or 0):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Max retries reached")
        now = datetime.utcnow()
        history = list(pj.status_history or [])
        history.append({"from": pj.status, "to": PRINT_STATUS_QUEUED, "at": now.isoformat(), "actor": actor, "note": "Retry"})
        audits = list(pj.audit_events or [])
        audits.append({"event": "RETRY", "at": now.isoformat(), "actor": actor})
        pj.status = PRINT_STATUS_QUEUED
        pj.status_history = history
        pj.audit_events = audits
        pj.failure_reason = None
        pj.completed_at = None
        pj.printing_started_at = None
        pj.queued_at = now
        self.db.add(pj)
        self.db.commit()
        self.db.refresh(pj)
        return pj


class PrintQueueService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PrintJobRepository(db)

    def _check_print_permission(self, document_id: uuid.UUID, user_id: uuid.UUID, tenant_id: uuid.UUID, cafe_id: uuid.UUID) -> bool:
        doc = self.db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant_id).first()
        if doc is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        if doc.user_id == user_id:
            if doc.deleted_at is None:
                return True
        perm = self.db.query(Permission).filter(
            Permission.document_id == document_id,
            Permission.user_id == user_id,
            Permission.can_print == True,
            Permission.revoked_at.is_(None),
        ).first()
        if perm is not None:
            return True
        return False

    def submit(self, data: PrintJobCreate, actor: Optional[str] = None):
        d = data.model_dump()
        if not self._check_print_permission(
            uuid.UUID(str(d["document_id"])),
            uuid.UUID(str(d["user_id"])),
            uuid.UUID(str(d["tenant_id"])),
            uuid.UUID(str(d["cafe_id"])),
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Print permission not granted")
        tenant_id = uuid.UUID(str(d["tenant_id"]))
        explicit_key = d.pop("idempotency_key", None)
        key = explicit_key or _idem_key({k: d.get(k) for k in ("document_id", "cafe_id", "user_id", "pages", "copies", "page_range_start", "page_range_end", "paper_size", "color_mode", "duplex", "print_options")})
        existing = self.repo.find_by_idempotency(key, tenant_id)
        if existing:
            return existing
        d["idempotency_key"] = key
        if d.get("page_range_start") and d.get("page_range_end"):
            if d["page_range_end"] < d["page_range_start"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid page range")
            if d["page_range_end"] > d["pages"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page range exceeds document pages")
        pj = self.repo.create(**d)
        return pj

    def update_status(self, pj_id: uuid.UUID, viewer_tenant_id: uuid.UUID, update: PrintJobStatusUpdate, viewer_cafe_id: Optional[uuid.UUID] = None) -> PrintJob:
        pj = self.repo.get_by_id(pj_id, tenant_id=viewer_tenant_id)
        if pj is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Print job not found")
        if viewer_cafe_id is not None and str(pj.cafe_id) != str(viewer_cafe_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Print job not visible")
        if pj.status in PRINT_TERMINAL_STATUSES and update.new_status not in (PRINT_STATUS_QUEUED,):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already in terminal state")
        return self.repo.update_status(pj, update)

    def retry_print(self, pj_id: uuid.UUID, viewer_tenant_id: uuid.UUID, actor: Optional[str] = None) -> PrintJob:
        pj = self.repo.get_by_id(pj_id, tenant_id=viewer_tenant_id)
        if pj is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Print job not found")
        if pj.status != PRINT_STATUS_FAILED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only failed print jobs can be retried")
        return self.repo.retry(pj, actor)

    def list_cafe_queue(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, page: int = 1, page_size: int = 50, status_filter: Optional[List[str]] = None, device_id: Optional[str] = None):
        return self.repo.list_for_cafe(cafe_id, tenant_id, page, page_size, status_filter, device_id)

    def list_user_jobs(self, user_id: uuid.UUID, tenant_id: uuid.UUID, page: int = 1, page_size: int = 50):
        return self.repo.list_for_user(user_id, tenant_id, page, page_size)

    def claim_queued_for_device(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, device_id: str) -> List[PrintJob]:
        items = self.repo.list_queued_for_cafe(cafe_id, tenant_id, device_id)
        result = []
        for pj in items:
            if pj.device_id is None:
                self.repo.assign_device(pj, device_id)
            result.append(pj)
        return result

    def get(self, pj_id: uuid.UUID, tenant_id: uuid.UUID) -> PrintJob:
        pj = self.repo.get_by_id(pj_id, tenant_id)
        if pj is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Print job not found")
        return pj
