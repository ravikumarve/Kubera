# PRD: KUBERA — B2B Trade Finance Escrow Boilerplate

**Status**: Draft v1.0
**Author**: Product Manager
**Last Updated**: 2026-07-19
**Stakeholders**: Engineering (solo dev), Marketing (solo dev), Sales (Gumroad/LemonSqueezy)

---

## 1. Executive Summary

KUBERA is a **source-code boilerplate** sold on Gumroad and LemonSqueezy that gives developers a production-ready B2B escrow platform foundation. It is NOT a live fintech service — it is a downloadable codebase that buyers own, deploy, and customize.

Buyers get: Next.js 16 (App Router) frontend, FastAPI backend, PostgreSQL persistence, Stripe Connect payouts, a formal escrow state machine (DRAFT → FUNDED → IN_PROGRESS → COMPLETED / DISPUTED / REFUNDED), multi-currency support, email+Google auth, and a developer dashboard — all wired together with E2E tests and Docker Compose deployment.

**One-liner**: The only developer boilerplate that ships a production-ready escrow state machine with Stripe Connect integration, so you can launch a marketplace or trade finance platform in days instead of months.

**Price**: $149 Standard (source code only) / $249 Pro (source + E2E tests + deployment scripts + priority support).

---

## 2. Problem Statement

### What pain are we solving?

Building a B2B escrow or marketplace platform from scratch requires stitching together 6+ complex systems: authentication, payment processing (Stripe Connect Connect), escrow accounting logic, a state machine for deal lifecycle, multi-currency support, admin dashboards, and deployment infrastructure. Each one of these is a multi-week engineering effort on its own.

The cost of building from scratch: 4–6 months of full-time engineering work ($40K–$80K in opportunity cost for an indie dev / early founder).

### Who experiences this pain?

| Persona | Frequency of Pain | Cost of Not Solving |
|---------|------------------|-------------------|
| Indie hackers building marketplace platforms | Every new project | 4–6 months rebuild |
| Fintech founders validating escrow-as-a-service | At funding/seed stage | Delayed MVP, missed market timing |
| Agencies building custom trade platforms for clients | Per client engagement | 3–4 months per project, eats margin |
| Developers learning / evaluating escrow architecture | Once per learning cycle | Weeks of research + trial and error |

### Evidence

- **Market signal**: ShipFast ($129, generic SaaS boilerplate) has 7,000+ customers — proving strong demand for boilerplates that accelerate development. No specialized escrow boilerplate exists.
- **Competitive gap**: Existing boilerplates (ShipFast, Supastarter, Makerkit, SaasRock) are generic. They include auth, payments, and landing pages but zero escrow logic, zero state machine, zero multi-currency disbursement logic.
- **Direct signal**: Personal experience trying to build an escrow platform; the first 3 months were spent rebuilding foundational infrastructure, not differentiating product logic.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target | Measurement Window |
|------|--------|--------|--------------------|
| Revenue | Total sales (Standard + Pro) | ≥ 100 units | First 3 months post-launch |
| Revenue | Gross revenue | ≥ $15,000 | First 3 months post-launch |
| Quality | Gumroad/LemonSqueezy rating | ≥ 4.5 / 5.0 | Rolling, measured at 90 days |
| Support burden | Support tickets per 10 sales | < 5 tickets | Rolling, measured monthly |
| Adoption | Buyers who deploy successfully (`docker compose up`) | ≥ 80% | Within 7 days of purchase |
| Conversion | Free waitlist → paid conversion | ≥ 15% | During launch window |
| Visibility | Dev.to / Hacker News / Reddit mentions | ≥ 10 organic | First 60 days |

---

## 4. Non-Goals (Explicit Out-of-Scope for v1)

This is as important as what IS in scope. These items are explicitly NOT part of KUBERA v1:

