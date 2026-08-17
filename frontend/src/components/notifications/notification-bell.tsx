"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  FileStack,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Clock,
  CreditCard,
  CheckCheck,
  Trash2,
  Settings,
  X,
  XCircle,
  PrinterCheck,
  Wifi,
  WifiOff,
  ArrowUpRight,
} from "lucide-react";
import {
  useNotificationStore,
  useUnreadCount,
  useRealtimeStatus,
} from "@/lib/store/use-notification-store";
import { useShallow } from "zustand/react/shallow";
import type { AppNotification, NotificationType } from "@/types/notification";
import { NOTIFICATION_PRIORITY_VARIANT } from "@/types/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ICONS: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  document_received: FileStack,
  access_request: UserCheck,
  access_approved: CheckCircle2,
  access_denied: XCircle,
  print_started: Printer,
  print_completed: PrinterCheck,
  document_expiring: Clock,
  payment_successful: CreditCard,
};

const ICON_COLORS: Record<NotificationType, string> = {
  document_received: "text-blue-600 dark:text-blue-400",
  access_request: "text-amber-600 dark:text-amber-400",
  access_approved: "text-green-600 dark:text-green-400",
  access_denied: "text-destructive",
  print_started: "text-indigo-600 dark:text-indigo-400",
  print_completed: "text-green-600 dark:text-green-400",
  document_expiring: "text-orange-600 dark:text-orange-400",
  payment_successful: "text-emerald-600 dark:text-emerald-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const unread = useUnreadCount();
  const { connected, sseConnected, wsConnected } = useRealtimeStatus();
  const notifications = useNotificationStore(
    useShallow((s) => s.notifications.slice(0, 30))
  );
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearNotification = useNotificationStore((s) => s.clearNotification);
  const router = useRouter();

  const handleAction = useCallback(
    (n: AppNotification) => {
      markAsRead(n.id);
      if (n.actions?.[0]?.href) {
        router.push(n.actions[0].href);
      } else if (n.documentId) {
        router.push(`/user/documents/${n.documentId}`);
      }
    },
    [markAsRead, router]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
            <span
              className={cn(
                "absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-background",
                connected ? "bg-green-500" : "bg-muted-foreground/40"
              )}
              title={
                connected
                  ? wsConnected
                    ? "WebSocket connected"
                    : "SSE connected"
                  : "Offline — notifications may be delayed"
              }
            />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[380px] p-0">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {unread} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={markAllAsRead}
                disabled={unread === 0}
                title="Mark all read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="sr-only">Mark all read</span>
              </Button>
              <Button variant="ghost" size="icon-xs" title="Settings">
                <Settings className="h-3.5 w-3.5" />
                <span className="sr-only">Notification settings</span>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30">
            {connected ? (
              <>
                <Wifi className="h-3 w-3 text-green-600 dark:text-green-400" />
                Live {wsConnected ? "(WebSocket)" : "(SSE)"} — updates in real time
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline — reload to reconnect
              </>
            )}
          </div>
          <Separator />
          <DropdownMenuGroup className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No notifications yet.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => handleAction(n)}
                    className={cn(
                      "group px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent/60 relative",
                      !n.read && "bg-primary/[0.04]"
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 p-1.5 rounded-md bg-muted shrink-0",
                          ICON_COLORS[n.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              !n.read && "font-semibold"
                            )}
                          >
                            {n.title}
                          </p>
                          <Badge
                            variant={NOTIFICATION_PRIORITY_VARIANT[n.priority]}
                            className="shrink-0 text-[10px] h-4"
                          >
                            {n.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {n.actions?.[0] && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(n);
                                }}
                              >
                                {n.actions[0].label}
                                <ArrowUpRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!n.read) markAsRead(n.id);
                              }}
                              disabled={n.read}
                              title={n.read ? "Read" : "Mark read"}
                            >
                              <CheckCheck className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(n.id);
                              }}
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!n.read && (
                      <span className="absolute top-3 left-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })
            )}
          </DropdownMenuGroup>
          <Separator />
          <DropdownMenuItem className="px-3 py-2 text-xs text-muted-foreground justify-center cursor-default">
            <Trash2 className="h-3 w-3 mr-1.5" />
            Clear all notifications
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
