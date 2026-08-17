import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PermissionBase(BaseModel):
    user_id: uuid.UUID
    document_id: uuid.UUID
    permission_type: str
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    tenant_id: uuid.UUID

class PermissionCreate(PermissionBase):
    pass

class PermissionInDB(PermissionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PermissionResponse(PermissionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
