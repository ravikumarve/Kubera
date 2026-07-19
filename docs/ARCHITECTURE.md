# KUBERA — Architecture Guide

> **Status:** Accepted — v1.0  
> **Audience:** Developers extending or customizing the KUBERA boilerplate  
> **Stack:** Next.js 16 (App Router) + FastAPI + PostgreSQL + Stripe Connect + Tailwind CSS + shadcn/ui

---

## 1. System Overview

KUBERA is a **source-code boilerplate** for B2B trade finance escrow — not a live fintech platform. It is sold as a starter kit on Gumroad/LemonSqueezy. Buyers get a complete, production-patterned codebase they can customize for their own escrow marketplace.

The architecture follows a **BFF (Backend For Frontend) + API Gateway** topology with a clear separation of concerns:

```
 ┌─────────────────────────────────────────────────────────┐
 │                    CUSTOMER DOMAIN                       │
 │                                                         │
 │   ┌──────────────┐    ┌──────────────────────────────┐  │
 │   │  Next.js 16   │    │  shadcn/ui Component Tree   │  │
 │   │  App Router   │◄──►│  (Tailwind CSS + Radix)     │  │
 │   │  SSR/SSG/ISR  │    └──────────────────────────────┘  │
 │   └──────┬───────┘                                       │
 │          │  HTTPS (REST + JSON)                          │
 │          ▼                                                │
 │   ┌──────────────────────────────────────────────────┐   │
 │   │           FastAPI (Python 3.12+)                  │   │
 │   │  ┌─────────┐ ┌──────────┐ ┌────────────────┐     │   │
 │   │  │ Auth    │ │ Escrow   │ │ Payment         │     │   │
 │   │  │ Module  │ │ State    │ │ (Stripe Connect)│     │   │
 │   │  │         │ │ Machine  │ │                  │     │   │
 │   │  └─────────┘ └──────────┘ └────────────────┘     │   │
 │   │  ┌─────────┐ ┌──────────┐ ┌────────────────┐     │   │
 │   │  │ Admin   │ │ Webhook  │ │ Background     │     │   │
 │   │  │ Module  │ │ Router   │ │ Worker         │     │   │
 │   │  └─────────┘ └──────────┘ └────────────────┘     │   │
 │   └──────┬───────────────────────────────────────────┘   │
 │          │                                                │
 │          ├────────────► ┌────────────┐                    │
 │          │              │ PostgreSQL │                    │
 │          │              │ (Asyncpg)  │                    │
 │          │              └────────────┘                    │
 │          │                                                │
 │          ├────────────► ┌────────────┐                    │
 │          │              │   Redis    │                    │
 │          │              │ (Optional) │                    │
 │          │              └────────────┘                    │
 │          │                                                │
 │          ▼                                                │
 │   ┌──────────────────────────────────────────────────┐   │
 │   │              External Services                    │   │
 │   │  ┌──────────────┐  ┌──────────────┐              │   │
 │   │  │ Stripe       │  │ Resend/      │              │   │
 │   │  │ Connect      │  │ SendGrid     │              │   │
 │   │  └──────────────┘  └──────────────┘              │   │
 │   └──────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Decisions

### Next.js 16 (App Router) — Frontend

**Why:** Next.js 16 with the App Router provides server components by default, reducing client-side JS payload. This matters for an escrow dashboard where pages like contract listings, transaction history, and invoice PDFs are mostly static content with occasional interactive zones.

**Trade-off:** Server Components push interactive zones (payment modals, escrow actions) into `"use client"` islands. For KUBERA, the interactive surface is small, making this acceptable.

**Rationale over alternatives:** Remix has a smaller shadcn/ui ecosystem. Plain Vite + React lacks SSR for marketing pages.

### FastAPI (Python 3.12+) — Backend

**Why:** FastAPI provides native async I/O, Pydantic v2 validation, and auto-generated OpenAPI. For escrow, a malformed webhook could release funds incorrectly — Pydantic gives compile-time-grade validation at runtime.

**Trade-off:** Python's GIL limits CPU parallelism, but KUBERA has no CPU-bound paths.

**Rationale over alternatives:** Express/Node.js has weaker type safety. Go has a thinner async ORM ecosystem. Django REST Framework is synchronous by default.

### PostgreSQL (with asyncpg)

**Why:** Serializable transactions, CHECK constraints, and JSONB for flexible metadata — all critical for auditable financial data. See ADR-004 for the full rationale.

### Stripe Connect

**Why:** Stripe Connect handles KYC, funds escrow, disbursement, and dispute resolution — the hardest parts of any marketplace. KUBERA wraps these APIs with the escrow state machine. See ADR-003.

### Tailwind CSS + shadcn/ui

**Why:** Tailwind keeps CSS bundle size deterministic by purging unused classes. shadcn/ui provides copy-paste Radix primitives with consistent styling — buyers can customize every component without fighting an abstraction layer.

---

## 3. ADR-001: Monorepo with npm Workspaces

### Status

Accepted

### Context

KUBERA ships as source code to developers. We must decide how to structure the codebase: a monorepo containing both frontend and backend, or separate repositories for each.

**Options considered:**
1. **Monorepo** — single `git` repo, `packages/` and `backend/` directories
2. **Separate repos** — `kubera-web` and `kubera-api` with independent release cycles

### Decision

Use a **monorepo** with npm workspaces for JS/TS packages and a top-level `backend/` directory for Python.

```
kubera/
├── package.json            # workspace root
├── apps/
│   └── web/                # Next.js 16 App Router
│       ├── app/            # App Router pages
│       ├── components/     # shadcn/ui + domain components
│       ├── lib/            # API client, helpers
│       └── ...
├── packages/
│   ├── shared/             # shared TypeScript types (Zod schemas)
│   ├── ui/                 # shared UI primitives
│   └── config/             # shared ESLint, TSConfig
├── backend/
│   ├── app/                # FastAPI application
│   │   ├── api/            # route handlers
│   │   ├── domain/         # business logic, state machine
│   │   ├── adapters/       # Stripe, email, DB adapters
│   │   └── models/         # SQLAlchemy + Pydantic models
│   ├── alembic/            # migrations
│   └── tests/
├── docker-compose.yml
└── README.md
```

**Consequences:** Single `git clone` for buyers, shared TypeScript types, single CI/CD. Larger clone size (mitigated by `.gitignore`), dual toolchains (managed via Docker).

---

## 4. ADR-002: Escrow State Machine Pattern

### Status

Accepted

### Context

An escrow contract transitions through multiple states over its lifecycle. The naive approach is a single `status` VARCHAR column. However, this does not enforce valid transitions — a contract could go from `DRAFT` directly to `COMPLETED` with no business logic preventing it.

**Options considered:**
1. **Enum column** — `status` VARCHAR with application-level checks
2. **State machine** — explicit states, valid transitions, guards, and side effects encoded in a dedicated module
3. **Event sourcing** — store every state change as an immutable event, derive current state via fold

### Decision

Implement a **finite state machine** as a dedicated `EscrowStateMachine` class in the domain layer.

```
                  ┌──────────┐
                  │  DRAFT   │
                  └────┬─────┘
                       │ parties sign
                       ▼
                  ┌──────────┐
                  │  ACTIVE  │
                  └────┬─────┘
                       │ buyer deposits
                       ▼
                  ┌──────────┐
                  │  FUNDED  │
                  └────┬─────┘
                       │ milestone confirmed
                       ▼
               ┌──────────────┐
          ┌────│ IN_PROGRESS  │
          │    └──────┬───────┘
          │           │ all milestones done
          │           ▼
          │    ┌───────────┐
          │    │ COMPLETED │
          │    └───────────┘
          │
          │  ┌──────────┐     ┌───────────┐
          │  │ DISPUTED │◄────│   Any     │
          │  └────┬─────┘     │  Funded   │
          │       │           │   State   │
          │       │ resolve   └───────────┘
          │       ▼
          │  ┌───────────┐
          │  │ REFUNDED  │
          │  └───────────┘
          │
          │  ┌───────────┐
          └─►│ CANCELLED │  (from DRAFT or ACTIVE)
             └───────────┘
