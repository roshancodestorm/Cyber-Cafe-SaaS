import base64
import hashlib
import hmac
import io
import uuid
from datetime import datetime, timedelta

import qrcode

from app.models.document import Document
from app.models.job import Job

DOCUMENT_EXPIRY_HOURS = 24

DOCUMENT_STATES = [
    "UPLOADED", "PROCESSING", "ACTIVE", "PRINT_PENDING",
    "PRINTED", "LOCKED", "EXPIRED", "DELETED",
]


def human_friendly_id(prefix: str, entity_id: uuid.UUID) -> str:
    """Derive a stable human-friendly id like CC-2026-10291 from a uuid."""
    year = datetime.utcnow().year
    digest = int(hashlib.sha256(str(entity_id).encode()).hexdigest(), 16)
    return f"{prefix}-{year}-{digest % 100000:05d}"


def _sign(payload: str, secret: str) -> str:
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()[:16]


def generate_task_token(job_id: uuid.UUID, secret: str) -> str:
    """Create a signed, short-lived verification token for a task."""
    expires = int((datetime.utcnow() + timedelta(hours=24)).timestamp())
    payload = f"{job_id}.{expires}"
    return f"{payload}.{_sign(payload, secret)}"


ACCESS_TOKEN_MINUTES = 15


def generate_access_token(document_id: uuid.UUID, user_id: uuid.UUID, secret: str) -> dict:
    """Short-lived secure document session token (FR-06)."""
    expires = int((datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_MINUTES)).timestamp())
    payload = f"{document_id}.{user_id}.{expires}"
    return {
        "access_token": f"{payload}.{_sign(payload, secret)}",
        "expires_at": datetime.utcfromtimestamp(expires).isoformat(),
        "expires_in_seconds": ACCESS_TOKEN_MINUTES * 60,
    }


def verify_access_token(token: str, document_id: uuid.UUID, user_id: uuid.UUID, secret: str) -> None:
    """Validate a secure document session token; raise ValueError on any failure."""
    try:
        doc_raw, user_raw, expires_raw, sig = token.split(".")
    except ValueError:
        raise ValueError("Malformed token")

    payload = f"{doc_raw}.{user_raw}.{expires_raw}"
    if not hmac.compare_digest(_sign(payload, secret), sig):
        raise ValueError("Invalid token signature")
    if uuid.UUID(doc_raw) != document_id or uuid.UUID(user_raw) != user_id:
        raise ValueError("Token not issued for this user/document")
    if int(expires_raw) < datetime.utcnow().timestamp():
        raise ValueError("Token expired")


def verify_task_token(token: str, secret: str) -> uuid.UUID:
    """Verify signature + expiry; return the job id or raise ValueError."""
    try:
        job_id_raw, expires_raw, sig = token.split(".")
    except ValueError:
        raise ValueError("Malformed token")

    payload = f"{job_id_raw}.{expires_raw}"
    if not hmac.compare_digest(_sign(payload, secret), sig):
        raise ValueError("Invalid token signature")

    if int(expires_raw) < datetime.utcnow().timestamp():
        raise ValueError("Token expired")

    return uuid.UUID(job_id_raw)


def generate_task_qr(job: Job, secret: str) -> dict:
    """Generate QR (PNG base64) + human-friendly task id for a job."""
    token = generate_task_token(job.id, secret)
    task_code = human_friendly_id("CC", job.id)

    qr = qrcode.QRCode(version=None, box_size=8, border=2)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return {
        "task_id": task_code,
        "qr_png_base64": qr_base64,
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "job_id": str(job.id),
        "status": job.status,
    }


def check_document_expired(document: Document) -> Document:
    """Lazily enforce the 24-hour auto-expiry policy."""
    if document.status in ("EXPIRED", "DELETED", "LOCKED"):
        return document

    if document.created_at and datetime.utcnow() - document.created_at > timedelta(
        hours=DOCUMENT_EXPIRY_HOURS
    ):
        document.status = "EXPIRED"
    return document


def lock_document(document: Document, db) -> Document:
    """Emergency lock: revoke access, invalidate policy, audit the event."""
    from app.models.permission import Permission
    from app.models.audit_log import AuditLog

    document.status = "LOCKED"
    db.add(document)

    revoked = (
        db.query(Permission)
        .filter(Permission.document_id == document.id, Permission.is_active == True)  # noqa: E712
        .all()
    )
    for perm in revoked:
        perm.is_active = False
        perm.revoked_at = datetime.utcnow()
        db.add(perm)

    db.add(
        AuditLog(
            user_id=document.user_id,
            event_type="DOCUMENT_LOCKED",
            details=f"Document {document.id} locked by owner; {len(revoked)} active permissions revoked",
            tenant_id=document.tenant_id,
        )
    )
    db.commit()
    db.refresh(document)
    return document
