"use client";

import { Globe, AlertCircle, Clock, Activity } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatWidget } from "@/components/admin/stat-widget";
import { DataTable, Column } from "@/components/admin/data-table";
import { MiniChart } from "@/components/admin/mini-chart";
import { mockApiEndpoints, mockLatencyHistory, mockRequestHistory, mockErrorHistory, type MockApiEndpoint } from "@/lib/mock/admin-data";

const columns: Column<MockApiEndpoint>[] = [
  { key: "path", label: "Endpoint",
    render: (v) => <span className="font-mono text-sm" style={{ color: "var(--admin-text)" }}>{String(v)}</span> },
  { key: "method", label: "Method", width: "100px",
    render: (v) => {
      const m = String(v);
      const color = m === "GET" ? "var(--admin-success)" : m === "POST" ? "var(--admin-primary)" : "var(--admin-warning)";
      return (
        <span className="px-2 py-0.5 rounded-full font-mono text-xs font-bold"
          style={{ background: `${color}20`, color }}>
          {m}
        </span>
      );
    }},
  { key: "requests", label: "Requests", align: "right",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "errors", label: "Errors", align: "right",
    render: (v, row) => {
      const err = Number(v);
      const total = Number(row.requests);
      const pct = total > 0 ? ((err / total) * 100).toFixed(1) : 0;
      return (
        <span className="font-mono text-xs" style={{ color: err > 0 ? "var(--admin-danger)" : "var(--admin-text-muted)" }}>
          {err > 0 ? `${err} (${pct}%)` : "0"}
        </span>
      );
    }},
  { key: "latency", label: "Avg Latency", align: "right",
    render: (v) => {
      const lat = Number(v);
      const color = lat < 100 ? "var(--admin-success)" : lat < 200 ? "var(--admin-warning)" : "var(--admin-danger)";
      return <span className="font-mono text-xs font-semibold" style={{ color }}>{lat}ms</span>;
    }},
];

export default function ApiMonitorPage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          API MONITOR
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Live API traffic, latency, and error tracking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget icon={Globe}       label="Total Requests" value="24,760" color="primary" />
        <StatWidget icon={AlertCircle} label="Total Errors"   value="20"     color="danger" />
        <StatWidget icon={Clock}       label="Avg Latency"    value="95ms"   color="warning" />
        <StatWidget icon={Activity}    label="Uptime"         value="99.9%"  color="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard padding={false}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
              API Latency Over Time
            </p>
          </div>
          <div className="p-4">
            <MiniChart type="line" data={mockLatencyHistory} color="var(--admin-primary)" height={100} showGrid />
          </div>
        </GlassCard>

        <GlassCard padding={false}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
              Request Volume
            </p>
          </div>
          <div className="p-4">
            <MiniChart type="bar" data={mockRequestHistory} color="var(--admin-secondary)" height={80} />
          </div>
        </GlassCard>

        <GlassCard padding={false}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
              Error Count
            </p>
          </div>
          <div className="p-4">
            <MiniChart type="bar" data={mockErrorHistory} color="var(--admin-danger)" height={80} />
          </div>
        </GlassCard>
      </div>

      <DataTable<MockApiEndpoint>
        columns={columns}
        data={mockApiEndpoints}
        searchable
        searchKeys={["path"]}
        title="Endpoint Performance"
      />
    </div>
  );
}
