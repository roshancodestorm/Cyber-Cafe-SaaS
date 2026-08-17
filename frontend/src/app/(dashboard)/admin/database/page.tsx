"use client";

import { Database, Activity, Clock, HardDrive, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatWidget } from "@/components/admin/stat-widget";
import { MiniChart } from "@/components/admin/mini-chart";
import { mockDbStats } from "@/lib/mock/admin-data";

export default function DatabasePage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          DATABASE HEALTH
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          PostgreSQL connection pool and query performance
        </p>
      </div>

      <GlassCard padding={false} glow="success">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full status-dot-pulse" style={{ background: "var(--admin-success)" }} />
            <span className="font-semibold" style={{ color: "var(--admin-success)" }}>
              🟢 Connected — PostgreSQL 15
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>
            uptime: 99.99%
          </span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatWidget icon={Database}    label="Connection"    value="Healthy" color="success" />
        <StatWidget icon={Activity}    label="Active Queries" value={42}      color="primary" />
        <StatWidget icon={Clock}       label="Avg Latency"    value="24 ms"   color="warning" />
        <StatWidget icon={HardDrive}   label="Storage"        value="61%"     color="warning" />
        <StatWidget icon={AlertCircle} label="Slow Queries"   value={3}       color="danger" />
      </div>

      <GlassCard padding={false}>
        <div className="px-5 pt-4 pb-2" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
            Query Latency Over Time
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 p-4 w-full">
            <MiniChart type="line" data={mockDbStats.latencyHistory} color="var(--admin-primary)" height={120} showGrid />
          </div>
          <div className="w-full md:w-64 p-5 grid grid-cols-1 gap-4" style={{ borderLeft: "1px solid var(--admin-border)" }}>
            {[
              { label: "Min", value: `${Math.min(...mockDbStats.latencyHistory)} ms`, color: "var(--admin-success)" },
              { label: "Avg", value: "24 ms", color: "var(--admin-warning)" },
              { label: "Max", value: `${Math.max(...mockDbStats.latencyHistory)} ms`, color: "var(--admin-danger)" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Connections", value: "87" },
          { label: "DB Size", value: "4.2 GB" },
          { label: "Uptime", value: "99.99%" },
          { label: "Pool Size", value: "100/100" },
        ].map(s => (
          <GlassCard key={s.label} padding={true}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
            <p className="text-sm font-semibold mt-1 font-mono" style={{ color: "var(--admin-text)" }}>{s.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
