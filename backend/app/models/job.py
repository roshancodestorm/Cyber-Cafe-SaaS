import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

# ---------------------------------------------------------------------------
# Job status constants
# ---------------------------------------------------------------------------
JOB_STATUS_NEW = "NEW"
JOB_STATUS_RECEIVED = "RECEIVED"
JOB_STATUS_QUEUED = "QUEUED"
JOB_STATUS_PROCESSING = "PROCESSING"
JOB_STATUS_COMPLETED = "COMPLETED"
JOB_STATUS_FAILED = "FAILED"
JOB_STATUS_CANCELLED = "CANCELLED"
JOB_STATUS_CLOSED = "CLOSED"
JOB_STATUS_EXPIRED = "EXPIRED"
JOB_STATUS_ACCESS_REQUESTED = "ACCESS_REQUESTED"

JOB_TERMINAL_STATUSES = {
    JOB_STATUS_COMPLETED,
    JOB_STATUS_FAILED,
    JOB_STATUS_CANCELLED,
    JOB_STATUS_CLOSED,
    JOB_STATUS_EXPIRED,
}

# Maps each status to the set of statuses it is allowed to transition to.
JOB_STATUS_TRANSITIONS: dict[str, set[str]] = {
    JOB_STATUS_NEW:              {JOB_STATUS_RECEIVED, JOB_STATUS_QUEUED, JOB_STATUS_CANCELLED, JOB_STATUS_EXPIRED},
    JOB_STATUS_RECEIVED:         {JOB_STATUS_QUEUED, JOB_STATUS_ACCESS_REQUESTED, JOB_STATUS_CANCELLED, JOB_STATUS_EXPIRED},
    JOB_STATUS_ACCESS_REQUESTED: {JOB_STATUS_QUEUED, JOB_STATUS_CANCELLED, JOB_STATUS_EXPIRED},
    JOB_STATUS_QUEUED:           {JOB_STATUS_PROCESSING, JOB_STATUS_CANCELLED, JOB_STATUS_EXPIRED},
    JOB_STATUS_PROCESSING:       {JOB_STATUS_COMPLETED, JOB_STATUS_FAILED, JOB_STATUS_CANCELLED},
    JOB_STATUS_COMPLETED:        {JOB_STATUS_CLOSED},
    JOB_STATUS_FAILED:           {JOB_STATUS_QUEUED, JOB_STATUS_CANCELLED},
    JOB_STATUS_CANCELLED:        set(),
    JOB_STATUS_CLOSED:           set(),
    JOB_STATUS_EXPIRED:          set(),
}

class Job(Base):
    __tablename__ = 'jobs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type = Column(String, nullable=False)
    status = Column(String, nullable=True, index=True, default='NEW')
    previous_status = Column(String, nullable=True)
    idempotency_key = Column(String, nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id'), nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=True)
    payload = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=True, default=0)
    max_retries = Column(Integer, nullable=True, default=3)
    expires_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    status_history = Column(JSON, nullable=True, default=list)
    audit_events = Column(JSON, nullable=True, default=list)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    requester_tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user = relationship('User')
    cafe = relationship('Cafe')
    document = relationship('Document')

    def can_transition_to(self, new_status: str) -> bool:
        """Return True if the job may transition from its current status to new_status."""
        allowed = JOB_STATUS_TRANSITIONS.get(self.status or JOB_STATUS_NEW, set())
        return new_status in allowed
