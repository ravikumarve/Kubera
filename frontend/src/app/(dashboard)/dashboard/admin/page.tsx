"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Demo data ──────────────────────────────────────────
const DEMO_USERS = [
  { id: "1", name: "Alice Buyer", email: "alice@example.com", role: "buyer", contracts: 12, joined: "2026-01-15" },
  { id: "2", name: "Bob Seller", email: "bob@example.com", role: "seller", contracts: 8, joined: "2026-02-20" },
  { id: "3", name: "Charlie Admin", email: "charlie@example.com", role: "admin", contracts: 0, joined: "2026-01-01" },
  { id: "4", name: "Diana Developer", email: "diana@example.com", role: "seller", contracts: 15, joined: "2026-03-10" },
  { id: "5", name: "Eve Escrow", email: "eve@example.com", role: "buyer", contracts: 5, joined: "2026-04-22" },
];

export default function AdminPage() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const totalVolume = 150000;
  const disputedCount = 2;

  return (
    <div>
      {/* ═══ HEADER ═══ */}
      <div className="mb-8">
        <div className="text-[11px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono">Administration</div>
        <h1 className="text-lg font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
          Admin Dashboard
          <span className="text-[var(--accent)] animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* ═══ TELEMETRY ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: DEMO_USERS.length.toString(), icon: "◆", color: "var(--accent)" },
          { label: "Total Contracts", value: "20", icon: "●", color: "var(--text-main)", pct: 15 },
          { label: "Total Volume", value: formatCurrency(totalVolume, "USD"), icon: "⬇", color: "var(--text-main)", pct: 22 },
          { label: "Open Disputes", value: disputedCount.toString(), icon: "■", cls: "text-red-400" },
        ].map((m: any) => (
          <div key={m.label} className="border border-[var(--border-faint)] bg-[var(--bg-surface)] p-4">
            <div className="text-[10px] text-[var(--text-faint)] tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 font-mono">
              <span>{m.icon}</span>
              {m.label}
            </div>
            <div
              className={`text-xl font-bold font-mono ${m.cls || ""}`}
              style={m.cls ? undefined : { color: m.color }}
            >
              {m.value}
            </div>
            {"pct" in m && (
              <div className="text-[10px] text-emerald-400 font-mono">
                ▲ {m.pct}% <span className="text-[var(--text-faint)]">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ USERS LIST ═══ */}
      <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-5 py-3">
          <div className="flex items-center gap-2 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
            <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
            Users
          </div>
          <span className="text-[10px] text-[var(--text-faint)] font-mono">{DEMO_USERS.length} entries</span>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-2.5 text-[10px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Contracts</span>
          <span>Joined</span>
        </div>

        <div className="p-0">
          {DEMO_USERS.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-5 py-3 hover:bg-[var(--bg-panel)] transition-colors border-b border-[var(--border-faint)] last:border-0 items-center"
            >
              <span className="text-[13px] text-[var(--text-main)] font-mono">{u.name}</span>
              <span className="text-[11px] text-[var(--text-faint)] font-mono truncate">{u.email}</span>
              <span
                className={`text-[11px] font-bold tracking-wider uppercase font-mono ${
                  u.role === "admin" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                [{u.role}]
              </span>
              <span className="text-[11px] text-[var(--text-main)] font-mono">{u.contracts}</span>
              <span className="text-[11px] text-[var(--text-faint)] font-mono">{u.joined}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
