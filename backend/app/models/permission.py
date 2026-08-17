import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class Permission(Base):
    __tablename__ = 'permissions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), nullable=False)
    permission_type = Column(String, nullable=False)
    can_view = Column(Boolean, nullable=True, default=True)
    can_print = Column(Boolean, nullable=True, default=False)
    can_download = Column(Boolean, nullable=True, default=False)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user = relationship('User')
    document = relationship('Document')
