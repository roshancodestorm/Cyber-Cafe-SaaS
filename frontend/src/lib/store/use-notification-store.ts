import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  AppNotification,
  NotificationType,
  NotificationPriority,
} from "@/types/notification";

function genId(): string {
  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface Toast {
  id: string;
  notification: AppNotification;
  expiresAt: number;
}

interface NotificationStore {
  notifications: AppNotification[];
  toasts: Toast[];
  sseConnected: boolean;
  wsConnected: boolean;
  lastEventAt: string | null;

  addNotification: (
    partial: Omit<AppNotification, "id" | "createdAt" | "read"> & {
      read?: boolean;
    }
  ) => AppNotification;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;

  showToast: (notification: AppNotification, durationMs?: number) => void;
  dismissToast: (toastId: string) => void;

  setSseConnected: (v: boolean) => void;
  setWsConnected: (v: boolean) => void;
  setLastEventAt: (iso: string | null) => void;

  handleInboundEvent: (event: RealtimeNotificationEvent) => void;
}

export interface RealtimeNotificationEvent {
  source: "ws" | "sse" | "poll";
  eventType: NotificationType;
  payload: Partial<AppNotification> & {
    title: string;
    message: string;
  };
  priority?: NotificationPriority;
  serverTimestamp?: string;
}

const TOAST_DEFAULT_MS = 6000;

const seedNotifications: AppNotification[] = [
  {
    id: genId(),
    type: "print_completed",
    title: "Print job complete",
    message: "Tax_Return_2025.pdf has finished printing at Terminal 04.",
    priority: "normal",
    read: false,
    createdAt: new Date(Date.now() - 420000).toISOString(),
    documentId: "doc_sample_001",
    jobId: "job_001",
  },
  {
    id: genId(),
    type: "access_request",
    title: "Document access requested",
    message: "A cafe visitor is requesting access to view Contract_Signing_Draft.pdf.",
    priority: "high",
    read: false,
    createdAt: new Date(Date.now() - 180000).toISOString(),
    documentId: "doc_sample_003",
    requestId: "req_waiting_01",
    actions: [
      { label: "Review", href: "/user/documents/doc_sample_003", actionId: "review" },
    ],
  },
  {
    id: genId(),
    type: "payment_successful",
    title: "Payment confirmed",
    message: "+60 min session — your wallet was charged $4.50 successfully.",
    priority: "low",
    read: true,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    paymentId: "pay_20260809_441",
    amount: 4.5,
  },
];

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: seedNotifications,
  toasts: [],
  sseConnected: false,
  wsConnected: false,
  lastEventAt: null,

  addNotification: (partial) => {
    const now = new Date();
    const { priority, ...rest } = partial;
    const notification: AppNotification = {
      id: genId(),
      createdAt: now.toISOString(),
      read: false,
      priority: priority ?? "normal",
      ...rest,
    };
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 200),
      lastEventAt: now.toISOString(),
    }));
    get().showToast(notification);
    return notification;
  },

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  showToast: (notification, durationMs = TOAST_DEFAULT_MS) => {
    const toastId = `t_${notification.id}_${Date.now()}`;
    const expiresAt = Date.now() + durationMs;

    set((s) => ({
      toasts: [...s.toasts, { id: toastId, notification, expiresAt }],
    }));

    if (durationMs !== Infinity && durationMs > 0) {
      setTimeout(() => {
        get().dismissToast(toastId);
      }, durationMs);
    }
  },

  dismissToast: (toastId) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== toastId),
    })),

  setSseConnected: (v) => set({ sseConnected: v }),
  setWsConnected: (v) => set({ wsConnected: v }),
  setLastEventAt: (iso) => set({ lastEventAt: iso }),

  handleInboundEvent: (event) => {
    const created = event.serverTimestamp ?? new Date().toISOString();
    const added = get().addNotification({
      type: event.eventType,
      priority: event.priority ?? "normal",
      createdAt: created,
      ...event.payload,
    });
    set({ lastEventAt: created });
    return added;
  },
}));

export function useUnreadCount(): number {
  return useNotificationStore((s) =>
    s.notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
  );
}

export function useRealtimeStatus(): {
  sseConnected: boolean;
  wsConnected: boolean;
  connected: boolean;
} {
  return useNotificationStore(
    useShallow((s) => ({
      sseConnected: s.sseConnected,
      wsConnected: s.wsConnected,
      connected: s.sseConnected || s.wsConnected,
    }))
  );
}

let wsSingleton: WebSocket | null = null;
let sseSingleton: EventSource | null = null;

export function connectWebSocket(url: string) {
  if (typeof window === "undefined") return;
  if (wsSingleton) return wsSingleton;

  try {
    const ws = new WebSocket(url);
    wsSingleton = ws;

    ws.onopen = () => useNotificationStore.getState().setWsConnected(true);
    ws.onclose = () => {
      useNotificationStore.getState().setWsConnected(false);
      wsSingleton = null;
    };
    ws.onerror = () => {
      useNotificationStore.getState().setWsConnected(false);
    };
    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as RealtimeNotificationEvent;
        useNotificationStore.getState().handleInboundEvent({
          ...parsed,
          source: parsed.source ?? "ws",
        });
      } catch {
      }
    };
    return ws;
  } catch {
    useNotificationStore.getState().setWsConnected(false);
    return null;
  }
}

export function connectSSE(url: string) {
  if (typeof window === "undefined") return;
  if (sseSingleton) return sseSingleton;

  try {
    const sse = new EventSource(url, { withCredentials: true });
    sseSingleton = sse;

    sse.onopen = () => useNotificationStore.getState().setSseConnected(true);
    sse.onerror = () => useNotificationStore.getState().setSseConnected(false);

    sse.addEventListener("notification", (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as RealtimeNotificationEvent;
        useNotificationStore.getState().handleInboundEvent({
          ...parsed,
          source: "sse",
        });
      } catch {
      }
    });

    return sse;
  } catch {
    useNotificationStore.getState().setSseConnected(false);
    return null;
  }
}

export function disconnectRealtime() {
  if (wsSingleton) {
    wsSingleton.close();
    wsSingleton = null;
  }
  if (sseSingleton) {
    sseSingleton.close();
    sseSingleton = null;
  }
  useNotificationStore.setState({
    wsConnected: false,
    sseConnected: false,
  });
}