- **Not a live fintech platform** — KUBERA sells source code, not escrow-as-a-service. Buyers must obtain their own Stripe Connect and regulatory licenses.
- **No KYC/AML infrastructure** — Buyers integrate their own KYC provider (Persona, Onfido, etc.) for production use.
- **No mobile apps** — v1 is web-only (responsive Tailwind CSS).
- **No ledger / double-entry accounting** — transaction history is tracked, but no accounting module.
- **No hosted deployment** — Buyers deploy on their own infrastructure (Vercel / Railway / AWS).
- **No Plaid / bank-account verification** — deferred to v2; v1 relies on Stripe Connect for all payout routing.
- **No admin panel** — v1 has a buyer/seller dashboard only. Admin functions deferred to v3.
- **No WebSocket / real-time tracking** — deferred to v2. v1 uses polling for status updates.
- **No mobile-responsive** — actually yes, this IS included. Tailwind CSS handles responsiveness by default.
- **No i18n / localization** — English only in v1.

---

## 5. Target Audience & Buyer Personas

### Primary Persona: The Indie Hacker (75% of expected buyers)

| Attribute | Description |
|-----------|-------------|
| **Name** | "Jamie" |
| **Background** | Full-stack developer, 3–8 years experience, solo founder or 2-person team |
| **Project** | Building a marketplace / freelancer platform / supply chain tool |
| **Budget** | Self-funded, $129–249 is an easy "tool purchase" decision |
| **Pain** | Needs escrow trust for marketplace but can't spend 4 months building it |
| **Channel** | Hacker News, Reddit r/indiehackers, Dev.to, X/Twitter (indie dev community) |
| **Buying trigger** | "I want to launch my marketplace MVP in 2 weeks, not 6 months" |

### Secondary Persona: The Fintech Founder (15%)

| Attribute | Description |
|-----------|-------------|
| **Name** | "Samira" |
| **Background** | Technical founder, seed-stage fintech, 1–3 engineers |
| **Project** | Trade finance / supply chain / B2B payments platform |
| **Budget** | Has seed funding, willing to spend $249 on Pro |
| **Pain** | Needs production-ready escrow logic to get pilot customers |
| **Channel** | X/Twitter fintech community, LinkedIn, B2B SaaS newsletters |
| **Buying trigger** | "We closed our first beta customer — need to ship escrow in 2 weeks" |

### Tertiary Persona: The Agency Builder (10%)

| Attribute | Description |
|-----------|-------------|
| **Name** | "Marcus" |
| **Background** | Agency owner, building custom platforms for B2B clients |
| **Project** | Client engagement — building a trade finance platform for a logistics company |
| **Budget** | Passes through to client; $249 is trivial compared to engineering savings |
| **Pain** | Rebuilding escrow for every client engagement destroys margin |
| **Channel** | Client referrals, GitHub sponsors, Dev.to |
| **Buying trigger** | "I just closed a $30K contract — shipping in 3 weeks vs 12 weeks means $20K more margin" |

---

## 6. User Stories (Buyer-Facing)

These describe what the developer buyer can DO with the purchased code.

### Core Workflow (v1)

