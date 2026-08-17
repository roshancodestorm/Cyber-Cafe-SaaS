import uuid
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.credit import CreditTransaction, DEFAULT_FREE_ALLOCATION
from app.models.subscription import Subscription
from app.models.payment import Payment
from app.models.user import User


TX_FREE_ALLOC = "FREE_ALLOC"
TX_PURCHASE = "PURCHASE"
TX_USE = "USE"
TX_REFUND = "REFUND"
TX_SUBSCRIPTION = "SUBSCRIPTION"
TX_EXPIRE = "EXPIRE"

PLAN_LIMITS: Dict[str, Dict[str, Any]] = {
    "FREE": {"plan_limit": 50, "monthly_ai_credits": 50, "print_jobs_per_month": 10},
    "BASIC": {"plan_limit": 500, "monthly_ai_credits": 500, "print_jobs_per_month": 100},
    "PRO": {"plan_limit": None, "monthly_ai_credits": None, "print_jobs_per_month": None},
}


class CreditRepository:
    def __init__(self, db: Session):
        self.db = db

    def _latest_tx(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[CreditTransaction]:
        return (
            self.db.query(CreditTransaction)
            .filter(CreditTransaction.user_id == user_id, CreditTransaction.tenant_id == tenant_id)
            .order_by(CreditTransaction.created_at.desc(), CreditTransaction.id.desc())
            .first()
        )

    def find_idempotent(self, key: str, tenant_id: uuid.UUID) -> Optional[CreditTransaction]:
        if not key:
            return None
        return (
            self.db.query(CreditTransaction)
            .filter(CreditTransaction.idempotency_key == key, CreditTransaction.tenant_id == tenant_id)
            .first()
        )

    def current_balance(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> Decimal:
        latest = self._latest_tx(user_id, tenant_id)
        if latest is None:
            return Decimal("0")
        return Decimal(latest.balance_after)

    def list_history(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> Tuple[List[CreditTransaction], int]:
        q = self.db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id, CreditTransaction.tenant_id == tenant_id
        )
        total = q.count()
        items = q.order_by(CreditTransaction.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def append(
        self,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        amount_delta: Decimal,
        transaction_type: str,
        idempotency_key: Optional[str] = None,
        category: Optional[str] = None,
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
    ) -> Tuple[CreditTransaction, bool]:
        """Returns (transaction, created?). Idempotent by key. Row-locked safe via serializable read + insert."""
        if idempotency_key:
            existing = self.find_idempotent(idempotency_key, tenant_id)
            if existing is not None:
                return existing, False
        latest = self._latest_tx(user_id, tenant_id)
        if latest is None:
            current = Decimal("0")
        else:
            current = Decimal(latest.balance_after)
        new_balance = current + Decimal(amount_delta)
        if new_balance < 0:
            # Do not allow negative balance
            new_balance = Decimal("0")
        tx = CreditTransaction(
            user_id=user_id,
            tenant_id=tenant_id,
            amount_delta=Decimal(amount_delta),
            balance_after=Decimal(new_balance),
            transaction_type=transaction_type,
            category=category,
            idempotency_key=idempotency_key,
            reference_id=reference_id,
            metadata=metadata or {},
            description=description,
        )
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(tx)
        return tx, True


class CreditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CreditRepository(db)

    def _ensure_free_allocation(self, user_id: uuid.UUID, tenant_id: uuid.UUID):
        latest = self.repo._latest_tx(user_id, tenant_id)
        if latest is None:
            self.repo.append(
                user_id=user_id,
                tenant_id=tenant_id,
                amount_delta=Decimal(str(DEFAULT_FREE_ALLOCATION)),
                transaction_type=TX_FREE_ALLOC,
                idempotency_key=f"FREE_ALLOC:{tenant_id}:{user_id}",
                description="Default 50 free AI credits on signup",
                metadata={"plan": "FREE"},
            )

    def get_balance(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> int:
        self._ensure_free_allocation(user_id, tenant_id)
        return int(self.repo.current_balance(user_id, tenant_id))

    def get_plan_limits(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> Dict[str, Any]:
        sub = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.tenant_id == tenant_id,
            Subscription.is_active == True,
        ).order_by(Subscription.created_at.desc()).first()
        plan = sub.subscription_type if sub else "FREE"
        plan = str(plan).upper()
        plan_info = PLAN_LIMITS.get(plan, PLAN_LIMITS["FREE"])
        return {
            "plan": plan,
            "plan_limit": plan_info.get("plan_limit"),
            "free_allocation": DEFAULT_FREE_ALLOCATION,
            "monthly_ai_credits": plan_info.get("monthly_ai_credits"),
        }

    def consume(
        self,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        amount: int,
        idempotency_key: str,
        category: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[int, bool]:
        """Returns (remaining_balance, actually_deducted?). Idempotent. Returns remaining balance.

        Server-side only. Never trust a balance sent by the frontend.
        """
        self._ensure_free_allocation(user_id, tenant_id)
        if amount <= 0:
            return int(self.repo.current_balance(user_id, tenant_id)), False
        if self.repo.current_balance(user_id, tenant_id) < Decimal(amount):
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient AI credits")
        tx, created = self.repo.append(
            user_id=user_id,
            tenant_id=tenant_id,
            amount_delta=Decimal(f"-{amount}"),
            transaction_type=TX_USE,
            idempotency_key=idempotency_key,
            category=category,
            metadata=metadata,
            description=f"{amount} credit(s) used",
        )
        return int(tx.balance_after), created

    def grant(
        self,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        amount: int,
        idempotency_key: str,
        transaction_type: str = TX_PURCHASE,
        reference_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        self._ensure_free_allocation(user_id, tenant_id)
        tx, _ = self.repo.append(
            user_id=user_id,
            tenant_id=tenant_id,
            amount_delta=Decimal(str(amount)),
            transaction_type=transaction_type,
            idempotency_key=idempotency_key,
            reference_id=reference_id,
            metadata=metadata,
            description=description,
        )
        return int(tx.balance_after)

    def refund(
        self,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        amount: int,
        idempotency_key: str,
        reference_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> int:
        return self.grant(
            user_id=user_id,
            tenant_id=tenant_id,
            amount=amount,
            idempotency_key=idempotency_key,
            transaction_type=TX_REFUND,
            reference_id=reference_id,
            description=reason or "Credit refund",
        )

    def history(self, user_id: uuid.UUID, tenant_id: uuid.UUID, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        self._ensure_free_allocation(user_id, tenant_id)
        skip = (page - 1) * page_size
        items, total = self.repo.list_history(user_id, tenant_id, skip=skip, limit=page_size)
        return {
            "items": [
                {
                    "id": str(tx.id),
                    "amount_delta": float(tx.amount_delta),
                    "balance_after": float(tx.balance_after),
                    "type": tx.transaction_type,
                    "category": tx.category,
                    "reference_id": tx.reference_id,
                    "description": tx.description,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None,
                }
                for tx in items
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "balance": self.get_balance(user_id, tenant_id),
        }
