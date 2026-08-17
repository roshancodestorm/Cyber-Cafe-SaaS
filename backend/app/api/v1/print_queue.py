from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import uuid
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.print_job import (
    PrintJobCreate,
    PrintJobResponse,
    PrintJobStatusUpdate,
    PrintJobListResponse,
    DeviceRegisterRequest,
    DeviceAuthResponse,
    PrintJobForAgent,
    PrintAgentStatusReport,
)
from app.services.print_queue_service import PrintQueueService
from app.services.notification_service import NotificationService
from app.services.event_bus import (
    EVENT_PRINT_QUEUED,
    EVENT_PRINT_STARTED,
    EVENT_PRINT_COMPLETED,
    EVENT_PRINT_FAILED,
)
from app.core.config import settings

router = APIRouter()


def _notify_print_status(db, pj, old_status, new_status, extra=None):
    extra = extra or {}
    notify = NotificationService(db)
    if new_status == old_status:
        return
    event_type = None
    if new_status == "QUEUED":
        event_type = EVENT_PRINT_QUEUED
    elif new_status == "PRINTING":
        event_type = EVENT_PRINT_STARTED
    elif new_status == "COMPLETED":
        event_type = EVENT_PRINT_COMPLETED
    elif new_status == "FAILED":
        event_type = EVENT_PRINT_FAILED
    if event_type is None:
        return
    payload = dict(extra)
    payload.setdefault("document_id", str(pj.document_id))
    payload.setdefault("cafe_id", str(pj.cafe_id))
    payload.setdefault("pages", pj.pages)
    payload.setdefault("copies", pj.copies)
    payload.setdefault("printed_pages", pj.printed_pages)
    payload.setdefault("failure_reason", pj.failure_reason)
    notify.dispatch(
        event_type,
        user_ids=[pj.user_id],
        tenant_ids=[pj.tenant_id],
        cafe_ids=[pj.cafe_id],
        payload=payload,
        entity_type="print_job",
        entity_id=str(pj.id),
    )


@router.post("", response_model=PrintJobResponse, status_code=status.HTTP_201_CREATED)
def submit_print_job(
    data: PrintJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if str(current_user.tenant_id) != str(data.tenant_id) and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant mismatch")
    svc = PrintQueueService(db)
    created = svc.submit(data, actor=str(current_user.id))
    try:
        _notify_print_status(db, created, None, created.status)
    except Exception:
        pass
    return PrintJobResponse.from_orm(created)


@router.get("/{pj_id}", response_model=PrintJobResponse)
def get_print_job(
    pj_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    pj = svc.get(pj_id, current_user.tenant_id)
    if pj.user_id != current_user.id and str(pj.cafe_id) != str(getattr(current_user, "cafe_id", None)) and not current_user.is_superuser:
        pass
    return PrintJobResponse.from_orm(pj)


@router.post("/{pj_id}/status", response_model=PrintJobResponse)
def update_print_status(
    pj_id: uuid.UUID,
    update: PrintJobStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    pj = svc.get(pj_id, current_user.tenant_id)
    old = pj.status
    result = svc.update_status(pj_id, current_user.tenant_id, update, viewer_cafe_id=None)
    try:
        _notify_print_status(db, result, old, result.new_status if hasattr(result, 'new_status') else result.status)
    except Exception:
        pass
    return PrintJobResponse.from_orm(result)


@router.post("/{pj_id}/retry", response_model=PrintJobResponse)
def retry_print_job(
    pj_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    pj = svc.retry_print(pj_id, current_user.tenant_id, actor=str(current_user.id))
    return PrintJobResponse.from_orm(pj)


@router.get("", response_model=PrintJobListResponse)
def list_print_jobs(
    current_user: User = Depends(get_current_user),
    cafe_id: Optional[uuid.UUID] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    if cafe_id is not None:
        items, total = svc.list_cafe_queue(cafe_id, current_user.tenant_id, page, page_size, status_filter)
    else:
        target_user = user_id if user_id else current_user.id
        items, total = svc.list_user_jobs(target_user, current_user.tenant_id, page, page_size)
    return PrintJobListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/agents/register", response_model=DeviceAuthResponse)
def register_print_agent(
    req: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import secrets
    device_id = "dev_" + secrets.token_urlsafe(16)
    token = secrets.token_urlsafe(48)
    expires = datetime.utcnow() + timedelta(days=30)
    return DeviceAuthResponse(
        device_id=device_id,
        access_token=token,
        token_expires_at=expires,
        cafe_id=req.cafe_id,
        polling_interval_seconds=15,
    )


@router.get("/agents/me/queued", response_model=List[PrintJobForAgent])
def agent_fetch_queued_jobs(
    cafe_id: uuid.UUID = Query(...),
    device_id: str = Query(...),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    jobs = svc.claim_queued_for_device(cafe_id, cafe_id, device_id)
    out = []
    for pj in jobs:
        doc_token = "signed_" + str(pj.id) + "_" + uuid.uuid4().hex
        out.append(
            PrintJobForAgent(
                print_job_id=pj.id,
                document_id=pj.document_id,
                pages=pj.pages,
                copies=pj.copies,
                page_range_start=pj.page_range_start,
                page_range_end=pj.page_range_end,
                paper_size=pj.paper_size,
                color_mode=pj.color_mode,
                duplex=pj.duplex,
                print_options=pj.print_options or {},
                document_download_token=doc_token,
                document_download_url=f"/api/v1/documents/{pj.document_id}/download?token={doc_token}",
                expires_at=pj.expires_at or (datetime.utcnow() + timedelta(hours=6)),
            )
        )
    return out


@router.post("/agents/me/report")
def agent_report_status(
    report: PrintAgentStatusReport,
    cafe_id: uuid.UUID = Query(...),
    device_id: str = Query(...),
    db: Session = Depends(get_db),
):
    svc = PrintQueueService(db)
    pj = svc.get(report.print_job_id, cafe_id)
    old = pj.status
    update = PrintJobStatusUpdate(
        new_status=report.status,
        failure_reason=report.failure_reason,
        printed_pages=report.printed_pages,
        actor=device_id,
        metadata=report.metadata,
    )
    result = svc.update_status(report.print_job_id, cafe_id, update, viewer_cafe_id=cafe_id)
    try:
        _notify_print_status(db, result, old, result.status, extra=report.metadata or {})
    except Exception:
        pass
    return {"acknowledged": True, "new_status": result.status}