| Story | Acceptance Criteria |
|-------|-------------------|
| **As a developer**, I can deploy the full stack with `docker compose up` so I have a running escrow platform in under 5 minutes. | `git clone` → `docker compose up` → login page at localhost:3000 in ≤ 5 min. All services start without errors. |
| **As a developer**, I can register users via email+password or Google OAuth so I don't need to build auth from scratch. | Registration flow works. Login flow works. Password reset flow works. Google OAuth flow works. JWT session persists across page reloads. |
| **As a developer**, I can create an escrow deal from the dashboard so buyers and sellers can initiate transactions. | Form with deal title, amount, currency, buyer/seller email. On submit, creates DRAFT deal. Both parties see the deal in their dashboard. |
| **As a developer**, I can fund an escrow deal via Stripe Connect so the money is held before work begins. | Stripe Payment Element renders. Card payment succeeds. Deal transitions to FUNDED. Stripe Connect account receives funds. |
| **As a developer**, I can mark a deal as IN_PROGRESS after funding so the workflow reflects real-world milestones. | Seller/buyer can transition FUNDED → IN_PROGRESS. Both parties see status change. |
| **As a developer**, I can complete a deal and trigger payout so the seller receives funds. | On COMPLETED transition, Stripe Connect payout executes. Seller receives funds (minus platform fee). Buyer sees confirmation. |
| **As a developer**, I can open a dispute so the platform can mediate when a deal goes wrong. | Buyer or seller can transition to DISPUTED from IN_PROGRESS or COMPLETED. Admin resolution flow is manual in v1. |
| **As a developer**, I can browse my deals dashboard to see all active, completed, and disputed deals. | Dashboard shows deal cards with status, amount, parties, creation date. Filter by status. Pagination. |
| **As a developer**, I can create deals in multiple currencies so my platform supports international trade. | Currency selector on deal creation. Supported: USD, EUR, GBP, INR, AED, SGD, HKD. Conversion display on dashboard. |
| **As a developer**, I can configure Stripe Connect keys via environment variables so the integration works out of the box. | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`. Webhook handler registered automatically. |

### Developer Experience Stories

| Story | Acceptance Criteria |
|-------|-------------------|
| **As a developer**, I can run the test suite with a single command to verify everything works. | `pytest` in backend dir runs 50+ tests. `npm test` runs in frontend. All pass. |
| **As a developer**, I can read the docs to understand the escrow state machine and customize it. | State machine documented in `/docs/STATE_MACHINE.md`. Each transition has a clear explanation. API endpoints documented with OpenAPI. |
| **As a developer**, I can customize the landing page to match my brand. | Landing page components are fully editable. Tailwind CSS theme variables in `tailwind.config.ts`. |
| **As a developer**, I can whitelabel the entire UI by changing a few theme values. | Color scheme, font, logo — all centralized in theme config. No hardcoded brand colors anywhere. |

---

## 7. Feature List

### v1 — Ship (Weeks 1–10)

| Category | Feature | Priority | Notes |
|----------|---------|----------|-------|
| **Auth** | Email + password registration / login | P0 | JWT-based, refresh token rotation |
| **Auth** | Google OAuth | P0 | NextAuth v5 / Auth.js integration |
| **Auth** | Password reset flow | P1 | Email-based reset link |
| **Auth** | Session management | P0 | Secure HTTP-only cookies |
| **Escrow** | State machine: DRAFT → FUNDED → IN_PROGRESS → COMPLETED | P0 | Finite state machine with guards on every transition |
| **Escrow** | State machine: DISPUTED / REFUNDED states | P0 | Buyer/seller can initiate dispute |
| **Escrow** | Deal creation form | P0 | Title, amount, currency, parties |
| **Escrow** | Deal detail page | P0 | Timeline, status, actions available per role |
| **Escrow** | Role-based action guards (only buyer can fund, only seller can mark complete) | P0 | Enforced in API + UI |
| **Payments** | Stripe Connect account creation | P0 | Onboarding for sellers to receive payouts |
| **Payments** | Stripe Payment Element for funding | P0 | Card payments into connected account |
| **Payments** | Stripe Connect payouts on completion | P0 | Platform fee deducted automatically |
| **Payments** | Webhook handler for payment events | P0 | Payment succeeded, payment failed, account updated |
| **Payments** | Multi-currency support | P1 | 7 currencies (USD, EUR, GBP, INR, AED, SGD, HKD) |
| **Dashboard** | Deals list with filters | P0 | Status, date range, role |
| **Dashboard** | Deal detail view | P0 | Full timeline + actions |
| **Dashboard** | Transaction history | P1 | Payments, refunds, payouts |
| **Dashboard** | Account / profile settings | P1 | Name, email, avatar |
| **Multi-currency** | Currency selector on deal creation | P1 | Dropdown with 7 supported currencies |
| **Multi-currency** | Amount display with currency formatting | P1 | Consistent across all views |
| **Landing page** | Hero, features, pricing, CTA | P0 | Tailwind + shadcn/ui components |
| **Landing page** | SEO meta tags | P1 | Open Graph, Twitter Cards |
| **Infrastructure** | Docker Compose (Next.js + FastAPI + PostgreSQL + Redis) | P0 | Single command to start everything |
| **Infrastructure** | `.env.example` with documentation | P0 | All configurable values documented |
| **Infrastructure** | Vercel / Railway deployment guides | P1 | Step-by-step docs |
| **Testing** | Backend: pytest (50+ tests) | P0 | Unit + integration |
| **Testing** | Frontend: Playwright E2E tests (Pro tier only) | P1 | Critical user flows |
| **Docs** | README.md with quick start | P0 | Clone → configure → deploy in 5 min |
| **Docs** | API documentation (OpenAPI) | P0 | Auto-generated from FastAPI |
| **Docs** | State machine documentation | P0 | Visual diagram + transitions |
| **Docs** | Customization guide | P1 | How to brand, add features, deploy |

### v2 — Post-Launch (Months 3–5)

| Category | Feature | Priority | Notes |
|----------|---------|----------|-------|
| **Real-time** | WebSocket deal status tracking | P1 | Socket.IO or native WebSocket |
| **Real-time** | Live notifications (funding received, deal completed) | P1 | In-app toast + browser notification |
| **Auth** | Organization / Team RBAC | P1 | Multi-tenant: admin, member, viewer roles |
| **Auth** | Invite-by-email to organization | P2 | |
| **Email** | Transactional email notifications | P1 | Resend / SendGrid integration |
| **Email** | Email templates for deal lifecycle events | P1 | Deal funded, completed, disputed |
| **Payments** | Plaid integration for ACH / bank transfers | P2 | Alternative to card payments |
| **Payments** | Payout scheduling (manual vs. automatic) | P1 | Configurable per platform |
| **Testing** | E2E tests for all critical flows | P1 | Completing coverage beyond v1 |
| **Docs** | Video walkthrough (Loom) | P2 | |

### v3 — Future (Month 6+)

| Category | Feature | Priority | Notes |
|----------|---------|----------|-------|
| **Escrow** | Invoice management (create, send, track) | P2 | PDF generation, email delivery |
| **Escrow** | Milestone-based escrow (partial releases) | P2 | Release X% on milestone A, rest on completion |
| **Platform** | API for external integrations | P2 | API keys, rate limits, webhooks outbound |
| **Platform** | Admin panel (user management, deal oversight, disputes) | P2 | Full admin CRUD |
| **Platform** | Audit log for all state transitions | P2 | Immutable log for compliance |
| **Payments** | Subscription / recurring billing support | P3 | Stripe subscriptions for platform fees |
| **Payments** | Payout reconciliation report (CSV export) | P3 | |
| **Multi-currency** | 15+ additional currencies | P3 | Based on buyer demand |
| **Integrations** | QuickBooks / Xero integration | P3 | |
| **Integrations** | Slack notification webhook | P3 | |
| **Testing** | Load testing suite | P3 | k6 / Artillery scripts |

---

## 8. Competitive Analysis

### Landscape Overview

| Feature | KUBERA (us) | ShipFast ($129) | Supastarter ($149) | Makerkit ($199) | SaasRock ($149) |
|---------|-------------|-----------------|--------------------|-----------------|-----------------|
| **Auth (email + social)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Stripe payments** | ✅ (Connect, full escrow) | ✅ (basic subscriptions) | ✅ (basic) | ✅ (basic) | ✅ (basic) |
| **Landing page** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** | ✅ (deal-centric) | ✅ (generic) | ✅ (generic) | ✅ (generic) | ✅ (generic) |
| **Escrow state machine** | ✅ (7 states, full FSM) | ❌ | ❌ | ❌ | ❌ |
| **Multi-party deals** | ✅ (buyer + seller + platform) | ❌ | ❌ | ❌ | ❌ |
| **Multi-currency payouts** | ✅ (7 currencies) | ❌ | ❌ | ❌ | ❌ |
| **Stripe Connect onboarding** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Dispute management** | ✅ (DRAFT→DISPUTED→REFUNDED) | ❌ | ❌ | ❌ | ❌ |
| **Role-based action guards** | ✅ (buyer vs seller) | ❌ | ❌ | ❌ | ❌ |
| **E2E tests** | Pro tier | ❌ | ❌ | ❌ | ❌ |
| **Docker Compose** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Multi-tenant / orgs** | v2 | ❌ | ✅ | ✅ | ✅ |
| **Pricing** | **$149 / $249** | $129 | $149 / $299 | $199 / $299 | $149 / $249 |

### Key Differentiator

**KUBERA is the ONLY boilerplate with a production-ready escrow state machine.** Every competitor in the $129–$299 boilerplate space is a generic SaaS starter — blog, subscriptions, user profiles, admin panel. None of them handle the core escrow logic: holding funds in Stripe Connect, transitioning through deal states, multi-party action permissions, dispute handling, or multi-currency payouts.

A developer building a marketplace platform with ShipFast would need to build all escrow logic from scratch — 8–12 weeks of work. With KUBERA, that developer has a working escrow platform on day one and can focus on marketplace-specific features.

### Competitive Positioning

```
                  Generic SaaS Tools     Specialized Escrow
                  ─────────────────      ─────────────────
