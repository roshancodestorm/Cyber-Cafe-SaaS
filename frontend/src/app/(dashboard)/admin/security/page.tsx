"use client";

import { LogIn, ShieldOff, Download, Gauge, Eye } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatWidget } from "@/components/admin/stat-widget";
import { RiskBadge } from "@/components/admin/status-badge";
import { mockSecurityEvents, mockBlockedAccess } from "@/lib/mock/admin-data";

const RISK_GLOW: Record<string, string> = {
  LOW:      "rgba(0,191,99,0.08)",
  MEDIUM:   "rgba(245,158,11,0.08)",
  HIGH:     "rgba(249,115,22,0.1)",
  CRITICAL: "rgba(239,68,68,0.12)",
};

const STAT_ICONS = [LogIn, ShieldOff, Download, Gauge, Eye];

export default function SecurityPage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
            SECURITY CENTER
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            Live threat monitoring and access control events
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(239,68,68,0.12)", color: "var(--admin-danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <span className="w-2 h-2 rounded-full status-dot-pulse" style={{ background: "var(--admin-danger)" }} />
          Live Monitoring
        </div>
      </div>

      {/* Stat Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockSecurityEvents.map((evt, i) => (
          <StatWidget
            key={evt.type}
            icon={STAT_ICONS[i]}
            label={evt.type}
            value={evt.count}
            color={evt.risk === "CRITICAL" || evt.risk === "HIGH" ? "danger" : evt.risk === "MEDIUM" ? "warning" : "primary"}
            subtitle={`Latest: ${evt.latest}`}
          />
        ))}
      </div>

      {/* Risk Level Legend */}
      <GlassCard padding={false}>
        <div className="px-5 py-3 flex flex-wrap gap-4 items-center">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
            Risk Levels
          </p>
          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((risk) => (
            <RiskBadge key={risk} risk={risk} />
          ))}
        </div>
      </GlassCard>

      {/* Events List */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--admin-text-muted)" }}>
          Security Events
        </p>
        <div className="space-y-3">
          {mockSecurityEvents.map((evt) => (
            <GlassCard
              key={evt.type}
              padding={false}
              hover
              glow={evt.risk === "CRITICAL" ? "danger" : evt.risk === "HIGH" ? "danger" : "warning"}
            >
              <div className="px-5 py-4 flex items-center gap-4"
                style={{ boxShadow: `inset 0 0 30px ${RISK_GLOW[evt.risk]}` }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{evt.type}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{evt.description}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-3xl font-bold" style={{ color: "var(--admin-danger)" }}>{evt.count}</p>
                  <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>events</p>
                </div>
                <div className="text-right">
                  <RiskBadge risk={evt.risk} />
                  <p className="text-xs mt-1.5" style={{ color: "var(--admin-text-subtle)" }}>{evt.latest}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Blocked Access */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--admin-text-muted)" }}>
          Recent Blocked Access
        </p>
        <GlassCard padding={false}>
          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--admin-border)", background: "rgba(255,255,255,0.02)" }}>
                  {["User", "Cafe", "Document", "Attempt", "HTTP Code", "Time"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-semibold"
                      style={{ color: "var(--admin-text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockBlockedAccess.map((b, i) => (
                  <tr key={i} style={{ borderBottom: i < mockBlockedAccess.length - 1 ? "1px solid var(--admin-border)" : "none" }}>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--admin-primary)" }}>{b.userId}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{b.cafeId}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{b.documentId}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "var(--admin-warning)" }}>
                        {b.attempt}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "var(--admin-danger)" }}>
                        {b.httpCode}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--admin-text-subtle)" }}>{b.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
