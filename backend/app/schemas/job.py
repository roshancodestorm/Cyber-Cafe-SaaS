import uuid
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime


PRINT_STATUS_QUEUED = "QUEUED"
PRINT_STATUS_PRINTING = "PRINTING"
PRINT_STATUS_COMPLETED = "COMPLETED"
PRINT_STATUS_FAILED = "FAILED"
PRINT_STATUS_CANCELLED = "CANCELLED"

PRINT_TERMINAL_STATUSES = {PRINT_STATUS_COMPLETED, PRINT_STATUS_FAILED, PRINT_STATUS_CANCELLED}

JOB_STATUS_NEW = "NEW"
JOB_STATUS_RECEIVED = "RECEIVED"
JOB_STATUS_ACCESS_REQUESTED = "ACCESS_REQUESTED"
JOB_STATUS_USER_APPROVED = "USER_APPROVED"
JOB_STATUS_PROCESSING = "PROCESSING"
JOB_STATUS_PRINTING = "PRINTING"
JOB_STATUS_COMPLETED = "COMPLETED"
JOB_STATUS_CLOSED = "CLOSED"
JOB_STATUS_DENIED = "DENIED"
JOB_STATUS_EXPIRED = "EXPIRED"
JOB_STATUS_CANCELLED = "CANCELLED"
JOB_STATUS_FAILED = "FAILED"


class JobStatusTransition(BaseModel):
    from_status: Optional[str] = None
    to_status: str
    transitioned_at: datetime
    actor: Optional[str] = None
    note: Optional[str] = None


class JobAuditEvent(BaseModel):
    event_type: str
    occurred_at: datetime
    actor: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class JobBase(BaseModel):
    job_type: str
    user_id: Optional[uuid.UUID] = None
    cafe_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None
    payload: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    max_retries: int = 3
    expires_at: Optional[datetime] = None
    idempotency_key: Optional[str] = None
    tenant_id: uuid.UUID
    requester_tenant_id: Optional[uuid.UUID] = None


class JobCreate(JobBase):
    status: Optional[str] = JOB_STATUS_NEW


class JobTransitionRequest(BaseModel):
    new_status: str
    actor: Optional[str] = None
    note: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class JobInDB(JobBase):
    id: uuid.UUID
    status: str
    previous_status: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    status_history: List[JobStatusTransition] = []
    audit_events: List[JobAuditEvent] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobResponse(JobBase):
    id: uuid.UUID
    status: str
    previous_status: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
