import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

# ---------------------------------------------------------------------------
# Print job status constants
# ---------------------------------------------------------------------------
PRINT_STATUS_QUEUED = "QUEUED"
PRINT_STATUS_PRINTING = "PRINTING"
PRINT_STATUS_COMPLETED = "COMPLETED"
PRINT_STATUS_FAILED = "FAILED"
PRINT_STATUS_CANCELLED = "CANCELLED"
PRINT_STATUS_EXPIRED = "EXPIRED"

PRINT_TERMINAL_STATUSES = {
    PRINT_STATUS_COMPLETED,
    PRINT_STATUS_FAILED,
    PRINT_STATUS_CANCELLED,
    PRINT_STATUS_EXPIRED,
}


class PrintJob(Base):
    __tablename__ = 'print_jobs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False, index=True)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey('jobs.id'), nullable=True, index=True)
    device_id = Column(String, nullable=True, index=True)
    status = Column(String, nullable=True, index=True, default='QUEUED')
    pages = Column(Integer, nullable=False)
    copies = Column(Integer, nullable=False, default=1)
    page_range_start = Column(Integer, nullable=True)
    page_range_end = Column(Integer, nullable=True)
    idempotency_key = Column(String, nullable=True, index=True)
    paper_size = Column(String, nullable=True, default='A4')
    color_mode = Column(String, nullable=True, default='mono')
    duplex = Column(Boolean, nullable=True, default=False)
    retry_count = Column(Integer, nullable=True, default=0)
    max_retries = Column(Integer, nullable=True, default=3)
    failure_reason = Column(Text, nullable=True)
    printed_pages = Column(Integer, nullable=True)
    print_options = Column(JSON, nullable=True, default=dict)
    status_history = Column(JSON, nullable=True, default=list)
    audit_events = Column(JSON, nullable=True, default=list)
    queued_at = Column(DateTime, nullable=True)
    printing_started_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    document = relationship('Document')
    cafe = relationship('Cafe')
    user = relationship('User')
    job = relationship('Job')
