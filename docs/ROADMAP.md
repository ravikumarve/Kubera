# KUBERA Boilerplate — Product Roadmap

> **Status:** Pre-development (Phase 0)
> **Current Version:** v0.0.0 (nothing built yet)
> **Target Launch:** 12 weeks from today
> **Repository:** `kuberaboilerplate/kubera` (private until launch)

---

## 1. Vision (12-Month Horizon)

KUBERA Boilerplate becomes the **leading open-core fintech boilerplate for escrow, payment, and B2B trade finance platforms**. Developers and indie founders building payment intermediaries, marketplace escrow systems, or cross-border trade platforms use KUBERA as their starting point instead of building from scratch.

By Month 12:
- **500+ copies sold** across Standard and Pro tiers
- **Active Discord community** of 200+ builders sharing integrations, asking questions, and contributing fixes
- **3–5 known production deployments** built on KUBERA (teams that forked and launched)
- **Ecosystem of plugins** — Plaid, WebSocket real-time tracking, Admin panel, Invoice management — sold as add-ons
- **Recognized brand** in the Next.js + Stripe boilerplate space (alongside things like ShipFast, DivJoy, Nextless, etc.)

This is **not** a hosted platform. KUBERA is **source code you own**. We sell shovels in a gold rush — every marketplace, every freelancer platform, every B2B trade startup needs escrow. We give them the first 80% for $149.

---

## 2. Release Philosophy

**Ship fast, iterate on feedback, add features only when buyers demand them.**

These principles govern every decision:

| Principle | What it means |
|-----------|---------------|
| **MVP is the product** | Do not build features nobody asked for. The first 12 weeks produce a working, sellable boilerplate — nothing more. |
| **Buyer-driven prioritization** | v1.x and v2.0 features come from actual buyer requests on Discord/Gumroad, not speculation. |
| **Docs > Code** | A boilerplate with mediocre code but great docs outsells perfect code with no docs. Documentation is a feature. |
| **Solo-dev realistic** | One human, one Latitude 3460, one cup of coffee at a time. No Kubernetes, no Docker Swarm, no heavy infra. |
| **Pro tier funds free tier** | Pro features (RBAC, WebSocket tracking, Admin panel) are paid upgrades that cross-subsidize the Standard tier. |

---

## 3. Phase 0: Foundation (Weeks 1–2)

**Goal:** Project scaffold compiles, CI passes, directory is navigable.

### Deliverables

- [x] `idea.md` — concept document (done)
- [ ] `AGENTS.md` — project context for AI coding assistants
- [ ] `docs/` skeleton — `ROADMAP.md` (this file), `ARCHITECTURE.md`, `SETUP.md`
- [ ] Next.js 16 App Router scaffold (`npx create-next-app@latest`)
- [ ] FastAPI scaffold with health endpoint (`/api/v1/health`)
- [ ] PostgreSQL schema directory (`db/schema/`) with initial migration
- [ ] Stripe Connect dev account + test keys configured
- [ ] Monorepo structure decided (turborepo? or separate `frontend/` + `backend/`)
- [ ] CI/CD: GitHub Actions — `lint`, `typecheck`, `test` on PR
- [ ] ESLint + Prettier + Ruff config
- [ ] Tailwind CSS + shadcn/ui installed with base theme
- [ ] `docker-compose.yml` for local Postgres (no Docker for app — runs natively)

### Key constraint

No Docker for the app services. PostgreSQL runs in Docker only. Next.js dev server and FastAPI Uvicorn run natively. The Latitude 3460 cannot run Docker Desktop + heavy containers without thermal throttling.

---

## 4. Phase 1: Core MVP (Weeks 3–6)

**Goal:** A buyer can clone the repo, run it, and see a working escrow dashboard with Stripe Connect.

### 4.1 Authentication (Week 3)