High maturity    │ ShipFast              │ [GAP IN MARKET]
                 │ Supastarter           │
                 │ Makerkit              │ ← KUBERA FILLS THIS
                 │ SaasRock              │
Low maturity     │ (CRA, Vite templates) │
                 ─────────────────      ─────────────────
```

---

## 9. Monetization

### Pricing Model

| Tier | Price | Includes | Buyer Segment |
|------|-------|----------|---------------|
| **Standard** | $149 | Full source code (v1), 1 year of updates, community Discord access | Indie hackers, budget-constrained founders |
| **Pro** | $249 | Everything in Standard + E2E test suite + deployment scripts + priority email support (48h SLA) | Funded startups, agencies, professionals |

### Why This Pricing

- **Shelf price**: $149 sits at the "impulse purchase" threshold for a developer tool. It's less than a night out and more than a SaaS subscription — a no-brainer for anyone who needs escrow.
- **Anchor comparison**: ShipFast is $129 (no escrow). KUBERA Standard is $20 more but provides an entirely different category of value. The Pro tier anchors against Supastarter's $299 tier.
- **No recurring revenue**: This is a conscious choice. Boilerplates sell as one-time purchases. The model is volume-driven: 100 sales at $149 = $14,900. At 500 sales, we reach $74,500. The scaling mechanism is content marketing, not SaaS upsells.

### Go-to-Market Channels

| Channel | Strategy | Expected Volume |
|---------|----------|----------------|
| **Dev.to** | 5-part series: "Building a Production Escrow Engine in 2026" | 30–50% of sales |
| **Hacker News** | Launch post + "Show HN" with live demo | 15–25% of launch spike |
| **X/Twitter** | #buildinpublic thread during development | 10–15% |
| **Reddit** | r/indiehackers, r/SaaS, r/fintech | 10–15% |
| **Gumroad discovery** | SEO on Gumroad marketplace | 5–10% |
| **YouTube** | "Build an escrow platform in 30 minutes" walkthrough | 5–10% |

### Revenue Projection

| Month | Sales (Standard) | Sales (Pro) | Revenue (Est.) |
|-------|-----------------|-------------|----------------|
| Month 1 (launch) | 25 | 15 | $7,460 |
| Month 2 | 15 | 8 | $4,227 |
| Month 3 | 12 | 6 | $3,282 |
| **Quarter 1 total** | **52** | **29** | **$14,969** |

---

## 10. Solution Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Buyer's Infrastructure                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Next.js 16   │  │ FastAPI      │  │ PostgreSQL         │  │
│  │ (App Router) │──│ (REST API)   │──│ (Deals, Users,     │  │
│  │ Tailwind CSS │  │ State Machine│  │  Transactions)     │  │
│  │ shadcn/ui    │  │ Stripe Sync  │  │                    │  │
│  └─────────────┘  └──────┬───────┘  └────────────────────┘  │
│                          │                                   │
│                   ┌──────┴───────┐                          │
│                   │  Redis       │                          │
│                   │  (Session,   │                          │
│                   │   Jobs)      │                          │
│                   └──────────────┘                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ Stripe Connect API
          ┌────────┴────────┐
          │   Stripe        │
          │   Connect       │
          │   Accounts      │
          │   Payouts       │
          └─────────────────┘
```

