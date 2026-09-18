import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[uuid.UUID] = None

class UserInDB(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
