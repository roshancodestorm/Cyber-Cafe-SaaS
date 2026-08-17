import uuid
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class CafeBase(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone_number: Optional[str] = None
    email: EmailStr
    is_active: Optional[bool] = True
    tenant_id: uuid.UUID


class CafeCreate(CafeBase):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_services: Optional[List[str]] = []
    opening_hours: Optional[dict] = {}
    timezone: Optional[str] = "UTC"
    description: Optional[str] = None
    public_display_name: Optional[str] = None
    is_verified: Optional[bool] = False


class CafeInDB(CafeBase):
    id: uuid.UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_services: List[str] = []
    opening_hours: dict = {}
    timezone: str = "UTC"
    description: Optional[str] = None
    public_display_name: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CafeResponse(CafeBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NearbyCafePublic(BaseModel):
    id: uuid.UUID
    name: str
    public_location: str
    approximate_distance_km: float
    approximate_distance_miles: float
    available_services: List[str] = []
    is_open: bool = False
    is_verified: bool = False
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class NearbyCafeSearchRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=5.0, gt=0, le=500)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    services_filter: Optional[List[str]] = None
    only_verified: Optional[bool] = False
    only_open: Optional[bool] = False


class NearbyCafeSearchResponse(BaseModel):
    results: List[NearbyCafePublic]
    total: int
    page: int
    page_size: int
    total_pages: int
    search_center: dict
