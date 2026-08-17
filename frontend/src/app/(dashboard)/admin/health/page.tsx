"use client";

import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { MiniChart } from "@/components/admin/mini-chart";
import { mockSystemServices } from "@/lib/mock/admin-data";

export default function SystemHealthPage() {
  const allHealthy = mockSystemServices.every(s => s.status === "Healthy");

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          SYSTEM HEALTH
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Global service status and availability
        </p>
      </div>

      <GlassCard padding={false} glow={allHealthy ? "success" : "danger"}>
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: allHealthy ? "rgba(0,191,99,0.15)" : "rgba(239,68,68,0.15)", border: `2px solid ${allHealthy ? "rgba(0,191,99,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <span className="w-6 h-6 rounded-full status-dot-pulse" style={{ background: allHealthy ? "var(--admin-success)" : "var(--admin-danger)" }} />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: allHealthy ? "var(--admin-success)" : "var(--admin-danger)" }}>
            {allHealthy ? "All Systems Operational" : "Service Degraded"}
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSystemServices.map((srv) => {
          const isHealthy = srv.status === "Healthy";
          const isDown = srv.status === "Down";
          const color = isHealthy ? "var(--admin-success)" : isDown ? "var(--admin-danger)" : "var(--admin-warning)";
          return (
            <GlassCard key={srv.name} padding={true} glow={isHealthy ? "success" : isDown ? "danger" : "warning"}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{srv.icon}</span>
                  <p className="font-semibold" style={{ color: "var(--admin-text)" }}>{srv.name}</p>
                </div>
                <StatusBadge status={srv.status} pulse={isHealthy} />
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-3xl font-bold" style={{ color }}>{srv.uptime}</p>
                  <p className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                    Uptime
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold" style={{ color: "var(--admin-text)" }}>{srv.responseTime}</p>
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                    Response
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: "100%", background: color }} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard padding={false}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
            24h Health History
          </p>
        </div>
        <div className="p-4">
          {/* Mock healthy history */}
          <MiniChart type="line" data={Array(24).fill(1)} color="var(--admin-success)" height={60} showGrid={false} />
        </div>
      </GlassCard>
    </div>
  );
}
