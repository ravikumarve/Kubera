"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useContracts } from "@/hooks/use-contracts";
import {
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ─── Demo: Escrow Pipeline ─────────────────────────────
const PIPELINE = [
  { id: "CT-2026-0042", buyer: "acme.com", seller: "supplier.in", amount: 12500, stage: "Funded", flag: "active" as const },
  { id: "CT-2026-0045", buyer: "retail.co", seller: "wholesaler.cn", amount: 28000, stage: "In Transit", flag: "active" as const },
  { id: "CT-2026-0040", buyer: "globalcorp.com", seller: "mfg.co.kr", amount: 45000, stage: "Customs Cleared", flag: "done" as const },
  { id: "CT-2026-0038", buyer: "startup.io", seller: "devhouse.in", amount: 8200, stage: "Released", flag: "done" as const },
  { id: "CT-2026-0035", buyer: "bank.ltd", seller: "fintech.sg", amount: 67000, stage: "Pending Funding", flag: "pending" as const },
];

const stageConfig: Record<string, { color: string; label: string }> = {
  "Funded": { color: "text-blue-400", label: "● Funded" },
  "In Transit": { color: "text-amber-400", label: "◎ In Transit" },
  "Customs Cleared": { color: "text-emerald-400", label: "◆ Customs Cleared" },
  "Released": { color: "text-emerald-400", label: "✓ Released" },
  "Pending Funding": { color: "text-[var(--text-faint)]", label: "○ Pending" },
};

// ─── Demo: FX Pairs ────────────────────────────────────
const FX_PAIRS = [
  { pair: "USD/INR", rate: "83.45", change: "+0.32%", vol: "Low", hedged: true },
  { pair: "USD/EUR", rate: "0.92", change: "-0.18%", vol: "Med", hedged: true },
  { pair: "USD/SGD", rate: "1.35", change: "+0.05%", vol: "Low", hedged: false },
  { pair: "USD/GBP", rate: "0.79", change: "-0.41%", vol: "Med", hedged: true },
  { pair: "USD/AED", rate: "3.67", change: "+0.01%", vol: "Low", hedged: false },
];

// ─── Demo: Liquidity Queue ────────────────────────────
const LIQUIDITY = [
  { id: "INV-2026-889", amount: 45000, risk: "Low", days: 30 },
  { id: "INV-2026-890", amount: 120000, risk: "Medium", days: 60 },
  { id: "INV-2026-891", amount: 28000, risk: "Low", days: 15 },
];

const riskColor: Record<string, string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

// ─── Demo: Activity Log ───────────────────────────────
const LOG_LINES = [
  { time: "10:23:45", level: "INFO", msg: "CT-2026-0042 funded — $12,500 held in escrow" },
  { time: "10:18:12", level: "OK",   msg: "Milestone 'Q4 Design Review' approved by buyer" },
  { time: "09:55:03", level: "WARN", msg: "Payment reminder: CT-2026-0038 due in 48h" },
  { time: "09:30:00", level: "OK",   msg: "Dispute DS-0003 resolved — funds released" },
  { time: "08:47:22", level: "INFO", msg: "New contract: CT-2026-0045 — $8,200" },
];

// ─── Interactive CLI ───────────────────────────────────
const CLI_COMMANDS = [
  { cmd: "contract create", desc: "New escrow", href: "/dashboard/contracts/new" },
  { cmd: "contract list", desc: "Browse all", href: "/dashboard/contracts" },
  { cmd: "tx list", desc: "View payments", href: "/dashboard/transactions" },
  { cmd: "disputes", desc: "Open cases", href: "/dashboard/admin/disputes" },
];

// ─── Helpers ───────────────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: string;
  label: string;
  value: string;
  trend?: { pct: number; isUp: boolean };
}) {
  return (
    <div
      className="relative p-5 hover:bg-[var(--bg-panel)] transition-colors"
      style={{
        border: "1px solid transparent",
        background: `
          linear-gradient(var(--bg-surface), var(--bg-surface)) padding-box,
          linear-gradient(135deg, var(--accent), transparent 60%) border-box
        `,
      }}
    >
      <div className="text-[12px] text-[var(--text-faint)] tracking-[0.15em] uppercase mb-3 flex items-center gap-1.5 font-mono leading-5">
        <span>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-[var(--text-main)] mb-1.5 font-mono tracking-tight">
        {value}
      </div>
      {trend && (
        <div
          className={`text-[12px] font-mono leading-5 ${
            trend.isUp ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {trend.isUp ? "▲" : "▼"} {Math.abs(trend.pct)}%
          <span className="text-[var(--text-faint)] ml-1">vs prev</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: contracts, isLoading } = useContracts();
  const [time] = useState(new Date());
  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState<string[]>(["> KUBERA CLI ready"]);
  const cliEndRef = useRef<HTMLDivElement>(null);
  const cliInputRef = useRef<HTMLInputElement>(null);

  const activeContracts = contracts?.filter(
    (c) => c.status !== "COMPLETED" && c.status !== "CANCELLED" && c.status !== "REFUNDED"
  ) ?? [];

  const totalVolume = contracts?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const pendingFunding = contracts?.filter((c) => c.status === "PENDING_FUNDING") ?? [];
  const disputedContracts = contracts?.filter((c) => c.status === "DISPUTED") ?? [];

  const userName = (session?.user as any)?.name || "operator";

  // ─── CLI handler ─────────────────────────────────────
  function handleCliSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd) return;

    setCliHistory((prev) => [...prev, `$ ${cmd}`]);

    // Map commands to actions
    const actionMap: Record<string, string> = {
      "contract create": "→ Navigating to contract creation...",
      "contract list": "→ Loading contract list...",
      "tx list": "→ Loading transactions...",
      "disputes": "→ Opening dispute console...",
      "help": "Available: contract create, contract list, tx list, disputes, help, clear",
      "clear": "CLEAR",
    };

    const response = actionMap[cmd] || `→ Unknown: '${cmd}'. Type 'help' for commands.`;

    if (cmd === "clear") {
      setCliHistory(["> KUBERA CLI ready"]);
    } else {
      setCliHistory((prev) => [...prev, response]);
    }

    setCliInput("");

    // Navigate for matching commands
    const navMap: Record<string, string> = {
      "contract create": "/dashboard/contracts/new",
      "contract list": "/dashboard/contracts",
      "tx list": "/dashboard/transactions",
      "disputes": "/dashboard/admin/disputes",
    };
    if (navMap[cmd]) {
      setTimeout(() => window.location.href = navMap[cmd], 400);
    }
  }

  function handleCliClick(cmd: string) {
    setCliInput(cmd);
    cliInputRef.current?.focus();
  }

  // ─── Telemetry data ─────────────────────────────────
  const telemetry = [
    {
      icon: "◆",
      label: "Active Escrows",
      value: activeContracts.length.toString(),
      trend: { pct: 17, isUp: true },
    },
    {
      icon: "●",
      label: "Total Volume",
      value: formatCurrency(totalVolume, "USD"),
      trend: { pct: 8, isUp: true },
    },
    {
      icon: "⬇",
      label: "Avg. Settlement",
      value: "2.4d",
      trend: { pct: 23, isUp: true },
    },
    {
      icon: "■",
      label: "Dispute Rate",
      value: contracts?.length
        ? `${Math.round((disputedContracts.length / contracts.length) * 100)}%`
        : "0%",
      trend: { pct: 45, isUp: false },
    },
    {
      icon: "▲",
      label: "Active Users",
      value: "38",
      trend: { pct: 12, isUp: true },
    },
    {
      icon: "●",
      label: "Pending Funding",
      value: pendingFunding.length.toString(),
      trend: { pct: 22, isUp: false },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ SECTION HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono leading-5">
            {time.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
            Command Center
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

      {/* ═══ METRIC CARDS (with gradient borders) ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {telemetry.map((m) => (
          <MetricCard
            key={m.label}
            icon={m.icon}
            label={m.label}
            value={m.value}
            trend={m.trend}
          />
        ))}
      </div>

      {/* ═══ MAIN: PIPELINE + FX + LIQUIDITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Escrow Milestone Pipeline (2/3) ── */}
        <div className="lg:col-span-2 border border-[var(--border-faint)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-5 py-3.5">
            <div className="flex items-center gap-2.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              Escrow Pipeline
            </div>
            <Link
              href="/dashboard/contracts"
              className="text-[11px] text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors font-mono flex items-center gap-1"
            >
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
            <span>Contract</span>
            <span className="col-span-2">Trade Route</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Stage</span>
          </div>

          <div className="divide-y divide-[var(--border-faint)]">
            {PIPELINE.map((p) => {
              const stage = stageConfig[p.stage] || stageConfig["Pending Funding"];
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-5 py-3.5 hover:bg-[var(--bg-panel)] transition-colors items-center"
                >
                  <span className="text-[13px] text-[var(--accent)] font-mono font-bold">
                    {p.id}
                  </span>
                  <span className="text-[13px] text-[var(--text-main)] font-mono col-span-2 truncate">
                    <span className="text-[var(--text-muted)]">{p.buyer}</span>
                    <span className="text-[var(--text-faint)] mx-1.5">→</span>
                    <span className="text-[var(--text-main)]">{p.seller}</span>
                  </span>
                  <span className="text-[14px] text-[var(--text-main)] font-mono tabular-nums md:text-right">
                    {formatCurrency(p.amount, "USD")}
                  </span>
                  <span
                    className={`text-[12px] font-bold tracking-wider font-mono md:text-right ${stage.color}`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Column: FX + Liquidity ── */}
        <div className="space-y-6">
          {/* FX Volatility & Currency Lock Monitor */}
          <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border-faint)] px-5 py-3">
              <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                FX Monitor
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-faint)]">
              {FX_PAIRS.map((f) => {
                const isUp = f.change.startsWith("+");
                return (
                  <div
                    key={f.pair}
                    className="grid grid-cols-4 gap-2 px-4 py-2.5 hover:bg-[var(--bg-panel)] transition-colors items-center"
                  >
                    <span className="text-[13px] text-[var(--text-main)] font-mono font-bold">
                      {f.pair}
                    </span>
                    <span className="text-[13px] text-[var(--text-main)] font-mono tabular-nums text-right">
                      {f.rate}
                    </span>
                    <span
                      className={`text-[11px] font-mono tabular-nums text-right ${
                        isUp ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {f.change}
                    </span>
                    <span className="text-right">
                      {f.hedged ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-400/10 text-[10px] font-bold tracking-wider text-emerald-400 font-mono uppercase">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Hedged
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-faint)] font-mono">
                          Open
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liquidity & Invoice Discounting Queue */}
          <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border-faint)] px-5 py-3">
              <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono flex items-center gap-2">
                <ArrowDownRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                Liquidity Queue
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-faint)]">
              {LIQUIDITY.map((lq) => (
                <div
                  key={lq.id}
                  className="px-4 py-3 hover:bg-[var(--bg-panel)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-[var(--text-main)] font-mono">{lq.id}</span>
                    <span className="text-[13px] text-[var(--text-main)] font-mono tabular-nums">
                      {formatCurrency(lq.amount, "USD")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-mono ${riskColor[lq.risk] || "text-[var(--text-faint)]"}`}>
                        ● {lq.risk}
                      </span>
                      <span className="text-[11px] text-[var(--text-faint)] font-mono">
                        {lq.days}d term
                      </span>
                    </div>
                    <button className="text-[10px] px-2.5 py-1 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-void)] transition-colors uppercase font-mono font-bold tracking-wider">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM: ACTIVITY LOG + CLI TERMINAL ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Log (compact, bumped down) */}
        <div className="lg:col-span-2 border border-[var(--border-faint)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border-faint)] px-5 py-3">
            <div className="flex items-center gap-2.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">
              <Clock className="h-4 w-4 text-[var(--accent)]" />
              Live Activity
            </div>
            <span className="text-[11px] text-[var(--text-faint)] font-mono">
              {LOG_LINES.length} entries
            </span>
          </div>
          <div className="p-0">
            {LOG_LINES.map((log, i) => {
              const levelColor = {
                INFO: "text-[var(--text-faint)]",
                OK: "text-emerald-400",
                WARN: "text-amber-400",
                ALERT: "text-[var(--accent)]",
              }[log.level] || "text-[var(--text-faint)]";

              return (
                <div
                  key={i}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-[var(--bg-panel)] transition-colors border-b border-[var(--border-faint)] last:border-0"
                >
                  <span className="text-[12px] text-[var(--text-faint)] font-mono shrink-0 w-16 tabular-nums leading-5">
                    {log.time}
                  </span>
                  <span
                    className={`text-[12px] font-bold tracking-wider uppercase shrink-0 w-16 font-mono leading-5 ${levelColor}`}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-[14px] text-[var(--text-main)] font-mono leading-5">
                    {log.msg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive CLI Terminal */}
        <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)] flex flex-col">
          <div className="border-b border-[var(--border-faint)] px-5 py-3">
            <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono flex items-center gap-2">
              <span className="text-[var(--accent)]">&gt;_</span>
              Terminal
            </h2>
          </div>

          {/* CLI history */}
          <div className="flex-1 px-4 py-3 space-y-1 max-h-[180px] overflow-y-auto">
            {cliHistory.map((line, i) => (
              <div
                key={i}
                className={`text-[12px] font-mono leading-6 ${
                  line.startsWith("$")
                    ? "text-[var(--accent)]"
                    : line.startsWith(">")
                      ? "text-[var(--text-faint)]"
                      : line.startsWith("→")
                        ? "text-[var(--text-main)]"
                        : "text-[var(--text-faint)]"
                }`}
              >
                {line}
              </div>
            ))}
            <div ref={cliEndRef} />
          </div>

          {/* Command shortcuts */}
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {CLI_COMMANDS.map((c) => (
              <button
                key={c.cmd}
                onClick={() => handleCliClick(c.cmd)}
                className="px-2 py-0.5 border border-[var(--border-faint)] text-[10px] tracking-wider text-[var(--text-faint)] hover:text-[var(--accent)] hover:border-[var(--accent-dim)] transition-colors font-mono"
              >
                {c.cmd}
              </button>
            ))}
          </div>

          {/* CLI input */}
          <form onSubmit={handleCliSubmit} className="border-t border-[var(--border-faint)]">
            <div className="flex items-center px-4 py-2.5">
              <span className="text-[12px] text-[var(--accent)] font-mono mr-2">$</span>
              <input
                ref={cliInputRef}
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="type help or click a command..."
                className="flex-1 bg-transparent text-[12px] text-[var(--text-main)] font-mono outline-none border-none placeholder:text-[var(--text-faint)]"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </form>
        </div>
      </div>

      {/* ═══ SYSTEM STATUS (compact footer strip) ═══ */}
      <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)] px-5 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Stripe Connect", status: "Operational", color: "text-emerald-400" },
            { label: "Database", status: "Connected", color: "text-emerald-400" },
            { label: "Redis", status: "Connected", color: "text-emerald-400" },
            { label: "Webhooks", status: "Active", color: "text-emerald-400" },
            { label: "Rate Limit", status: "45%", color: "text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-faint)] font-mono">{item.label}</span>
              <span className={`text-[11px] font-mono ${item.color}`}>◆ {item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
