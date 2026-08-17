import { create } from "zustand";
import type {
  ChatMessage,
  ChatSession,
  AssistantCredits,
  ChatRole,
} from "@/types/assistant";

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type SendStatus = "idle" | "streaming" | "error";

interface AssistantStore {
  isOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  credits: AssistantCredits;
  sendStatus: SendStatus;
  lastErrorMessage: string | null;
  suggestedPromptsVisible: boolean;

  setOpen: (v: boolean) => void;
  toggleOpen: () => void;
  setSuggestedPromptsVisible: (v: boolean) => void;

  createSession: (title?: string) => ChatSession;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;

  appendMessage: (
    sessionId: string,
    role: ChatRole,
    content: string,
    extras?: Partial<ChatMessage>
  ) => ChatMessage;

  updateMessage: (
    sessionId: string,
    messageId: string,
    patch: Partial<ChatMessage>
  ) => void;

  appendAssistantToken: (sessionId: string, messageId: string, token: string) => void;
  finalizeAssistantMessage: (
    sessionId: string,
    messageId: string,
    usage?: ChatMessage["usage"]
  ) => void;
  failMessage: (
    sessionId: string,
    messageId: string,
    errorMessage: string
  ) => void;

  setSendStatus: (s: SendStatus) => void;
  setLastError: (msg: string | null) => void;

  setCredits: (c: Partial<AssistantCredits>) => void;
  consumeCredits: (amount: number) => void;
}

const seedCredits: AssistantCredits = {
  balance: 47,
  totalUsed: 153,
  planLimit: 200,
  resetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
};

const seedSession: ChatSession = {
  id: genId("sesh"),
  title: "Welcome",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: genId("msg"),
      role: "assistant",
      content:
        "Hi! I'm your cyber cafe assistant. I can help with document security, printing issues, billing questions, and plan recommendations. What do you need today?",
      status: "sent",
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
  ],
};

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  isOpen: false,
  sessions: [seedSession],
  activeSessionId: seedSession.id,
  credits: seedCredits,
  sendStatus: "idle",
  lastErrorMessage: null,
  suggestedPromptsVisible: true,

  setOpen: (v) => set({ isOpen: v }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setSuggestedPromptsVisible: (v) => set({ suggestedPromptsVisible: v }),

  createSession: (title) => {
    const session: ChatSession = {
      id: genId("sesh"),
      title: title ?? "New chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
    }));
    return session;
  },

  switchSession: (id) => set({ activeSessionId: id }),

  deleteSession: (id) =>
    set((s) => {
      const filtered = s.sessions.filter((x) => x.id !== id);
      const nextActive =
        s.activeSessionId === id
          ? filtered[0]?.id ?? null
          : s.activeSessionId;
      return { sessions: filtered, activeSessionId: nextActive };
    }),

  appendMessage: (sessionId, role, content, extras) => {
    const msg: ChatMessage = {
      id: genId("msg"),
      role,
      content,
      status: role === "user" ? "sending" : "streaming",
      createdAt: new Date().toISOString(),
      ...extras,
    };
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: [...sess.messages, msg],
              updatedAt: new Date().toISOString(),
              title:
                sess.messages.length === 0 && role === "user"
                  ? content.slice(0, 40)
                  : sess.title,
            }
          : sess
      ),
    }));
    return msg;
  },

  updateMessage: (sessionId, messageId, patch) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === messageId ? { ...m, ...patch } : m
              ),
            }
          : sess
      ),
    })),

  appendAssistantToken: (sessionId, messageId, token) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === messageId ? { ...m, content: m.content + token } : m
              ),
            }
          : sess
      ),
    })),

  finalizeAssistantMessage: (sessionId, messageId, usage) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === messageId
                  ? { ...m, status: "sent", usage: usage ?? m.usage }
                  : m
              ),
            }
          : sess
      ),
      sendStatus: "idle",
    })),

  failMessage: (sessionId, messageId, errorMessage) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === messageId
                  ? { ...m, status: "error", errorMessage }
                  : m
              ),
            }
          : sess
      ),
      sendStatus: "error",
      lastErrorMessage: errorMessage,
    })),

  setSendStatus: (s) => set({ sendStatus: s }),
  setLastError: (msg) => set({ lastErrorMessage: msg }),

  setCredits: (c) =>
    set((s) => ({ credits: { ...s.credits, ...c } })),

  consumeCredits: (amount) =>
    set((s) => ({
      credits: {
        ...s.credits,
        balance: Math.max(0, s.credits.balance - amount),
        totalUsed: s.credits.totalUsed + amount,
      },
    })),
}));

export function useActiveSession(): ChatSession | null {
  return useAssistantStore((s) => {
    const id = s.activeSessionId;
    return s.sessions.find((x) => x.id === id) ?? null;
  });
}
