import json
import uuid
import hashlib
import asyncio
import threading
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any, Callable, Set
from datetime import datetime


EVENT_JOB_CREATED = "JOB_CREATED"
EVENT_ACCESS_REQUESTED = "ACCESS_REQUESTED"
EVENT_ACCESS_APPROVED = "ACCESS_APPROVED"
EVENT_ACCESS_DENIED = "ACCESS_DENIED"
EVENT_PRINT_QUEUED = "PRINT_QUEUED"
EVENT_PRINT_STARTED = "PRINT_STARTED"
EVENT_PRINT_COMPLETED = "PRINT_COMPLETED"
EVENT_PRINT_FAILED = "PRINT_FAILED"
EVENT_DOCUMENT_EXPIRING = "DOCUMENT_EXPIRING"
EVENT_DOCUMENT_EXPIRED = "DOCUMENT_EXPIRED"
EVENT_PAYMENT_SUCCESS = "PAYMENT_SUCCESS"

ALL_NOTIFICATION_EVENTS = [
    EVENT_JOB_CREATED, EVENT_ACCESS_REQUESTED, EVENT_ACCESS_APPROVED, EVENT_ACCESS_DENIED,
    EVENT_PRINT_QUEUED, EVENT_PRINT_STARTED, EVENT_PRINT_COMPLETED, EVENT_PRINT_FAILED,
    EVENT_DOCUMENT_EXPIRING, EVENT_DOCUMENT_EXPIRED, EVENT_PAYMENT_SUCCESS,
]


def event_dedup_key(event_type: str, entity_id: Optional[str], payload: dict) -> str:
    safe_payload = {k: payload.get(k) for k in sorted(payload.keys())} if payload else {}
    raw = f"{event_type}:{entity_id or ''}:{json.dumps(safe_payload, sort_keys=True, default=str)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class DedupWindow:
    def __init__(self, size: int = 2000):
        self._size = size
        self._seen: List[str] = []
        self._set: Set[str] = set()
        self._lock = threading.Lock()

    def check_and_mark(self, key: str) -> bool:
        with self._lock:
            if key in self._set:
                return False
            self._seen.append(key)
            self._set.add(key)
            while len(self._seen) > self._size:
                old = self._seen.pop(0)
                self._set.discard(old)
            return True


@dataclass
class NotificationEnvelope:
    event_id: str
    event_type: str
    user_ids: List[str]
    tenant_ids: List[str]
    cafe_ids: List[str]
    title: str
    message: str
    priority: str = "normal"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)
    server_timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    actions: Optional[List[Dict[str, Any]]] = None


class InMemoryEventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[NotificationEnvelope], None]]] = {}
        self._dedup = DedupWindow()
        self._lock = threading.Lock()
        self._history: List[NotificationEnvelope] = []
        self._history_max = 500

    def topic(self, kind: str, id: str) -> str:
        return f"{kind}:{id}"

    def subscribe(self, topic: str, callback: Callable[[NotificationEnvelope], None]):
        with self._lock:
            self._subscribers.setdefault(topic, [])
            self._subscribers[topic].append(callback)
            return lambda: self._unsubscribe(topic, callback)

    def _unsubscribe(self, topic: str, callback):
        with self._lock:
            callbacks = self._subscribers.get(topic)
            if callbacks and callback in callbacks:
                callbacks.remove(callback)

    def publish(self, env: NotificationEnvelope) -> bool:
        dkey = event_dedup_key(env.event_type, env.entity_id, env.payload)
        if not self._dedup.check_and_mark(dkey):
            return False
        with self._lock:
            self._history.append(env)
            if len(self._history) > self._history_max:
                self._history = self._history[-self._history_max:]
        targets: List[str] = []
        for uid in env.user_ids:
            targets.append(self.topic("user", str(uid)))
        for tid in env.tenant_ids:
            targets.append(self.topic("tenant", str(tid)))
        for cid in env.cafe_ids:
            targets.append(self.topic("cafe", str(cid)))
        delivered = set()
        for t in targets:
            for cb in list(self._subscribers.get(t, [])):
                key = f"{id(cb)}:{t}"
                if key in delivered:
                    continue
                delivered.add(key)
                try:
                    cb(env)
                except Exception:
                    pass
        return True

    def recent_history(self, topic: Optional[str] = None, limit: int = 50) -> List[NotificationEnvelope]:
        return list(reversed(self._history[-limit:]))


_bus_singleton = InMemoryEventBus()


def get_event_bus() -> InMemoryEventBus:
    return _bus_singleton
