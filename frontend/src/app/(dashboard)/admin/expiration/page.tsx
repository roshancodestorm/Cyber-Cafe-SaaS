"use client";

import { FileCheck, Clock, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatWidget } from "@/components/admin/stat-widget";
import { DataTable, Column } from "@/components/admin/data-table";
import { mockExpirationDocs, type MockExpirationDoc, type ExpiryStatus } from "@/lib/mock/admin-data";

const LIFECYCLE_STEPS = [
  { emoji: "📤", label: "Uploaded",       active: true  },
  { emoji: "✅", label: "Active",          active: true  },
  { emoji: "⚠️", label: "Expiring Soon",  active: true  },
  { emoji: "⏰", label: "Expired",         active: false },
  { emoji: "🚫", label: "Access Revoked", active: false },
  { emoji: "🗑️", label: "Deleted",        active: false },
];

const columns: Column<MockExpirationDoc>[] = [
  { key: "id", label: "Document ID", width: "120px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-primary)" }}>{String(v)}</span> },
  { key: "uploaded", label: "Uploaded At",
    render: (v) => <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{String(v)}</span> },
  { key: "expiresIn", label: "Expires In",
    render: (v) => {
      const s = String(v);
      const color = s === "Expired" ? "var(--admin-danger)" : s.includes("min") || (s.includes("hour") && parseInt(s) < 2) ? "var(--admin-warning)" : "var(--admin-success)";
      return <span className="text-xs font-semibold" style={{ color }}>{s}</span>;
    }},
  { key: "status", label: "Status",
    render: (v) => <StatusBadge status={v as ExpiryStatus} pulse={v === "active"} /> },
];

export default function ExpirationPage() {
  const active  = mockExpirationDocs.filter((d) => d.status === "active").length;
  const soon    = mockExpirationDocs.filter((d) => d.status === "soon").length;
  const deleted = mockExpirationDocs.filter((d) => d.status === "deleted").length;

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          EXPIRATION QUEUE
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Monitor document expiry and auto-delete pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatWidget icon={FileCheck} label="Active Docs"    value={active}  color="success" />
        <StatWidget icon={Clock}     label="Expiring Soon"  value={soon}    color="warning" trendLabel="Action needed" trend="down" />
        <StatWidget icon={Trash2}    label="Deleted Today"  value={deleted} color="danger"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable<MockExpirationDoc>
            columns={columns}
            data={mockExpirationDocs}
            searchable
            searchKeys={["id"]}
            title="Expiration Queue"
          />
        </div>

        <div className="lg:col-span-1">
          <GlassCard padding={false}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                Document Lifecycle
              </p>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-5 top-6 bottom-6 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                <div className="space-y-1">
                  {LIFECYCLE_STEPS.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4 py-3 relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-base"
                        style={{
                          background: step.active ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.04)",
                          border: `2px solid ${step.active ? "var(--admin-primary)" : "rgba(255,255,255,0.08)"}`,
                          boxShadow: step.active ? "0 0 12px rgba(255,107,53,0.3)" : "none",
                        }}>
                        {step.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-semibold"
                          style={{ color: step.active ? "var(--admin-text)" : "var(--admin-text-subtle)" }}>
                          {step.label}
                        </p>
                        {step.active && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full status-dot-pulse"
                              style={{ background: "var(--admin-primary)" }} />
                            <span className="text-xs" style={{ color: "var(--admin-primary)" }}>Active stage</span>
                          </div>
                        )}
                      </div>
                      {i < LIFECYCLE_STEPS.length - 1 && (
                        <div className="absolute left-[18px] bottom-0 text-xs"
                          style={{ color: "rgba(255,255,255,0.15)" }}>
                          ↓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