### Escrow State Machine

```
                  ┌─────────┐
                  │  DRAFT  │
                  └────┬────┘
                       │ Buyer funds deal
                  ┌────▼────┐
                  │ FUNDED  │
                  └────┬────┘
                       │ Seller starts work
                  ┌────▼────────┐
                  │ IN_PROGRESS │
                  └────┬────────┘
                       │ Seller completes
                  ┌────▼─────────┐
                  │  COMPLETED   │──→ Payout executed
                  └──────┬───────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
      ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
      │DISPUTED │  │REFUNDED │  │COMPLETED│
      └─────────┘  └─────────┘  └─────────┘
```

### Key Design Decisions

1. **Dual-stack (Next.js + FastAPI) over monolith**: Next.js for SSR, SEO, and fast UI. FastAPI for type-safe, async Python API with formal state machine logic. Trade-off: two deployable services instead of one.

2. **Finite state machine in Python over ad-hoc status column**: Enforces valid transitions at the API layer. Prevents bugs where a deal jumps from DRAFT to COMPLETED. Trade-off: slightly more code than a simple status enum, but dramatically fewer edge-case bugs.

3. **Stripe Connect over direct Stripe charges**: Connect is purpose-built for platforms where one party pays another. Direct charges would require manual payout logic and PCI compliance scope. Trade-off: Connect onboarding for sellers adds friction but is mandatory for production escrow.

