import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, index=True, unique=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)
    is_superuser = Column(Boolean, nullable=True, default=False)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    audit_logs = relationship('AuditLog')
    cafe_staff_associations = relationship('CafeStaff')
    credit_transactions = relationship('CreditTransaction')
    documents = relationship('Document')
    notifications = relationship('Notification')
    payments = relationship('Payment')
    permissions = relationship('Permission')
    sent_permission_requests = relationship('PermissionRequest')
    received_permission_requests = relationship('PermissionRequest')
    subscriptions = relationship('Subscription')
