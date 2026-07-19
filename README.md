# KUBERA

**Build your B2B escrow or trade finance platform in weeks, not months.**

KUBERA is a production-ready source-code boilerplate that wires together Next.js 16, FastAPI, PostgreSQL, and Stripe Connect into a working escrow SaaS foundation. Buy it once, own it forever, deploy anywhere.

---

## ⚡ Quick Start

```bash
git clone https://github.com/yourusername/kuber.git
cd kuber

# Start infrastructure (PostgreSQL + Redis)
docker compose -f infra/docker-compose.dev.yml up -d

# Backend
cd backend && poetry install && poetry run alembic upgrade head && poetry run uvicorn app.main:app --reload --port 8000 &

# Frontend
cd ../frontend && npm install && npm run dev
```

Open **http://localhost:3000** — dashboard is ready.  
API docs at **http://localhost:8000/docs**.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup.

---

## 🚀 Features

### 🔐 Escrow Engine (Core)
| Feature | Description |
|---------|-------------|
| **9-State Finite State Machine** | `DRAFT → PENDING_FUNDING → FUNDED → IN_PROGRESS → COMPLETED` with `DISPUTED`, `REFUNDED`, `CANCELLED`, `EXPIRED` branches |
| **Guard-Protected Transitions** | 15 valid transitions each with guard functions — invalid transitions are impossible at the code level |
| **Milestone-Based Release** | Multi-milestone contracts with percentage-based allocation; partial releases as milestones are approved |
| **Dispute Management** | Raise, investigate, and resolve disputes — with resolution paths for buyer, seller, or full refund |
| **Expiration Handling** | Automatic cleanup of unfunded contracts beyond expiration window |

### 💳 Stripe Connect Payments
| Feature | Description |
|---------|-------------|
| **Marketplace Architecture** | Platform fee model — KUBERA never touches funds directly, avoiding money-transmitter regulation |
| **Express Onboarding** | Stripe Connect Express accounts with embedded KYC — sellers onboard without leaving your app |
| **PaymentIntent + Transfers** | Funds held via PaymentIntent, released via Stripe Transfers on milestone approval |
| **Webhook Processing** | Signed webhook receiver with idempotency keys, retry logic, and event dispatching |
| **Multi-Currency** | Support for USD, EUR, GBP + 130+ currencies via Stripe. Live FX rate feeds from Open Exchange Rates |

### 🔐 Authentication & Authorization
| Feature | Description |
|---------|-------------|
| **Email + Password Auth** | Secure registration/login with bcrypt hashing (cost factor 12) |
| **Google OAuth 2.0** | One-click sign-in with Google |
| **JWT Token Strategy** | 15-min access tokens + 7-day refresh tokens with rotation |
| **Role-Based Access Control** | `buyer`, `seller`, `admin` roles with permission guards on every endpoint |
| **Session Management** | httpOnly cookies, CSRF protection, rate-limited login attempts |

### 🖥️ Dashboard & UI
| Feature | Description |
|---------|-------------|
| **Marketing Pages** | Landing page, pricing tiers, about — Server Components, zero JS shipped |
| **Dashboard Home** | Stats cards (active contracts, pending funding, total volume), activity feed |
| **Contract Management** | Create, list, filter, view details, cancel — full CRUD |
| **Multi-Step Wizard** | 3-step contract creation (details → milestones → review) with persistent Zustand state |
| **Milestone Timeline** | Visual progress bar showing contract status and milestone completion |
| **Payment Section** | Stripe deposit interface, funding status, transaction history |
| **Dispute Panel** | Raise disputes, upload evidence, track resolution |
| **Admin Panel** | View all contracts, manage disputes, user management |
| **Dark Mode** | System-preference + manual toggle via next-themes |
| **Responsive Design** | Mobile-first layout with collapsible sidebar |
| **Theme System** | Tailwind v4 CSS-first with OKLCH color tokens |

### 🔌 API & Backend
| Feature | Description |
|---------|-------------|
| **RESTful API** | Versioned (`/api/v1/`), consistent error format, pagination |
| **OpenAPI 3.1** | Auto-generated Swagger docs at `/docs` and ReDoc at `/redoc` |
| **Async Throughout** | FastAPI + asyncpg + SQLAlchemy 2.0 async — no blocking I/O |
| **Pydantic v2 Validation** | Double validation (request body + DB layer) with Rust-core performance |
| **Background Jobs** | Celery + Redis for contract cleanup, milestone reminders, webhook retry |
| **Structured Logging** | JSON logs via structlog with request_id correlation |
| **Rate Limiting** | Per-route, per-IP, per-user rate limits (in-memory or Redis-backed) |
| **Audit Logging** | Immutable audit trail for all financial actions (INSERT-only table) |

