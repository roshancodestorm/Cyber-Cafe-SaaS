from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional, List

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobTransitionRequest,
    JobListResponse,
)
from app.services.job_service import JobService
from app.services.notification_service import NotificationService
from app.services.event_bus import (
    EVENT_JOB_CREATED,
    EVENT_ACCESS_REQUESTED,
    EVENT_ACCESS_APPROVED,
    EVENT_ACCESS_DENIED,
)

router = APIRouter()


def _notify_on_transition(db, job, old_status, new_status, payload=None):
    payload = payload or {}
    notify = NotificationService(db)
    payload.setdefault("job_id", str(job.id))
    payload.setdefault("document_id", str(job.document_id) if job.document_id else None)
    payload.setdefault("cafe_id", str(job.cafe_id) if job.cafe_id else None)
    user_ids = []
    if job.user_id:
        user_ids.append(job.user_id)
    event_map = {
        ("NEW", "ACCESS_REQUESTED"): EVENT_ACCESS_REQUESTED,
        ("ACCESS_REQUESTED", "USER_APPROVED"): EVENT_ACCESS_APPROVED,
        ("ACCESS_REQUESTED", "DENIED"): EVENT_ACCESS_DENIED,
    }
    key = (old_status, new_status)
    event_type = event_map.get(key)
    if event_type is None and old_status is None and new_status == "NEW":
        event_type = EVENT_JOB_CREATED
    if event_type:
        notify.dispatch(
            event_type,
            user_ids=user_ids,
            tenant_ids=[job.tenant_id],
            cafe_ids=[job.cafe_id] if job.cafe_id else [],
            payload=payload,
            entity_type="job",
            entity_id=str(job.id),
        )


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if str(current_user.tenant_id) != str(data.tenant_id) and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant mismatch")
    svc = JobService(db)
    created = svc.create_job(data, actor=str(current_user.id))
    try:
        _notify_on_transition(db, created, None, created.status, payload={
            "job_type": created.job_type,
        })
    except Exception:
        pass
    return JobResponse.from_orm(created)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = JobService(db)
    job = svc.get(job_id, current_user.tenant_id)
    return JobResponse.from_orm(job)


@router.post("/{job_id}/transition", response_model=JobResponse)
def transition_job(
    job_id: uuid.UUID,
    req: JobTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = JobService(db)
    existing = svc.get(job_id, current_user.tenant_id)
    old_status = existing.status
    result = svc.transition(job_id, current_user.tenant_id, req, viewer_cafe_id=None)
    try:
        _notify_on_transition(db, result, old_status, result.status, payload={"note": req.note, "error": req.error_message})
    except Exception:
        pass
    return JobResponse.from_orm(result)


@router.post("/{job_id}/cancel", response_model=JobResponse)
def cancel_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = JobService(db)
    job = svc.cancel(job_id, current_user.tenant_id, actor=str(current_user.id))
    return JobResponse.from_orm(job)


@router.post("/{job_id}/retry", response_model=JobResponse)
def retry_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = JobService(db)
    job = svc.retry(job_id, current_user.tenant_id, actor=str(current_user.id))
    return JobResponse.from_orm(job)


@router.get("", response_model=JobListResponse)
def list_jobs(
    current_user: User = Depends(get_current_user),
    user_id: Optional[uuid.UUID] = None,
    cafe_id: Optional[uuid.UUID] = None,
    status: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    svc = JobService(db)
    viewer_user_id = user_id if user_id else (None if current_user.is_superuser else current_user.id)
    return svc.list_jobs(current_user.tenant_id, viewer_user_id, cafe_id, status, page, page_size)


@router.post("/_sweep-expired")
def sweep_expired_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    svc = JobService(db)
    count = svc.sweep_expired()
    return {"expired_count": count}
