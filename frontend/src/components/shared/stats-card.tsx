import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down"; percentage: string };
  sparkline?: number[];
}

export function StatsCard({ title, value, subtitle, icon, trend, sparkline }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden border border-[var(--border-faint)] bg-[var(--bg-surface)] transition-all duration-300 hover:border-[var(--accent-dim)] hover:bg-[var(--bg-panel)]">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] opacity-60" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] font-display">
            {title}
          </span>
          <span className="text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors">
            {icon}
          </span>
        </div>

        {/* Value */}
        <p className="text-4xl font-bold text-[var(--text-main)] font-display tracking-tight mb-2">
          {value}
        </p>

        {/* Subtitle / trend */}
        <div className="flex items-center gap-4">
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend.direction === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.direction === "up" ? "text-emerald-400" : "text-red-400"
                )}
              >
                {trend.percentage}
              </span>
            </div>
          )}
          {subtitle && (
            <span className="text-sm text-[var(--text-faint)]">{subtitle}</span>
          )}
        </div>

        {/* CSS-only sparkline bars */}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-5 flex items-end gap-[3px] h-10">
            {sparkline.map((val, i) => {
              const max = Math.max(...sparkline);
              const height = max > 0 ? (val / max) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-none transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(height, 8)}%`,
                    backgroundColor: `var(--accent)`,
                    opacity: 0.3 + (val / max) * 0.5,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
