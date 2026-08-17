"use client";

import { useState } from "react";
import { Key, Check, X } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatWidget } from "@/components/admin/stat-widget";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailModal } from "@/components/admin/detail-modal";
import { mockPermissions, type MockPermission } from "@/lib/mock/admin-data";

const columns: Column<MockPermission>[] = [
  { key: "requestId", label: "Request #", width: "100px",
    render: (v) => <span className="font-mono text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>{String(v)}</span> },
  { key: "cafeId", label: "Cafe",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "userId", label: "User",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "documentId", label: "Document",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  { key: "status", label: "Status",
    render: (v) => <StatusBadge status={v as string} /> },
  { key: "expiresAt", label: "Expires",
    render: (v) => <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{String(v)}</span> },
];

function PermRow({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid var(--admin-border)" }}>
      <span className="text-sm" style={{ color: "var(--admin-text)" }}>{label}</span>
      <span className="flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: allowed ? "var(--admin-success)" : "var(--admin-danger)" }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: allowed ? "rgba(0,191,99,0.15)" : "rgba(239,68,68,0.15)" }}>
          {allowed ? <Check size={10} /> : <X size={10} />}
        </div>
        {allowed ? "Allowed" : "Denied"}
      </span>
    </div>
  );
}

export default function PermissionsPage() {
  const [selected, setSelected] = useState<MockPermission | null>(null);

  const approved = mockPermissions.filter((p) => p.status === "Approved").length;
  const denied   = mockPermissions.filter((p) => p.status === "Denied").length;
  const pending  = mockPermissions.filter((p) => p.status === "Pending").length;

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          ACCESS PERMISSIONS
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Manage document access grants — strong audit required for changes
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatWidget icon={Key} label="Total Requests" value={mockPermissions.length} color="primary"   />
        <StatWidget icon={Key} label="Approved"        value={approved}             color="success"   />
        <StatWidget icon={Key} label="Denied"          value={denied}               color="danger"    />
        <StatWidget icon={Key} label="Pending"         value={pending}              color="warning"   />
      </div>

      <DataTable<MockPermission>
        columns={[
          ...columns,
          {
            key: "requestId" as keyof MockPermission,
            label: "Details",
            align: "right",
            render: (_, row) => (
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(row); }}
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)", border: "1px solid rgba(255,107,53,0.2)" }}
              >
                Timeline
              </button>
            ),
          },
        ]}
        data={mockPermissions}
        searchable
        searchKeys={["requestId", "cafeId", "userId", "documentId"]}
        onRowClick={setSelected}
      />

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Request ${selected?.requestId ?? ""}`}
        subtitle="Permission Detail & Access Timeline"
      >
        {selected && (
          <div className="space-y-5">
            {/* IDs */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              {[selected.cafeId, selected.userId, selected.documentId].map((id) => (
                <span key={id} className="px-2.5 py-0.5 rounded-full font-mono text-xs"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-muted)" }}>
                  {id}
                </span>
              ))}
            </div>

            {/* Permission Matrix */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3"
                style={{ color: "var(--admin-text-muted)" }}>
                Permission Matrix
              </p>
              <PermRow label="View Document" allowed={selected.canView} />
              <PermRow label="Print Document" allowed={selected.canPrint} />
              <PermRow label="Download Document" allowed={selected.canDownload} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Opens Used", value: `${selected.opens} / ${selected.maxOpens}` },
                { label: "Expires At", value: selected.expiresAt },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
                  <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{item.label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: "var(--admin-text)" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3"
                style={{ color: "var(--admin-text-muted)" }}>
                Access Timeline
              </p>
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px"
                  style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="space-y-3">
                  {selected.timeline.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--admin-border)", fontSize: 14 }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm" style={{ color: "var(--admin-text)" }}>{item.action}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--admin-text-subtle)" }}>{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
