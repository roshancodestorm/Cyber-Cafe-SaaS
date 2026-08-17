from __future__ import annotations
import abc
import json
import time
import hashlib
import uuid
import secrets
from dataclasses import dataclass, field, asdict
from typing import Any, Awaitable, Callable, Dict, List, Optional, Union


@dataclass
class AIProviderResponse:
    provider: str
    model: str
    content_text: str
    tool_calls: List["AIToolCall"] = field(default_factory=list)
    tokens_in: int = 0
    tokens_out: int = 0
    cost_estimate_cents: float = 0.0
    finish_reason: Optional[str] = None
    raw: Any = None


@dataclass
class AIToolCall:
    call_id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class AIToolResult:
    call_id: str
    name: str
    result: Any
    error: Optional[str] = None
    is_error: bool = False


class AIProvider(abc.ABC):
    name: str

    @abc.abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        timeout_seconds: int = 30,
        max_retries: int = 3,
    ) -> AIProviderResponse:
        ...


class ProviderNotConfiguredError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# OpenAI-compatible provider (works for OpenAI, Together, Groq, etc.)
# ---------------------------------------------------------------------------


class OpenAICompatibleProvider(AIProvider):
    name = "openai_compat"

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        model: str = "gpt-4o-mini",
        default_temperature: float = 0.2,
        default_max_tokens: int = 1024,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.default_temperature = default_temperature
        self.default_max_tokens = default_max_tokens

    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        timeout_seconds: int = 30,
        max_retries: int = 3,
    ) -> AIProviderResponse:
        import urllib.request
        import urllib.error

        url = f"{self.base_url}/chat/completions"
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self.default_temperature,
            "max_tokens": max_tokens if max_tokens is not None else self.default_max_tokens,
        }
        if tools:
            payload["tools"] = tools
            payload["parallel_tool_calls"] = False
        if tool_choice:
            payload["tool_choice"] = tool_choice
        if response_schema:
            payload["response_format"] = {"type": "json_object", "schema": response_schema}

        last_err: Optional[Exception] = None
        for attempt in range(1, max_retries + 1):
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "Accept": "application/json",
                    },
                    method="POST",
                )
                import asyncio

                loop = asyncio.get_event_loop()
                resp_b: bytes = await loop.run_in_executor(
                    None,
                    lambda: urllib.request.urlopen(req, timeout=timeout_seconds).read(),
                )
                body = json.loads(resp_b.decode("utf-8"))
                choice = body["choices"][0]
                msg = choice["message"]
                tool_calls: List[AIToolCall] = []
                for tc in msg.get("tool_calls") or []:
                    fn = tc.get("function") or {}
                    try:
                        args = json.loads(fn.get("arguments") or "{}")
                    except json.JSONDecodeError:
                        args = {}
                    tool_calls.append(
                        AIToolCall(
                            call_id=tc.get("id") or secrets.token_hex(8),
                            name=fn.get("name") or "",
                            arguments=args,
                        )
                    )
                usage = body.get("usage") or {}
                return AIProviderResponse(
                    provider=self.name,
                    model=body.get("model", self.model),
                    content_text=msg.get("content") or "",
                    tool_calls=tool_calls,
                    tokens_in=int(usage.get("prompt_tokens") or 0),
                    tokens_out=int(usage.get("completion_tokens") or 0),
                    finish_reason=choice.get("finish_reason"),
                    raw=body,
                )
            except Exception as e:
                last_err = e
                if attempt < max_retries:
                    time.sleep(min(2 ** (attempt - 1), 5))
                    continue
        assert last_err is not None
        raise last_err


# ---------------------------------------------------------------------------
# Echo/fallback provider (for dev without keys — deterministic canned replies)
# ---------------------------------------------------------------------------


class EchoProvider(AIProvider):
    name = "echo"

    def __init__(self, seed: str = ""):
        self.seed = seed

    async def generate(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        timeout_seconds: int = 30,
        max_retries: int = 3,
    ) -> AIProviderResponse:
        last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
        text = (last_user or {}).get("content") or ""
        tool_calls: List[AIToolCall] = []
        if tools and tool_choice != "none":
            lowered = text.lower()
            if any(k in lowered for k in ["cafe", "nearby", "distance", "location"]):
                tool_calls.append(AIToolCall(
                    call_id="tc_" + hashlib.md5(text.encode()).hexdigest()[:10],
                    name="find_nearby_cafes",
                    arguments={"radius_km": 5},
                ))
            elif any(k in lowered for k in ["job", "print", "status"]):
                tool_calls.append(AIToolCall(
                    call_id="tc_" + hashlib.md5(text.encode()).hexdigest()[:10],
                    name="get_job_status",
                    arguments={"job_id": "latest"},
                ))
            elif any(k in lowered for k in ["credit", "balance", "usage"]):
                tool_calls.append(AIToolCall(
                    call_id="tc_" + hashlib.md5(text.encode()).hexdigest()[:10],
                    name="get_credit_balance",
                    arguments={},
                ))
        reply = (
            "I'm your Cyber Café assistant. Ask me about nearby cafés, document jobs, "
            "printing, credits, or subscriptions. If I don't know the answer, I'll use safe tools."
        )
        return AIProviderResponse(
            provider=self.name,
            model="echo",
            content_text=reply,
            tool_calls=tool_calls,
            tokens_in=len(text) // 4,
            tokens_out=len(reply) // 4,
            finish_reason="stop",
        )
