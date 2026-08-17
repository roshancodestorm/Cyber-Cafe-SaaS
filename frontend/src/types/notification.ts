export type NotificationType =
  | "document_received"
  | "access_request"
  | "access_approved"
  | "access_denied"
  | "print_started"
  | "print_completed"
  | "document_expiring"
  | "payment_successful";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationAction {
  label: string;
  href?: string;
  actionId: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  documentId?: string;
  jobId?: string;
  requestId?: string;
  paymentId?: string;
  amount?: number;
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  document_received: "FileInbox",
  access_request: "UserCheck",
  access_approved: "CheckCircle2",
  access_denied: "XCircle",
  print_started: "Printer",
  print_completed: "PrinterCheck",
  document_expiring: "ClockAlert",
  payment_successful: "CreditCard",
};

export const NOTIFICATION_PRIORITY_VARIANT: Record<
  NotificationPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  normal: "default",
  high: "outline",
  urgent: "destructive",
};
