"use client";

import { useState } from "react";
import { Check, X, Edit2, Shield } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";
import { rbacRoles, permissionLabels } from "@/lib/mock/admin-data";

type Role = (typeof rbacRoles)[0];
type PermKey = keyof Role["permissions"];

const ROLE_COLORS: Record<string, string> = {
  USER:        "var(--admin-secondary)",
  CAFE_OWNER:  "var(--admin-primary)",
  CAFE_STAFF:  "var(--admin-warning)",
  SUPER_ADMIN: "var(--admin-danger)",
};

const KEY_PERMS: PermKey[] = ["viewJobs", "print", "manageCafe"];

export default function RBACPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editedPerms, setEditedPerms] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditedPerms({ ...role.permissions });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 admin-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
            Role &amp; Access Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
            Configure permissions per role — changes require audit authorization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: "var(--admin-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--admin-primary)" }}>
            {rbacRoles.length} Roles
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Cards — 2 cols */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rbacRoles.map((role) => {
            const color = ROLE_COLORS[role.id] ?? "#94A3B8";
            const isSelected = selectedRole?.id === role.id;
            return (
              <GlassCard
                key={role.id}
                padding={false}
                hover
                onClick={() => handleEdit(role)}
              >
                <div
                  className="p-5"
                  style={{
                    border: isSelected ? `1px solid ${color}` : "1px solid transparent",
                    borderRadius: 12,
                    boxShadow: isSelected ? `0 0 20px ${color}30` : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Role header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}20` }}>
                        <Shield size={15} style={{ color }} />
                      </div>
                      <span className="text-sm font-bold" style={{ color }}>
                        {role.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(role); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-muted)" }}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>

                  <p className="text-xs mb-4" style={{ color: "var(--admin-text-muted)" }}>
                    {role.description}
                  </p>

                  {/* Key permission chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {KEY_PERMS.map((k) => {
                      const allowed = role.permissions[k];
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: allowed ? "rgba(0,191,99,0.12)" : "rgba(239,68,68,0.1)",
                            color:      allowed ? "var(--admin-success)" : "var(--admin-danger)",
                          }}
                        >
                          {allowed ? <Check size={10} /> : <X size={10} />}
                          {permissionLabels[k]}
                        </span>
                      );
                    })}
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--admin-text-subtle)" }}>
                      +{Object.keys(role.permissions).length - KEY_PERMS.length} more
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Role Editor */}
        <div className="lg:col-span-1">
          <GlassCard padding={false}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--admin-text-muted)" }}>
                Role Editor
              </p>
            </div>

            {!selectedRole ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Shield size={20} style={{ color: "var(--admin-text-subtle)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--admin-text-muted)" }}>
                  Select a role to edit
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
                  Click any role card on the left
                </p>
              </div>
            ) : (
              <div className="p-5">
                {/* Role label */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${ROLE_COLORS[selectedRole.id]}20` }}>
                    <Shield size={14} style={{ color: ROLE_COLORS[selectedRole.id] }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: ROLE_COLORS[selectedRole.id] }}>
                      {selectedRole.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                      Editing permissions
                    </p>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-1">
                  {Object.keys(permissionLabels).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                      style={{ userSelect: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: editedPerms[key] ? "var(--admin-primary)" : "rgba(255,255,255,0.08)",
                          border: editedPerms[key] ? "none" : "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {editedPerms[key] && <Check size={10} color="white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!editedPerms[key]}
                        onChange={(e) =>
                          setEditedPerms((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      <span className="text-sm" style={{ color: editedPerms[key] ? "var(--admin-text)" : "var(--admin-text-muted)" }}>
                        {permissionLabels[key]}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-5 space-y-2">
                  <button
                    onClick={handleSave}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: saved ? "var(--admin-success)" : "var(--admin-primary)",
                      color: "white",
                      boxShadow: `0 4px 16px ${saved ? "rgba(0,191,99,0.3)" : "rgba(255,107,53,0.3)"}`,
                    }}
                  >
                    {saved ? "✓ Saved!" : "Save Role"}
                  </button>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="w-full py-2 text-xs"
                    style={{ color: "var(--admin-text-subtle)" }}
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs mt-4 text-center" style={{ color: "var(--admin-text-subtle)" }}>
                  All changes are logged in the audit trail
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