```

**State invariants:** `DRAFT` (editable), `ACTIVE` (signed, ready for deposit), `FUNDED` (funds held), `IN_PROGRESS` (milestones active), `COMPLETED` (released), `DISPUTED` (any funded state), `REFUNDED` (buyer favored), `CANCELLED` (pre-funds termination).

**Consequences:** Invalid transitions are impossible at the code level. Side effects attach to transitions, not scattered across handlers. State machine is unit-testable in isolation. Buyers can add states without touching every route. More code (~150 lines vs 1 enum column).

**Why not event sourcing:** Event sourcing suits a production fintech platform processing millions of transactions. KUBERA is a boilerplate — event stores, projection rebuilds, and eventual consistency add complexity that a solo developer does not need.

---

## 5. ADR-003: Stripe Connect for Marketplace Payments

### Status

Accepted

### Context

KUBERA needs to handle three payment primitives: (1) hold funds from buyer, (2) release funds to seller, (3) handle disputes and refunds. The buyer is not KUBERA — the buyer is a user of the marketplace built from KUBERA.

**Options considered:**
1. **Stripe Connect** — dedicated marketplace platform with platform fees, KYC, and escrow-like Destination Charges
2. **Direct Stripe** — single Stripe account, manual payout splitting
3. **Plaid + custom ledger** — Plaid for bank linking, custom accounting for escrow
4. **Custom wallet system** — internal ledger with blockchain-style accounting

### Decision

Use **Stripe Connect** with the Express dashboard for seller onboarding.

**Architecture:**

```
Buyer pays ──► Stripe Connect ──► Platform fee ──► KUBERA operator
                        │
                        ├──► Seller's Connect account (held until release)
                        │
                        └──► Stripe's dispute system
