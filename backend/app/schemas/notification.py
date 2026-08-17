import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    user_id: uuid.UUID
    notification_type: str
    message: str
    is_read: Optional[bool] = False
    tenant_id: uuid.UUID

class NotificationCreate(NotificationBase):
    pass

class NotificationInDB(NotificationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
