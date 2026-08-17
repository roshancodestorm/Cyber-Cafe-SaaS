import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class Cafe(Base):
    __tablename__ = 'cafes'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=False, index=True, unique=True)
    is_active = Column(Boolean, nullable=True, default=True)
    is_verified = Column(Boolean, nullable=True, index=True, default=False)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    available_services = Column(JSON, nullable=True, default=list)
    opening_hours = Column(JSON, nullable=True, default=dict)
    timezone = Column(String, nullable=True, default='UTC')
    description = Column(Text, nullable=True)
    public_display_name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    staff_associations = relationship('CafeStaff')
    documents = relationship('Document')
