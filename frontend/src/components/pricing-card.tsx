"use client";

interface PricingCardProps {
  tier: "Standard" | "Pro";
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
}

export function PricingCard({
  tier,
  price,
  description,
  features,
  isPopular,
  ctaText = "Get Started",
}: PricingCardProps) {
  return (
    <div
      className="interactive-card"
      style={{
        position: "relative",
        background: "var(--bg-surface)",
        border: `1px solid ${isPopular ? "var(--accent)" : "var(--border-faint)"}`,
        padding: "4rem",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s",
        borderRadius: "var(--radius-md)",
      }}
      onMouseEnter={(e) => {
        if (!isPopular) {
          e.currentTarget.style.borderColor = "var(--text-main)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isPopular) {
          e.currentTarget.style.borderColor = "var(--border-faint)";
        }
      }}
    >
      {isPopular && (
        <div
          style={{
            position: "absolute",
            top: -16,
            left: "2rem",
            background: "var(--accent)",
            color: "#000",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            border: "1px solid var(--accent)",
            padding: "6px 16px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          Most Popular
        </div>
      )}

      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
          color: "var(--text-main)",
        }}
      >
        {tier}
      </h3>
      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--text-muted)",
          marginBottom: "2rem",
        }}
      >
        {description}
      </p>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "3.5rem",
          fontWeight: 700,
          color: "var(--accent)",
          paddingBottom: "2.5rem",
          marginBottom: "2.5rem",
          borderBottom: "1px solid var(--border-faint)",
          lineHeight: 1,
        }}
      >
        ${price}
      </div>

      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginBottom: "3rem",
          flex: 1,
        }}
      >
        {features.map((feature) => (
          <li
            key={feature}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: "0.95rem",
              color: "var(--text-muted)",
            }}
          >
            <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              →
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <button
          className="interactive"
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem 2.5rem",
            fontFamily: "var(--font-display)",
            fontSize: "0.9rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "all 0.2s ease",
            borderRadius: "var(--radius-sm)",
            border: "1px solid",
            cursor: "pointer",
            ...(tier === "Pro"
              ? {
                  background: "var(--accent)",
                  color: "#000",
                  borderColor: "var(--accent)",
                }
              : {
                  background: "var(--bg-void)",
                  color: "var(--text-main)",
                  borderColor: "var(--border-light)",
                }),
          }}
          onMouseEnter={(e) => {
            if (tier === "Pro") {
              e.currentTarget.style.background = "var(--bg-void)";
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.boxShadow = "4px 4px 0 var(--accent)";
              e.currentTarget.style.transform = "translate(-4px, -4px)";
            } else {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (tier === "Pro") {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            } else {
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-main)";
            }
          }}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
