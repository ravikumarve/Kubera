"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { CommandBar } from "./command-bar";
import { StatusBar } from "./status-bar";
import KineticCanvas from "@/components/kinetic-canvas";
import VaultCanvas from "@/components/vault-canvas";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isVault = theme === "vault";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-void)] font-mono relative">
      {/* WebGL Canvas Background */}
      {mounted && (
        <>
          {isVault ? <VaultCanvas /> : <KineticCanvas />}
        </>
      )}

      {/* Command bar — replaces sidebar + header */}
      <div className="relative z-10">
        <CommandBar />
      </div>

      {/* Main content */}
      <main className="flex-1 relative z-10 px-6 py-6 overflow-auto">
        {children}
      </main>

      {/* Bottom status bar */}
      <div className="relative z-10">
        <StatusBar />
      </div>
    </div>
  );
}
