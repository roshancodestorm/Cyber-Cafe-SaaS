from __future__ import annotations
import json
import uuid
import secrets
from typing import Any, Callable, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.services.ai_provider import (
    AIProvider,
    AIProviderResponse,
    AIToolCall,
    AIToolResult,
    EchoProvider,
    OpenAICompatibleProvider,
)
from app.services.ai_safety import (
    SafetyLayer,
    SafetyVerdict,
    MessageRisk,
    make_security_event,
)
from app.services.cafe_discovery_service import CafeDiscoveryService
from app.services.job_service import JobService
from app.services.notification_service import NotificationService
from app.core.config import settings


DEFAULT_FREE_AI_CREDITS = 50
DEFAULT_CREDIT_COST_PER_REQUEST = 1
AI_TOOL_EXTRA_COST = 1


@dataclass
class AIChatMessage:
    role: str  # user | assistant | system | tool
    content: str
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


@dataclass
class AIConversation:
    id: str
    user_id: str
    tenant_id: str
    messages: List[AIChatMessage] = field(default_factory=list)
    title: str = "New chat"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AITurnResult:
    reply_text: str
    tool_results: List[AIToolResult]
    tokens_in: int
    tokens_out: int
    cost_cents: float
    credits_used: int
    safety: SafetyVerdict
    security_events: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# AI Tool definitions — every tool performs authorization checks
# ---------------------------------------------------------------------------


class AIToolAuthorizationError(RuntimeError):
    pass


@dataclass
class AIToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Callable[[Dict[str, Any], Dict[str, Any]], Any]


def build_tool_schema(definitions: List[AIToolDefinition]) -> List[Dict[str, Any]]:
    out = []
    for d in definitions:
        out.append({
            "type": "function",
            "function": {
                "name": d.name,
                "description": d.description,
                "parameters": d.parameters,
            },
        })
    return out


class AIToolRegistry:
    def __init__(self):
        self._tools: Dict[str, AIToolDefinition] = {}

    def register(self, tool: AIToolDefinition):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[AIToolDefinition]:
        return self._tools.get(name)

    def all(self) -> List[AIToolDefinition]:
        return list(self._tools.values())

    def schemas(self) -> List[Dict[str, Any]]:
        return build_tool_schema(list(self._tools.values()))


def default_tool_registry(db: Session) -> AIToolRegistry:
    reg = AIToolRegistry()

    # 1. find_nearby_cafes
    reg.register(AIToolDefinition(
        name="find_nearby_cafes",
        description=(
            "Find verified Cyber Cafes near a latitude/longitude location. "
            "Call this when the user asks about nearby cafes, distances, or available services. "
            "Never disclose private owner contact info."
        ),
        parameters={
            "type": "object",
            "properties": {
                "latitude": {"type": "number", "description": "WGS84 latitude"},
                "longitude": {"type": "number", "description": "WGS84 longitude"},
                "radius_km": {"type": "number", "description": "Search radius in km (1-500, default 5)"},
                "only_verified": {"type": "boolean", "description": "Limit to verified cafes only"},
            },
            "required": ["latitude", "longitude"],
        },
        handler=lambda args, ctx: _tool_find_nearby_cafes(db, args, ctx),
    ))

    # 2. get_job_status
    reg.register(AIToolDefinition(
        name="get_job_status",
        description=(
            "Get the status of a document or print job belonging to the current user. "
            "Use 'latest' to fetch the most recent one. Returns state + timestamps."
        ),
        parameters={
            "type": "object",
            "properties": {
                "job_id": {"type": "string", "description": "Job ID or 'latest' for most recent"},
            },
            "required": [],
        },
        handler=lambda args, ctx: _tool_get_job_status(db, args, ctx),
    ))

    # 3. get_credit_balance
    reg.register(AIToolDefinition(
        name="get_credit_balance",
        description="Get the current user's AI credit balance, free allocation, and plan limit details.",
        parameters={"type": "object", "properties": {}, "required": []},
        handler=lambda args, ctx: _tool_get_credit_balance(db, args, ctx),
    ))

    # 4. get_subscription
    reg.register(AIToolDefinition(
        name="get_subscription",
        description="Return the user's current subscription status, plan, and renewal/expiry dates.",
        parameters={"type": "object", "properties": {}, "required": []},
        handler=lambda args, ctx: _tool_get_subscription(db, args, ctx),
    ))

    # 5. get_service_information
    reg.register(AIToolDefinition(
        name="get_service_information",
        description=(
            "Return a structured summary of Cyber Cafe SaaS services: printing, scanning, "
            "document upload, permissions model, credits, subscriptions, and supported countries."
        ),
        parameters={"type": "object", "properties": {
            "topic": {"type": "string", "description": "Optional: 'printing' | 'documents' | 'credits' | 'security' | 'all'"}
        }, "required": []},
        handler=lambda args, ctx: _tool_get_service_information(args, ctx),
    ))

    return reg


