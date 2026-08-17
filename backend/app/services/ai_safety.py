from __future__ import annotations
import json
import re
import hashlib
import secrets
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from enum import Enum


class MessageRisk(str, Enum):
    NORMAL = "normal"
    SUSPICIOUS = "suspicious"
    HIGH_RISK = "high_risk"


RISK_ORDER = {MessageRisk.NORMAL: 0, MessageRisk.SUSPICIOUS: 1, MessageRisk.HIGH_RISK: 2}


@dataclass
class SafetyVerdict:
    risk: MessageRisk
    rule_hits: List[str] = field(default_factory=list)
    score: float = 0.0
    reasons: List[str] = field(default_factory=list)
    classification_version: str = "v1"


_SQLI_PATTERNS = [
    re.compile(r"(?i)(union\s+select|select\s+.*\s+from\s+|insert\s+into|delete\s+from|drop\s+table|update\s+.*\s+set\s+|--\s|/\*.*\*/|;--|or\s+1\s*=\s*1|')", re.S),
]
_XSS_PATTERNS = [re.compile(r"(?i)(<script[^>]*>|javascript:|on\w+\s*=|<iframe[^>]*>)", re.S)]
_CMD_PATTERNS = [re.compile(r"(?i)(rm\s+-rf|wget\s+|curl\s+.*\|\s*(ba)?sh|;|\|\s*(ba|z|k)?sh|`\$\(|python\s+-c\s+['\"])", re.S)]
_HARASS_PATTERNS = re.compile(r"(?i)(kill\s+(your)?self|self.harm|stalk|harass|bomb|threat|attack\s+)", re.S)
_PII_PATTERNS = re.compile(r"(?<!\d)(?:\d[\s-]?){9,16}(?!\d)")
_SECRET_PATTERNS = re.compile(r"(?i)(sk[_-][a-z0-9]{16,}|api[_-]?key\s*[:=]|password\s*[:=]|token\s*[:=]\s*[A-Za-z0-9_\-]{8,})")
_BYPASS_PHRASES = [
    "ignore previous", "bypass your", "reveal your prompt", "system prompt", "jailbreak",
    "forget your instructions", "you are now", "sudo", "execute as admin",
]


class SafetyLayer:
    """Rule-based AI message safety classifier. Replace/adapt with an LLM judge in production."""

    def __init__(self):
        self.classification_version = "v1"

    # --- public ----
    def classify_user_message(self, text: str) -> SafetyVerdict:
        verdict = SafetyVerdict(risk=MessageRisk.NORMAL, classification_version=self.classification_version)
        if not text:
            return verdict
        t = text.strip()
        self._apply_pattern(t, _SECRET_PATTERNS, "secret_attempt", 0.9, verdict, MessageRisk.HIGH_RISK, "Message appeared to contain secrets/tokens")
        self._apply_pattern(t, _CMD_PATTERNS, "command_injection", 0.8, verdict, MessageRisk.HIGH_RISK, "Possible command execution patterns")
        self._apply_pattern(t, _SQLI_PATTERNS, "sql_injection", 0.7, verdict, MessageRisk.HIGH_RISK, "SQL injection-like syntax")
        self._apply_pattern(t, _XSS_PATTERNS, "xss", 0.65, verdict, MessageRisk.SUSPICIOUS, "HTML/script injection syntax")
        self._apply_pattern(t, _HARASS_PATTERNS, "harm_self_or_others", 0.8, verdict, MessageRisk.HIGH_RISK, "Harm-related keywords")
        for phrase in _BYPASS_PHRASES:
            if phrase in t.lower():
                self._bump(verdict, MessageRisk.SUSPICIOUS, f"jailbreak_phrase", 0.3, f"Potential jailbreak phrase: {phrase!r}")
        if len(t) > 8000:
            self._bump(verdict, MessageRisk.SUSPICIOUS, "oversized", 0.1, "Very long message")
        return verdict

    def classify_tool_args(self, tool_name: str, arguments: Dict[str, Any]) -> SafetyVerdict:
        verdict = SafetyVerdict(risk=MessageRisk.NORMAL, classification_version=self.classification_version)
        raw = json.dumps(arguments, sort_keys=True, default=str)
        if _SECRET_PATTERNS.search(raw):
            self._bump(verdict, MessageRisk.HIGH_RISK, "secret_in_args", 0.9, "Secrets in tool arguments")
        if _CMD_PATTERNS.search(raw):
            self._bump(verdict, MessageRisk.HIGH_RISK, "cmd_in_args", 0.8, "Shell patterns in tool arguments")
        if tool_name in {"find_nearby_cafes"}:
            r = arguments.get("radius_km")
            if isinstance(r, (int, float)) and (r <= 0 or r > 500):
                self._bump(verdict, MessageRisk.SUSPICIOUS, "radius_out_of_bounds", 0.3, "Radius outside valid range")
        return verdict

    # --- internals ----
    def _apply_pattern(self, t: str, patterns, rule: str, score: float, v: SafetyVerdict, min_risk: MessageRisk, reason: str):
        hits = [p for p in patterns if p.search(t)] if isinstance(patterns, list) else ([patterns] if patterns.search(t) else [])
        if hits:
            self._bump(v, min_risk, rule, score, reason)

    def _bump(self, v: SafetyVerdict, risk: MessageRisk, rule: str, score: float, reason: str):
        if rule not in v.rule_hits:
            v.rule_hits.append(rule)
            v.reasons.append(reason)
        v.score = min(1.0, v.score + score)
        if RISK_ORDER[risk] > RISK_ORDER[v.risk]:
            v.risk = risk


def make_security_event(
    *,
    source: str,
    verdict: SafetyVerdict,
    actor_user_id: Optional[str],
    actor_tenant_id: Optional[str],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    sha = hashlib.sha256()
    sha.update(json.dumps({
        "v": verdict.classification_version,
        "hits": sorted(verdict.rule_hits),
        "actor": actor_user_id,
        "tenant": actor_tenant_id,
        "meta": metadata or {},
        "salt": secrets.token_hex(4),
    }, sort_keys=True, default=str).encode("utf-8"))
    return {
        "event_id": "sec_" + sha.hexdigest()[:24],
        "event_type": "AI_SAFETY_FLAG",
        "source": source,
        "risk": verdict.risk.value,
        "classification_version": verdict.classification_version,
        "rule_hits": list(verdict.rule_hits),
        "score": round(verdict.score, 4),
        "reasons": list(verdict.reasons),
        "actor_user_id": actor_user_id,
        "actor_tenant_id": actor_tenant_id,
        "requires_human_review": verdict.risk != MessageRisk.NORMAL,
        "review_status": "OPEN" if verdict.risk != MessageRisk.NORMAL else "CLOSED",
        "metadata": metadata or {},
        "occurred_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
