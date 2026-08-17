import uuid
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.notification import Notification
from app.services.event_bus import (
    get_event_bus,
    NotificationEnvelope,
    EVENT_JOB_CREATED,
    EVENT_ACCESS_REQUESTED,
    EVENT_ACCESS_APPROVED,
    EVENT_ACCESS_DENIED,
    EVENT_PRINT_QUEUED,
    EVENT_PRINT_STARTED,
    EVENT_PRINT_COMPLETED,
    EVENT_PRINT_FAILED,
    EVENT_DOCUMENT_EXPIRING,
    EVENT_DOCUMENT_EXPIRED,
    EVENT_PAYMENT_SUCCESS,
)
from app.models.user import User


NOTIFICATION_TYPE_MAP: Dict[str, str] = {
    EVENT_JOB_CREATED: "job_created",
    EVENT_ACCESS_REQUESTED: "access_request",
    EVENT_ACCESS_APPROVED: "access_approved",
    EVENT_ACCESS_DENIED: "access_denied",
    EVENT_PRINT_QUEUED: "print_started",
    EVENT_PRINT_STARTED: "print_started",
    EVENT_PRINT_COMPLETED: "print_completed",
    EVENT_PRINT_FAILED: "print_failed",
    EVENT_DOCUMENT_EXPIRING: "document_expiring",
    EVENT_DOCUMENT_EXPIRED: "document_expiring",
    EVENT_PAYMENT_SUCCESS: "payment_successful",
}

PRIORITY_BY_EVENT = {
    EVENT_ACCESS_REQUESTED: "high",
    EVENT_PRINT_FAILED: "high",
    EVENT_PAYMENT_SUCCESS: "normal",
    EVENT_DOCUMENT_EXPIRING: "normal",
    EVENT_ACCESS_DENIED: "normal",
}


def _mask_pii(text: str) -> str:
    return text


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Notification:
        n = Notification(**kwargs)
        self.db.add(n)
        self.db.commit()
        self.db.refresh(n)
        return n

    def mark_read(self, nid: uuid.UUID, user_id: uuid.UUID, tenant_id: uuid.UUID) -> Optional[Notification]:
        n = self.db.query(Notification).filter(
            Notification.id == nid, Notification.user_id == user_id, Notification.tenant_id == tenant_id
        ).first()
        if n is None:
            return None
        n.is_read = True
        self.db.add(n)
        self.db.commit()
        self.db.refresh(n)
        return n

    def mark_all_read(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> int:
        q = self.db.query(Notification).filter(
            Notification.user_id == user_id, Notification.tenant_id == tenant_id, Notification.is_read == False
        )
        updated = q.update({"is_read": True}, synchronize_session=False)
        self.db.commit()
        return int(updated)

    def list_for_user(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 50, only_unread: bool = False
    ) -> Tuple[List[Notification], int]:
        q = self.db.query(Notification).filter(Notification.user_id == user_id, Notification.tenant_id == tenant_id)
        if only_unread:
            q = q.filter(Notification.is_read == False)
        total = q.count()
        items = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def unread_count(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> int:
        return int(
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.tenant_id == tenant_id, Notification.is_read == False)
            .count()
        )

    def clear(self, nid: uuid.UUID, user_id: uuid.UUID, tenant_id: uuid.UUID) -> bool:
        n = self.db.query(Notification).filter(
            Notification.id == nid, Notification.user_id == user_id, Notification.tenant_id == tenant_id
        ).first()
        if n is None:
            return False
        self.db.delete(n)
        self.db.commit()
        return True


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)
        self.bus = get_event_bus()

    def _make_title_and_message(self, event_type: str, payload: Dict[str, Any]) -> Tuple[str, str]:
        doc_title = payload.get("document_name") or payload.get("filename") or "Document"
        cafe = payload.get("cafe_name") or "your cafe"
        user_name = payload.get("requester_name") or "A visitor"
        printer = payload.get("printer") or payload.get("device") or "printer"
        amount = payload.get("amount")
        map = {
            EVENT_JOB_CREATED: ("Print job created", f"Your {doc_title} job was received at {cafe}."),
            EVENT_ACCESS_REQUESTED: ("Access requested", f"{user_name} is requesting access to {doc_title}."),
            EVENT_ACCESS_APPROVED: ("Access approved", f"Your request for {doc_title} was approved."),
            EVENT_ACCESS_DENIED: ("Access denied", f"Your request for {doc_title} was denied."),
            EVENT_PRINT_QUEUED: ("Print queued", f"{doc_title} has been queued for printing at {cafe}."),
            EVENT_PRINT_STARTED: ("Print started", f"Your {doc_title} is now printing at {cafe} ({printer})."),
            EVENT_PRINT_COMPLETED: ("Print complete", f"{doc_title} finished printing. Pick it up at {cafe}."),
            EVENT_PRINT_FAILED: ("Print failed", f"Printing {doc_title} failed. {payload.get('failure_reason') or 'Retrying...'}"),
            EVENT_DOCUMENT_EXPIRING: ("Document expiring soon", f"{doc_title} will expire soon. Print or save before it expires."),
            EVENT_DOCUMENT_EXPIRED: ("Document expired", f"{doc_title} has expired and is no longer available."),
            EVENT_PAYMENT_SUCCESS: ("Payment successful", f"Payment confirmed" + (f" — ${amount:.2f}" if amount else "") + "."),
        }
        return map.get(event_type, (event_type.replace("_", " ").title(), "New activity on your account"))

    def dispatch(
        self,
        event_type: str,
        *,
        user_ids: Optional[List[uuid.UUID]] = None,
        tenant_ids: Optional[List[uuid.UUID]] = None,
        cafe_ids: Optional[List[uuid.UUID]] = None,
        payload: Optional[Dict[str, Any]] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        priority: Optional[str] = None,
        actions: Optional[List[Dict[str, Any]]] = None,
        actor: Optional[str] = None,
    ) -> NotificationEnvelope:
        payload = payload or {}
        users_to_notify: List[uuid.UUID] = [uuid.UUID(str(u)) for u in (user_ids or [])]
        tenant_list: List[uuid.UUID] = [uuid.UUID(str(t)) for t in (tenant_ids or [])]
        cafe_list: List[uuid.UUID] = [uuid.UUID(str(c)) for c in (cafe_ids or [])]
        if tenant_ids:
            extra_users = self.db.query(User.id).filter(User.tenant_id.in_(tenant_ids)).all()
            for (uid,) in extra_users:
                if uid not in users_to_notify:
                    users_to_notify.append(uid)
        title, message = self._make_title_and_message(event_type, payload)
        for uid in users_to_notify:
            tenant_for_user = None
            if tenant_list:
                tenant_for_user = tenant_list[0]
            else:
                u = self.db.query(User).filter(User.id == uid).first()
                tenant_for_user = u.tenant_id if u else None
            self.repo.create(
                user_id=uid,
                tenant_id=tenant_for_user,
                notification_type=NOTIFICATION_TYPE_MAP.get(event_type, "system"),
                message=_mask_pii(f"{title}: {message}"),
                is_read=False,
            )
        env = NotificationEnvelope(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            user_ids=[str(u) for u in users_to_notify],
            tenant_ids=[str(t) for t in tenant_list],
            cafe_ids=[str(c) for c in cafe_list],
            title=title,
            message=message,
            priority=priority or PRIORITY_BY_EVENT.get(event_type, "normal"),
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            payload=payload,
            actions=actions,
        )
        self.bus.publish(env)
        return env
