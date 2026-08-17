import json
import asyncio
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationRepository
from app.services.event_bus import get_event_bus, NotificationEnvelope

router = APIRouter()


def _to_public_dict(n, include_payload=False) -> Dict[str, Any]:
    return {
        "id": str(n.id),
        "type": n.notification_type,
        "title": n.message.split(":", 1)[0] if ":" in (n.message or "") else "Notification",
        "message": n.message.split(":", 1)[1].strip() if ":" in (n.message or "") else n.message,
        "read": bool(n.is_read),
        "createdAt": n.created_at.isoformat() if n.created_at else datetime.utcnow().isoformat(),
        "priority": "normal",
    }


@router.get("")
def list_notifications(
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=200),
    only_unread: bool = False,
    db: Session = Depends(get_db),
):
    repo = NotificationRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.list_for_user(current_user.id, current_user.tenant_id, skip=skip, limit=page_size, only_unread=only_unread)
    unread = repo.unread_count(current_user.id, current_user.tenant_id)
    return {
        "items": [_to_public_dict(n) for n in items],
        "total": total,
        "unread_count": unread,
        "page": page,
        "page_size": page_size,
    }


@router.get("/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = NotificationRepository(db)
    return {"unread_count": repo.unread_count(current_user.id, current_user.tenant_id)}


@router.post("/{nid}/read")
def mark_read(
    nid: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = NotificationRepository(db)
    updated = repo.mark_read(nid, current_user.id, current_user.tenant_id)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"success": True, "unread_count": repo.unread_count(current_user.id, current_user.tenant_id)}


@router.post("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = NotificationRepository(db)
    count = repo.mark_all_read(current_user.id, current_user.tenant_id)
    return {"marked_count": count, "unread_count": 0}


@router.delete("/{nid}")
def delete_notification(
    nid: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = NotificationRepository(db)
    ok = repo.clear(nid, current_user.id, current_user.tenant_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"success": True}


@router.get("/stream")
async def sse_stream(
    request: Request,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    bus = get_event_bus()
    queue: asyncio.Queue[NotificationEnvelope] = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def _push(env: NotificationEnvelope):
        relevant = (
            str(current_user.id) in env.user_ids
            or str(current_user.tenant_id) in env.tenant_ids
        )
        if relevant:
            asyncio.run_coroutine_threadsafe(queue.put(env), loop)

    unsubs = []
    for t in [f"user:{current_user.id}", f"tenant:{current_user.tenant_id}"]:
        unsubs.append(bus.subscribe(t, _push))

    async def cleanup():
        for u in unsubs:
            try:
                u()
            except Exception:
                pass

    async def generate():
        try:
            yield "event: hello\ndata: " + json.dumps({
                "server_timestamp": datetime.utcnow().isoformat(),
                "user_id": str(current_user.id),
            }) + "\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    env = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                payload = {
                    "event_id": env.event_id,
                    "event_type": env.event_type,
                    "title": env.title,
                    "message": env.message,
                    "priority": env.priority,
                    "entity_type": env.entity_type,
                    "entity_id": env.entity_id,
                    "payload": env.payload,
                    "server_timestamp": env.server_timestamp,
                    "actions": env.actions,
                }
                yield "event: notification\ndata: " + json.dumps(payload) + "\n\n"
        finally:
            await cleanup()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
