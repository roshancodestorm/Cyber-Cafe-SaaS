"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  title?: string;
  actions?: React.ReactNode;
  maxHeight?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable,
  searchKeys,
  onRowClick,
  emptyMessage = "No records found.",
  title,
  actions,
  maxHeight,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim() || !searchKeys?.length) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchKeys]);

  const getValue = (row: T, key: string) => {
    return key.split(".").reduce<unknown>((acc, k) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
      return undefined;
    }, row);
  };

  return (
    <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
      {(title || searchable || actions) && (
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          {title && (
            <h3 className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
              {title}
            </h3>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {searchable && (
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--admin-text-muted)" }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none w-44 transition-all focus:w-56"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", maxHeight }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-5 py-3 font-semibold text-left"
                  style={{
                    color: "var(--admin-text-muted)",
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: col.width,
                    textAlign: col.align ?? "left",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className="transition-colors duration-150"
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--admin-border)" : "none",
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {columns.map((col) => {
                    const val = getValue(row, String(col.key));
                    return (
                      <td
                        key={String(col.key)}
                        className="px-5 py-3.5"
                        style={{
                          color: "var(--admin-text)",
                          textAlign: col.align ?? "left",
                        }}
                      >
                        {col.render ? col.render(val, row) : String(val ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