```

KUBERA never touches the funds directly. Money moves from buyer → Stripe → seller, with KUBERA taking a platform fee via `application_fee_amount`. This avoids the regulatory burden of becoming a money transmitter.

**Consequences:** Stripe handles KYC, dispute resolution, and PCI compliance. Supports 135+ currencies. KUBERA never touches funds directly, avoiding money-transmitter regulation. Downsides: Stripe fees (2.9% + $0.30 + platform fee), seller must have a Stripe account, payout timing is Stripe-controlled (T+2 to T+7).

**Why not Plaid/custom:** Building a compliant escrow ledger requires licensing and audits in every jurisdiction. For a source-code boilerplate, this is untenable. Stripe Connect provides the compliance layer; KUBERA provides the state machine and UX.

---

## 6. ADR-004: PostgreSQL over NoSQL

### Status

Accepted

### Context

Escrow and financial transactions have strong consistency requirements: a payment must not be double-released, a balance must not go negative, and a dispute resolution must be atomic with the state transition.

**Options considered:**
1. **PostgreSQL** — relational, ACID transactions, CHECK constraints
2. **MongoDB** — document store, eventual consistency by default
3. **DynamoDB** — key-value, single-table design required for relational queries

### Decision

**PostgreSQL** with `asyncpg` for asynchronous access and SQLAlchemy 2.0 (async) as the ORM.

**Consequences:** ACID transactions guarantee atomic state transitions. SERIALIZABLE isolation prevents phantom reads on balance operations. CHECK constraints enforce invariants at the DB level. JSONB columns handle per-vertical metadata. Schema migrations require Alembic. Sharding is more complex than Mongo — irrelevant for a single-node starter.

**Why MongoDB was rejected:** MongoDB's document model excels at write-heavy, schema-less workloads (analytics, IoT) — the opposite of KUBERA's domain. Escrow accounting demands relational transactions, a 30-year-proven pattern. MongoDB 5.0+ has multi-document ACID transactions, but the tooling maturity lags behind PostgreSQL.

---

## 7. System Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────┐
│                     End User                             │
│            (Buyer or Seller using the escrow platform)   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│               KUBERA System                             │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │   Web App    │   │  API Server  │   │  Background│  │
│  │  (Next.js)   │──►│  (FastAPI)   │──►│  Worker    │  │
│  └──────────────┘   └──────┬───────┘   │ (Celery/  │  │
│                            │           │  ARQ)     │  │
│                            │           └────────────┘  │
└────────────────────────────┼────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   PostgreSQL   │  │ Stripe Connect │  │  Resend/       │
│   (Primary DB) │  │ (Payments)     │  │  SendGrid      │
└────────────────┘  └────────────────┘  │ (Email)        │
                                        └────────────────┘
```

