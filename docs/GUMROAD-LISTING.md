# KUBERA — B2B Escrow & Trade Finance SaaS Boilerplate (Next.js + FastAPI)

**Price:** $149 Standard / $249 Pro  
**Platform:** Gumroad (10% + $0.50 per sale)  
**License:** Commercial (Standard) / White-label (Pro)

---

## Product Description

Building escrow or marketplace payment logic from scratch is weeks of work you'll never get back. State machines, Stripe Connect onboarding, multi-currency handling, webhook reliability — it's all here, production-ready. Every edge case you haven't thought of yet? Already handled. Every Stripe webhook that could fire out of order? Already sequenced. Every currency rounding error that could lose you money? Already fixed.

KUBERA is a complete SaaS starter kit with a fully functional escrow engine, Stripe Connect marketplace payments, multi-currency support, and a beautiful dashboard. Frontend (Next.js 16) + Backend (FastAPI) + Database (PostgreSQL). Auth, dark mode, API docs, deployment config — everything you need to go from `git clone` to production in a weekend, not a quarter. The escrow state machine alone represents 60+ hours of careful design and testing.

Built by a solo developer who understands what you need — clean code, comprehensive docs, zero bloat. No AI-generated abstractions, no unnecessary dependencies, no "enterprise" cruft. Just well-structured TypeScript and Python that you can read, understand, and modify. Every module has a single responsibility, every API endpoint has OpenAPI docs, and every database migration is reversible.

---

## Features

- Production-ready escrow state machine (7 states, transition guards, event sourcing)
- Stripe Connect marketplace payment integration (Express onboarding, platform fees, automatic payouts)
- Multi-currency support with live FX rates (30+ fiat currencies, automatic settlement)
- Beautiful dashboard with contract management (create, fund, approve, release, dispute)
- Milestone-based payment release workflow (partial releases, conditional triggers)
- Dispute management system (hold, arbitrate, partial refund, release)
- Full auth (email + Google OAuth) via NextAuth.js (session management, role-based access)
- Dark mode + responsive design (mobile-first, works on all screen sizes)
- Comprehensive API documentation (OpenAPI/Swagger, Postman collection, webhook examples)
- Commercial License — full product rights to your code (no royalties, no revenue share)

---

## What's Included

| Standard ($149) | Pro ($249) |
|---|---|
| Full source code (Next.js + FastAPI) | Everything in Standard |
| Documentation (setup + architecture) | + E2E test suite (Playwright + pytest) |
| API reference (OpenAPI/Swagger) | + Deployment scripts (Docker + CI/CD) |
| Quick start guide | + Priority email support (48hr SLA) |
| Database migrations | + White-label license |
| Community support (Discord) | + 40% off v2 upgrade |

---

## Tech Stack

`Next.js 16` `FastAPI` `PostgreSQL` `Stripe` `Tailwind CSS` `TypeScript` `Python 3.12` `shadcn/ui` `Redis` `Docker` `NextAuth.js` `Pydantic` `SQLAlchemy` `Playwright`

---

## Requirements

- **Node.js 20+** — for the Next.js frontend
- **Python 3.12+** — for the FastAPI backend
- **PostgreSQL 16+** — primary database
- **Redis 7+** — caching, session store, and job queues
- **Stripe account** (free) — for payment processing and Connect marketplace
- Basic knowledge of Next.js and FastAPI

---

## FAQ

**Q: Do I need a fintech license to use KUBERA?**

A: No. KUBERA is source code — a boilerplate, not a licensed financial service. You own the code and are responsible for your own compliance. We recommend consulting a fintech attorney before launching a live platform.

**Q: Can I resell this to clients?**

A: Standard tier covers a single project (your own). Pro tier includes white-label rights, allowing you to use KUBERA as a foundation for multiple client projects. Redistribution of raw source code is not permitted on either tier.

**Q: What if I find a bug?**

A: Priority email support (48hr response) on Pro tier. Standard tier gets community support via Discord. All reported bugs are tracked publicly and fixed within the v1 lifecycle.

**Q: Do you offer refunds?**

A: Yes — 7-day money-back guarantee if the code doesn't work as documented. No questions asked. After 7 days, no refunds.

**Q: Is this a hosted service?**

A: No. You deploy it yourself. We provide Docker Compose setup, deployment scripts (Pro), and a deployment guide. You own the infrastructure.

**Q: Will there be updates?**

A: Yes. v2 roadmap includes WebSocket real-time tracking, RBAC with team management, Stripe Connect Payouts API migration, and mobile SDK. Pro buyers get 40% off v2.

**Q: What if Stripe doesn't support my country?**

A: Stripe operates in 46+ countries. If your country isn't supported, you can use a Stripe Atlas US entity (we include guidance). Future versions may support additional processors.

**Q: Can I customize the escrow state machine?**

A: Yes. The state machine is implemented as a Python enum with composable transition validators. Adding new states, milestones, or conditional release logic is documented and straightforward.

---

## Images/Assets Needed

| Asset | Description | Spec |
|---|---|---|
| Hero screenshot | Dashboard overview with contracts table, stats cards, and navigation | 1920×1080 PNG |
| Feature 1 | Escrow contract creation wizard (multi-step form) | 1920×1080 PNG |
| Feature 2 | Milestone timeline with status badges (pending → funded → released) | 1920×1080 PNG |
| Feature 3 | Stripe Connect checkout / payment flow | 1920×1080 PNG |
| Feature 4 | Mobile responsive dashboard view | 390×844 PNG |
| Demo GIF | Full escrow flow: create → fund → approve → release | 1920×1080, ~15s loop |
| Logo | KUBERA icon on transparent background | 512×512 PNG |

---

## Gumroad Tags

`SaaS boilerplate`, `Next.js boilerplate`, `FastAPI boilerplate`, `escrow`, `fintech`, `Stripe`, `Python`, `TypeScript`, `startup kit`, `trade finance`, `marketplace`, `Stripe Connect`, `full-stack`, `boilerplate`, `indie hacker`

---

## Pricing Tiers — Recommendation

### Standard — $149

For indie devs who want to customize everything. Full source code, documentation, and API reference. You handle your own testing and deployment. Best for solo founders building a single product.

**Rationale:** $149 is below the pain threshold for a developer tool but above "impulse buy" — it signals quality. Compared to 200+ hours of build time (~$15K at freelance rates), it's a 99% discount. The price makes it an easy yes for anyone who's ever bought a boilerplate before.

### Pro — $249

For founders and agencies who want production-ready quality. Includes E2E test suite, deployment scripts, priority support, and white-label license. Best for teams shipping to clients or raising pre-seed.

**Rationale:** The Pro tier exists primarily to make Standard feel like a smart choice, while also capturing the high-value segment that needs test coverage and deployment automation. The 67% price increase is justified by white-label rights alone — agencies can charge clients $5K–$15K and recoup the cost on the first project.

---

*Built for solo developers who ship. No bloat. No gatekeeping. Just clean code that works.*
