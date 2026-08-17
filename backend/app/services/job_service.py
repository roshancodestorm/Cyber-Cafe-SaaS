import uuid
import hashlib
import json
from typing import Optional, List, Tuple, Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.job_repository import JobRepository
from app.models.job import (
    Job,
    JOB_STATUS_TRANSITIONS,
    JOB_TERMINAL_STATUSES,
    JOB_STATUS_NEW,
    JOB_STATUS_RECEIVED,
    JOB_STATUS_CANCELLED,
    JOB_STATUS_EXPIRED,
    JOB_STATUS_COMPLETED,
    JOB_STATUS_CLOSED,
    JOB_STATUS_FAILED,
    JOB_STATUS_ACCESS_REQUESTED,
)
from app.schemas.job import JobCreate, JobTransitionRequest, JobListResponse
from app.services.permission_service import PermissionService
from app.repositories.permission_repository import PermissionRepository


def make_default_idempotency_key(data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, default=str)
    return "job_" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


class JobService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = JobRepository(db)
        self.permission_repo = PermissionRepository(db)
        self.permission_service = PermissionService(self.permission_repo)

    def _assert_tenant_visibility(self, job: Job, viewer_tenant_id: uuid.UUID, viewer_cafe_id: Optional[uuid.UUID] = None):
        if str(job.tenant_id) != str(viewer_tenant_id) and str(job.requester_tenant_id or "") != str(viewer_tenant_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        if viewer_cafe_id is not None and job.cafe_id is not None and str(job.cafe_id) != str(viewer_cafe_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not visible to this cafe")

    def create_job(self, data: JobCreate, actor: Optional[str] = None) -> Job:
        data_dict = data.model_dump()
        idem_key = data_dict.pop("idempotency_key", None) or make_default_idempotency_key({
            "t": data_dict.get("tenant_id"),
            "u": data_dict.get("user_id"),
            "c": data_dict.get("cafe_id"),
            "d": data_dict.get("document_id"),
            "ty": data_dict.get("job_type"),
            "p": data_dict.get("payload"),
        })
        existing = self.repo.find_by_idempotency_key(idem_key, uuid.UUID(str(data_dict["tenant_id"])))
        if existing is not None:
            return existing
        data_dict["idempotency_key"] = idem_key
        data_dict.setdefault("status", data_dict.get("status") or JOB_STATUS_NEW)
        job = self.repo.create(**data_dict)
        job = self.repo.append_audit_event(job, "JOB_CREATED", actor=actor, metadata={"idempotency_key": idem_key})
        return job

    def transition(self, job_id: uuid.UUID, viewer_tenant_id: uuid.UUID, req: JobTransitionRequest, viewer_cafe_id: Optional[uuid.UUID] = None) -> Job:
        job = self.repo.get_by_id(job_id, tenant_id=viewer_tenant_id, cafe_id=viewer_cafe_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        self._assert_tenant_visibility(job, viewer_tenant_id, viewer_cafe_id)
        if not job.can_transition_to(req.new_status):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from {job.status} to {req.new_status}"
            )
        if req.new_status == JOB_STATUS_FAILED and (job.retry_count or 0) >= (job.max_retries or 0):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Max retries exceeded")
        job = self.repo.persist_status_transition(
            job,
            new_status=req.new_status,
            actor=req.actor,
            note=req.note,
            result=req.result,
            error_message=req.error_message,
        )
        job = self.repo.append_audit_event(
            job,
            "STATUS_TRANSITION",
            actor=req.actor,
            metadata={"from": job.previous_status, "to": req.new_status, "note": req.note},
        )
        return job

    def cancel(self, job_id: uuid.UUID, viewer_tenant_id: uuid.UUID, actor: Optional[str] = None) -> Job:
        return self.transition(
            job_id,
            viewer_tenant_id,
            JobTransitionRequest(new_status=JOB_STATUS_CANCELLED, actor=actor, note="Cancelled by user"),
        )

    def retry(self, job_id: uuid.UUID, viewer_tenant_id: uuid.UUID, actor: Optional[str] = None) -> Job:
        job = self.repo.get_by_id(job_id, tenant_id=viewer_tenant_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        if job.status != JOB_STATUS_FAILED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only failed jobs can be retried")
        if (job.retry_count or 0) >= (job.max_retries or 0):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Max retries exceeded")
        return self.transition(job_id, viewer_tenant_id, JobTransitionRequest(new_status="PROCESSING", actor=actor))

    def get(self, job_id: uuid.UUID, viewer_tenant_id: uuid.UUID, viewer_cafe_id: Optional[uuid.UUID] = None) -> Job:
        job = self.repo.get_by_id(job_id, tenant_id=viewer_tenant_id, cafe_id=viewer_cafe_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        self._assert_tenant_visibility(job, viewer_tenant_id, viewer_cafe_id)
        return job

    def list_jobs(
        self,
        viewer_tenant_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
        cafe_id: Optional[uuid.UUID] = None,
        status_filter: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> JobListResponse:
        skip = (page - 1) * page_size
        if cafe_id is not None:
            items, total = self.repo.list_for_cafe(cafe_id, viewer_tenant_id, skip=skip, limit=page_size, status_filter=status_filter)
        elif user_id is not None:
            items = self.repo.list_for_user(user_id, viewer_tenant_id, skip=skip, limit=page_size)
            total = len(items)
        else:
            from sqlalchemy import or_ as _or
            from app.models.job import Job as _J
            q = self.db.query(_J).filter(_or(_J.tenant_id == viewer_tenant_id, _J.requester_tenant_id == viewer_tenant_id))
            if status_filter:
                q = q.filter(_J.status.in_(status_filter))
            total = q.count()
            items = q.order_by(_J.created_at.desc()).offset(skip).limit(page_size).all()
        return JobListResponse(items=items, total=total, page=page, page_size=page_size)

    def sweep_expired(self) -> int:
        now = datetime.utcnow()
        count = 0
        for j in self.repo.list_expired_candidates(now):
            try:
                req = JobTransitionRequest(new_status=JOB_STATUS_EXPIRED, actor="system", note="Automatic expiry sweep")
                self.transition(j.id, j.tenant_id, req)
                count += 1
            except Exception:
                continue
        return count