---

## 8. Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────┐
│  Web App (Next.js 16)                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Server Components                                        │   │
│  │  ├── Landing/Marketing pages (SSG)                       │   │
│  │  ├── Dashboard layout (authenticated)                    │   │
│  │  ├── Contract detail page (SSR + streaming)              │   │
│  │  └── Invoice/preview pages (SSR)                         │   │
│  │                                                          │   │
│  │ Client Components                                        │   │
│  │  ├── CreateContractForm  ──► POST /api/contracts         │   │
│  │  ├── EscrowStatusStepper ──► GET /api/contracts/:id      │   │
│  │  ├── DepositModal        ──► Stripe Checkout redirect    │   │
│  │  └── DisputePanel        ──► POST /api/disputes          │   │
│  │                                                          │   │
│  │ Shared utilities                                         │   │
│  │  ├── lib/api-client.ts   (fetch wrapper, typed via Zod)  │   │
│  │  ├── lib/stripe-client.ts (Stripe.js for Checkout)       │   │
│  │  └── lib/auth.ts         (next-auth or clerk integration) │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │ HTTP + JSON
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Server (FastAPI)                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware                                                 │   │
│  │  ├── CORS (configured for web app origin)                 │   │
│  │  ├── Authentication (JWT + session validation)            │   │
│  │  ├── Rate limiting (per-route, per-role)                  │   │
│  │  ├── Request ID + structured logging                      │   │
│  │  └── Error handler (structured error response)            │   │
│  │                                                          │   │
│  │ Route Modules                                             │   │
│  │  ├── /api/auth           ──► AuthModule                   │   │
│  │  ├── /api/contracts      ──► EscrowModule                │   │
│  │  ├── /api/payments       ──► PaymentModule               │   │
│  │  ├── /api/webhooks       ──► WebhookModule               │   │
│  │  ├── /api/admin          ──► AdminModule                 │   │
│  │  └── /api/disputes       ──► DisputeModule               │   │
│  │                                                          │   │
│  │ Domain Layer                                              │   │
│  │  ├── EscrowStateMachine   (state + transitions)           │   │
│  │  ├── ContractService     (orchestrates flow)             │   │
│  │  ├── PaymentService      (Stripe Connect calls)          │   │
│  │  ├── DisputeService      (dispute lifecycle)             │   │
│  │  └── NotificationService (email + in-app alerts)         │   │
│  │                                                          │   │
│  │ Adapters (Ports)                                          │   │
│  │  ├── db/session.py       (asyncpg + SQLAlchemy session)   │   │
│  │  ├── stripe/client.py    (Stripe SDK wrapper)            │   │
│  │  ├── email/sender.py     (Resend/SendGrid)               │   │
│  │  └── cache/redis.py      (optional rate-limit counters)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Background Worker                                              │
│                                                                 │
│  Responsibilities:                                              │
│  ├── Stripe webhook idempotency processing                      │
│  ├── Expired escrow contract cleanup (transition to CANCELLED)  │
│  ├── Email notification sending                                 │
│  ├── Scheduled milestone reminders                              │
│  └── (v2) Report generation                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Component Diagram (C4 Level 3)