- NextAuth v5 with Google OAuth + email/password (credentials provider)
- JWT session strategy (no database sessions — simpler for boilerplate users)
- Protected route middleware (`/dashboard/*`, `/api/*`)
- Role placeholder in database (`user.role: 'buyer' | 'seller' | 'admin'`)
- **Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

### 4.2 Escrow State Machine (Week 3–4)

Core domain model. This is the heart of the boilerplate.

```
States: DRAFT -> FUNDED -> IN_TRANSIT -> DELIVERED -> RELEASED
                         -> DISPUTED -> RESOLVED
                         -> CANCELLED (from DRAFT or FUNDED only)
```

- PostgreSQL table `escrows` with state + version (optimistic locking)
- FastAPI endpoints: `POST /api/v1/escrows`, `PATCH /api/v1/escrows/{id}/transition`
- State transition validation (cannot go from DRAFT to DELIVERED, etc.)
- TypeScript types mirroring the backend enum
- **Files:** `backend/app/models/escrow.py`, `backend/app/services/escrow_machine.py`

### 4.3 Stripe Connect Integration (Week 4–5)

- Stripe Connect Express accounts for buyers/sellers
- `POST /api/v1/connect/account` — creates Stripe Connect account
- `POST /api/v1/connect/onboard` — returns onboarding link
- `POST /api/v1/escrows/{id}/fund` — creates PaymentIntent + transfers to platform
- Webhook handler: `POST /api/v1/webhooks/stripe` — handles `payment_intent.succeeded`, `charge.disputed`
- Idempotency key support
- **No Plaid, no bank account verification in v1**
- **Files:** `backend/app/services/stripe_connect.py`, `backend/app/routes/webhooks.py`

### 4.4 Dashboard CRUD (Week 5–6)

- List escrows page (buyer view / seller view filtered by role)
- Create escrow form (amount, currency, counterparty email, description)
- Escrow detail page with state timeline visualization
- Cancel escrow button (when state allows)
- Responsive — works on mobile
- **Files:** `src/app/dashboard/escrows/page.tsx`, `src/components/escrow/*.tsx`

### 4.5 Multi-currency (Week 6)

- Configurable currency list in `.env`
- Stripe's zero-decimal currency handling baked in
- Exchange rate display (free API — exchangerate-api.com or similar)
- Currency selector in create-escrow form
- **Files:** `backend/app/services/currency.py`, `src/lib/currency.ts`

### Phase 1 Gate

> **Pass condition:** `docker compose up`, `npm run dev`, `uvicorn run`, create an escrow from the UI, fund it with a Stripe test card, see state change to FUNDED. Everything works on a fresh clone with 3 commands.

---

## 5. Phase 2: Ship Readiness (Weeks 7–10)

**Goal:** A buyer is confident enough to put their credit card down. Professional presentation.

### 5.1 Testing (Week 7–8)

- **Backend:** pytest with async fixtures, factory boy for test data
  - Test every escrow state transition
  - Test Stripe webhook idempotency
  - Test auth middleware (unauthenticated = 401)
  - Coverage target: 80%+
- **Frontend:** Playwright for E2E
  - Auth flow (Google OAuth, email/password login, logout)
  - Create escrow → fund → see state change
  - Responsive layout checks
  - Error states (network failure, validation errors)
- **CI:** Tests run on every PR, block merge on failure

### 5.2 Documentation (Week 8–9)

- **`SETUP.md`** — From `git clone` to running in 15 minutes
- **`ARCHITECTURE.md`** — High-level system design, data flow diagrams (Mermaid)
- **`API.md`** — All endpoints with curl examples
- **`ENV.md`** — Every environment variable documented
- **`DEPLOY.md`** — Deploy to Vercel + Railway/Render guide
- Inline docstrings in all Python routes and services
- JSDoc for all exported TypeScript functions

### 5.3 Landing Page (Week 9)

- Single-page marketing site (`src/app/page.tsx`)
- Hero section: "Build your escrow platform in days, not months"
- Feature grid: Auth, Escrow Engine, Stripe Connect, Multi-currency
- Pricing: $149 Standard / $249 Pro (compare table)
- CTA: "Get Early Access" → email waitlist (ConvertKit / Mailchimp)
- SEO meta tags, OG image

