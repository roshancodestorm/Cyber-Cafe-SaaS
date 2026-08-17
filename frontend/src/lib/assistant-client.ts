/**
 * AI Assistant Client Abstraction Layer
 *
 * Team 4 will replace the mock implementations below with real calls
 * to the AI service once the backend is available.
 *
 * IMPORTANT:
 * - Do NOT implement the AI model itself in this file or anywhere on the frontend.
 * - Frontend only renders output, streams tokens, reports errors, and tracks credits.
 * - The backend MUST validate auth, deduct credits, rate-limit, and sanitize output.
 * - Streaming is done via ReadableStream (SSE-style chunks) or WebSocket tokens.
 */

import type {
  ChatMessage,
  AssistantCredits,
  AssistantStreamEvent,
} from "@/types/assistant";

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000/api/ai";

const MOCK_RESPONSES: Record<string, string> = {
  security:
    "All document security is enforced server-side. When you upload a file, the backend stores it encrypted and returns a signed, short-lived preview URL. Permission flags (canView, canDownload, canPrint) are read from the server's DocumentDetails — never from client state. If the server denies an action, the UI simply hides the control; this is a UX convenience, not security. The final policy lives in the backend document access service.",
  print:
    "If a print job is stuck, try these steps in order:\n\n1. Open Job Tracking and confirm the status is not Failed.\n2. Refresh the list — sometimes the cafe queue pauses briefly.\n3. If status shows Processing for >5 min, contact the front desk and quote the Job ID.\n4. The printer may be low on paper or toner — cafe staff can see hardware alerts on their dashboard.\n\nNote: Print jobs are charged on submission, not on completion. Failed jobs are refunded automatically within 2 minutes of the server detecting the failure.",
  session:
    "To maximize session value:\n\n• Pre-upload documents before sitting at a terminal — upload time is free.\n• Use view-only mode unless you actually need download — print/download sessions are billed at a higher tier.\n• Set short auto-delete windows (15–30 min) — short sessions unlock small loyalty discounts.\n• If you run low on time, top up from the wallet page *before* expiry to avoid interruptions.\n• Pause (if supported by the cafe) suspends billing for up to 10 min.",
  pricing:
    "Three tiers are available:\n\nStarter — $29/mo, up to 20 terminals, basic billing & reports, standard support.\nPro — $79/mo, up to 100 terminals, advanced analytics, cloud printing module, priority support.\nEnterprise — custom pricing, unlimited terminals, AI assistant module, custom branding, 24/7 phone support.\n\nAll plans include document security. AI credits are billed separately: $0.0025 per 1K tokens, or included in the Enterprise tier.",
};

function pickMockResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("security") || p.includes("document") || p.includes("access"))
    return MOCK_RESPONSES.security;
  if (p.includes("print")) return MOCK_RESPONSES.print;
  if (p.includes("session") || p.includes("time") || p.includes("value"))
    return MOCK_RESPONSES.session;
  if (p.includes("pricing") || p.includes("plan") || p.includes("credit") || p.includes("cost"))
    return MOCK_RESPONSES.pricing;
  return "I can help with document security, printing issues, session optimization, and pricing. Could you be a little more specific, or try one of the suggested prompts?";
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < text.length; ) {
    const chunk = Math.min(1 + Math.floor(Math.random() * 6), text.length - i);
    tokens.push(text.slice(i, i + chunk));
    i += chunk;
  }
  return tokens;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface SendMessageOptions {
  sessionId: string;
  userMessage: string;
  previousMessages: ChatMessage[];
  onToken?: (token: string) => void;
  onDone?: (usage: ChatMessage["usage"]) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

export const assistantClient = {
  async sendMessage(opts: SendMessageOptions): Promise<void> {
    const { onToken, onDone, onError, signal } = opts;

    try {
      await sleep(400);
      const response = pickMockResponse(opts.userMessage);
      const tokens = tokenize(response);

      for (const tok of tokens) {
        if (signal?.aborted) return;
        onToken?.(tok);
        await sleep(10 + Math.floor(Math.random() * 25));
      }

      const totalTokens =
        Math.ceil(opts.userMessage.length / 4) +
        Math.ceil(response.length / 4);
      const creditsUsed = Math.max(1, Math.ceil(totalTokens / 50));

      onDone?.({
        promptTokens: Math.ceil(opts.userMessage.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens,
        creditsUsed,
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "Request cancelled."
          : "Unable to reach the assistant. Please try again in a moment.";
      onError?.(msg);
    }
  },

  /**
   * Stream from the real Team 4 AI endpoint.
   *
   * Expected backend contract:
   *   POST /ai/chat
   *   Authorization: Bearer <token>
   *   Content-Type: application/json
   *   Body: { sessionId, previousMessages: ChatMessage[], message: string }
   *   Response: text/event-stream  (SSE-style)
   *     event: token  data: { token: string }
   *     event: usage  data: { totalTokens, creditsUsed, ... }
   *     event: done   data: {}
   *     event: error  data: { message: string }
   */
  async sendMessageLive(opts: SendMessageOptions): Promise<void> {
    const { sessionId, userMessage, previousMessages, onToken, onDone, onError, signal } = opts;

    try {
      const res = await fetch(`${AI_BASE_URL}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, previousMessages, message: userMessage }),
        signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Assistant returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event = parseSSE(part);
          switch (event.type) {
            case "token":
              onToken?.(event.token ?? "");
              break;
            case "usage":
              break;
            case "done":
              onDone?.(event.usage);
              return;
            case "error":
              throw new Error(event.errorMessage ?? "Unknown error");
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        onError?.("Request cancelled.");
      } else {
        onError?.(err instanceof Error ? err.message : "Assistant request failed.");
      }
    }
  },

  async getCredits(): Promise<AssistantCredits> {
    await sleep(200);
    return {
      balance: 47,
      totalUsed: 153,
      planLimit: 200,
      resetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    };
  },

  async getCreditsLive(): Promise<AssistantCredits> {
    const res = await fetch(`${AI_BASE_URL}/credits`, { credentials: "include" });
    if (!res.ok) throw new Error("Cannot load credits");
    return res.json();
  },
};

function parseSSE(block: string): AssistantStreamEvent {
  const lines = block.split("\n");
  let eventType: AssistantStreamEvent["type"] = "token";
  let data: Record<string, unknown> = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("event:")) {
      const v = line.slice(6).trim();
      if (v === "done" || v === "error" || v === "usage" || v === "token") {
        eventType = v;
      }
    } else if (line.startsWith("data:")) {
      const rawData = line.slice(5).trim();
      if (rawData === "[DONE]") continue;
      try {
        data = JSON.parse(rawData);
      } catch {
        data = { token: rawData };
      }
    }
  }

  return {
    type: eventType,
    token: typeof data.token === "string" ? data.token : undefined,
    errorMessage:
      typeof data.message === "string" ? data.message :
      typeof data.errorMessage === "string" ? data.errorMessage : undefined,
    usage: typeof data.usage === "object" ? (data.usage as ChatMessage["usage"]) : undefined,
  };
}

export { AI_BASE_URL };
