"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Key,
  Webhook,
  Server,
  Copy,
  Trash2,
  Plus,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

interface WebhookEntry {
  id: string;
  url: string;
  events: string;
  status: "active" | "paused";
}

interface McpNode {
  id: string;
  name: string;
  endpoint: string;
  status: "connected" | "disconnected";
}

const DEMO_KEYS: ApiKey[] = [
  { id: "ak_1", name: "Production", key: "kubera_sk_prod_a1b2c3d4e5f6...", created_at: "2026-06-01" },
  { id: "ak_2", name: "Development", key: "kubera_sk_dev_6f5e4d3c2b1a...", created_at: "2026-06-15" },
];

const DEMO_WEBHOOKS: WebhookEntry[] = [
  { id: "wh_1", url: "https://api.acme.com/webhooks/kubera", events: "contract.*, payment.*", status: "active" },
  { id: "wh_2", url: "https://hooks.slack.com/services/T.../B.../xxx", events: "dispute.*", status: "active" },
];

const DEMO_MCP: McpNode[] = [
  { id: "mcp_1", name: "Primary Ledger", endpoint: "ledger.kubera.dev:8443", status: "connected" },
  { id: "mcp_2", name: "FX Oracle", endpoint: "fx.oracle.kubera.dev:9443", status: "connected" },
  { id: "mcp_3", name: "Staging Sandbox", endpoint: "sandbox.kubera.dev:7443", status: "disconnected" },
];

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "mcp-nodes", label: "MCP Nodes", icon: Server },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("profile");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(DEMO_KEYS);
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(DEMO_WEBHOOKS);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* ═══ HEADER ═══ */}
      <div className="mb-8">
        <div className="text-[12px] text-[var(--text-faint)] tracking-[0.2em] uppercase mb-1 font-mono leading-5">Configuration</div>
        <h1 className="text-xl font-bold text-[var(--text-main)] tracking-wide uppercase font-mono">
          Settings
          <span className="text-[var(--accent)] animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* ═══ SIDEBAR + CONTENT ═══ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar Nav */}
        <nav className="lg:col-span-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs tracking-wider uppercase font-mono transition-colors text-left ${
                  isActive
                    ? "bg-[var(--accent-dim)] text-white border-l-2 border-l-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] border-l-2 border-l-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-4">
          {/* ═══ PROFILE ═══ */}
          {activeSection === "profile" && (
            <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
              <div className="border-b border-[var(--border-faint)] px-6 py-3.5">
                <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">Profile</h2>
              </div>
              <div className="p-6 space-y-5 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-[12px] text-[var(--text-faint)] tracking-wider uppercase font-mono">Name</label>
                  <input
                    defaultValue={session?.user?.name || ""}
                    placeholder="Your name"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-faint)] px-4 py-2.5 text-[14px] text-[var(--text-main)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-[var(--text-faint)] tracking-wider uppercase font-mono">Email</label>
                  <input
                    type="email"
                    defaultValue={session?.user?.email || ""}
                    placeholder="your@email.com"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-faint)] px-4 py-2.5 text-[14px] text-[var(--text-main)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-[var(--text-faint)] tracking-wider uppercase font-mono">Role</label>
                  <div className="px-4 py-2.5 border border-[var(--border-faint)] bg-[var(--bg-panel)] text-[14px] text-[var(--text-muted)] font-mono">
                    {(session?.user as any)?.role || "user"}
                  </div>
                </div>
                <div className="pt-2 pb-1">
                  <p className="text-[11px] text-[var(--text-faint)] font-mono leading-5">
                    Role configurations are governed by administrative organization policies.
                    Contact system root to escalate privileges.
                  </p>
                </div>
                <div className="pt-2 pb-3">
                  <button className="px-5 py-2.5 border border-[var(--accent)] bg-[var(--accent)] text-[12px] font-bold tracking-wider text-white hover:bg-transparent hover:text-[var(--accent)] transition-colors uppercase font-mono">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ API KEYS ═══ */}
          {activeSection === "api-keys" && (
            <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
              <div className="border-b border-[var(--border-faint)] px-6 py-3.5">
                <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">API Keys</h2>
              </div>
              <div className="p-6">
                {/* Column headers */}
                <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2.5 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
                  <span>Name</span>
                  <span className="col-span-2">Key</span>
                  <span className="text-right">Created</span>
                </div>

                <div className="divide-y divide-[var(--border-faint)]">
                  {apiKeys.length === 0 ? (
                    <p className="py-8 text-center text-[12px] text-[var(--text-faint)] font-mono">No API keys yet. Generate one below.</p>
                  ) : (
                    apiKeys.map((ak) => (
                      <div key={ak.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--bg-panel)] transition-colors items-center">
                        <div className="flex items-center gap-2">
                          <Key className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                          <span className="text-[13px] text-[var(--text-main)] font-mono">{ak.name}</span>
                        </div>
                        <span className="text-[12px] text-[var(--text-faint)] font-mono col-span-2 truncate">{ak.key}</span>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-[var(--text-faint)] font-mono">{ak.created_at}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(ak.key)}
                            className="p-1.5 hover:bg-[var(--bg-panel)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setApiKeys((prev) => prev.filter((k) => k.id !== ak.id))}
                            className="p-1.5 hover:bg-[var(--bg-panel)] transition-colors text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="mt-4 flex items-center gap-2 px-5 py-2.5 border border-[var(--border-faint)] text-[12px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors uppercase font-mono">
                  <Plus className="h-4 w-4" />
                  Generate New Key
                </button>
              </div>
            </div>
          )}

          {/* ═══ WEBHOOKS ═══ */}
          {activeSection === "webhooks" && (
            <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
              <div className="border-b border-[var(--border-faint)] px-6 py-3.5">
                <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">Webhooks &amp; Signatures</h2>
              </div>
              <div className="p-6">
                <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2.5 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
                  <span className="col-span-2">Endpoint URL</span>
                  <span className="col-span-2">Subscribed Events</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-[var(--border-faint)]">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--bg-panel)] transition-colors items-center">
                      <span className="text-[13px] text-[var(--accent)] font-mono col-span-2 truncate">{wh.url}</span>
                      <span className="text-[12px] text-[var(--text-muted)] font-mono col-span-2">{wh.events}</span>
                      <span className={`text-right text-[12px] font-mono ${wh.status === "active" ? "text-emerald-400" : "text-amber-400"}`}>
                        {wh.status === "active" ? "◆ Active" : "○ Paused"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Webhook signature info */}
                <div className="mt-6 px-4 py-3.5 border border-[var(--border-faint)] bg-[var(--bg-panel)]">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] font-mono mb-2">
                    <Shield className="h-4 w-4 text-[var(--accent)]" />
                    Webhook Signing Secret
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--text-faint)] font-mono">whsec_8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a</span>
                    <button className="p-1.5 hover:bg-[var(--bg-panel)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-faint)] font-mono mt-1.5">
                    Use this secret to verify incoming webhook payloads. Rotate regularly.
                  </p>
                </div>

                <button className="mt-4 flex items-center gap-2 px-5 py-2.5 border border-[var(--border-faint)] text-[12px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors uppercase font-mono">
                  <Plus className="h-4 w-4" />
                  Add Webhook
                </button>
              </div>
            </div>
          )}

          {/* ═══ MCP NODES ═══ */}
          {activeSection === "mcp-nodes" && (
            <div className="border border-[var(--border-faint)] bg-[var(--bg-surface)]">
              <div className="border-b border-[var(--border-faint)] px-6 py-3.5">
                <h2 className="text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono">MCP Server Nodes</h2>
              </div>
              <div className="p-6">
                <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2.5 text-[11px] text-[var(--text-faint)] tracking-wider uppercase font-mono border-b border-[var(--border-faint)]">
                  <span>Name</span>
                  <span className="col-span-2">Endpoint</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-[var(--border-faint)]">
                  {DEMO_MCP.map((node) => (
                    <div key={node.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--bg-panel)] transition-colors items-center">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                        <span className="text-[13px] text-[var(--text-main)] font-mono">{node.name}</span>
                      </div>
                      <span className="text-[12px] text-[var(--text-faint)] font-mono col-span-2 truncate">{node.endpoint}</span>
                      <span className={`text-right text-[12px] font-mono ${node.status === "connected" ? "text-emerald-400" : "text-red-400"}`}>
                        {node.status === "connected" ? "◆ Connected" : "○ Disconnected"}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="mt-4 flex items-center gap-2 px-5 py-2.5 border border-[var(--border-faint)] text-[12px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors uppercase font-mono">
                  <Plus className="h-4 w-4" />
                  Add Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