### 5.4 Demo Video (Week 9–10)

- Loom screen recording, 3–5 minutes
- Walkthrough: clone → configure → create escrow → fund → release
- Upload to YouTube (unlisted) + embed on landing page

### 5.5 Gumroad + LemonSqueezy Setup (Week 10)

- Gumroad product page: KUBERA Boilerplate — Standard Edition ($149)
- Gumroad product page: KUBERA Boilerplate — Pro Edition ($249)
- License key delivery (or manual delivery via email)
- Refund policy: 14-day, no questions asked
- Affiliate program: 20% commission (Gumroad built-in)

### Phase 2 Gate

> **Pass condition:** Full E2E test suite passes. Landing page is live. Gumroad product page is published. Buyer can purchase, download, and have a working app in under 30 minutes following SETUP.md.

---

## 6. Phase 3: Launch (Weeks 11–12)

**Goal:** 50 pre-orders / first-week sales. Begin building audience.

### 6.1 Product Hunt Launch (Week 11 — Tuesday)

- Schedule for Tuesday launch (best day for PH)
- Prepare: logo, tagline, 5 screenshots, 60s demo GIF
- Pre-seed upvotes: DM 30 dev friends, post in 5 Discord servers
- Maker intro comment: tell the story of why you built it
- Hunters: reach out to 3-5 fintech/product hunters to ask for a feature

### 6.2 Reddit Campaign (Week 11)

- `r/SaaS` — "I built an escrow boilerplate so you don't have to"
- `r/startups` — "How we built a multi-currency escrow engine in 6 weeks"
- `r/nextjs` — "KUBERA: Next.js 16 + FastAPI + Stripe Connect boilerplate"
- `r/fintech` — "Open-source escrow state machine — feedback welcome"
- **No spam.** Each post is a genuine story with lessons learned.

### 6.3 X/Twitter Campaign (Week 11–12)

- Daily posts (8–12/day) during launch week
- Content: code snippets, architecture diagrams, progress screenshots
- DM 20 dev influencers with a free Pro license key
- Thread: "I built a fintech boilerplate in 12 weeks — here's exactly how"

### 6.4 Dev.to Articles (Week 12)

- Article 1: "Building an Escrow State Machine in Python — A Practical Guide"
- Article 2: "Stripe Connect for Boilerplates: What I Learned the Hard Way"
- Article 3: "From Idea to $149 Product: My 12-Week Journey Building KUBERA"
- Cross-post to Medium and HackerNoon

### Launch Gate

> **Pass condition:** 50 sales (all tiers combined). 100 email waitlist subscribers before launch. PH top-10 product of the day.

---

## 7. Post-Launch v1.x (Month 3–4)

**Goal:** Stabilize, respond to feedback, improve docs.

| Week | Focus |
|------|-------|
| L+1 | Bug fix sprint — all GitHub issues triaged |
| L+2 | Documentation improvements based on buyer confusion |
| L+3 | Discord community setup (if not done pre-launch) |
| L+4 | First buyer-requested feature |
| L+5 | Performance audit (Lighthouse, API response times) |
| L+6–8 | v1.1 release: minor improvements, no new major features |

**No paid upgrade during v1.x.** All buyers get v1.x updates free. This builds trust.

---

## 8. v2.0 — Real-time & Organization (Month 4–5)

**Goal:** Add features that justify the Pro tier price. Charge existing Pro buyers nothing (they already paid), but new buyers see v2.0 as the reason to go Pro.

**Price update:** Standard $149 stays. Pro moves to $349 for new buyers (grandfather existing).

### 8.1 WebSocket Real-time Tracking (v2.0 — $249 Pro feature)

- FastAPI WebSocket endpoint (`/ws/v1/escrows/{id}`)
- Zustand store on frontend that subscribes to WS events
- Real-time state machine transitions in the dashboard
- No polling — instant UI updates when Stripe webhook fires or counterparty acts