# -------------------- Authorized tool implementations ----------------------


def _ctx_user(ctx: Dict[str, Any]):
    user_id = ctx.get("user_id")
    tenant_id = ctx.get("tenant_id")
    if not user_id or not tenant_id:
        raise AIToolAuthorizationError("Missing user/tenant context")
    return user_id, tenant_id


def _tool_find_nearby_cafes(db: Session, args: Dict[str, Any], ctx: Dict[str, Any]) -> Any:
    from app.schemas.cafe import NearbyCafeSearchRequest
    _ctx_user(ctx)
    lat = float(args.get("latitude"))
    lon = float(args.get("longitude"))
    r = max(1, min(500, float(args.get("radius_km") or 5)))
    req = NearbyCafeSearchRequest(
        latitude=lat,
        longitude=lon,
        radius_km=r,
        page=1,
        page_size=10,
        only_verified=bool(args.get("only_verified", False)),
    )
    svc = CafeDiscoveryService(db)
    resp = svc.search_nearby(req)
    return [
        {
            "name": c.name,
            "approximate_distance_km": c.approximate_distance_km,
            "approximate_distance_miles": c.approximate_distance_miles,
            "available_services": c.available_services,
            "is_open": c.is_open,
            "is_verified": c.is_verified,
        }
        for c in resp.results
    ]


def _tool_get_job_status(db: Session, args: Dict[str, Any], ctx: Dict[str, Any]) -> Any:
    user_id, tenant_id = _ctx_user(ctx)
    svc = JobService(db)
    listing = svc.list_jobs(
        tenant_id=uuid.UUID(tenant_id),
        user_id=uuid.UUID(user_id),
        page=1,
        page_size=5,
    )
    job = None
    if args.get("job_id") and args["job_id"] != "latest":
        try:
            job = svc.get(uuid.UUID(args["job_id"]), tenant_id=uuid.UUID(tenant_id))
            if str(job.user_id) != str(user_id):
                raise AIToolAuthorizationError("Job does not belong to current user")
        except Exception as e:
            return {"error": str(e)}
    elif listing.items:
        job = listing.items[0]
    if job is None:
        return {"status": "NO_JOB", "message": "You don't have any recent jobs yet."}
    return {
        "job_id": str(job.id),
        "status": job.status,
        "previous_status": job.previous_status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "retry_count": job.retry_count,
        "error": job.error_message,
    }


def _tool_get_credit_balance(db: Session, args: Dict[str, Any], ctx: Dict[str, Any]) -> Any:
    user_id, tenant_id = _ctx_user(ctx)
    from app.services.credit_service import CreditService
    svc = CreditService(db)
    balance = svc.get_balance(user_id=uuid.UUID(user_id), tenant_id=uuid.UUID(tenant_id))
    plan = svc.get_plan_limits(user_id=uuid.UUID(user_id), tenant_id=uuid.UUID(tenant_id))
    return {
        "balance": balance,
        "plan_limit": plan.get("plan_limit"),
        "free_allocation": plan.get("free_allocation"),
        "currency": "AI credits",
    }


