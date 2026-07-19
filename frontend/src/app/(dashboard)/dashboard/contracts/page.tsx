"use client";

import Link from "next/link";
import { useContracts } from "@/hooks/use-contracts";
import { FileText, Plus, ArrowRight, Shield, Layers, GitBranch } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ─── Templates for empty state ─────────────────────────
const TEMPLATES = [
  {
    id: "standard",
    label: "Standard Trade Escrow",
    desc: "Fixed-price with milestone releases",
    icon: Shield,
  },
  {
    id: "milestone",
    label: "Milestone Vendor Contract",
    desc: "Pay-per-deliverable with approvals",
    icon: Layers,
  },
  {
    id: "custom",
    label: "Custom Multi-Sig Vault",
    desc: "2-of-3 approval with arbitration",
    icon: GitBranch,
  },
];

export default function ContractsPage() {
  const { data: contracts, isLoading } = useContracts();

  const activeCount = contracts?.filter(
    (c) => c.status !== "COMPLETED" && c.status !== "CANCELLED" && c.status !== "REFUNDED"
  ).length ?? 0;

  const totalVolume = contracts?.reduce((sum, c) => sum + c.amount, 0) ?? 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-400";
      case "DISPUTED": return "text-red-400";
      case "PENDING_FUNDING": return "text-amber-400";
      case "FUNDED":
      case "IN_PROGRESS": return "text-blue-400";
      default: return "text-[var(--accent)]";
    }
  };

  const hasContracts = contracts && contracts.length > 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[12px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono leading-5">
            Management
          </div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
            Contracts
            <span className="text-[var(--accent)] animate-pulse ml-2">_</span>
          </h1>
        </div>
        <Link
          href="/dashboard/contracts/new"
          className="flex items-center gap-2 px-5 py-2.5 border border-[var(--accent)] bg-[var(--accent)] text-[12px] font-bold tracking-wider text-[var(--bg-void)] hover:bg-transparent hover:text-[var(--accent)] transition-colors uppercase font-mono shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Contract
        </Link>
      </div>

      {/* ═══ MINI TELEMETRY ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Contracts", value: contracts?.length ?? 0, icon: "◆" },
          { label: "Active", value: activeCount, icon: "●" },
          { label: "Total Volume", value: `${(totalVolume / 1000).toFixed(1)}K`, icon: "⬇" },
        ].map((m) => (
          <div key={m.label} className="border border-[var(--border-faint)] bg-[var(--bg-surface)] p-5">
            <div className="text-[12px] text-[var(--text-faint)] tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 font-mono leading-5">
              <span>{m.icon}</span>
              {m.label}
            </div>
            <div className="text-2xl font-bold text-[var(--text-main)] font-mono tracking-tight">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ CONTRACTS LIST (fills remaining space) ═══ */}
      <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)] flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-6 py-3.5">
          <div className="flex items-center gap-2.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
            <FileText className="h-4 w-4 text-[var(--accent)]" />
            All Contracts
          </div>
          <span className="text-[11px] text-[var(--text-faint)] font-mono">{contracts?.length ?? 0} entries</span>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
          <span>ID</span>
          <span>Status</span>
          <span className="col-span-2">Title</span>
          <span className="text-right">Amount</span>
        </div>

        {hasContracts ? (
          <>
            <div className="flex-1 divide-y divide-[var(--border-faint)]">
              {contracts!.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/contracts/${c.id}`}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-6 py-4 hover:bg-[var(--bg-panel)] transition-colors items-center"
                >
                  <span className="text-[12px] text-[var(--text-faint)] font-mono truncate">{c.id.slice(0, 14)}</span>
                  <span className={`text-[12px] font-bold tracking-wider uppercase font-mono ${statusColor(c.status)}`}>
                    [{c.status.slice(0, 8)}]
                  </span>
                  <span className="text-[14px] text-[var(--text-main)] font-mono truncate md:col-span-2">
                    {c.title || `Contract ${c.id.slice(0, 8)}`}
                  </span>
                  <span className="text-[14px] text-[var(--text-main)] font-mono md:text-right tabular-nums">
                    {formatCurrency(c.amount, "USD")}
                  </span>
                </Link>
              ))}
            </div>

            {/* Pagination bar */}
            <div className="border-t border-[var(--border-faint)] px-6 py-3">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)] font-mono">
                <span>Showing {contracts!.length} of {contracts!.length} entries</span>
                <span className="text-[var(--accent)]">●</span>
                <span>Database Sync: Nominal</span>
              </div>
            </div>
          </>
        ) : (
          /* ═══ EPIC EMPTY STATE ═══ */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            {/* Terminal box */}
            <div className="border border-[var(--border-faint)] bg-[var(--bg-panel)] p-6 mb-8 max-w-md w-full">
              <div className="text-[11px] text-[var(--text-faint)] font-mono mb-2 leading-5 tracking-wider uppercase">
                ╔══ [SYSTEM STATUS] ══╗
              </div>
              <div className="text-[13px] text-[var(--accent)] font-mono leading-6">
                $ scan --contracts
              </div>
              <div className="text-[13px] text-[var(--text-muted)] font-mono leading-6">
                &gt; No active contracts found in ledger.
              </div>
              <div className="text-[13px] text-[var(--text-main)] font-mono leading-6">
                &gt; Ready to create first escrow.
              </div>
              <div className="text-[11px] text-[var(--text-faint)] font-mono mt-2 leading-5 tracking-wider uppercase">
                ╚══ [STATUS: STANDBY] ══╝
              </div>
            </div>

            {/* Quick-Start Blueprints */}
            <div className="text-[12px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-5 font-mono">
              Quick-Start Blueprints
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
              {TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <Link
                    key={tpl.id}
                    href="/dashboard/contracts/new"
                    className="border border-[var(--border-faint)] bg-[var(--bg-surface)] p-5 hover:bg-[var(--bg-panel)] hover:border-[var(--accent-dim)] transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center bg-[var(--bg-panel)] group-hover:bg-[var(--accent-dim)] transition-colors">
                        <Icon className="h-4 w-4 text-[var(--accent)]" />
                      </div>
                      <span className="text-[13px] text-[var(--text-main)] font-mono font-bold">
                        {tpl.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-faint)] font-mono leading-5 mb-3">
                      {tpl.desc}
                    </p>
                    <span className="text-[11px] text-[var(--accent)] font-mono flex items-center gap-1 group-hover:gap-2 transition-all">
                      Create <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pagination bar (empty) */}
            <div className="border-t border-[var(--border-faint)] px-6 py-3 w-full mt-8">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)] font-mono">
                <span>Showing 0 of 0 entries</span>
                <span className="text-[var(--accent)]">●</span>
                <span>Database Sync: Nominal</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