### 8.2 Organization RBAC (v2.0 — Pro feature)

- `organizations` table with `organization_members` join table
- Roles: Owner, Admin, Member, Viewer
- Escrows belong to organizations (not individual users)
- Invite flow: email invite → accept → join org
- **Standard tier stays single-user.** This is the primary Pro differentiator.

### 8.3 Email Notification System (v2.0 — both tiers)

- Triggered emails on state transitions
- Resend.com integration (free tier: 100 emails/day)
- Templates: escrow funded, escrow released, dispute opened, dispute resolved
- Buyer can configure notification preferences

### 8.4 Plaid Integration (v2.0 — optional add-on, $49)

- Plaid Link frontend component
- Bank account verification for sellers
- Instant payout setup (Stripe Connect + Plaid)
- **Not included in either tier.** Sold as a separate $49 add-on.

### v2.0 Gate

> **Pass condition:** Pro-tier users can create organizations, invite team members, and see real-time escrow updates. Standard-tier users continue with single-user mode. Plaid add-on available for separate purchase.

---

## 9. v3.0 — Admin & API (Month 6–8)

**Goal:** Unlock enterprise sales. Target: $499–$999 Enterprise tier.

### 9.1 Invoice Management Module (v3.0 — Enterprise)

- Invoice generation (PDF via Puppeteer or PDFKit)
- Invoice → Escrow flow (create escrow FROM an invoice)
- Payment reconciliation — mark invoice as paid when escrow releases
- Tax-inclusive amount calculation

### 9.2 Admin Panel (v3.0 — Enterprise)

- User management (list, suspend, delete)
- Escrow overview (all orgs, filter by state)
- Dispute management dashboard
- Stripe payout overview
- **Not a dashboard for end-users.** Internal tool for the platform owner.

### 9.3 API Token System (v3.0 — Enterprise)

- API tokens with scopes: `escrows:read`, `escrows:write`, `webhooks:receive`
- Rate limiting per token
- Usage analytics (requests/day, endpoint breakdown)
- OpenAPI spec auto-generated and served at `/api/v1/docs`

### v3.0 Gate

> **Pass condition:** Enterprise buyer can deploy KUBERA, generate an API token, create an escrow from curl, and see it in the admin panel. Invoice module generates PDFs that match Stripe payouts.

---

## 10. The "No" List

These are explicitly **not** part of KUBERA Boilerplate — now or ever.

| What we won't build | Why |
|---------------------|-----|
| **Live hosting / managed service** | We sell source code, not a platform. No Heroku-for-escrow. |
| **Regulatory compliance consulting** | We are not lawyers. KUBERA comes with no KYC/AML/SEC/FINCEN compliance. Buyers must handle their own regulatory landscape. |
| **Custom development for clients** | Every customization request is a referral to a vetted freelancer. We don't do bespoke work. |
| **Bank integrations beyond Strioke + Plaid** | No SWIFT, no ACH direct, no wire transfer APIs. Stripe Connect handles all payment rails. |
| **Mobile native apps** | Responsive web only. No React Native, no Flutter, no Swift/Kotlin. |
| **AI/ML features** | No LLM-powered dispute resolution, no fraud detection models. Stay in the lane of deterministic state machines. |
| **Multi-region deployment** | Single-region deployment guide (us-east-1 or eu-west-1). No multi-region, no CDN for APIs. |
| **White-label SaaS offering** | You buy the code. You brand it yourself. We don't offer a branded subdomain service. |

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Low sales (< 20 copies)** | Medium | High | Pre-sell on Twitter/Dev.to before building. Build waitlist. Validate demand with landing page before writing code. |
| **Competitor emerges** | Medium | Medium | KUBERA competes on docs quality, escrow domain focus, and Pro tier features. Do not compete on price. |
| **Stripe API breaking changes** | Low | High | Use Stripe SDK version pinning. Monitor Stripe changelog weekly. Abstract Stripe calls behind an internal service layer. |
| **Technical debt slows v2.0** | Medium | Medium | Week 8 testing sprint is non-negotiable. No feature work until Phase 2 gate passes. |
| **Scope creep (building too much)** | High | High | The "No" list is law. Every feature proposal goes through: "Did a buyer ask for this?" If no, reject. |
| **Health issues / burnout** | Low | High | Solo dev constraint: no more than 6 hours of deep work per day. Weekends off. Phase timelines include 20% buffer. |
| **Gumroad/LemonSqueezy policy change** | Low | Medium | Diversify sales channels. Have both ready at launch. Consider Paddle as backup. |
| **Piracy / unauthorized resale** | Medium | Low | Accept it. License keys are for honesty-based enforcement. Most boilerplate buyers are legitimate. Piracy is free marketing. |

