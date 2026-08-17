"use client";

import { useState } from "react";
import { FileText, Clock, Key, ShieldOff } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatWidget } from "@/components/admin/stat-widget";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailModal } from "@/components/admin/detail-modal";
import { mockDocuments, type MockDocument } from "@/lib/mock/admin-data";

function OpensCell({ opens, maxOpens }: { opens: number; maxOpens: number }) {
  const pct = maxOpens > 0 ? (opens / maxOpens) * 100 : 0;
  const color = opens >= maxOpens ? "var(--admin-danger)" : opens >= maxOpens - 1 ? "var(--admin-warning)" : "var(--admin-success)";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="h-1.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold" style={{ color }}>
        {opens}/{maxOpens}
      </span>
    </div>
  );
}

const columns: Column<MockDocument>[] = [
  { key: "id", label: "Doc ID", width: "110px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-primary)" }}>{String(v)}</span> },
  { key: "status", label: "Status",
    render: (v) => <StatusBadge status={v as string} /> },
  { key: "opens", label: "Opens",
    render: (v, row) => <OpensCell opens={Number(v)} maxOpens={row.maxOpens as number} /> },
  { key: "expiresIn", label: "Expires In",
    render: (v) => {
      const s = String(v);
      const isSoon = s === "Expired" || s.includes("min") || s === "1h";
      return (
        <span className="text-xs font-semibold"
          style={{ color: s === "Expired" ? "var(--admin-danger)" : isSoon ? "var(--admin-warning)" : "var(--admin-text-muted)" }}>
          {s}
        </span>
      );
    }},
  { key: "userId", label: "User",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{String(v)}</span> },
];

export default function DocumentsPage() {
  const [selected, setSelected] = useState<MockDocument | null>(null);

  const expiring = mockDocuments.filter((d) => {
    const s = d.expiresIn;
    return d.status === "Active" && (s.includes("min") || s === "1h" || s === "2h");
  }).length;
  const locked  = mockDocuments.filter((d) => d.status === "Locked").length;
  const expired = mockDocuments.filter((d) => d.status === "Expired").length;
  const active  = mockDocuments.filter((d) => d.status === "Active").length;

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          DOCUMENT SECURITY CENTER
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Monitor document lifecycle, access limits, and expiry
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget icon={FileText}  label="Active Documents" value={842}            color="success" />
        <StatWidget icon={Clock}     label="Expiring Soon"    value={expiring + 34}  color="warning" trendLabel="Review" trend="down" />
        <StatWidget icon={Key}       label="Access Requests"  value={18}             color="primary" />
        <StatWidget icon={ShieldOff} label="Blocked Access"   value={7}              color="danger"  trendLabel="7 blocked" trend="down" />
      </div>

      <DataTable<MockDocument>
        columns={[
          ...columns,
          {
            key: "id" as keyof MockDocument,
            label: "Action",
            align: "right",
            render: (_, row) => (
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(row); }}
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)", border: "1px solid rgba(255,107,53,0.2)" }}
              >
                View
              </button>
            ),
          },
        ]}
        data={mockDocuments}
        searchable
        searchKeys={["id", "status", "userId"]}
        onRowClick={setSelected}
        title={`${mockDocuments.length} Documents`}
      />

      <GlassCard padding={false}>
        <div className="px-5 py-3 flex flex-wrap gap-6">
          {[
            { label: "Active",  value: active,  color: "var(--admin-success)"     },
            { label: "Locked",  value: locked,  color: "var(--admin-danger)"      },
            { label: "Expired", value: expired, color: "var(--admin-text-muted)"  },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{s.label}:</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <DetailModal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ""} subtitle="Document Security Detail">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <span className="px-2.5 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-muted)" }}>
                Uploaded {selected.uploadedAt}
              </span>
            </div>

            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Access Opens</p>
                <span className="text-sm font-bold"
                  style={{ color: selected.opens >= selected.maxOpens ? "var(--admin-danger)" : "var(--admin-success)" }}>
                  {selected.opens} / {selected.maxOpens}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(100, (selected.opens / selected.maxOpens) * 100)}%`,
                  background: selected.opens >= selected.maxOpens ? "var(--admin-danger)" : "var(--admin-success)",
                }} />
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Expires In",    value: selected.expiresIn },
                { label: "Uploaded By",   value: selected.userId },
                { label: "Assigned Cafe", value: selected.cafeId ?? "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{item.label}</span>
                  <span className="text-sm font-mono font-semibold" style={{ color: "var(--admin-text)" }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.12)", color: "var(--admin-danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                Revoke Access
              </button>
              <button className="py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(245,158,11,0.12)", color: "var(--admin-warning)", border: "1px solid rgba(245,158,11,0.2)" }}>
                Extend Expiry
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
