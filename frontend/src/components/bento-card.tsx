"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";

interface BentoCardProps {
  tag: string;
  title: string;
  description: string;
  colSpan: "col-8" | "col-4" | "col-6" | "col-12";
  children?: React.ReactNode;
}

const colSpanMap: Record<string, string> = {
  "col-8": "span 8",
  "col-4": "span 4",
  "col-6": "span 6",
  "col-12": "span 12",
};

export function BentoCard({
  tag,
  title,
  description,
  colSpan,
  children,
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isVault = theme === "vault";

  // Vault: track mouse for radial glow effect
  useEffect(() => {
    if (!isVault) return;
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    card.addEventListener("mousemove", onMouseMove);
    return () => card.removeEventListener("mousemove", onMouseMove);
  }, [isVault]);

  return (
    <div
      ref={cardRef}
      className="interactive-card"
      style={{
        gridColumn: colSpanMap[colSpan],
        background: "var(--bg-surface)",
        border: "1px solid var(--border-faint)",
        padding: "3.5rem",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        transition: isVault
          ? "background 0.4s ease"
          : "all 0.3s ease",
        borderRadius: isVault ? "var(--radius-md)" : 0,
      }}
      onMouseEnter={(e) => {
        if (!isVault) {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.background = "var(--bg-panel)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isVault) {
          e.currentTarget.style.borderColor = "var(--border-faint)";
          e.currentTarget.style.background = "var(--bg-surface)";
        }
      }}
    >
      {/* Vault: radial glow overlay */}
      {isVault && (
        <div
          ref={glowRef}
          className="vault-glow"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--accent-dim), transparent 40%)",
            zIndex: 0,
            opacity: 0,
            transition: "opacity 0.4s",
            pointerEvents: "none",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
        />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-faint)",
            marginBottom: "2rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          <span style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
            ■
          </span>
          {tag}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            marginBottom: "1.25rem",
            color: "var(--text-main)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            fontWeight: 400,
          }}
        >
          {description}
        </p>
        {children && (
          <div style={{ marginTop: "1.5rem" }}>{children}</div>
        )}
      </div>
    </div>
  );
}
