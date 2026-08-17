"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileStack,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  PrinterCheck,
  Clock,
  CreditCard,
  X,
  AlertTriangle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore } from "@/lib/store/use-notification-store";
import type { AppNotification, NotificationType } from "@/types/notification";
import { NOTIFICATION_PRIORITY_VARIANT } from "@/types/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ICONS: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  document_received: FileStack,
  access_request: UserCheck,
  access_approved: CheckCircle2,
  access_denied: AlertCircle,
  print_started: Printer,
  print_completed: PrinterCheck,
  document_expiring: Clock,
  payment_successful: CreditCard,
};

const ICON_BG: Record<NotificationType, string> = {
  document_received: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  access_request: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  access_approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  access_denied: "bg-red-500/10 text-destructive",
  print_started: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  print_completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  document_expiring: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  payment_successful: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const BORDER_BY_PRIORITY: Record<string, string> = {
  urgent: "border-l-4 border-l-destructive",
  high: "border-l-4 border-l-amber-500",
  normal: "",
  low: "",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m`;
}

function ToastCard({
  toast,
}: {
  toast: ReturnType<typeof useNotificationStore.getState>["toasts"][number];
}) {
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const n: AppNotification = toast.notification;
  const Icon = ICONS[n.type];

  const [progress, setProgress] = useState(100);
  const totalLife = toast.expiresAt - new Date(n.createdAt).getTime();

  useEffect(() => {
    if (!isFinite(totalLife) || totalLife <= 0) return;
    const start = Date.now();
    const deadline = toast.expiresAt;
    const total = Math.max(1000, deadline - start);
    const id = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setProgress(Math.max(0, (remaining / total) * 100));
      if (remaining <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [toast.expiresAt, totalLife, n.createdAt]);

  const action = n.actions?.[0];
  const priorityVariant = NOTIFICATION_PRIORITY_VARIANT[n.priority];

  const onClickBody = useCallback(() => {
    markAsRead(n.id);
    dismissToast(toast.id);
  }, [markAsRead, dismissToast, n.id, toast.id]);

  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "w-[360px] max-w-[94vw] relative overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl",
        BORDER_BY_PRIORITY[n.priority]
      )}
      onClick={onClickBody}
      role="status"
      aria-live={n.priority === "urgent" ? "assertive" : "polite"}
    >
      <div className="flex gap-3 p-3.5">
        <div
          className={cn(
            "p-2 rounded-lg shrink-0 h-fit",
            ICON_BG[n.type]
          )}
        >
          {n.priority === "urgent" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight pr-1">{n.title}</p>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant={priorityVariant}
                className="text-[10px] h-4 capitalize"
              >
                {n.priority}
              </Badge>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-snug line-clamp-3">
            {n.message}
          </p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(n.createdAt)} ago
            </span>
            <div className="flex items-center gap-2">
              {action && action.href && (
                <Link
                  href={action.href}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  {action.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
              {action && !action.href && (
                <span className="text-xs font-medium text-primary">
                  {action.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-0.5 w-full bg-muted/60">
        <motion.div
          className="h-full bg-primary/70"
          style={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
    </motion.div>
  );

  if (action?.href) return content;
  return content;
}

export function NotificationToaster() {
  const toasts = useNotificationStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
