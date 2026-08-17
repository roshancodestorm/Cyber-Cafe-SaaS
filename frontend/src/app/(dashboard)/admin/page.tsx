"use client";

import { Activity, Users, Store, Layers, Shield, Bell, Trash2, Printer, Bot } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatWidget } from "@/components/admin/stat-widget";
import { MiniChart } from "@/components/admin/mini-chart";
import {
  mockOverviewStats,
  mockLatencyHistory,
  mockRequestHistory,
  mockQueueStats,
} from "@/lib/mock/admin-data";

const STATUS_SERVICES = [
  { label: "API Status",  value: "Healthy",   color: "var(--admin-success)" },
  { label: "PostgreSQL",  value: "Connected",  color: "var(--admin-success)" },
  { label: "Redis",       value: "Connected",  color: "var(--admin-success)" },
  { label: "Storage",     value: "Healthy",    color: "var(--admin-success)" },
];

const QUEUES = [
  { icon: <Bell size={20} />,    label: "Notifications", count: mockQueueStats.notifications, color: "var(--admin-primary)"   },
  { icon: <Trash2 size={20} />,  label: "Auto Delete",   count: mockQueueStats.autoDelete,   color: "var(--admin-danger)"    },
  { icon: <Printer size={20} />, label: "Print Jobs",    count: mockQueueStats.printJobs,    color: "var(--admin-warning)"   },
  { icon: <Bot size={20} />,     label: "AI Jobs",       count: mockQueueStats.aiJobs,       color: "var(--admin-secondary)" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
            SYSTEM CONTROL
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            Backend &amp; Security Overview — Live Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(0,191,99,0.12)", color: "var(--admin-success)", border: "1px solid rgba(0,191,99,0.2)" }}>
          <span className="w-2 h-2 rounded-full status-dot-pulse" style={{ background: "var(--admin-success)" }} />
          All Systems Operational
        </div>
      </div>

      {/* System Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_SERVICES.map((s) => (
          <GlassCard key={s.label} padding={false}>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full status-dot-pulse flex-shrink-0" style={{ background: s.color }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Stat Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatWidget icon={Activity} label="API Requests"  value={mockOverviewStats.apiRequests}    color="primary"   trendLabel="+8.2%" trend="up"      subtitle="Last 24h"    />
        <StatWidget icon={Users}    label="Active Users"  value={mockOverviewStats.activeUsers}     color="success"   trendLabel="+5.1%" trend="up"      subtitle="Currently"   />
        <StatWidget icon={Store}    label="Active Cafes"  value={mockOverviewStats.activeCafes}     color="secondary" trendLabel="+2"    trend="up"      subtitle="Online"      />
        <StatWidget icon={Layers}   label="Active Jobs"   value={mockOverviewStats.activeJobs}      color="warning"   trendLabel="Queue" trend="neutral" subtitle="Processing"  />
        <StatWidget icon={Shield}   label="Security Events" value={mockOverviewStats.securityEvents} color="danger"  trendLabel="12 new" trend="down"   subtitle="Today"       />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* API Latency */}
        <GlassCard padding={false}>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                API Latency
              </p>
              <p className="text-lg font-bold mt-0.5" style={{ color: "var(--admin-text)" }}>Avg: 131ms</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)" }}>
              Last 15 samples
            </span>
          </div>
          <div className="px-4 py-3">
            <MiniChart type="line" data={mockLatencyHistory} color="var(--admin-primary)" height={100} showGrid />
          </div>
          <div className="px-5 pb-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Min", value: `${Math.min(...mockLatencyHistory)}ms`, color: "var(--admin-success)" },
              { label: "Avg", value: "131ms",                                 color: "var(--admin-warning)" },
              { label: "Max", value: `${Math.max(...mockLatencyHistory)}ms`, color: "var(--admin-danger)"  },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Request Volume */}
        <GlassCard padding={false}>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                Request Volume
              </p>
              <p className="text-lg font-bold mt-0.5" style={{ color: "var(--admin-text)" }}>
                {mockRequestHistory.reduce((a, b) => a + b, 0).toLocaleString()} total
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(0,78,137,0.2)", color: "#60A5FA" }}>
              Hourly
            </span>
          </div>
          <div className="px-4 py-3">
            <MiniChart type="bar" data={mockRequestHistory} color="var(--admin-secondary)" height={100} showGrid />
          </div>
          <div className="px-5 pb-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Peak",  value: `${Math.max(...mockRequestHistory).toLocaleString()}`, color: "var(--admin-primary)"   },
              { label: "Avg",   value: "2,587",                                                color: "var(--admin-text)"      },
              { label: "Low",   value: `${Math.min(...mockRequestHistory).toLocaleString()}`, color: "var(--admin-text-muted)" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Queue Status */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--admin-text-muted)" }}>
          Queue Status
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUEUES.map((q) => (
            <GlassCard key={q.label} padding={false} glow="primary">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${q.color}20`, color: q.color }}>
                    {q.icon}
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-muted)" }}>
                    waiting
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: q.color }}>{q.count}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: "var(--admin-text-muted)" }}>{q.label}</p>
                {/* Mini progress */}
                <div className="mt-3 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (q.count / 25) * 100)}%`, background: q.color }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* DB Load summary strip */}
      <GlassCard padding={false}>
        <div className="px-5 py-4 flex flex-wrap gap-6 items-center justify-between">
          {[
            { label: "Database Load",        value: "61%",    color: "var(--admin-warning)"  },
            { label: "Active DB Queries",    value: "42",     color: "var(--admin-primary)"  },
            { label: "DB Avg Latency",       value: "24ms",   color: "var(--admin-success)"  },
            { label: "Slow Queries",         value: "3",      color: "var(--admin-danger)"   },
            { label: "Redis Memory",         value: "1.2 GB", color: "var(--admin-text)"     },
            { label: "Worker Processes",     value: "4 / 4",  color: "var(--admin-success)"  },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