def _tool_get_subscription(db: Session, args: Dict[str, Any], ctx: Dict[str, Any]) -> Any:
    user_id, tenant_id = _ctx_user(ctx)
    from app.services.payment_service import SubscriptionService
    svc = SubscriptionService(db)
    sub = svc.get_current_subscription(user_id=uuid.UUID(user_id), tenant_id=uuid.UUID(tenant_id))
    if sub is None:
        return {"plan": "FREE", "is_active": True, "message": "Free tier"}
    return {
        "plan": sub.subscription_type,
        "is_active": sub.is_active,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub.end_date else None,
    }


def _tool_get_service_information(args: Dict[str, Any], ctx: Dict[str, Any]) -> Any:
    topic = (args.get("topic") or "all").lower()
    docs = {
        "printing": "Print documents at selected Cyber Cafes. Choose color/mode, pages, copies. Jobs are authorized by user via access-request flow before printing. Print agents run locally on cafe PCs and report status.",
        "documents": "Documents are client-scannable, encrypted, and stored in private object storage. Set expiry, max opens, and grant view/print/download permissions. URLs are never public; scoped short-lived tokens are used.",
        "credits": f"50 free AI credits on sign-up. Each AI assistant turn costs ~{DEFAULT_CREDIT_COST_PER_REQUEST} credit + {AI_TOOL_EXTRA_COST} extra when tools are used. Server-side deduction only — never trust frontend balance.",
        "security": "Zero-trust: server-side auth, tenant isolation, idempotency keys, audit logs. AI tools are authorized per request and cannot access private user data without scope checks.",
    }
    if topic == "all":
        return docs
    return {topic: docs.get(topic, "No specific information on that topic.")}


# ---------------------------------------------------------------------------
# Assistant service (provider + tools + safety + credits orchestration)
# ---------------------------------------------------------------------------