### Auth Module

```
┌─────────────────────────────────────────────┐
│ Auth Module                                  │
│                                              │
│  ┌──────────────┐   ┌────────────────────┐  │
│  │  Login        │   │  Session           │  │
│  │  (credentials │──►│  Management        │  │
│  │   OAuth)      │   │  (JWT + HTTP-only) │  │
│  └──────────────┘   └────────┬───────────┘  │
│                              │              │
│  ┌──────────────┐   ┌───────▼────────────┐  │
│  │  Registration │   │  RBAC Guards       │  │
│  │  + Onboarding │──►│  (buyer vs seller) │  │
│  └──────────────┘   └────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Escrow Module

```
┌─────────────────────────────────────────────────────┐
│ Escrow Module                                        │
│                                                      │
│  ┌──────────────┐   ┌──────────────┐                │
│  │  Contract     │   │  Escrow      │                │
│  │  CRUD         │──►│  State       │                │
│  │  (create,     │   │  Machine     │                │
│  │   list, show) │   │              │                │
│  └──────────────┘   └──────┬───────┘                │
│                            │                         │
│  ┌──────────────┐   ┌──────▼───────┐                │
│  │  Milestone    │   │  Side        │                │
│  │  Tracking     │──►│  Effects     │                │
│  │               │   │  (email,     │                │
│  └──────────────┘   │  webhook)    │                │
│                     └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Payment Module

```
┌─────────────────────────────────────────────────────┐
│ Payment Module                                       │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────────┐   │
│  │  Stripe Connect   │   │  Payment Intent       │   │
│  │  Onboarding       │──►│  (hold / release /   │   │
│  │  (Express link)   │   │   refund)            │   │
│  └──────────────────┘   └──────────┬───────────┘   │
│                                    │               │
│  ┌──────────────────┐   ┌──────────▼───────────┐   │
│  │  Transaction      │   │  Webhook Handler     │   │
│  │  Ledger           │◄──┤  (stripe events →   │   │
│  │  (history view)   │   │   state transitions) │   │
│  └──────────────────┘   └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Dashboard Module

```
┌─────────────────────────────────────────────────────┐
│ Dashboard Module                                     │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────────┐   │
│  │  Buyer View       │   │  Seller View          │   │
│  │  ├─ Active escrows│   │  ├─ Active contracts  │   │
│  │  ├─ Funds at risk │   │  ├─ Pending payouts   │   │
│  │  ├─ Create new    │   │  └─ Completed deals   │   │
│  │  └─ Disputes      │   └──────────────────────┘   │
│  └──────────────────┘                               │
│                                                      │
│  ┌──────────────────┐   ┌──────────────────────┐   │
│  │  Admin View       │   │  Activity Feed       │   │
│  │  ├─ All contracts │   │  (recent events,     │   │
│  │  ├─ All disputes  │   │   real-time via      │   │
│  │  └─ System health │   │   polling in v1)     │   │
│  └──────────────────┘   └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 10. Data Flow — Complete Escrow Walkthrough

### 1. Create Contract
Buyer → `POST /api/contracts` → FastAPI validates via Pydantic, inserts `contracts (status=DRAFT)` + milestones → returns contract ID + seller Stripe onboarding link.

### 2. Seller Onboards to Stripe Connect
Seller → `GET /api/payments/onboarding-link` → FastAPI creates Stripe account link → seller completes KYC on Stripe Express → Stripe webhook `account.updated` → `transition(ACTIVE)` → email buyer "Ready to deposit."

### 3. Buyer Deposits Funds
Buyer → `POST /api/payments/create-deposit` → FastAPI creates Stripe PaymentIntent with `transfer_data[destination]` set to seller's Connect account → buyer confirms via Stripe.js → Stripe webhook `payment_intent.succeeded` → `transition(FUNDED)` in a DB transaction with `SERIALIZABLE` isolation → email seller.

