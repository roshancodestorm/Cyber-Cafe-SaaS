"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "480px",
}: DetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="slide-in-right fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width,
          maxWidth: "100vw",
          background: "linear-gradient(135deg, rgba(15,15,26,0.98) 0%, rgba(20,20,40,0.98) 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-start justify-between px-6 py-5 z-10"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15,15,26,0.95)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: "var(--admin-text)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors mt-0.5"
            style={{ color: "var(--admin-text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-muted)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </>
  );
}
