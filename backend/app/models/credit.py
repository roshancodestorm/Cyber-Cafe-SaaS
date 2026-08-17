import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class CreditTransaction(Base):
    __tablename__ = 'credit_transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    amount_delta = Column(Numeric, nullable=False)
    balance_after = Column(Numeric, nullable=False)
    transaction_type = Column(String, nullable=False)
    category = Column(String, nullable=True)
    idempotency_key = Column(String, nullable=True, index=True)
    reference_id = Column(String, nullable=True)
    meta_data = Column(JSON, nullable=True, default=dict)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True, index=True, default=datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user = relationship('User')
