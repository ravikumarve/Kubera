"use client";

import { useState } from "react";
import { ArrowLeftRight, ExternalLink, Copy, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Demo data ──────────────────────────────────────────
const TXNS = [
  { id: "txn_1", contract_id: "ct_1", amount: 5000, currency: "USD", type: "FUND", status: "SUCCEEDED", created_at: "2026-06-15T10:30:00Z" },
  { id: "txn_2", contract_id: "ct_1", amount: 2500, currency: "USD", type: "RELEASE", status: "SUCCEEDED", created_at: "2026-06-20T14:00:00Z" },
  { id: "txn_3", contract_id: "ct_2", amount: 10000, currency: "USD", type: "FUND", status: "PENDING", created_at: "2026-07-01T09:00:00Z" },
  { id: "txn_4", contract_id: "ct_1", amount: 150, currency: "USD", type: "FEE", status: "SUCCEEDED", created_at: "2026-06-20T14:00:00Z" },
  { id: "txn_5", contract_id: "ct_3", amount: 7500, currency: "USD", type: "REFUND", status: "SUCCEEDED", created_at: "2026-07-05T11:00:00Z" },
  { id: "txn_6", contract_id: "ct_4", amount: 3200, currency: "USD", type: "FUND", status: "FAILED", created_at: "2026-07-12T16:45:00Z" },
];

type Txn = typeof TXNS[0];

const typeStyles: Record<string, { label: string; color: string }> = {
  FUND: { label: "Deposit", color: "text-[var(--accent)]" },
  RELEASE: { label: "Release", color: "text-emerald-400" },
  REFUND: { label: "Refund", color: "text-amber-400" },
  FEE: { label: "Fee", color: "text-[var(--text-faint)]" },
};

const statusStyles: Record<string, string> = {
  PENDING: "text-amber-400",
  SUCCEEDED: "text-emerald-400",
  FAILED: "text-red-400",
};

// ─── Mock detail data per txn ──────────────────────────
const MOCK_LEDGER: Record<string, {
  hash: string;
  conversion: { from: string; to: string; rate: string; fee: string; net: string };
  signatures: string[];
  timeline: { stage: string; date: string; actor: string }[];
}> = {
  txn_1: {
    hash: "0x4f8b…3c2a",
    conversion: { from: "USD", to: "USD", rate: "1.0000", fee: "$25.00", net: "$4,975.00" },
    signatures: ["0x7a3e…b1f2 (Buyer)", "0x9d1c…e4a8 (Platform)"],
    timeline: [
      { stage: "Initiated", date: "2026-06-15 10:30", actor: "System" },
      { stage: "Funds Held", date: "2026-06-15 10:31", actor: "Stripe" },
      { stage: "Confirmed", date: "2026-06-15 10:32", actor: "Ledger" },
    ],
  },
  txn_3: {
    hash: "0x3a1c…d9e2",
    conversion: { from: "USD", to: "USD", rate: "1.0000", fee: "$50.00", net: "$9,950.00" },
    signatures: ["0x1b2f…8c4d (Buyer)"],
    timeline: [
      { stage: "Initiated", date: "2026-07-01 09:00", actor: "System" },
      { stage: "Pending ACH", date: "2026-07-01 09:01", actor: "Stripe" },
    ],
  },
};

function getDetail(txn: Txn) {
  return MOCK_LEDGER[txn.id] || {
    hash: `${txn.id}_hash_0x${Math.random().toString(16).slice(2, 10)}…`,
    conversion: { from: "USD", to: "USD", rate: "1.0000", fee: "$0.00", net: formatCurrency(txn.amount, txn.currency) },
    signatures: ["0x0000…0000 (Pending)"],
    timeline: [
      { stage: "Initiated", date: txn.created_at, actor: "System" },
    ],
  };
}

export default function TransactionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalInflow = TXNS.filter((t) => t.type === "FUND").reduce((s, t) => s + t.amount, 0);
  const totalOutflow = TXNS.filter((t) => t.type === "RELEASE" || t.type === "REFUND").reduce((s, t) => s + t.amount, 0);

  const selected = TXNS.find((t) => t.id === selectedId) || null;
  const detail = selected ? getDetail(selected) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* ═══ HEADER ═══ */}
      <div className="mb-8">
        <div className="text-[12px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono leading-5">Finance</div>
        <h1 className="text-xl font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
          Transactions
          <span className="text-[var(--accent)] animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* ═══ MINI TELEMETRY ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Transactions", value: TXNS.length, icon: "◆", color: "var(--accent)" },
          { label: "Inflow", value: formatCurrency(totalInflow, "USD"), icon: "●", cls: "text-emerald-400" },
          { label: "Outflow", value: formatCurrency(totalOutflow, "USD"), icon: "⬇", cls: "text-amber-400" },
        ].map((m) => (
          <div key={m.label} className="border border-[var(--border-faint)] bg-[var(--bg-surface)] p-5">
            <div className="text-[12px] text-[var(--text-faint)] tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 font-mono leading-5">
              <span>{m.icon}</span>
              {m.label}
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${m.cls || ""}`} style={m.cls ? undefined : { color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SPLIT-PANE: LIST + DETAIL ═══ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Transaction List (3/5) */}
        <div className="lg:col-span-3 border border-[var(--border-faint)] bg-[var(--bg-surface)] flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-6 py-3.5">
            <div className="flex items-center gap-2.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
              <ArrowLeftRight className="h-4 w-4 text-[var(--accent)]" />
              All Transactions
            </div>
            <span className="text-[11px] text-[var(--text-faint)] font-mono">{TXNS.length} entries</span>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-5 gap-3 px-6 py-3 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
            <span>ID</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          <div className="flex-1 divide-y divide-[var(--border-faint)] overflow-auto">
            {TXNS.map((t) => {
              const typeCfg = typeStyles[t.type] || typeStyles.FUND;
              const statusColor = statusStyles[t.status] || "text-[var(--text-faint)]";
              const isSelected = selectedId === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(isSelected ? null : t.id)}
                  className={`w-full text-left grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 px-6 py-4 transition-colors items-center ${
                    isSelected
                      ? "bg-[var(--accent-dim)] border-l-2 border-l-[var(--accent)]"
                      : "hover:bg-[var(--bg-panel)] border-l-2 border-l-transparent"
                  }`}
                >
                  <span className="text-[12px] text-[var(--text-faint)] font-mono">{t.id}</span>
                  <span className={`text-[12px] font-bold tracking-wider uppercase font-mono ${typeCfg.color}`}>
                    [{typeCfg.label}]
                  </span>
                  <span className="text-[14px] text-[var(--text-main)] font-mono tabular-nums">
                    {t.type === "FUND" ? "+" : t.type === "FEE" ? "" : "-"}
                    {formatCurrency(t.amount, t.currency)}
                  </span>
                  <span className={`text-[12px] font-mono ${statusColor}`}>◆ {t.status}</span>
                  <span className="text-[12px] text-[var(--text-faint)] font-mono">{formatDate(t.created_at)}</span>
                </button>
              );
            })}
          </div>

          {/* Pagination bar */}
          <div className="border-t border-[var(--border-faint)] px-6 py-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)] font-mono">
              <span>Showing {TXNS.length} of {TXNS.length} entries</span>
              <span className="text-[var(--accent)]">●</span>
              <span>Database Sync: Nominal</span>
            </div>
          </div>
        </div>

        {/* Right: Transaction Details Panel (2/5) */}
        <div className="lg:col-span-2 border border-[var(--border-faint)] bg-[var(--bg-surface)] flex flex-col">
          <div className="border-b border-[var(--border-faint)] px-6 py-3.5">
            <div className="flex items-center gap-2.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
              <ExternalLink className="h-4 w-4 text-[var(--accent)]" />
              Inspection Panel
            </div>
          </div>

          {selected && detail ? (
            <div className="flex-1 p-0 divide-y divide-[var(--border-faint)] overflow-auto">
              {/* Ledger Hash */}
              <div className="px-6 py-4">
                <div className="text-[10px] text-[var(--text-faint)] tracking-wider uppercase mb-2 font-mono">Ledger Entry</div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[var(--accent)] font-mono">{detail.hash}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(detail.hash)}
                    className="text-[var(--text-faint)] hover:text-[var(--text-main)] transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Currency Conversion Breakdown */}
              <div className="px-6 py-4">
                <div className="text-[10px] text-[var(--text-faint)] tracking-wider uppercase mb-3 font-mono">
                  Currency Conversion
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-faint)] font-mono">From</span>
                    <span className="text-[13px] text-[var(--text-main)] font-mono">{detail.conversion.from}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-faint)] font-mono">To</span>
                    <span className="text-[13px] text-[var(--text-main)] font-mono">{detail.conversion.to}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-faint)] font-mono">Rate</span>
                    <span className="text-[13px] text-[var(--text-main)] font-mono tabular-nums">{detail.conversion.rate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-faint)] font-mono">Platform Fee</span>
                    <span className="text-[13px] text-[var(--text-faint)] font-mono">{detail.conversion.fee}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-faint)] pt-2.5">
                    <span className="text-[12px] text-[var(--text-muted)] font-mono font-bold">Net Settlement</span>
                    <span className="text-[14px] text-[var(--accent)] font-mono font-bold">{detail.conversion.net}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="px-6 py-4">
                <div className="text-[10px] text-[var(--text-faint)] tracking-wider uppercase mb-3 font-mono">Timeline</div>
                <div className="space-y-3">
                  {detail.timeline.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2 w-2 rounded-full mt-1.5 ${i === detail.timeline.length - 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border-faint)]'}`} />
                        {i < detail.timeline.length - 1 && <div className="w-px h-4 bg-[var(--border-faint)]" />}
                      </div>
                      <div>
                        <div className="text-[13px] text-[var(--text-main)] font-mono">{step.stage}</div>
                        <div className="text-[11px] text-[var(--text-faint)] font-mono">{step.date} — {step.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Signature Seal */}
              <div className="px-6 py-4">
                <div className="text-[10px] text-[var(--text-faint)] tracking-wider uppercase mb-3 font-mono">
                  Signatures
                </div>
                <div className="space-y-2">
                  {detail.signatures.map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 border border-[var(--border-faint)] bg-[var(--bg-panel)]">
                      <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-[var(--text-main)] font-mono truncate">{sig}</span>
                    </div>
                  ))}
                </div>
                {/* Mock seal */}
                <div className="mt-4 px-4 py-3 border border-[var(--border-faint)] text-center">
                  <div className="text-[18px] text-[var(--accent)] mb-1" style={{ opacity: 0.6 }}>
                    ═══════╗
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)] tracking-widest uppercase font-mono">
                    CRYPTOGRAPHIC SEAL
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)] font-mono mt-1">
                    {detail.hash}
                  </div>
                  <div className="text-[18px] text-[var(--accent)] mt-1" style={{ opacity: 0.6 }}>
                    ╚═══════
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center px-6 py-12 m-4 border-2 border-dashed border-[var(--border-faint)]" style={{ opacity: 0.6 }}>
              <div className="text-center">
                <div className="text-[32px] text-[var(--text-faint)] mb-4" style={{ opacity: 0.25 }}>
                  ⊕
                </div>
                <p className="text-[12px] text-[var(--text-faint)] font-mono">
                  Select a transaction to inspect its ledger data.
                </p>
                <p className="text-[11px] text-[var(--text-faint)] font-mono mt-2" style={{ opacity: 0.6 }}>
                  Click any row to load cryptographic proof
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
