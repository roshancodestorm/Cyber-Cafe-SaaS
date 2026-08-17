import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AuditLogBase(BaseModel):
    user_id: Optional[uuid.UUID] = None
    event_type: str
    details: Optional[str] = None
    tenant_id: uuid.UUID

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogInDB(AuditLogBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(AuditLogBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
