import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class Document(Base):
    __tablename__ = 'documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    cafe_id = Column(UUID(as_uuid=True), ForeignKey('cafes.id'), nullable=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    object_storage_key = Column(String, nullable=False, unique=True)
    checksum = Column(String, nullable=False)
    is_encrypted = Column(Boolean, nullable=True, default=True)
    is_scanned = Column(Boolean, nullable=True, default=False)
    status = Column(String, nullable=True, default='uploaded')
    max_opens = Column(Integer, nullable=True)
    open_count = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user = relationship('User')
    cafe = relationship('Cafe')
    permissions = relationship('Permission')
    permission_requests = relationship('PermissionRequest')
