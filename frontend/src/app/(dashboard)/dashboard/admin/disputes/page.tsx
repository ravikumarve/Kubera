"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Scale, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

// ─── Demo data ──────────────────────────────────────────
const DEMO_DISPUTES = [
  {
    id: "d_1",
    contract_id: "ct_1",
    raised_by: "Alice Buyer",
    reason: "Deliverable does not match the agreed specifications. The code quality is significantly below what was promised.",
    status: "OPEN",
    created_at: "2026-07-10T14:30:00Z",
  },
  {
    id: "d_2",
    contract_id: "ct_2",
    raised_by: "Bob Seller",
    reason: "Client has not provided the required assets for two weeks, delaying the project.",
    status: "UNDER_REVIEW",
    created_at: "2026-07-08T09:00:00Z",
  },
  {
    id: "d_3",
    contract_id: "ct_4",
    raised_by: "Charlie Admin",
    reason: "Dispute resolved via mutual agreement — funds split 70/30.",
    status: "RESOLVED",
    created_at: "2026-07-01T12:00:00Z",
  },
];

const statusColors: Record<string, string> = {
  OPEN: "text-red-400",
  UNDER_REVIEW: "text-amber-400",
  RESOLVED: "text-emerald-400",
  DISMISSED: "text-[var(--text-faint)]",
};

export default function AdminDisputesPage() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      {/* ═══ HEADER ═══ */}
      <div className="mb-8">
        <div className="text-[11px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono">Administration</div>
        <h1 className="text-lg font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
          Dispute Management
          <span className="text-[var(--accent)] animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* ═══ MINI TELEMETRY ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Disputes", value: DEMO_DISPUTES.length, icon: "◆" },
          { label: "Open", value: DEMO_DISPUTES.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length, icon: "●" },
          { label: "Resolved", value: DEMO_DISPUTES.filter((d) => d.status === "RESOLVED" || d.status === "DISMISSED").length, icon: "⬇" },
        ].map((m) => (
          <div key={m.label} className="border border-[var(--border-faint)] bg-[var(--bg-surface)] p-4">
            <div className="text-[10px] text-[var(--text-faint)] tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 font-mono">
              <span>{m.icon}</span>
              {m.label}
            </div>
            <div className="text-xl font-bold text-[var(--text-main)] font-mono">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ DISPUTES LIST ═══ */}
      <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-5 py-3">
          <div className="flex items-center gap-2 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
            <Scale className="h-3.5 w-3.5 text-[var(--accent)]" />
            All Disputes
          </div>
          <span className="text-[10px] text-[var(--text-faint)] font-mono">{DEMO_DISPUTES.length} entries</span>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-2.5 text-[10px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
          <span>ID</span>
          <span>Raised By</span>
          <span className="col-span-2">Reason</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        <div className="p-0">
          {DEMO_DISPUTES.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 px-5 py-3 hover:bg-[var(--bg-panel)] transition-colors border-b border-[var(--border-faint)] last:border-0 items-center"
            >
              <span className="text-[11px] text-[var(--text-faint)] font-mono">{d.id}</span>
              <span className="text-[13px] text-[var(--text-main)] font-mono">{d.raised_by}</span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono col-span-2 truncate">{d.reason}</span>
              <span
                className={`text-[11px] font-bold tracking-wider uppercase font-mono ${
                  statusColors[d.status] || "text-[var(--text-faint)]"
                }`}
              >
                ◆ {d.status.replace("_", " ")}
              </span>
              <div className="flex items-center gap-1.5">
                {(d.status === "OPEN" || d.status === "UNDER_REVIEW") ? (
                  <>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-faint)] text-[10px] tracking-wider text-[var(--text-muted)] hover:text-emerald-400 hover:border-emerald-400/30 transition-colors uppercase font-mono">
                      <Check className="h-3 w-3" />
                      Resolve
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-faint)] text-[10px] tracking-wider text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/30 transition-colors uppercase font-mono">
                      <X className="h-3 w-3" />
                      Dismiss
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-[var(--text-faint)] font-mono">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