4. **Docker Compose over platform-specific deployment scripts**: Works identically on local dev, Vercel, Railway, and AWS. Deferred platform-specific scripts to Pro tier. Trade-off: Pro buyers who want one-click deploy get their value in the Pro tier.

---

## 11. Technical Considerations

### Dependencies

| Dependency | Purpose | Risk Level | Notes |
|------------|---------|------------|-------|
| Next.js 16 | Frontend + SSR | Low | Mature ecosystem |
| FastAPI | REST API + state machine | Low | Well-documented, async-native |
| PostgreSQL | Persistent storage | Low | Industry standard |
| Redis | Sessions + job queue | Low | Replaceable with Upstash |
| Stripe Connect | Payments + payouts | Medium | Requires Stripe account, webhook testing |
| Auth.js (NextAuth) | Authentication | Low | v5 stable |
| Docker / Docker Compose | Local dev + deployment | Low | Standard tooling |
| Tailwind CSS + shadcn/ui | UI components | Low | Utility-first, easily themed |

### Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe webhook testing in CI | High | Medium | Use ngrok for local webhook testing; Stripe CLI for test events |
| Multi-currency rounding errors | Low | High | Use Stripe's zero-decimal currency handling; test all 7 currencies with real test amounts |
| Docker Compose startup time | Medium | Low | Optimize Dockerfile layers; document typical startup time in README |
| Buyers with no Stripe Connect experience | Medium | Medium | Provide step-by-step Stripe setup guide with screenshots |
| Platform liability concerns (buyers get sued) | Low | High | Clear license terms: "provided as-is, buyer assumes all legal risk" in EULA |

