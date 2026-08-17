import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CafeStaffBase(BaseModel):
    user_id: uuid.UUID
    cafe_id: uuid.UUID
    role: str
    tenant_id: uuid.UUID

class CafeStaffCreate(CafeStaffBase):
    pass

class CafeStaffInDB(CafeStaffBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CafeStaffResponse(CafeStaffBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
