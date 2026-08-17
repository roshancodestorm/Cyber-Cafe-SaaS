import uuid
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.job import (
    Job,
    JOB_STATUS_TRANSITIONS,
    JOB_TERMINAL_STATUSES,
    JOB_STATUS_COMPLETED,
    JOB_STATUS_CLOSED,
    JOB_STATUS_FAILED,
)


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, job_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None, cafe_id: Optional[uuid.UUID] = None) -> Optional[Job]:
        q = self.db.query(Job).filter(Job.id == job_id)
        if tenant_id is not None:
            q = q.filter(or_(Job.tenant_id == tenant_id, Job.requester_tenant_id == tenant_id))
        if cafe_id is not None:
            q = q.filter(Job.cafe_id == cafe_id)
        return q.first()

    def find_by_idempotency_key(self, key: str, tenant_id: uuid.UUID) -> Optional[Job]:
        return (
            self.db.query(Job)
            .filter(Job.idempotency_key == key, Job.tenant_id == tenant_id)
            .first()
        )

    def create(self, **kwargs) -> Job:
        job = Job(**kwargs)
        now = datetime.utcnow()
        initial = kwargs.get("status") or "NEW"
        job.status_history = job.status_history or []
        job.audit_events = job.audit_events or []
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def persist_status_transition(
        self,
        job: Job,
        new_status: str,
        actor: Optional[str] = None,
        note: Optional[str] = None,
        result: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> Job:
        now = datetime.utcnow()
        history = list(job.status_history or [])
        history.append({
            "from_status": job.status,
            "to_status": new_status,
            "transitioned_at": now.isoformat(),
            "actor": actor,
            "note": note,
        })
        job.previous_status = job.status
        job.status = new_status
        job.status_history = history
        if result is not None:
            job.result = result
        if error_message is not None:
            job.error_message = error_message
        if new_status == JOB_STATUS_COMPLETED and job.completed_at is None:
            job.completed_at = now
        if new_status == JOB_STATUS_CLOSED and job.closed_at is None:
            job.closed_at = now
        if new_status == JOB_STATUS_FAILED:
            job.retry_count = (job.retry_count or 0) + 1
        job.updated_at = now
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def append_audit_event(self, job: Job, event_type: str, actor: Optional[str] = None, metadata: Optional[dict] = None) -> Job:
        events = list(job.audit_events or [])
        events.append({
            "event_type": event_type,
            "occurred_at": datetime.utcnow().isoformat(),
            "actor": actor,
            "metadata": metadata or {},
        })
        job.audit_events = events
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def list_for_user(self, user_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Job]:
        return (
            self.db.query(Job)
            .filter(Job.user_id == user_id, Job.tenant_id == tenant_id)
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def list_for_cafe(self, cafe_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 50, status_filter: Optional[List[str]] = None) -> Tuple[List[Job], int]:
        q = self.db.query(Job).filter(Job.cafe_id == cafe_id, Job.tenant_id == tenant_id)
        if status_filter:
            q = q.filter(Job.status.in_(status_filter))
        total = q.count()
        items = q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def list_expired_candidates(self, now: Optional[datetime] = None) -> List[Job]:
        now = now or datetime.utcnow()
        return (
            self.db.query(Job)
            .filter(Job.expires_at.isnot(None), Job.expires_at <= now, ~Job.status.in_(list(JOB_TERMINAL_STATUSES)))
            .all()
        )

    def update_fields(self, job: Job, **fields) -> Job:
        for k, v in fields.items():
            setattr(job, k, v)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job
