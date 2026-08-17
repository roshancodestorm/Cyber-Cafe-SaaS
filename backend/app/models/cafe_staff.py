import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class CafeStaff(Base):
    __tablename__ = 'cafe_staff'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id'), nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user = relationship('User')
    cafe = relationship('Cafe')
