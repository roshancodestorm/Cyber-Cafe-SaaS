"use client";

import { Bell, Trash2, Printer, Bot } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { mockQueueStats } from "@/lib/mock/admin-data";

const QUEUES = [
  { icon: <Bell size={24} />,    label: "Notifications", count: mockQueueStats.notifications, color: "var(--admin-primary)"   },
  { icon: <Trash2 size={24} />,  label: "Auto Delete",   count: mockQueueStats.autoDelete,   color: "var(--admin-danger)"    },
  { icon: <Printer size={24} />, label: "Print Jobs",    count: mockQueueStats.printJobs,    color: "var(--admin-warning)"   },
  { icon: <Bot size={24} />,     label: "AI Jobs",       count: mockQueueStats.aiJobs,       color: "var(--admin-secondary)" },
];

export default function QueuePage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          QUEUE MONITOR
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Redis background jobs and worker status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUEUES.map((q) => (
          <GlassCard key={q.label} padding={false} hover>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${q.color}20`, color: q.color }}>
                  {q.icon}
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>{q.label}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-muted)" }}>
                    Queue
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: q.color }}>{q.count}</span>
                  <span className="text-sm pb-1" style={{ color: "var(--admin-text-muted)" }}>waiting</span>
                </div>
              </div>

              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (q.count / 25) * 100)}%`, background: q.color }} />
              </div>
              <p className="text-xs mt-2 text-right font-mono" style={{ color: "var(--admin-text-subtle)" }}>
                Max capacity: 25
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard padding={false} glow="success">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,191,99,0.15)", border: "2px solid rgba(0,191,99,0.3)" }}>
              <span className="w-4 h-4 rounded-full status-dot-pulse" style={{ background: "var(--admin-success)" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>Queue Health</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--admin-success)" }}>🟢 Healthy</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-8">
            {[
              { label: "Total Processed", value: "24,892", color: "var(--admin-text)" },
              { label: "Failed Jobs", value: "3", color: "var(--admin-danger)" },
              { label: "Success Rate", value: "99.9%", color: "var(--admin-success)" },
            ].map(s => (
              <div key={s.label} className="text-center md:text-right">
                <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Worker Status", value: "4 / 4 Active" },
          { label: "Redis Memory", value: "128 MB / 2 GB" },
          { label: "Queue Throughput", value: "45 jobs / sec" },
        ].map(s => (
          <GlassCard key={s.label} padding={true}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: "var(--admin-text)" }}>{s.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