### 🗄️ Database & Storage
| Feature | Description |
|---------|-------------|
| **PostgreSQL 16** | ACID transactions, SERIALIZABLE isolation for balance operations |
| **SQLAlchemy 2.0** | Async ORM with selectinload, relationship loading, type-safe queries |
| **Alembic Migrations** | Reversible auto-generated migrations with naming conventions |
| **Index Strategy** | Optimized indexes for dashboard queries, milestone deadlines, dispute lookups |
| **Soft Deletes** | `deleted_at` pattern for financial data — never hard-delete transactions |
| **Connection Pooling** | Asyncpg connection pool (20 connections) with PgBouncer support |

### 🐳 Infrastructure & DevOps
| Feature | Description |
|---------|-------------|
| **Docker Compose (Dev)** | PostgreSQL 16 + Redis 7 — one command to start |
| **Docker Compose (Prod)** | Full stack: DB + Redis + API + Frontend + Celery Worker |
| **CI/CD Pipeline** | GitHub Actions: lint → type-check → test → build (Python + Node matrix) |
| **Deployment Guides** | Railway ($15/mo), Fly.io ($20/mo), Hetzner VPS ($10/mo) |
| **Nginx Config** | Reverse proxy with SSL, WebSocket support, HSTS |
| **Backup Script** | Automated PostgreSQL dumps to S3-compatible storage |
| **Sentry Integration** | Error tracking for both backend and frontend |
| **Health Check** | `GET /api/v1/health` — DB connectivity, Stripe reachability, uptime |

---

## 📋 Feature Status Map

| Area | Feature | Status |
|------|---------|--------|
| **Escrow** | 9-state FSM with guard transitions | ✅ v1 |
| **Escrow** | Milestone-based release | ✅ v1 |
| **Escrow** | Dispute lifecycle management | ✅ v1 |
| **Escrow** | Expiration & auto-cleanup | ✅ v1 |
| **Payments** | Stripe Connect Express onboarding | ✅ v1 |
| **Payments** | PaymentIntent creation & funding | ✅ v1 |
| **Payments** | Milestone transfer release | ✅ v1 |
| **Payments** | Webhook signature verification | ✅ v1 |
| **Payments** | Multi-currency + live FX rates | ✅ v1 |
| **Auth** | Email/password registration | ✅ v1 |
| **Auth** | Google OAuth | ✅ v1 |
| **Auth** | JWT access + refresh tokens | ✅ v1 |
| **Auth** | Role-based access (buyer/seller/admin) | ✅ v1 |
| **Dashboard** | Landing page with pricing | ✅ v1 |
| **Dashboard** | Stats overview | ✅ v1 |
| **Dashboard** | Contract CRUD | ✅ v1 |
| **Dashboard** | Multi-step creation wizard | ✅ v1 |
| **Dashboard** | Milestone timeline | ✅ v1 |
| **Dashboard** | Payment section | ✅ v1 |
| **Dashboard** | Dispute panel | ✅ v1 |
| **Dashboard** | Admin panel | ✅ v1 |
| **Dashboard** | Dark mode | ✅ v1 |
| **Dashboard** | Responsive layout | ✅ v1 |
| **Backend** | OpenAPI docs (Swagger + ReDoc) | ✅ v1 |
| **Backend** | Pydantic v2 validation | ✅ v1 |
| **Backend** | Alembic migrations | ✅ v1 |
| **Backend** | Structured logging | ✅ v1 |
| **Backend** | Rate limiting | ✅ v1 |
| **Backend** | Audit logging | ✅ v1 |
| **Backend** | Celery background jobs | ✅ v1 |
| **Testing** | pytest unit tests | 👑 Pro |
| **Testing** | Playwright E2E tests | 👑 Pro |
| **Testing** | Vitest frontend tests | 👑 Pro |
| **Infra** | Docker Compose dev + prod | ✅ v1 |
| **Infra** | CI/CD (GitHub Actions) | ✅ v1 |
| **Infra** | Nginx reverse proxy | ✅ v1 |
| **Infra** | Backup automation | ✅ v1 |
| **Infra** | Deployment guides (Railway/Fly/VPS) | ✅ v1 |
| **Enhancement** | WebSocket real-time tracking | 🚧 v2 |
| **Enhancement** | Organization RBAC / multi-tenant | 🚧 v2 |
| **Enhancement** | Email notification system | 🚧 v2 |
| **Enhancement** | Plaid integration | 🚧 v2 |
| **Enhancement** | Invoice generation | 🚧 v3 |
| **Enhancement** | Public API tokens | 🚧 v3 |

