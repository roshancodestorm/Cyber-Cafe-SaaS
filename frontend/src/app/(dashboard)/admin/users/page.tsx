"use client";

import { useState, useMemo } from "react";
import { UserPlus, Clock, Calendar } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, Column } from "@/components/admin/data-table";
import { DetailModal } from "@/components/admin/detail-modal";
import { mockUsers, type MockUser, type UserRole, type UserStatus } from "@/lib/mock/admin-data";

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  USER:        { bg: "rgba(0,78,137,0.18)",   text: "#60A5FA"          },
  CAFE_OWNER:  { bg: "rgba(255,107,53,0.15)", text: "var(--admin-primary)" },
  CAFE_STAFF:  { bg: "rgba(245,158,11,0.15)", text: "var(--admin-warning)" },
  SUPER_ADMIN: { bg: "rgba(239,68,68,0.15)",  text: "var(--admin-danger)"  },
};

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {role.replace("_", " ")}
    </span>
  );
}

const columns: Column<MockUser>[] = [
  { key: "id",   label: "User ID",     width: "110px",
    render: (v) => <span className="font-mono text-xs" style={{ color: "var(--admin-primary)" }}>{String(v)}</span> },
  { key: "name", label: "Name" },
  { key: "role", label: "Role",
    render: (v) => <RoleBadge role={v as UserRole} /> },
  { key: "status", label: "Status",
    render: (v) => <StatusBadge status={v as string} pulse={v === "Active"} /> },
  { key: "lastActive", label: "Last Active",
    render: (v) => (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--admin-text-muted)" }}>
        <Clock size={11} /> {String(v)}
      </span>
    )},
];

export default function UsersPage() {
  const [selected, setSelected]       = useState<MockUser | null>(null);
  const [roleFilter, setRoleFilter]   = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      if (roleFilter   !== "all" && u.role   !== roleFilter)   return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [roleFilter, statusFilter]);

  const selectStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-text)",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  } as React.CSSProperties;

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            {mockUsers.length} total users · {mockUsers.filter(u => u.status === "Active").length} active
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--admin-primary)",
            color: "white",
            boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
          }}
        >
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      {/* Filters */}
      <GlassCard padding={false}>
        <div className="px-5 py-3 flex flex-wrap gap-3 items-center"
          style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
            Filters
          </p>
          <select style={selectStyle} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="USER">User</option>
            <option value="CAFE_OWNER">Cafe Owner</option>
            <option value="CAFE_STAFF">Cafe Staff</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
          <span className="ml-auto text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable<MockUser>
        columns={[
          ...columns,
          {
            key: "id" as keyof MockUser,
            label: "Action",
            align: "right",
            render: (_, row) => (
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(row); }}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)", border: "1px solid rgba(255,107,53,0.2)" }}
              >
                View
              </button>
            ),
          },
        ]}
        data={filtered}
        searchable
        searchKeys={["id", "name", "role"]}
        onRowClick={setSelected}
      />

      {/* Detail Modal */}
      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`User Profile — ${selected?.id}`}
      >
        {selected && (
          <div className="space-y-5">
            {/* ID pill */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full font-mono text-xs font-semibold"
                style={{ background: "rgba(255,107,53,0.12)", color: "var(--admin-primary)" }}>
                {selected.id}
              </span>
              <RoleBadge role={selected.role} />
              <StatusBadge status={selected.status} pulse={selected.status === "Active"} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Calendar size={12} />, label: "Joined",      value: selected.joinedAt    },
                { icon: <Clock size={12} />,    label: "Last Active", value: selected.lastActive  },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--admin-border)" }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--admin-text-muted)" }}>
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Activity Timeline */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3"
                style={{ color: "var(--admin-text-muted)" }}>
                Recent Activity
              </p>
              {selected.activity.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--admin-text-subtle)" }}>No activity recorded</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="space-y-3 pl-6">
                    {selected.activity.map((act, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                          style={{ background: "var(--admin-bg)", borderColor: "var(--admin-primary)" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--admin-primary)" }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm" style={{ color: "var(--admin-text)" }}>{act.action}</p>
                          <span className="text-xs font-mono" style={{ color: "var(--admin-text-subtle)" }}>{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy note */}
            <p className="text-xs text-center" style={{ color: "var(--admin-text-subtle)" }}>
              🔒 Email &amp; phone shown only in authorized admin context
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(239,68,68,0.12)", color: "var(--admin-danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                Suspend User
              </button>
              <button className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(0,78,137,0.2)", color: "#60A5FA", border: "1px solid rgba(0,78,137,0.3)" }}>
                Review Audit
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
