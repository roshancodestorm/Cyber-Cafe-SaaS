import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class CreditBase(BaseModel):
    user_id: uuid.UUID
    amount: Decimal
    credit_type: str
    tenant_id: uuid.UUID

class CreditCreate(CreditBase):
    pass

class CreditInDB(CreditBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CreditResponse(CreditBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