---

## 🧰 Tech Stack

### Frontend
![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss)
![React Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery)
![NextAuth](https://img.shields.io/badge/NextAuth_v5-000000?style=flat&logo=nextauth)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat&logo=shadcnui)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2.0-100000?style=flat&logo=sqlalchemy)
![Stripe](https://img.shields.io/badge/Stripe_Connect-008CDD?style=flat&logo=stripe)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis)
![Celery](https://img.shields.io/badge/Celery-37814A?style=flat&logo=celery)
![Alembic](https://img.shields.io/badge/Alembic-000000?style=flat)

---

## 📦 What You Get

### Standard ($149)
| Item | Included |
|------|----------|
| Full frontend source (Next.js 16 + Tailwind + shadcn/ui) | ✅ |
| Full backend source (FastAPI + SQLAlchemy + Stripe Connect) | ✅ |
| Database schema (PostgreSQL 16 + Alembic migrations) | ✅ |
| Complete documentation (14 docs, 430+ pages equivalent) | ✅ |
| Docker Compose dev environment | ✅ |
| CI/CD pipeline (GitHub Actions) | ✅ |
| MIT License — full ownership | ✅ |

### Pro ($249)
| Item | Included |
|------|----------|
| Everything in Standard | ✅ |
| E2E test suite (Playwright + pytest + Vitest) | ✅ |
| Production deployment scripts | ✅ |
| Nginx reverse proxy configuration | ✅ |
| Database backup automation | ✅ |
| Priority email support (48hr response) | ✅ |
| White-label license (use for client projects) | ✅ |

---

## 📚 Documentation

All documentation lives in the [`docs/`](docs/) directory:

| Document | Lines | Description |
|----------|-------|-------------|
| [PRD](docs/PRD.md) | 448 | Product requirements, market analysis, buyer personas |
| [Architecture](docs/ARCHITECTURE.md) | 555 | System design, C4 diagrams, 4 ADRs with trade-offs |
| [Backend](docs/BACKEND.md) | 1,487 | FastAPI structure, escrow engine, services, code examples |
| [Frontend](docs/FRONTEND.md) | 1,480 | Next.js pages, components, state management, TypeScript code |
| [Database](docs/DATABASE.md) | 781 | ERD, full DDL, index strategy, query patterns, migrations |
| [API Spec](docs/API-SPEC.md) | 1,394 | All REST endpoints with request/response schemas |
| [Security](docs/SECURITY.md) | 816 | STRIDE threat model, auth/RBAC, Stripe security, compliance |
| [Deployment](docs/DEPLOYMENT.md) | 1,143 | Railway, Fly.io, VPS guides, CI/CD, monitoring, backup |
| [Testing](docs/TESTING.md) | 1,271 | pytest, Vitest, Playwright setup, CI integration, coverage |
| [Guidelines](docs/GUIDELINES.md) | 1,014 | Coding standards, git conventions, PR template |
| [Roadmap](docs/ROADMAP.md) | 416 | Phased timeline, risk register, explicit "no" list |
| [Marketing](docs/MARKETING.md) | 531 | Positioning, launch strategy, content plan, pricing rationale |
| [Gumroad Listing](docs/GUMROAD-LISTING.md) | 136 | Product page copy, FAQ, image asset list |

---

## 🔒 License

MIT License — full source code rights granted to the buyer. You can use KUBERA for any personal, commercial, or client project. The Pro tier includes white-label rights for agency/client work.

---

## 🤝 Contributing

This is a commercial boilerplate sold on Gumroad and LemonSqueezy. Bug reports and documentation improvements are welcome. See [docs/GUIDELINES.md](docs/GUIDELINES.md) for detailed contribution guide.

---

*Built with Next.js 16, FastAPI, PostgreSQL, and Stripe Connect. Deploy anywhere.*
