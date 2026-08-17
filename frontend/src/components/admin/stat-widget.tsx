"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Color = "primary" | "success" | "warning" | "danger" | "secondary" | "default";

const colorMap: Record<Color, { icon: string; badge: string; glow: string }> = {
  primary:   { icon: "var(--admin-primary)",   badge: "rgba(255,107,53,0.15)",  glow: "rgba(255,107,53,0.12)"  },
  success:   { icon: "var(--admin-success)",   badge: "rgba(0,191,99,0.15)",    glow: "rgba(0,191,99,0.12)"    },
  warning:   { icon: "var(--admin-warning)",   badge: "rgba(245,158,11,0.15)",  glow: "rgba(245,158,11,0.12)"  },
  danger:    { icon: "var(--admin-danger)",    badge: "rgba(239,68,68,0.15)",   glow: "rgba(239,68,68,0.12)"   },
  secondary: { icon: "var(--admin-secondary)", badge: "rgba(0,78,137,0.25)",    glow: "rgba(0,78,137,0.12)"    },
  default:   { icon: "#94A3B8",                badge: "rgba(100,116,139,0.15)", glow: "rgba(100,116,139,0.08)" },
};

interface StatWidgetProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: Color;
}

export function StatWidget({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  trendLabel,
  color = "default",
}: StatWidgetProps) {
  const c = colorMap[color];

  const TrendIcon =
    trend === "up"   ? TrendingUp :
    trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"   ? "#00BF63" :
    trend === "down" ? "#EF4444" : "#94A3B8";

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 transition-all duration-200 hover:translate-y-[-2px]"
      style={{ boxShadow: `0 4px 24px ${c.glow}` }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.badge }}
        >
          <Icon size={20} style={{ color: c.icon }} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            <TrendIcon size={13} />
            {trendLabel}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
