import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    user_id: uuid.UUID
    cafe_id: Optional[uuid.UUID] = None
    filename: str
    file_type: str
    file_size: int
    object_storage_key: str
    checksum: str
    is_encrypted: Optional[bool] = True
    is_scanned: Optional[bool] = False
    status: Optional[str] = "uploaded"
    max_opens: Optional[int] = None
    open_count: Optional[int] = 0
    tenant_id: uuid.UUID

class DocumentCreate(DocumentBase):
    pass

class DocumentInDB(DocumentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentResponse(DocumentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
