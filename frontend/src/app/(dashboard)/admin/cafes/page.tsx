"use client";

import { useState } from "react";
import { Store, Users, Briefcase, MapPin, CheckCircle, XCircle } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatWidget } from "@/components/admin/stat-widget";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailModal } from "@/components/admin/detail-modal";
import { mockCafes, type MockCafe } from "@/lib/mock/admin-data";

const columns: Column<MockCafe>[] = [
  { key: "id",   label: "Cafe ID", width: "110px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-primary)" }}>{String(v)}</span> },
  { key: "name", label: "Name",
    render: (v) => <span className="font-semibold text-sm">{String(v)}</span> },
  { key: "location", label: "Location",
    render: (v) => (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--admin-text-muted)" }}>
        <MapPin size={11} /> {String(v)}
      </span>
    )},
  { key: "status", label: "Status",
    render: (v) => <StatusBadge status={v as string} pulse={v === "online"} /> },
  { key: "todayJobs", label: "Jobs Today", align: "center",
    render: (v) => <span className="font-mono font-semibold">{String(v)}</span> },
  { key: "staff", label: "Staff", align: "center" },
  { key: "verified", label: "Verified", align: "center",
    render: (v) => v
      ? <CheckCircle size={16} style={{ color: "var(--admin-success)" }} className="mx-auto" />
      : <XCircle size={16} style={{ color: "var(--admin-danger)" }} className="mx-auto" /> },
];

export default function CafesPage() {
  const [selected, setSelected] = useState<MockCafe | null>(null);

  const online  = mockCafes.filter((c) => c.status === "online").length;
  const offline = mockCafes.filter((c) => c.status === "offline").length;

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
            Cyber Cafes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            {mockCafes.length} registered cafes across the network
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatWidget icon={Store}   label="Total Cafes"    value={mockCafes.length} color="primary"   />
        <StatWidget icon={Users}   label="Online"         value={online}           color="success"   trendLabel={`${online}/${mockCafes.length}`} trend="up"   />
        <StatWidget icon={Briefcase} label="Offline"      value={offline}          color="danger"    trendLabel="Action needed" trend="down" />
      </div>

      {/* Table */}
      <DataTable<MockCafe>
        columns={[
          ...columns,
          {
            key: "id" as keyof MockCafe,
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
        data={mockCafes}
        searchable
        searchKeys={["id", "name", "location"]}
        onRowClick={setSelected}
      />

      {/* Detail Modal */}
      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`Cafe Detail — ${selected?.id}`}
      >
        {selected && (
          <div className="space-y-5">
            {/* Header badges */}
            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)" }}>
                {selected.id}
              </span>
              <StatusBadge status={selected.status} pulse={selected.status === "online"} />
              {selected.verified ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,191,99,0.12)", color: "var(--admin-success)" }}>
                  <CheckCircle size={11} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.12)", color: "var(--admin-danger)" }}>
                  <XCircle size={11} /> Unverified
                </span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
              <MapPin size={14} style={{ color: "var(--admin-text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--admin-text)" }}>{selected.location}</span>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-2"
                style={{ color: "var(--admin-text-muted)" }}>
                Services Offered
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.services.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(0,191,99,0.1)", color: "var(--admin-success)", border: "1px solid rgba(0,191,99,0.2)" }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Staff",       value: selected.staff,      color: "var(--admin-primary)"  },
                { label: "Active Jobs", value: selected.activeJobs, color: "var(--admin-warning)"  },
                { label: "Today Jobs",  value: selected.todayJobs,  color: "var(--admin-success)"  },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--admin-primary)", color: "white", boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
                Manage
              </button>
              <button className="py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(0,78,137,0.2)", color: "#60A5FA", border: "1px solid rgba(0,78,137,0.3)" }}>
                View Audit
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
