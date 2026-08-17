"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  StopCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Crown,
  ArrowRight,
  User,
  Bot,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useAssistantStore,
  useActiveSession,
} from "@/lib/store/use-assistant-store";
import { assistantClient } from "@/lib/assistant-client";
import type { ChatMessage } from "@/types/assistant";
import { DEFAULT_SUGGESTIONS } from "@/types/assistant";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
    </div>
  );
}

function MessageBubble({
  msg,
  onRetry,
  onCopy,
}: {
  msg: ChatMessage;
  onRetry?: () => void;
  onCopy: (text: string) => void;
}) {
  const isUser = msg.role === "user";
  const errored = msg.status === "error";
  const streaming = msg.status === "streaming";
  const sending = msg.status === "sending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-gradient-to-br from-primary/80 to-purple-600 text-primary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "group max-w-[85%] flex flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : cn(
                  "bg-muted/60 text-foreground rounded-bl-md border border-border/50",
                  errored &&
                    "bg-destructive/5 border-destructive/30 text-destructive-foreground"
                )
          )}
        >
          {sending && !msg.content ? (
            <TypingDots />
          ) : streaming && !msg.content ? (
            <TypingDots />
          ) : (
            <>
              {msg.content}
              {streaming && (
                <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-foreground/80 animate-pulse rounded-[1px]" />
              )}
            </>
          )}
        </div>

        {errored && (
          <div className="mt-2 w-full">
            <Alert variant="destructive" className="py-2 px-3">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertTitle className="text-xs">Request failed</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">
                {msg.errorMessage ?? "Unknown error. Please try again."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div
          className={cn(
            "mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-muted-foreground px-1">
            {formatTime(msg.createdAt)}
          </span>
          {!isUser && !errored && msg.content && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onCopy(msg.content)}
                title="Copy"
                aria-label="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Helpful"
                aria-label="Mark as helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Not helpful"
                aria-label="Mark as not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </>
          )}
          {errored && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onRetry}
              className="gap-1 text-[11px]"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
          {msg.usage?.creditsUsed && (
            <Badge variant="outline" className="text-[10px] h-4 gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              −{msg.usage.creditsUsed}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreditLimitBanner({ onUpgrade }: { onUpgrade: () => void }) {
  const credits = useAssistantStore((s) => s.credits);
  const pct =
    credits.planLimit !== null
      ? Math.min(100, (credits.balance / credits.planLimit) * 100)
      : 0;

  const nearZero = credits.balance <= 5;
  const low = credits.balance <= 15;

  if (!low) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-3 pt-2.5"
    >
      <Card
        className={cn(
          "border-0",
          nearZero
            ? "bg-destructive/10 text-destructive-foreground"
            : "bg-gradient-to-r from-amber-500/10 to-primary/10"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "p-1.5 rounded-md shrink-0",
                  nearZero
                    ? "bg-destructive/20 text-destructive"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                )}
              >
                <Crown className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {nearZero ? "Almost out of credits" : "Credits running low"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {credits.balance === 0
                    ? "You're out of AI credits. Upgrade to continue."
                    : `${credits.balance} credit${credits.balance === 1 ? "" : "s"} remaining.`}
                </p>
                {credits.planLimit !== null && (
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden w-full max-w-[200px]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        nearZero ? "bg-destructive" : "bg-amber-500"
                      )}
                      style={{ width: `${100 - pct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <Button size="sm" onClick={onUpgrade} className="gap-1 shrink-0">
              Upgrade
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SuggestionChips({ onPick }: { onPick: (prompt: string) => void }) {
  const show = useAssistantStore((s) => s.suggestedPromptsVisible);
  const session = useActiveSession();
  const hasMessages = (session?.messages.length ?? 0) > 1;
  if (!show || hasMessages) return null;

  return (
    <div className="px-3 py-2">
      <p className="text-[11px] text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        Try asking about
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {DEFAULT_SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.prompt)}
            className="group text-left rounded-lg border bg-background hover:bg-accent/50 px-3 py-2 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{s.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {s.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const session = useActiveSession();
  const activeSessionId = useAssistantStore((s) => s.activeSessionId);
  const sendStatus = useAssistantStore((s) => s.sendStatus);
  const lastError = useAssistantStore((s) => s.lastErrorMessage);
  const credits = useAssistantStore((s) => s.credits);
  const createSession = useAssistantStore((s) => s.createSession);
  const appendMessage = useAssistantStore((s) => s.appendMessage);
  const updateMessage = useAssistantStore((s) => s.updateMessage);
  const appendAssistantToken = useAssistantStore((s) => s.appendAssistantToken);
  const finalizeAssistantMessage = useAssistantStore(
    (s) => s.finalizeAssistantMessage
  );
  const failMessage = useAssistantStore((s) => s.failMessage);
  const setSendStatus = useAssistantStore((s) => s.setSendStatus);
  const setLastError = useAssistantStore((s) => s.setLastError);
  const consumeCredits = useAssistantStore((s) => s.consumeCredits);
  const setSuggestedPromptsVisible = useAssistantStore(
    (s) => s.setSuggestedPromptsVisible
  );

  const busy = sendStatus === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [session?.messages.length, session?.messages[session.messages.length - 1]?.content]);

  const ensureSession = useCallback((): string => {
    if (activeSessionId) return activeSessionId;
    return createSession().id;
  }, [activeSessionId, createSession]);

  const send = useCallback(
    async (promptOverride?: string) => {
      const prompt = (promptOverride ?? input).trim();
      if (!prompt || busy) return;
      const sid = ensureSession();

      setSuggestedPromptsVisible(false);
      setLastError(null);
      setSendStatus("streaming");

      const userMsg = appendMessage(sid, "user", prompt);
      updateMessage(sid, userMsg.id, { status: "sent" });
      setInput("");

      const assistantMsg = appendMessage(sid, "assistant", "");

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const previous = (session?.messages ?? []).slice(-20);

      await assistantClient.sendMessage({
        sessionId: sid,
        userMessage: prompt,
        previousMessages: previous,
        signal: ctrl.signal,
        onToken: (tok) => {
          appendAssistantToken(sid, assistantMsg.id, tok);
        },
        onDone: (usage) => {
          if (usage?.creditsUsed) consumeCredits(usage.creditsUsed);
          finalizeAssistantMessage(sid, assistantMsg.id, usage);
          setSendStatus("idle");
        },
        onError: (msg) => {
          failMessage(sid, assistantMsg.id, msg);
          setLastError(msg);
        },
      });
    },
    [
      input,
      busy,
      ensureSession,
      setSuggestedPromptsVisible,
      setLastError,
      setSendStatus,
      appendMessage,
      updateMessage,
      session?.messages,
      appendAssistantToken,
      consumeCredits,
      finalizeAssistantMessage,
      failMessage,
    ]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSendStatus("idle");
  };

  const retryFailed = (messageId: string, originalUserPrompt?: string) => {
    if (originalUserPrompt) send(originalUserPrompt);
  };

  const findUserPrompt = (failedId: string): string | undefined => {
    if (!session) return undefined;
    const idx = session.messages.findIndex((m) => m.id === failedId);
    for (let i = idx - 1; i >= 0; i--) {
      if (session.messages[i].role === "user") return session.messages[i].content;
    }
    return undefined;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
    }
  };

  const outOfCredits = credits.balance <= 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b bg-muted/30">
        <div className="flex items-center gap-1 min-w-0">
          <Button
            variant="ghost"
            size="xs"
            className="gap-1"
            onClick={() => createSession()}
          >
            <Plus className="h-3 w-3" />
            New chat
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground truncate px-1">
            {session?.title ?? "Chat"}
          </span>
        </div>
        <Button variant="ghost" size="icon-xs" title="Clear chat" aria-label="Clear chat">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-4 bg-gradient-to-b from-transparent to-muted/20"
      >
        {session?.messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">How can I help today?</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Ask about document security, printing, session usage, or plans.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {session?.messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              onCopy={copyText}
              onRetry={
                m.status === "error"
                  ? () => retryFailed(m.id, findUserPrompt(m.id))
                  : undefined
              }
            />
          ))}
        </AnimatePresence>

        {lastError && sendStatus === "error" && (session?.messages.length ?? 0) === 0 && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Assistant unavailable</AlertTitle>
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}
      </div>

      <SuggestionChips onPick={(p) => send(p)} />
      <CreditLimitBanner onUpgrade={() => {}} />

      <div className="border-t bg-background p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                outOfCredits
                  ? "Out of credits — upgrade to continue"
                  : busy
                    ? "Assistant is typing…"
                    : "Ask anything…"
              }
              disabled={busy || outOfCredits}
              className="pr-16 min-h-[40px] py-2"
            />
            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 pointer-events-none">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 gap-1 border-transparent pointer-events-auto",
                  outOfCredits
                    ? "bg-destructive/10 text-destructive"
                    : credits.balance <= 15
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "text-muted-foreground/80"
                )}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {credits.balance}
              </Badge>
            </div>
          </div>
          {busy ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stop}
              aria-label="Stop generating"
              title="Stop"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || outOfCredits}
              aria-label="Send message"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
        <p className="text-[10px] text-muted-foreground mt-2 px-1 text-center">
          AI responses are generated by the backend service. Verify sensitive information independently.
        </p>
      </div>
    </div>
  );
}
