"use client";

import { useTheme } from "./theme-provider";

export default function Logo({ className }: { className?: string }) {
  const { theme } = useTheme();
  const isVault = theme === "vault";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Vault: rotated square with void inset + accent border */}
      {/* Kinetic: solid accent block with black inset */}
      <div
        style={
          isVault
            ? {
                width: 24,
                height: 24,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                transform: "rotate(45deg)",
                flexShrink: 0,
              }
            : {
                width: 24,
                height: 24,
                backgroundColor: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }
        }
      >
        {isVault ? (
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              right: 3,
              bottom: 3,
              background: "var(--bg-void)",
              border: "1px solid var(--accent)",
            }}
          />
        ) : (
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#000",
            }}
          />
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-1px",
          color: "var(--text-main)",
          lineHeight: 1,
        }}
      >
        KUBERA
      </span>
    </div>
  );
}
