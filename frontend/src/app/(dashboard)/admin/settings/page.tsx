"use client";

import { useState } from "react";
import { Settings as SettingsIcon, AlertTriangle, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/admin/glass-card";

function ToggleRow({ label, description, initial }: { label: string; description: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: on ? "var(--admin-primary)" : "rgba(255,255,255,0.1)" }}
      >
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
          style={{ left: on ? "calc(100% - 20px)" : "4px" }} />
      </button>
    </div>
  );
}

function InputRow({ label, value: initial }: { label: string; value: string }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="py-3">
      <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--admin-text-muted)" }}>
        {label}
      </label>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--admin-primary)"}
        onBlur={(e) => e.target.style.borderColor = "var(--admin-border)"}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 admin-fade-in pb-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--admin-text)" }}>
          SETTINGS
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
          Global configuration and admin profile
        </p>
      </div>

      {/* Admin Profile */}
      <GlassCard padding={true}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ background: "rgba(255,107,53,0.15)", color: "var(--admin-primary)" }}>
            SA
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>Super Admin</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ background: "rgba(239,68,68,0.15)", color: "var(--admin-danger)" }}>
                <ShieldCheck size={12} /> Root Access
              </span>
            </div>
            <p className="text-sm font-mono mt-1" style={{ color: "var(--admin-text-muted)" }}>
              s***@cyb***cafe.com
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <GlassCard padding={false}>
          <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <SettingsIcon size={16} style={{ color: "var(--admin-primary)" }} />
            <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
              Notification Preferences
            </h3>
          </div>
          <div className="px-6 pb-2">
            <ToggleRow label="Security Alerts" description="Email on high-risk events" initial={true} />
            <ToggleRow label="Failed Login Alerts" description="Notify after 5 attempts" initial={true} />
            <ToggleRow label="Document Expiry" description="Daily digest of expiring docs" initial={true} />
            <ToggleRow label="API Error Alerts" description="Ping Slack on 5xx errors" initial={false} />
            <ToggleRow label="Queue Overflow" description="Notify when queue > 20" initial={true} />
          </div>
        </GlassCard>

        {/* Configuration */}
        <div className="space-y-6">
          <GlassCard padding={false}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
              <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
                System Limits
              </h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <InputRow label="Session Timeout (minutes)" value="30" />
              <InputRow label="Default Max Opens" value="3" />
              <InputRow label="Auto-Delete Interval (hours)" value="24" />
              <InputRow label="Rate Limit (req/min)" value="100" />
              <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--admin-primary)", color: "white", boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
                Save Configuration
              </button>
            </div>
          </GlassCard>

          {/* Danger Zone */}
          <GlassCard padding={false} glow="danger">
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={16} style={{ color: "var(--admin-danger)" }} />
              <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "var(--admin-danger)" }}>
                Danger Zone
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                These actions cannot be undone and may affect active users immediately.
              </p>
              <div className="flex gap-3">
                <button className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "var(--admin-danger)", background: "rgba(239,68,68,0.05)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.05)"}>
                  Reset All Sessions
                </button>
                <button className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "var(--admin-danger)", background: "rgba(239,68,68,0.05)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.05)"}>
                  Purge Expired Docs
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