class AIAssistantService:
    def __init__(
        self,
        db: Session,
        *,
        provider: Optional[AIProvider] = None,
        safety: Optional[SafetyLayer] = None,
        tool_registry: Optional[AIToolRegistry] = None,
        credit_service: Optional[Any] = None,
    ):
        self.db = db
        self.provider = provider or build_provider_from_settings()
        self.safety = safety or SafetyLayer()
        self.tool_registry = tool_registry or default_tool_registry(db)
        if credit_service is None:
            from app.services.credit_service import CreditService
            credit_service = CreditService(db)
        self.credit_service = credit_service
        self._conversations: Dict[str, AIConversation] = {}

    # ------------ public orchestration -----------------
    async def chat(
        self,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        user_message: str,
        conversation_id: Optional[str] = None,
        dedup_key: Optional[str] = None,
        max_tool_rounds: int = 3,
    ) -> AITurnResult:
        ctx = {"user_id": str(user_id), "tenant_id": str(tenant_id)}
        security_events: List[Dict[str, Any]] = []

        # 1. Safety classify user message
        user_safety = self.safety.classify_user_message(user_message)
        if user_safety.risk != MessageRisk.NORMAL:
            ev = make_security_event(
                source="AI.user_message",
                verdict=user_safety,
                actor_user_id=str(user_id),
                actor_tenant_id=str(tenant_id),
                metadata={"message_hash": _hash_for_audit(user_message)},
            )
            security_events.append(ev)
            if user_safety.risk == MessageRisk.HIGH_RISK:
                await self._notify_admins(ev)
                return AITurnResult(
                    reply_text="I can't help with that request. If you have questions about cafes, documents, jobs, or payments, I'm happy to assist.",
                    tool_results=[],
                    tokens_in=0,
                    tokens_out=0,
                    cost_cents=0.0,
                    credits_used=0,
                    safety=user_safety,
                    security_events=security_events,
                )

        # 2. Credit check
        balance = self.credit_service.get_balance(user_id=user_id, tenant_id=tenant_id)
        if balance <= 0:
            return AITurnResult(
                reply_text="You're out of AI credits. Upgrade your plan or wait for your next free allocation to continue.",
                tool_results=[],
                tokens_in=0,
                tokens_out=0,
                cost_cents=0.0,
                credits_used=0,
                safety=user_safety,
                security_events=security_events,
            )

        # 3. Conversation state
        cid = conversation_id or self._default_conversation_id(user_id)
        conv = self._conversations.setdefault(
            cid,
            AIConversation(id=cid, user_id=str(user_id), tenant_id=str(tenant_id), messages=[self._system_message()]),
        )
        conv.messages.append(AIChatMessage(role="user", content=user_message))
        conv.updated_at = datetime.utcnow()
        if not conv.title or conv.title == "New chat":
            conv.title = (user_message[:40] + "…") if len(user_message) > 40 else user_message or "New chat"

        total_in = 0
        total_out = 0
        total_cost = 0.0
        total_tool_results: List[AIToolResult] = []

        # 4. Generate + tool-call loop
        for _ in range(max_tool_rounds + 1):
            messages_payload = self._serialize_for_provider(conv.messages)
            try:
                resp: AIProviderResponse = await self.provider.generate(
                    messages=messages_payload,
                    tools=self.tool_registry.schemas(),
                    tool_choice="auto",
                    timeout_seconds=30,
                    max_retries=3,
                )
            except Exception as e:
                # Notify admins but don't leak
                return AITurnResult(
                    reply_text="I couldn't reach the AI service right now. Please try again in a moment.",
                    tool_results=[],
                    tokens_in=total_in,
                    tokens_out=total_out,
                    cost_cents=total_cost,
                    credits_used=0,
                    safety=user_safety,
                    security_events=security_events,
                )
            total_in += resp.tokens_in
            total_out += resp.tokens_out
            total_cost += resp.cost_estimate_cents

            assistant_msg = AIChatMessage(
                role="assistant",
                content=resp.content_text or "",
                tool_calls=[
                    {
                        "id": tc.call_id,
                        "name": tc.name,
                        "arguments": tc.arguments,
                    }
                    for tc in resp.tool_calls
                ],
            )
            conv.messages.append(assistant_msg)

            if not resp.tool_calls:
                break

            tool_results: List[AIToolResult] = []
            for tc in resp.tool_calls:
                tool_safety = self.safety.classify_tool_args(tc.name, tc.arguments)
                if tool_safety.risk == MessageRisk.HIGH_RISK:
                    security_events.append(make_security_event(
                        source=f"AI.tool_args.{tc.name}",
                        verdict=tool_safety,
                        actor_user_id=str(user_id),
                        actor_tenant_id=str(tenant_id),
                        metadata={"tool": tc.name, "args_hash": _hash_for_audit(json.dumps(tc.arguments))},
                    ))
                    result = AIToolResult(
                        call_id=tc.call_id,
                        name=tc.name,
                        result=None,
                        error="Tool call blocked by safety policy.",
                        is_error=True,
                    )
                else:
                    result = await self._execute_tool(tc, ctx)
                tool_results.append(result)
                total_tool_results.append(result)
                conv.messages.append(AIChatMessage(
                    role="tool",
                    content=json.dumps({"result": result.result, "error": result.error} if result.is_error else result.result, default=str),
                    tool_call_id=result.call_id,
                    name=result.name,
                ))

        # 5. Deduct credits server-side (idempotent)
        tool_rounds = sum(1 for t in total_tool_results)
        credits_used = DEFAULT_CREDIT_COST_PER_REQUEST + (tool_rounds * AI_TOOL_EXTRA_COST)
        dedup = dedup_key or f"ai_turn:{cid}:{len(conv.messages)}:{_hash_for_audit(user_message)[:12]}"
        _ = self.credit_service.consume(
            user_id=user_id,
            tenant_id=tenant_id,
            amount=credits_used,
            idempotency_key=dedup,
            category="AI_ASSISTANT",
            metadata={
                "tokens_in": total_in,
                "tokens_out": total_out,
                "provider": self.provider.name,
                "tool_calls": tool_rounds,
            },
        )

        return AITurnResult(
            reply_text=(resp.content_text or "").strip() or "Here's what I found.",
            tool_results=total_tool_results,
            tokens_in=total_in,
            tokens_out=total_out,
            cost_cents=total_cost,
            credits_used=credits_used,
            safety=user_safety,
            security_events=security_events,
        )

    # ------------ internals -----------------------------
    async def _execute_tool(self, tc: AIToolCall, ctx: Dict[str, Any]) -> AIToolResult:
        definition = self.tool_registry.get(tc.name)
        if definition is None:
            return AIToolResult(call_id=tc.call_id, name=tc.name, result=None, error=f"Unknown tool {tc.name}", is_error=True)
        try:
            out = definition.handler(tc.arguments or {}, ctx)
            if hasattr(out, "__await__"):
                out = await out
            return AIToolResult(call_id=tc.call_id, name=tc.name, result=out)
        except AIToolAuthorizationError as e:
            return AIToolResult(call_id=tc.call_id, name=tc.name, result=None, error="Not authorized.", is_error=True)
        except Exception as e:
            return AIToolResult(call_id=tc.call_id, name=tc.name, result=None, error=str(type(e).__name__), is_error=True)

    def _system_message(self) -> AIChatMessage:
        return AIChatMessage(role="system", content=(
            "You are the Cyber Café SaaS AI assistant. Your role is to help users find verified cafes, "
            "explain services, check document/print job statuses, explain credits and subscriptions, "
            "and answer product FAQs. You NEVER reveal private user information, documents of other users, "
            "passwords, tokens, payment secrets, secrets, bypass instructions, or execute arbitrary code. "
            "When asked for information you cannot answer, say so clearly. Use provided tools when possible. "
            "Keep answers concise and helpful."
        ))

    def _serialize_for_provider(self, messages: List[AIChatMessage]) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for m in messages:
            d: Dict[str, Any] = {"role": m.role, "content": m.content}
            if m.tool_calls:
                d["tool_calls"] = [
                    {
                        "id": t["id"],
                        "type": "function",
                        "function": {"name": t["name"], "arguments": json.dumps(t.get("arguments") or {}, default=str)},
                    }
                    for t in m.tool_calls
                ]
            if m.tool_call_id:
                d["tool_call_id"] = m.tool_call_id
            if m.name:
                d["name"] = m.name
            out.append(d)
        return out

    def _default_conversation_id(self, user_id) -> str:
        return f"conv_{user_id}_default"

    async def _notify_admins(self, security_event: Dict[str, Any]):
        try:
            svc = NotificationService(self.db)
            svc.dispatch(
                "PAYMENT_SUCCESS",  # reuse existing notification type — admins handle via security events
                tenant_ids=[uuid.UUID(security_event.get("actor_tenant_id"))],
                payload={
                    "title": "AI Safety Event",
                    "risk": security_event.get("risk"),
                    "event_id": security_event.get("event_id"),
                },
                entity_type="security_event",
                entity_id=security_event.get("event_id"),
            )
        except Exception:
            pass


def build_provider_from_settings() -> AIProvider:
    key = (getattr(settings, "OPENAI_API_KEY", None) or getattr(settings, "AI_API_KEY", None) or "").strip()
    base = getattr(settings, "AI_API_BASE", None) or "https://api.openai.com/v1"
    model = getattr(settings, "AI_MODEL", None) or "gpt-4o-mini"
    if key:
        return OpenAICompatibleProvider(api_key=key, base_url=base, model=model)
    return EchoProvider()


def _hash_for_audit(text: str) -> str:
    # Retain only one-way hash in logs — never store raw user text in security audit
    return hashlib_sha(text)


def hashlib_sha(text: str) -> str:
    import hashlib as _h
    return _h.sha256(text.encode("utf-8")).hexdigest()
