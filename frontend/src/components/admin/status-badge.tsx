"use client";

type StatusValue =
  | "Active" | "Locked" | "Expired"
  | "Pending" | "Approved" | "Denied"
  | "Healthy" | "Degraded" | "Down"
  | "online"  | "degraded" | "offline"
  | "Soon"    | "Suspended" | "soon"
  | "active"  | "deleted"  | string;

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  Active:     { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", dot: "#00BF63", label: "Active"     },
  online:     { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", dot: "#00BF63", label: "Online"     },
  active:     { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", dot: "#00BF63", label: "Active"     },
  Healthy:    { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", dot: "#00BF63", label: "Healthy"    },
  Approved:   { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", dot: "#00BF63", label: "Approved"   },
  Locked:     { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Locked"     },
  Expired:    { bg: "rgba(100,116,139,0.12)",text: "#94A3B8", dot: "#64748B", label: "Expired"    },
  offline:    { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Offline"    },
  Down:       { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Down"       },
  Denied:     { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Denied"     },
  Suspended:  { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Suspended"  },
  deleted:    { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", dot: "#EF4444", label: "Deleted"    },
  degraded:   { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Degraded"   },
  Degraded:   { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Degraded"   },
  Pending:    { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Pending"    },
  Soon:       { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Soon"       },
  soon:       { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Soon"       },
  Pending2:   { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B", label: "Pending"    },
};

const fallback: StatusConfig = { bg: "rgba(100,116,139,0.12)", text: "#94A3B8", dot: "#64748B", label: "Unknown" };

interface StatusBadgeProps {
  status: StatusValue;
  pulse?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, pulse, size = "md" }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? fallback;
  const px = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1 text-xs gap-1.5";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${px}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${dotSize} ${pulse ? "status-dot-pulse" : ""}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

interface RiskBadgeProps {
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const RISK_MAP: Record<string, { bg: string; text: string; label: string }> = {
  LOW:      { bg: "rgba(0,191,99,0.12)",   text: "#00BF63", label: "🟢 LOW"      },
  MEDIUM:   { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", label: "🟡 MEDIUM"   },
  HIGH:     { bg: "rgba(249,115,22,0.12)", text: "#F97316", label: "🟠 HIGH"     },
  CRITICAL: { bg: "rgba(239,68,68,0.12)",  text: "#EF4444", label: "🔴 CRITICAL" },
};

export function RiskBadge({ risk }: RiskBadgeProps) {
  const cfg = RISK_MAP[risk] ?? RISK_MAP.LOW;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}
