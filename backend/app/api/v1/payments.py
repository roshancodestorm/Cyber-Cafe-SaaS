import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.credit import CreditTransaction

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Razorpay client ──────────────────────────────────────────────────────────
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# ── Plan config: subscription_type → (amount in paise, currency, credits) ────
PLAN_CONFIG = {
    "starter": {"amount": 2900, "currency": "USD", "credits": 500, "duration_days": 30},
    "pro":     {"amount": 7900, "currency": "USD", "credits": 2000, "duration_days": 30},
}


# ── Schemas ──────────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    subscription_type: str  # "starter" or "pro"


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    razorpay_key_id: str


class WebhookResponse(BaseModel):
    status: str
    message: str


# ── Helpers ──────────────────────────────────────────────────────────────────
def _verify_razorpay_signature(body: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def _get_or_create_subscription(
    db: Session, user: User, subscription_type: str, duration_days: int
) -> Subscription:
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id,
            Subscription.subscription_type == subscription_type,
            Subscription.is_active == True,
        )
        .first()
    )
    if sub:
        sub.end_date = datetime.utcnow() + timedelta(days=duration_days)
        sub.updated_at = datetime.utcnow()
    else:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=user.id,
            subscription_type=subscription_type,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=duration_days),
            is_active=True,
            tenant_id=user.tenant_id,
        )
        db.add(sub)
    return sub


def _add_credits(
    db: Session, user: User, amount: int, subscription_type: str, reference_id: str
) -> CreditTransaction:
    last = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id)
        .order_by(CreditTransaction.created_at.desc())
        .first()
    )
    balance_after = (last.balance_after if last else Decimal("0")) + Decimal(amount)

    tx = CreditTransaction(
        id=uuid.uuid4(),
        user_id=user.id,
        amount_delta=Decimal(amount),
        balance_after=balance_after,
        transaction_type="credit",
        category="subscription",
        idempotency_key=reference_id,
        reference_id=reference_id,
        description=f"Credits added via {subscription_type} subscription",
        tenant_id=user.tenant_id,
    )
    db.add(tx)
    return tx


# ── Endpoints ────────────────────────────────────────────────────────────────
@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Razorpay checkout order",
)
def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    plan = PLAN_CONFIG.get(body.subscription_type)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subscription_type '{body.subscription_type}'. Choose 'starter' or 'pro'.",
        )

    receipt = f"rcpt_{current_user.id}_{uuid.uuid4().hex[:8]}"
    order = client.order.create(
        {
            "amount": plan["amount"],
            "currency": plan["currency"],
            "receipt": receipt,
            "notes": {
                "user_id": str(current_user.id),
                "tenant_id": str(current_user.tenant_id),
                "subscription_type": body.subscription_type,
            },
        }
    )

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
    )


@router.post(
    "/webhook",
    response_model=WebhookResponse,
    summary="Receive and process Razorpay webhooks",
)
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not _verify_razorpay_signature(body, signature):
        logger.warning("Razorpay webhook signature verification failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    payload = json.loads(body)
    event = payload.get("event", "")
    logger.info(f"Razorpay webhook received: {event}")

    if event in ("payment.captured", "payment.authorized"):
        payment_entity = payload["payload"]["payment"]["entity"]
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")
        amount = payment_entity.get("amount", 0)
        notes = payment_entity.get("notes", {})
        user_id = notes.get("user_id")
        tenant_id = notes.get("tenant_id")
        subscription_type = notes.get("subscription_type", "starter")

        if not user_id or not tenant_id:
            logger.error(f"Missing user_id/tenant_id in webhook notes: {notes}")
            return WebhookResponse(status="ignored", message="Missing metadata")

        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            logger.error(f"User {user_id} not found for webhook payment")
            return WebhookResponse(status="error", message="User not found")

        # Upsert payment record
        payment = (
            db.query(Payment)
            .filter(Payment.transaction_id == razorpay_payment_id)
            .first()
        )
        if payment:
            payment.status = "completed"
            payment.updated_at = datetime.utcnow()
        else:
            payment = Payment(
                id=uuid.uuid4(),
                user_id=user.id,
                amount=Decimal(amount),
                currency=payment_entity.get("currency", "USD"),
                status="completed",
                payment_method="razorpay",
                transaction_id=razorpay_payment_id,
                tenant_id=uuid.UUID(tenant_id),
            )
            db.add(payment)

        # Activate subscription
        plan = PLAN_CONFIG.get(subscription_type, PLAN_CONFIG["starter"])
        subscription = _get_or_create_subscription(
            db, user, subscription_type, plan["duration_days"]
        )
        payment.subscription_id = subscription.id

        # Add credits
        _add_credits(db, user, plan["credits"], subscription_type, razorpay_payment_id)

        db.commit()
        logger.info(
            f"Payment {razorpay_payment_id} processed — "
            f"subscription={subscription_type}, credits={plan['credits']}"
        )

        return WebhookResponse(status="success", message="Payment processed")

    return WebhookResponse(status="ignored", message=f"Unhandled event: {event}")
