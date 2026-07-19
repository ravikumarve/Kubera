"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import KineticCursor from "@/components/kinetic-cursor";
import KineticCanvas from "@/components/kinetic-canvas";
import VaultCursor from "@/components/vault-cursor";
import VaultCanvas from "@/components/vault-canvas";
import Logo from "@/components/logo";
import FsmMockup from "@/components/fsm-mockup";
import { BentoCard } from "@/components/bento-card";
import { StatusMetrics } from "@/components/status-metrics";
import { StackList } from "@/components/stack-list";
import { PricingCard } from "@/components/pricing-card";
import { useTheme } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";

export default function LandingPage() {
  const { theme } = useTheme();
  const isVault = theme === "vault";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = [
    { href: "#engine", label: "Engine" },
    { href: "#infrastructure", label: "Infra" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <>
      {mounted && (
        <>
          {isVault ? <VaultCursor /> : <KineticCursor />}
          {isVault ? <VaultCanvas /> : <KineticCanvas />}
        </>
      )}

      <div className="ambient-glow" />

      <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 10 }}>
        {/* ===== NAVIGATION ===== */}
        <nav
          className="interactive"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "2rem 0", borderBottom: "1px solid var(--border-faint)",
            position: "relative", zIndex: 100,
          }}
        >
          <a href="#" className="logo" style={{ textDecoration: "none" }}>
            <Logo />
          </a>

          {/* Desktop nav links */}
          <div
            style={{
              display: "flex", gap: "4rem",
            }}
            className="nav-links-desktop"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="interactive"
                style={{
                  color: "var(--text-muted)", textDecoration: "none",
                  fontSize: "0.8rem", fontFamily: "var(--font-mono)",
                  textTransform: "uppercase", letterSpacing: "1px",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ThemeToggle />
            <a
              href="https://github.com/yourusername/kuber"
              className="btn btn-outline interactive"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "1rem 2.5rem", fontFamily: "var(--font-display)", fontSize: "0.9rem",
                fontWeight: 700, textDecoration: "none", textTransform: "uppercase",
                letterSpacing: "1px", transition: "all 0.2s ease", borderRadius: isVault ? "var(--radius-sm)" : 0,
                background: "var(--bg-void)", color: "var(--text-main)",
                border: "1px solid var(--border-light)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.color = "var(--text-main)";
              }}
            >
              Source
            </a>

            {/* Hamburger (mobile) */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: "none", background: "none", border: "none",
                cursor: "pointer", padding: "0.5rem", color: "var(--text-main)",
                fontFamily: "var(--font-mono)", fontSize: "1.5rem",
              }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? "✕" : "≡"}
            </button>
          </div>
        </nav>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "var(--bg-void)", zIndex: 200,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "3rem",
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute", top: "2rem", right: "2rem",
                background: "none", border: "none", color: "var(--text-main)",
                fontFamily: "var(--font-mono)", fontSize: "2rem", cursor: "pointer",
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: "var(--text-muted)", textDecoration: "none",
                  fontSize: "1.5rem", fontFamily: "var(--font-display)",
                  textTransform: "uppercase", letterSpacing: "2px",
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/yourusername/kuber"
              className="btn btn-primary"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "1rem 2.5rem", fontFamily: "var(--font-display)", fontSize: "1rem",
                fontWeight: 700, textDecoration: "none", textTransform: "uppercase",
                letterSpacing: "1px", background: "var(--accent)", color: "var(--bg-void)",
                border: "1px solid var(--accent)", borderRadius: 0,
              }}
            >
              View Source
            </a>
          </div>
        )}

        {/* ===== HERO ===== */}
        <section
          className="hero"
          style={{
            minHeight: "85vh", display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "4rem", alignItems: "center", paddingTop: 0, border: "none",
            position: "relative", zIndex: 10,
          }}
        >
          <div className="hero-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div
              className="hero-badge"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "0.5rem 1.25rem", background: "var(--bg-surface)",
                border: "1px solid var(--border-faint)", color: "var(--text-muted)",
                fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginBottom: "2.5rem",
                textTransform: "uppercase", letterSpacing: "2px",
              }}
            >
              Escrow SaaS Boilerplate v1.0
            </div>

            <h1
              style={{
                fontSize: "clamp(3.5rem, 6vw, 5.5rem)", marginBottom: "1.5rem",
                maxWidth: "700px",
              }}
            >
              Escrow.<br />
              <span style={{ color: "var(--accent)" }}>Engineered.</span>
            </h1>

            <p
              style={{
                fontSize: "1.15rem", color: "var(--text-muted)", maxWidth: "500px",
                lineHeight: 1.7, marginBottom: "3.5rem", fontWeight: 400,
              }}
            >
              KUBERA is a production-ready source-code boilerplate that wires together
              Next.js 16, FastAPI, PostgreSQL, and Stripe Connect into a frictionless
              escrow foundation.
            </p>

            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem" }}>
              <a
                href="#pricing"
                className="btn btn-primary interactive"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "1rem 2.5rem", fontFamily: "var(--font-display)", fontSize: "0.9rem",
                  fontWeight: 700, textDecoration: "none", textTransform: "uppercase",
                  letterSpacing: "1px", transition: "all 0.2s ease", borderRadius: 0,
                  background: "var(--accent)", color: "var(--bg-void)",
                  border: "1px solid var(--accent)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-void)";
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.boxShadow = "4px 4px 0 var(--accent)";
                  e.currentTarget.style.transform = "translate(-4px, -4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.color = "var(--bg-void)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                Buy Source
              </a>
              <a
                href="docs/ARCHITECTURE.md"
                className="btn btn-outline interactive"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "1rem 2.5rem", fontFamily: "var(--font-display)", fontSize: "0.9rem",
                  fontWeight: 700, textDecoration: "none", textTransform: "uppercase",
                  letterSpacing: "1px", transition: "all 0.2s ease", borderRadius: 0,
                  background: "var(--bg-void)", color: "var(--text-main)",
                  border: "1px solid var(--border-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.color = "var(--text-main)";
                }}
              >
                Documentation
              </a>
            </div>
          </div>

          <FsmMockup />
        </section>

        {/* ===== THE ENGINE (BENTO MATRIX) ===== */}
        <section id="engine" style={{ padding: "8rem 0", borderBottom: "1px solid var(--border-faint)" }}>
          <div className="section-header" style={{ marginBottom: "5rem" }}>
            <h2 style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
              The Escrow <br />
              Architecture.
            </h2>
            <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", maxWidth: "650px", lineHeight: 1.7, fontWeight: 400 }}>
              Handling other people&apos;s money requires absolute precision. Kubera enforces strict logic guards across every transition.
            </p>
          </div>

          <div
            className="bento-grid"
            style={{
              display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px",
            }}
          >
            <BentoCard
              tag="CORE // FINITE STATE MACHINE"
              title="9-State Strict Engine"
              description="Contracts move predictably from DRAFT to COMPLETED with explicit branches for DISPUTED and REFUNDED. 15 valid transitions, each guarded by mathematical verification. Invalid transitions are impossible at the code level."
              colSpan="col-8"
            />
            <BentoCard
              tag="COMMERCE // STRIPE CONNECT"
              title="Platform Fee Model"
              description="Kubera never touches funds directly, avoiding heavy money-transmitter regulation. Funds are held via PaymentIntents and released via Stripe Transfers."
              colSpan="col-4"
            />
            <BentoCard
              tag="LOGIC // MULTI-TRANCHE"
              title="Milestone-Based Release"
              description="Configure multi-milestone contracts with percentage-based allocation. Partial funds are securely released to the seller only as specific deliverables are approved."
              colSpan="col-6"
            />
            <BentoCard
              tag="RISK // OVERSIGHT"
              title="Dispute Management"
              description="Raise, investigate, and resolve disputes internally. Pre-built resolution paths for buyer-favor, seller-favor, or custom partial refunds via Admin override."
              colSpan="col-6"
            />
          </div>
        </section>

        {/* ===== SAAS ARCHITECTURE ===== */}
        <section
          id="infrastructure"
          className="stack-section"
          style={{
            padding: "8rem 0", borderBottom: "1px solid var(--border-faint)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
              Institutional <br />
              Infrastructure.
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", lineHeight: 1.8, marginBottom: "2rem", fontWeight: 400 }}>
              Kubera is built on async FastAPI and PostgreSQL with SERIALIZABLE transaction isolation. Immutable audit logs track every financial event.
            </p>

            <StatusMetrics />
          </div>

          <div>
            <StackList />
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section
          id="pricing"
          style={{
            padding: "8rem 0", borderBottom: "1px solid var(--border-faint)",
          }}
        >
          <div className="section-header" style={{ marginBottom: "5rem" }}>
            <h2 style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
              Buy once. <br />
              Deploy anywhere.
            </h2>
            <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", maxWidth: "650px", lineHeight: 1.7, fontWeight: 400 }}>
              Full source code ownership. No recurring fees.
            </p>
          </div>

          <div
            className="pricing-grid"
            style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem",
              marginTop: "4rem", maxWidth: "900px",
            }}
          >
            <PricingCard
              tier="Standard"
              price={149}
              description="The complete source code foundation."
              features={[
                "Full Frontend (Next.js 16 + shadcn)",
                "Full Backend (FastAPI + SQLAlchemy)",
                "Docker Compose Dev Environment",
                "Complete Documentation (14 Docs)",
              ]}
              ctaText="Purchase Standard"
            />
            <PricingCard
              tier="Pro"
              price={249}
              description="For agencies and production deployment."
              isPopular
              features={[
                "Everything in Standard",
                "E2E Test Suite (Playwright + pytest)",
                "Prod Deployment Scripts (Nginx/Backup)",
                "White-label License (Client work allowed)",
              ]}
              ctaText="Purchase Pro"
            />
          </div>
        </section>

        {/* ===== CTA BAND ===== */}
        <section style={{ padding: 0, border: "none" }}>
          <div
            className="cta-band"
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-faint)",
              padding: "8rem 4rem", textAlign: "center", margin: "4rem 0",
            }}
          >
            <h2 style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
              Deploy the Infrastructure.
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.8 }}>
              Stop rebuilding authentication, Stripe Connect routing, and state machines. Buy Kubera and launch your escrow platform this weekend.
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
              <a
                href="https://github.com/yourusername/kuber"
                className="btn btn-primary interactive"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "1rem 2.5rem", fontFamily: "var(--font-display)", fontSize: "0.9rem",
                  fontWeight: 700, textDecoration: "none", textTransform: "uppercase",
                  letterSpacing: "1px", transition: "all 0.2s ease", borderRadius: 0,
                  background: "var(--accent)", color: "var(--bg-void)",
                  border: "1px solid var(--accent)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-void)";
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.boxShadow = "4px 4px 0 var(--accent)";
                  e.currentTarget.style.transform = "translate(-4px, -4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.color = "var(--bg-void)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                View GitHub
              </a>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer
          style={{
            padding: "5rem 0 3rem", display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", borderTop: "1px solid var(--border-faint)",
            position: "relative", zIndex: 10,
          }}
        >
          <div className="f-brand">
            <a href="#" className="logo" style={{ textDecoration: "none" }}>
              <Logo />
            </a>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "1.5rem", maxWidth: "320px", lineHeight: 1.8 }}>
              Institutional escrow engine and trade finance boilerplate. Built with Next.js 16, FastAPI, and Stripe Connect.
            </p>
          </div>

          <div className="f-links" style={{ display: "flex", gap: "5rem" }}>
            <div className="f-col">
              <h5 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-faint)", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "2px" }}>
                Architecture
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <li><a href="docs/ARCHITECTURE.md" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>System Design</a></li>
                <li><a href="docs/DATABASE.md" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>Database Schema</a></li>
                <li><a href="docs/SECURITY.md" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>Threat Model</a></li>
              </ul>
            </div>
            <div className="f-col">
              <h5 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-faint)", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "2px" }}>
                Repository
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <li><a href="https://github.com/yourusername/kuber" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>GitHub Source</a></li>
                <li><a href="docs/API-SPEC.md" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>OpenAPI Spec</a></li>
                <li><a href="docs/DEPLOYMENT.md" className="interactive" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>Deployment Guide</a></li>
              </ul>
            </div>
          </div>
        </footer>

        {/* ===== BOTTOM BAR ===== */}
        <div
          style={{
            marginTop: "6rem", paddingTop: "2rem", borderTop: "1px solid var(--border-faint)",
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: "0.75rem",
            color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px",
          }}
        >
          <div>© 2026 KUBERA ESCROW BOILERPLATE.</div>
          <div>STATUS: <span style={{ color: "var(--accent)" }}>v1 STABLE</span></div>
        </div>
      </div>

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr !important;
            gap: 4rem !important;
          }
          .stack-section {
            grid-template-columns: 1fr !important;
            gap: 4rem !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
          footer {
            flex-direction: column !important;
            gap: 4rem !important;
          }
        }

        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none !important;
          }
          .btn-outline {
            display: none !important;
          }
          .hamburger {
            display: block !important;
          }
          section {
            padding: 4rem 0 !important;
          }
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
          .cta-band {
            padding: 4rem 1.5rem !important;
          }
          .f-links {
            flex-direction: column !important;
            gap: 2rem !important;
          }
          .f-bottom {
            flex-direction: column !important;
            gap: 1rem !important;
            text-align: center !important;
          }
        }
      `}</style>
    </>
  );
}