### Open Questions (Resolve Before v1 Launch)

- [ ] Should the Pro tier include a pre-built Stripe Connect onboarding page or just docs? — Decision: Include the page in both tiers; it's necessary for the escrow flow.
- [ ] What is the minimum Stripe Connect payout threshold for multi-currency? — Need to confirm with Stripe docs.
- [ ] Should we support Stripe Tax calculation in v1? — Decision: Defer to v2. Buyers can configure their own Stripe Tax settings.
- [ ] What test coverage threshold do we enforce? — Decision: 80%+ backend, critical path E2E for Pro.
- [ ] License choice? — Decision: Commercial for code (Standard/Pro white-label), KUBERA brand/trademark reserved.
- [ ] Do we include a pre-seeded demo database for quick evaluation? — Decision: Yes, a `docker compose up` with seed data so buyers see a working platform immediately.

---

## 12. Launch Plan

| Phase | Timeline | Audience | Success Gate |
|-------|----------|----------|--------------|
| Internal alpha | Weeks 8–9 | Solo dev + 2 design partners (fellow devs) | Core escrow flow works end-to-end, 50+ passing tests |
| Public beta (waitlist) | Week 10 | 20–50 waitlist subscribers | All v1 features complete, docs written |
| GA launch | Week 11 | Public (Hacker News + Dev.to + Reddit) | < 5 P0 bugs, demo video published, landing page live |
| Post-launch sprint | Weeks 12–15 | Early buyers | Fix all reported bugs within 48h, publish changelog |

### Launch Checklist

- [ ] Gumroad product page live with screenshots and demo GIF
- [ ] LemonSqueezy product page mirror
- [ ] "Show HN" post drafted and scheduled
- [ ] 5-part Dev.to series — first 3 parts published before launch
- [ ] Twitter/X thread with build journey screenshots
- [ ] 30-minute "Build an escrow platform" video on YouTube
- [ ] Landing page with live demo (screenshare or deployed instance)
- [ ] Purchase flow tested end-to-end (buy Gumroad → receive download → `docker compose up` works)
- [ ] README.md with clear "What do I get?" section
- [ ] EULA / LICENSE file included in download

---

## 13. Appendix

### A. License Strategy

- **Source code**: Commercial license — buyers can modify, sell, or deploy commercially (no boilerplate redistribution).
- **Brand/trademark**: "KUBERA" name and logo remain reserved.
- **No royalties**: One-time purchase, no revenue share.
- **Gumroad/LemonSqueezy standard terms apply**.

### B. Competitive Threats

- **ShipFast adding escrow**: If ShipFast sees KUBERA's success, they could add a basic escrow module. Our moat is depth — a 7-state FSM with Stripe Connect multi-currency is hard to bolt onto a generic boilerplate.
- **Open-source escrow projects**: No mature OSS escrow projects exist today. If one emerges, we compete on polish, docs, and support (the "paid" moat).
- **Buyers building in-house anyway**: Some developers will buy only to use as reference architecture. This is fine — they still paid $149.

### C. Post-Launch Signals to Watch

| Signal | What It Means | Action |
|--------|---------------|--------|
| Repeat purchases (single buyer, multiple licenses) | Agency using for clients | Create agency licensing page |
| High support tickets about Stripe setup | Stripe onboarding friction | Improve Stripe setup guide + add video |
| Low Pro tier adoption | $249 perceived as too high for value | Add differentiation (more tests, deploy scripts) |
| Feature requests cluster around milestone escrow | Real-world supply chain use | Prioritize v3 milestone-based escrow |
| Sales after 60 days plateau | Content marketing drying up | Invest in YouTube + paid ads (Reddit) |
