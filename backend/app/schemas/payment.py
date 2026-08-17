import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class PaymentBase(BaseModel):
    user_id: uuid.UUID
    subscription_id: Optional[uuid.UUID] = None
    amount: Decimal
    currency: Optional[str] = "USD"
    status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    tenant_id: uuid.UUID

class PaymentCreate(PaymentBase):
    pass

class PaymentInDB(PaymentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentResponse(PaymentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
