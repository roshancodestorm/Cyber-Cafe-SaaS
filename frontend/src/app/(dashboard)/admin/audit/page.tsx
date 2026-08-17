"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { DataTable, Column } from "@/components/admin/data-table";
import { mockAuditLogs, type MockAuditLog } from "@/lib/mock/admin-data";

function ActorPill({ actor, type }: { actor: string; type: MockAuditLog["actorType"] }) {
  const cfg = {
    USER:   { bg: "rgba(0,78,137,0.2)",   text: "#60A5FA" },
    CAFE:   { bg: "rgba(255,107,53,0.15)", text: "var(--admin-primary)" },
    SYSTEM: { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" },
  }[type];
  return (
    <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      {actor}
    </span>
  );
}

function maskIp(ip: string) {
  if (ip === "internal") return "internal";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return ip;
}

const columns: Column<MockAuditLog>[] = [
  { key: "time", label: "Time", width: "70px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{String(v)}</span> },
  { key: "actor", label: "Actor",
    render: (v, row) => <ActorPill actor={String(v)} type={row.actorType as MockAuditLog["actorType"]} /> },
  { key: "action", label: "Action",
    render: (v) => <span className="text-sm font-medium">{String(v)}</span> },
  { key: "result", label: "Result", align: "center", width: "70px",
    render: (v) => <span className="text-base">{v === "success" ? "✅" : "❌"}</span> },
  { key: "resource", label: "Resource",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{String(v)}</span> },
  { key: "ip", label: "IP", width: "120px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-text-subtle)" }}>{maskIp(String(v))}</span> },
];

export default function AuditPage() {
  const [actorFilter, setActorFilter]   = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "failure">("all");
  const [actionFilter, setActionFilter] = useState("all");

  const uniqueActions = [...new Set(mockAuditLogs.map((l) => l.action))];

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      if (actorFilter  && !log.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false;
      if (resultFilter !== "all" && log.result !== resultFilter) return false;
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      return true;
    });
  }, [actorFilter, resultFilter, actionFilter]);

  const selectStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-text)",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    outline: "none",
  };

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          AUDIT LOGS
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Immutable event trail — all system and user actions recorded
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Events",    value: mockAuditLogs.length, color: "var(--admin-text)"    },
          { label: "Successful",      value: mockAuditLogs.filter((l) => l.result === "success").length,  color: "var(--admin-success)" },
          { label: "Failed",          value: mockAuditLogs.filter((l) => l.result === "failure").length,  color: "var(--admin-danger)"  },
        ].map((s) => (
          <GlassCard key={s.label} padding={false}>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard padding={false}>
        <div className="px-5 py-3 flex flex-wrap gap-3 items-center">
          <Filter size={13} style={{ color: "var(--admin-text-muted)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
            Filters
          </p>
          <input
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="Actor (USR-xxx, CAFE-xxx)…"
            style={{ ...selectStyle, width: 180 }}
          />
          <select style={selectStyle} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select style={selectStyle} value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as "all" | "success" | "failure")}>
            <option value="all">All Results</option>
            <option value="success">✅ Success</option>
            <option value="failure">❌ Failure</option>
          </select>
          <span className="ml-auto text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {filtered.length} events
          </span>
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable<MockAuditLog>
        columns={columns}
        data={filtered}
        searchable
        searchKeys={["actor", "action", "resource"]}
        emptyMessage="No audit events match your filters."
      />

      {/* Footer note */}
      <p className="text-xs text-center" style={{ color: "var(--admin-text-subtle)" }}>
        🔒 Sensitive content is filtered from audit logs per security policy. Logs are immutable and tamper-proof.
      </p>
    </div>
  );
}