---

## 12. Timeline Gantt

```
Month 1         Month 2         Month 3         Month 4         Month 5         Month 6-8
│               │               │               │               │               │
██ Phase 0 ██   │               │               │               │               │
│   Week 1-2    │               │               │               │               │
│   Foundation  │               │               │               │               │
│               ██ Phase 1 ████│               │               │               │
│                 Week 3-6     │               │               │               │
│                 Core MVP     │               │               │               │
│                              ██ Phase 2 █████│               │               │
│                                Week 7-10     │               │               │
│                                Ship Readiness│               │               │
│                                             ██ Phase 3 ████ │               │
│                                               Week 11-12    │               │
│                                               Launch        │               │
│                                                            ██ v1.x ████████│
│                                                              Month 3-4     │
│                                                              Bug fixes +   │
│                                                              feedback      │
│                                                                           ██ v2.0 ██████████████
│                                                                             Month 4-5
│                                                                             Real-time + RBAC
│                                                                                          ██ v3.0 ████████████████████
│                                                                                            Month 6-8
│                                                                                            Admin + API + Invoices
├───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┤
Week 1              Week 6              Week 12             Month 4             Month 5             Month 8
```

### Detailed weekly view (Phase 0–3 only)

| Week | Theme | Key Deliverables |
|------|-------|-----------------|
| 1 | Scaffold | Next.js + FastAPI + Postgres + CI/CD |
| 2 | Foundation | Auth shell, directory structure, AGENTS.md, docs |
| 3 | Auth & Models | NextAuth, Google OAuth, escrow DB schema |
| 4 | State Machine | Escrow engine, state transitions, tests |
| 5 | Stripe Connect | Connect accounts, onboarding, payments |
| 6 | Dashboard + Currency | CRUD UI, multi-currency, gate check |
| 7 | Tests (Backend) | pytest with 80% coverage, async fixtures |
| 8 | Tests (Frontend) | Playwright E2E, CI pipeline |
| 9 | Docs + Landing | All md files, landing page, SEO |
| 10 | Video + Gumroad | Demo video, product pages, gate check |
| 11 | Launch (PH + Reddit) | Product Hunt, Reddit posts, Twitter thread |
| 12 | Launch (Content) | Dev.to articles, final push, gate check |

---

## Appendix: Key Metrics Dashboard

Track these weekly from Week 6 onward:

| Metric | Target (Month 3) | Target (Month 12) |
|--------|-----------------|-------------------|
| Total sales (all tiers) | 100 | 500 |
| Gumroad conversion rate | 3% | 5% |
| Landing page visitors/mo | 5,000 | 20,000 |
| Discord community members | 100 | 500 |
| GitHub stars | 200 | 1,000 |
| Documentation satisfaction | > 4/5 (feedback form) | > 4.5/5 |
| Support tickets/week | < 5 | < 10 |
| Pro tier adoption rate | 30% | 40% |

---

*Last updated: 2026-07-19*
*Product Manager: AI Agent (opencode)*
*For questions or roadmap suggestions, open an issue or ping on Discord (invite link coming at launch).*