### 4. Confirm Milestone
Seller → `POST /api/contracts/:id/milestones/:mid/complete` → marks milestone pending buyer approval → buyer approves → `transition(IN_PROGRESS)` (or `COMPLETED` if last milestone) → Stripe transfer released.

### 5. Release Payment
Automatic on `COMPLETED`. Funds move via Stripe transfer from the held PaymentIntent to the seller's Connect account (T+2 settlement). Both parties receive completion email.

### Flow Summary
```
DRAFT → ACTIVE → FUNDED → IN_PROGRESS → COMPLETED
  |        |                    |
  |        ↓                    ↓
  ↓    CANCELLED            DISPUTED → REFUNDED
CANCELLED
```

---

## 11. Cross-cutting Concerns

### Error Handling

All routes return a consistent JSON envelope: `{ error: { code, message, detail } }`. Error codes are typed in `packages/shared` so the frontend switches on them with typed `try/catch`.

### Logging

Structured JSON via `structlog` (Python) and `pino` (Next.js). Every request carries a `request_id` (FastAPI middleware → `X-Request-Id` header), enabling frontend-to-backend log correlation.

### Rate Limiting

| Route Group     | Limit       | Scope     |
|-----------------|-------------|-----------|
| `/api/auth/*`   | 10 req/min  | IP        |
| `/api/contracts`| 60 req/min  | User ID   |
| `/api/payments` | 20 req/min  | User ID   |
| `/api/webhooks` | 200 req/min | Stripe IP |

Counters are in-memory for v1 (swap to Redis via `REDIS_URL`).

### Monitoring

`/api/health` returns DB connectivity, Stripe reachability, and last webhook timestamp — sufficient for Docker health checks.

### Security

Stripe webhooks validated via signature verification. All queries use parameterized SQL. JWT in HTTP-only cookies. CSRF via Next.js Server Actions. Auth endpoints rate-limited against brute force. Full details in `SECURITY.md`.

---

## 12. Evolution Strategy

KUBERA v1 is deliberately constrained. The architecture is designed to accommodate the following v2 additions without architectural rewrites.

### WebSocket / Real-Time
**v1:** Dashboard polls `GET /api/contracts` every 30s. **v2:** Add `/ws/events` endpoint. The `EventService` already emits typed domain events — replace the email-only publisher with a pub/sub that pushes to WebSocket sessions. No rewrite: swap polling hook with a WebSocket hook, keep same response shapes.

### Role-Based Access Control
**v1:** Two hardcoded roles (`buyer`, `seller`). **v2:** Store roles in a `roles` table, add a `RoleChecker` FastAPI dependency. No rewrite: auth middleware already injects `user` into every route.

### Multi-Tenancy
**v1:** Single-tenant. **v2:** Add `tenant_id` to domain tables, scope queries via `get_current_tenant()` dependency. No rewrite: repository layer accepts a `session` parameter — add an optional `tenant_id` filter.

### Reports & File Uploads
**v1:** No reporting or file handling. **v2:** Background worker processes tables into materialized views + `/api/reports` route. File uploads via S3-compatible storage, pointed at the existing `milestones.documents` JSONB column.

---

## Appendix: Key Directories

| Path | Purpose |
|------|---------|
| `apps/web/app/(marketing)/` | Landing, pricing docs (SSG) |
| `apps/web/app/(dashboard)/` | Authenticated escrow dashboard |
| `apps/web/components/ui/` | shadcn/ui primitives |
| `apps/web/components/escrow/` | EscrowStatusStepper, MilestoneTimeline |
| `apps/web/lib/` | Typed API client, auth, Stripe.js wrappers |
| `packages/shared/` | Shared Zod schemas + TypeScript types |
| `backend/app/domain/` | State machine, services |
| `backend/app/api/` | FastAPI route modules |
| `backend/app/adapters/` | DB, Stripe, Email adapters |
| `backend/alembic/` | Database migrations |
| `backend/tests/unit/`, `backend/tests/integration/` | Test suites |
