"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  Shield,
  Terminal,
  FileText,
  ArrowLeftRight,
  Settings,
  Users,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

const NAV_TABS = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: Terminal },
  { id: "contracts", label: "Contracts", href: "/dashboard/contracts", icon: FileText },
  { id: "transactions", label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { id: "admin", label: "Admin", href: "/dashboard/admin", icon: Users, adminOnly: true },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function CommandBar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const userName = (session?.user as any)?.name || "operator";
  const role = (session?.user as any)?.role || "user";
  const isAdmin = role === "admin";

  // Determine active tab from pathname
  const activeTab = (() => {
    if (pathname === "/dashboard") return "overview";
    if (pathname.startsWith("/dashboard/contracts")) return "contracts";
    if (pathname.startsWith("/dashboard/transactions")) return "transactions";
    if (pathname.startsWith("/dashboard/admin")) return "admin";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    return "";
  })();

  return (
    <div className="border-b border-[var(--border-faint)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Left: Logo + Tabs */}
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center bg-[var(--accent)]">
              <Shield className="h-4 w-4 text-[var(--bg-void)]" />
            </div>
            <span className="text-sm font-bold tracking-widest text-[var(--text-main)] hidden sm:inline">
              KUBERA
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
            {NAV_TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-3 py-2 text-[13px] tracking-wider transition-colors whitespace-nowrap font-mono ${
                    isActive
                      ? "bg-[var(--accent-dim)] text-black"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Status + User */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live clock */}
          <span className="text-[11px] text-[var(--text-faint)] font-mono hidden md:block tabular-nums">
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-2.5 py-1.5 border border-[var(--border-faint)] text-[11px] tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-mono"
          >
            <span
              className="inline-block h-2 w-2 shrink-0"
              style={{
                backgroundColor: "var(--accent)",
                borderRadius: theme === "vault" ? "2px" : "50%",
              }}
            />
            <span className="hidden xs:inline">{theme === "kinetic" ? "Mint" : "Vault"}</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <span className="text-[var(--accent)]">◆</span>
            <span className="hidden sm:inline max-w-[120px] truncate">{userName}</span>
            <span className="text-[var(--text-faint)] hidden lg:inline">({role})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
