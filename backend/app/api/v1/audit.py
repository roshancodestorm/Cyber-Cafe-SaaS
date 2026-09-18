import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("/user")
def get_user_audit(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Audit history for the current user (FR-19)."""
    events = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "event_id": str(e.id),
            "event_type": e.event_type,
            "details": e.details,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@router.get("/document/{document_id}")
def get_document_audit(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Audit events for a specific document (owner only)."""
    from app.models.document import Document

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document or document.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")

    events = (
        db.query(AuditLog)
        .filter(AuditLog.details.contains(str(document_id)))
        .order_by(AuditLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "event_id": str(e.id),
            "event_type": e.event_type,
            "details": e.details,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]
