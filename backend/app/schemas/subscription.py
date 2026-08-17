import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class SubscriptionBase(BaseModel):
    user_id: uuid.UUID
    subscription_type: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = True
    tenant_id: uuid.UUID

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionInDB(SubscriptionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionResponse(SubscriptionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
