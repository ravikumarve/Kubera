"use client";

import { useState, useEffect } from "react";

export function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-t border-[var(--border-faint)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-4 text-[10px] text-[var(--text-faint)] font-mono">
          <span className="hidden sm:inline">KUBERA v1.0.0</span>
          <span className="text-[var(--accent)]">●</span>
          <span>All systems nominal</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[var(--text-faint)] font-mono">
          <span className="hidden md:inline">Uptime: 99.97%</span>
          <span>Last sync: {time.toLocaleTimeString("en-US", { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
}
