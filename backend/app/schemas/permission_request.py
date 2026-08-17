import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PermissionRequestBase(BaseModel):
    document_id: uuid.UUID
    requester_id: uuid.UUID
    owner_id: uuid.UUID
    permission_type: str
    status: Optional[str] = "pending"
    tenant_id: uuid.UUID

class PermissionRequestCreate(PermissionRequestBase):
    pass

class PermissionRequestInDB(PermissionRequestBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionRequestResponse(PermissionRequestBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
