import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


PRINT_STATUS_QUEUED = "QUEUED"
PRINT_STATUS_PRINTING = "PRINTING"
PRINT_STATUS_COMPLETED = "COMPLETED"
PRINT_STATUS_FAILED = "FAILED"
PRINT_STATUS_CANCELLED = "CANCELLED"


class PrintJobBase(BaseModel):
    document_id: uuid.UUID
    cafe_id: uuid.UUID
    user_id: uuid.UUID
    pages: int
    copies: int = Field(default=1, ge=1, le=999)
    page_range_start: Optional[int] = None
    page_range_end: Optional[int] = None
    paper_size: str = "A4"
    color_mode: str = "mono"
    duplex: bool = False
    print_options: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None
    job_id: Optional[uuid.UUID] = None
    expires_at: Optional[datetime] = None
    tenant_id: uuid.UUID


class PrintJobCreate(PrintJobBase):
    pass


class PrintJobStatusUpdate(BaseModel):
    new_status: str
    failure_reason: Optional[str] = None
    printed_pages: Optional[int] = None
    actor: Optional[str] = None
    note: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PrintJobInDB(PrintJobBase):
    id: uuid.UUID
    status: str
    device_id: Optional[str] = None
    retry_count: int = 0
    printed_pages: Optional[int] = None
    failure_reason: Optional[str] = None
    queued_at: Optional[datetime] = None
    printing_started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PrintJobResponse(PrintJobBase):
    id: uuid.UUID
    status: str
    device_id: Optional[str] = None
    retry_count: int = 0
    printed_pages: Optional[int] = None
    failure_reason: Optional[str] = None
    queued_at: Optional[datetime] = None
    printing_started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PrintJobListResponse(BaseModel):
    items: List[PrintJobResponse]
    total: int
    page: int
    page_size: int


class DeviceRegisterRequest(BaseModel):
    cafe_id: uuid.UUID
    device_name: str
    device_fingerprint: str
    capabilities: Optional[Dict[str, Any]] = None


class DeviceAuthResponse(BaseModel):
    device_id: str
    access_token: str
    token_expires_at: datetime
    cafe_id: uuid.UUID
    polling_interval_seconds: int = 15


class PrintJobForAgent(BaseModel):
    print_job_id: uuid.UUID
    document_id: uuid.UUID
    pages: int
    copies: int
    page_range_start: Optional[int] = None
    page_range_end: Optional[int] = None
    paper_size: str
    color_mode: str
    duplex: bool
    print_options: Dict[str, Any] = {}
    document_download_token: str
    document_download_url: str
    expires_at: datetime


class PrintAgentStatusReport(BaseModel):
    print_job_id: uuid.UUID
    status: str
    failure_reason: Optional[str] = None
    printed_pages: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
