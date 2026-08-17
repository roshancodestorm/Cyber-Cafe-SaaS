import { Badge } from "@/components/ui/badge";
import type { DocumentJobStatus, DocumentStatus } from "@/types/document";

type StatusValue = DocumentStatus | DocumentJobStatus;

const statusConfig: Record<
  StatusValue,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "outline" },
  ready: { label: "Ready", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  deleted: { label: "Deleted", variant: "destructive" },
};

export function DocumentStatusBadge({ status }: { status: StatusValue }) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "No auto-delete";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${remaining}m`;
}

export function formatExpiry(isoDate: string | null): string {
  if (!isoDate) return "No expiry set";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Unknown expiry";
  return date.toLocaleString();
}
