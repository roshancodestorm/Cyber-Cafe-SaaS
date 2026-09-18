import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.job import Job
from app.repositories.document_repository import DocumentRepository
from app.services.security_service import (
    generate_task_qr,
    human_friendly_id,
    lock_document,
    verify_task_token,
)

router = APIRouter()


@router.get("/tasks/{job_id}/qr")
def get_task_qr(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a signed QR code for task verification at the cafe."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return generate_task_qr(job, settings.SECRET_KEY)


@router.post("/verify-qr")
def verify_qr(
    data: dict,
    db: Session = Depends(get_db),
):
    """Cafe scans the QR; token is verified and the task summary is returned.

    Body: {"token": "<qr-token>"}
    """
    token = (data or {}).get("token", "").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="token is required")

    try:
        job_id = verify_task_token(token, settings.SECRET_KEY)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return {
        "verified": True,
        "task_id": human_friendly_id("CC", job.id),
        "job_id": str(job.id),
        "job_type": job.job_type,
        "status": job.status,
        "message": "Task verified successfully",
    }


@router.post("/documents/{document_id}/lock")
def emergency_lock_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Emergency lock: revoke all active access sessions and permissions immediately."""
    document_repo = DocumentRepository(db)
    document = document_repo.get_document_by_id(document_id)
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if document.status == "LOCKED":
        return {"status": "LOCKED", "message": "Document already locked"}

    locked = lock_document(document, db)
    return {
        "status": locked.status,
        "message": "Document locked. All active access sessions revoked.",
        "document_id": str(locked.id),
    }
