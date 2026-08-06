<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Stripe_Connect-008CDD?style=for-the-badge&logo=stripe" alt="Stripe Connect" />
</p>

<p align="center">
  <strong>Build your B2B escrow or trade finance platform in weeks, not months.</strong>
</p>

# KUBERA

<p align="center">
  <img src="https://img.shields.io/github/stars/ravikumarve/Kubera?style=social" />
  <img src="https://img.shields.io/github/license/ravikumarve/Kubera" />
  <img src="https://img.shields.io/badge/status-active-brightgreen" />
</p>

KUBERA is a **production-ready source-code boilerplate** that wires together Next.js 16, FastAPI, PostgreSQL, and Stripe Connect into a working escrow SaaS foundation. Buy it once, own it forever, deploy anywhere.

---

## Quick Start

```bash
git clone https://github.com/ravikumarve/Kubera.git
cd Kubera

# Start infrastructure (PostgreSQL + Redis)
docker compose -f infra/docker-compose.dev.yml up -d

# Backend
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &

# Frontend
cd ../frontend && npm install && npm run dev
```

Open **http://localhost:3000** — dashboard is ready.  
API docs at **http://localhost:8000/docs**.

---

## Dashboard

KUBERA ships with a **command-center style dashboard** — full-width, terminal-inspired, with real-time data modules:

| Module | What It Shows |
|--------|---------------|
| **Escrow Pipeline** | Active trades with buyer/seller route, amount, stage indicator |
| **FX Volatility Monitor** | Live currency pairs with rate, change %, auto-hedging status |
| **Liquidity Queue** | Invoice discounting requests with risk profiles and approve actions |
| **Interactive CLI Terminal** | Type commands — `contract create`, `tx list`, `help` — executes and navigates |
| **Live Activity Log** | Real-time escrow events with color-coded levels |
| **Telemetry Gauges** | 6 KPI cards with trend arrows and gradient borders |

Two premium themes: **Kinetic Mint** (brutalist, straight edges) and **Vault Cobalt** (rounded, mouse-reactive node grid), toggleable from the command bar.

---

## Features

### Escrow Engine
- **9-State Finite State Machine** — `DRAFT → PENDING_FUNDING → FUNDED → IN_PROGRESS → COMPLETED` with `DISPUTED`, `REFUNDED`, `CANCELLED`, `EXPIRED` branches
- **15 Guard-Protected Transitions** — invalid transitions are impossible at the code level
- **Milestone-Based Release** — multi-milestone contracts with percentage-based allocation
- **Dispute Management** — raise, investigate, resolve with buyer/seller/full-refund paths
- **Expiration Handling** — automatic cleanup of unfunded contracts

### Stripe Connect Payments
- **Marketplace Architecture** — platform fee model, never touches funds directly
- **Express Onboarding** — embedded KYC, sellers onboard without leaving your app
- **PaymentIntent + Transfers** — funds held via PaymentIntent, released via Stripe Transfers
- **Signed Webhooks** — idempotency keys, retry logic, event dispatching
- **Multi-Currency** — USD, EUR, GBP + 130+ currencies via Stripe

### Authentication
- Email + password with bcrypt (cost factor 12)
- Google OAuth 2.0 one-click sign-in
- JWT access/refresh tokens with rotation
- Role-based access control: `buyer`, `seller`, `admin`
- Rate-limited login, httpOnly cookies, CSRF protection

### API & Backend
- Versioned REST API (`/api/v1/`) with OpenAPI 3.1 docs
- FastAPI + asyncpg + SQLAlchemy 2.0 async — zero blocking I/O
- Pydantic v2 validation with Rust-core performance
- Celery + Redis for background jobs (cleanup, reminders, webhook retry)
- Structured JSON logging with request_id correlation
- Per-route rate limiting, immutable audit trail

### Database
- PostgreSQL 16 with SERIALIZABLE isolation for balance operations
- SQLAlchemy 2.0 async ORM with selectinload
- Alembic reversible migrations with naming conventions
- Optimized indexes for dashboard queries and milestone deadlines
- Soft deletes for financial data

### Infrastructure
- Docker Compose for dev (PostgreSQL + Redis) and prod (full stack)
- CI/CD pipeline — GitHub Actions with Python + Node matrix
- Nginx reverse proxy with SSL, WebSocket, HSTS
- Automated PostgreSQL backups to S3-compatible storage
- Sentry error tracking (backend + frontend)
- Deployment guides for Railway, Fly.io, Hetzner VPS

---

## What You Get

| | Standard ($149) | Pro ($249) |
|---|---|---|
| Full frontend source (Next.js 16 + Tailwind) | ✅ | ✅ |
| Full backend source (FastAPI + Stripe Connect) | ✅ | ✅ |
| Database schema + Alembic migrations | ✅ | ✅ |
| 14 documentation files (430+ pages) | ✅ | ✅ |
| Docker Compose dev environment | ✅ | ✅ |
| CI/CD pipeline (GitHub Actions) | ✅ | ✅ |
| MIT License — full ownership | ✅ | ✅ |
| **E2E test suite** (Playwright + pytest + Vitest) | — | ✅ |
| **Production deployment scripts** | — | ✅ |
| **Nginx config + backup automation** | — | ✅ |
| **Priority email support (48hr)** | — | ✅ |
| **White-label license for client projects** | — | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, TanStack Query, NextAuth v5, Zustand, shadcn/ui |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0 async, Pydantic v2, Celery, Stripe SDK |
| Database | PostgreSQL 16, asyncpg, Alembic, Redis 7 |
| Infra | Docker Compose, Nginx, GitHub Actions, Sentry |

---

## Documentation

All documentation is in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements, market analysis, buyer personas |
| [Architecture](docs/ARCHITECTURE.md) | System design, C4 diagrams, 4 ADRs |
| [Backend](docs/BACKEND.md) | FastAPI structure, escrow engine, services |
| [Frontend](docs/FRONTEND.md) | Next.js pages, components, state management |
| [Database](docs/DATABASE.md) | ERD, DDL, index strategy, migrations |
| [API Spec](docs/API-SPEC.md) | All REST endpoints with schemas |
| [Security](docs/SECURITY.md) | STRIDE threat model, auth, compliance |
| [Deployment](docs/DEPLOYMENT.md) | Railway, Fly.io, VPS, CI/CD, backup |
| [Testing](docs/TESTING.md) | pytest, Vitest, Playwright setup |
| [Roadmap](docs/ROADMAP.md) | Phased timeline, risk register |

---

## License

MIT License — full source code rights granted to the buyer. Use KUBERA for any personal, commercial, or client project. The Pro tier includes white-label rights for agency/client work.

## 🛒 Support the Project

Star the repo, share it, or grab the Pro tier: [Buy on Gumroad](https://ravikumarve.gumroad.com)

---

<p align="center">
  <sub>Built with Next.js 16, FastAPI, PostgreSQL, and Stripe Connect. Deploy anywhere.</sub>
</p>