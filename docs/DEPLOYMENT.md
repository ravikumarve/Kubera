# KUBERA — Deployment Guide

> **Status:** Living Document — v1.0  
> **Audience:** Boilerplate buyers deploying their own KUBERA instance  
> **Stack:** Next.js 16 (App Router) + FastAPI + PostgreSQL + Stripe Connect + Redis (Celery)

---

## Table of Contents

1. [Deployment Options Overview](#1-deployment-options-overview)
2. [Local Development Setup](#2-local-development-setup)
3. [Production — Railway (Recommended for Solo Devs)](#3-production--railway-recommended-for-solo-devs)
4. [Production — Fly.io](#4-production--flyio)
5. [Production — VPS (Hetzner CPX31)](#5-production--vps-hetzner-cpx31)
6. [CI/CD Pipeline (GitHub Actions)](#6-cicd-pipeline-github-actions)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Docker Configuration](#8-docker-configuration)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Backup Strategy](#10-backup-strategy)
11. [Production Checklist](#11-production-checklist)

---

## 1. Deployment Options Overview

| Platform | Starting Cost | Complexity | Scalability | Best For |
|---|---|---|---|---|
| **Railway** | ~$15–25/mo | Low | Auto-scaling containers | Solo devs, MVPs |
| **Fly.io** | ~$20–35/mo | Medium | Per-region auto-scaling | Solo devs, growth stage |
| **DigitalOcean App Platform** | ~$25–40/mo | Low | Vertical + horizontal | Small teams |
| **Hetzner VPS (CPX31)** | ~$10–15/mo | High (self-managed) | Manual vertical | Budget-conscious devs |
| **AWS EC2 (t3.medium)** | ~$30–50/mo | Very High | Full control | Enterprises, compliance-heavy |

**KUBERA's recommendation:** Start with **Railway** for zero-ops velocity. Graduate to **Hetzner VPS** when costs matter or you need full control. Use **Fly.io** if your buyer base is global and edge-latency matters.

---

## 2. Local Development Setup

### Prerequisites

| Tool | Version | Check Command |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Python | 3.12+ | `python3 --version` |
| Poetry | 1.8+ | `poetry --version` |
| PostgreSQL | 16+ | `psql --version` |
| Redis | 7+ | `redis-cli --version` |
| Docker & Compose | Latest | `docker compose version` |

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/your-org/kubera.git
cd kubera

# 2. Start infrastructure services (DB + Redis)
docker compose -f docker-compose.dev.yml up -d

# 3. Backend setup
cd backend
poetry install
cp .env.example .env        # edit with your values
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8000

# 4. Frontend setup (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local    # edit with your values
npm run dev                          # → http://localhost:3000

# 5. Verify
curl http://localhost:8000/api/v1/health
# → {"status":"healthy","version":"1.0.0"}
```

### Environment Variables (Local Dev Only)

| Variable | Description | Default | Required |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/kubera` | ✅ |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API secret (test mode) | — | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (test mode) | — | ✅ |
| `NEXTAUTH_SECRET` | NextAuth encryption key | — | ✅ |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` | ✅ |
| `NEXT_PUBLIC_API_URL` | Public API base URL | `http://localhost:8000` | ✅ |
| `SENTRY_DSN` | Sentry error tracking DSN | — | ❌ |

---

## 3. Production — Railway (Recommended for Solo Devs)

Railway provides a zero-ops PaaS with built-in Postgres, Redis, auto-deploys from GitHub, and generous free tier.

### Step-by-Step

#### 3.1 Create Railway Account & Project

1. Sign up at [railway.app](https://railway.app) (GitHub OAuth)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your KUBERA fork
4. Railway auto-detects `Dockerfile.frontend` and `Dockerfile.backend` — set **Root Directory** per service

#### 3.2 Add Infrastructure Services

```bash
# In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
   # Note the connection string

2. Click "New" → "Database" → "Redis"
   # Note the connection string
```

Railway provisions these as plugins. They appear as `POSTGRES_URL` and `REDIS_URL` in the environment automatically.

#### 3.3 Configure Services

Create **two services** in the project:

**Backend Service:**
- Root Directory: `backend/`
- Start Command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/api/v1/health`

**Frontend Service:**
- Root Directory: `frontend/`
- Build Command: `npm run build`
- Start Command: `npm start`
- Health Check Path: (Next.js handles this)

#### 3.4 Environment Variables

Set these in Railway dashboard per service:

| Variable | Backend | Frontend |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `REDIS_URL` | ✅ | — |
| `STRIPE_SECRET_KEY` | ✅ | — |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — |
| `NEXTAUTH_SECRET` | ✅ | ✅ |
| `NEXTAUTH_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_API_URL` | — | ✅ |
| `SENTRY_DSN` | ✅ | ✅ |

#### 3.5 Custom Domain

1. Go to your **Frontend** service → **Settings** → **Domains**
2. Add `escrow.yourdomain.com`
3. Point your DNS CNAME to `cname.railway.app`
4. Railway auto-provisions SSL via Let's Encrypt

#### 3.6 Cost Estimate

| Item | Cost |
|---|---|
| Railway Starter Plan | $5/mo (no egress limits) |
| PostgreSQL plugin | $5–10/mo (512MB–1GB RAM) |
| Redis plugin | $5/mo |
| **Total (shared CPU)** | **~$15–25/mo** |

---

## 4. Production — Fly.io

Fly.io runs containers close to users with per-region auto-scaling. Good for globally distributed escrow dashboards.

### Step-by-Step

#### 4.1 Install flyctl & Launch

```bash
# Install flyctl
curl -fsSL https://fly.io/install.sh | sh

# Login
fly auth login

# Launch backend
cd backend
fly launch --no-deploy
# → Creates fly.toml, Dockerfile, .dockerignore

# Launch frontend
cd ../frontend
fly launch --no-deploy
```

#### 4.2 Configure fly.toml (Backend)

```toml
# backend/fly.toml
app = "kubera-api"
primary_region = "ams"

[build]
  dockerfile = "Dockerfile.backend"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  concurrency = { soft_limit = 50, hard_limit = 100 }

[env]
  DATABASE_URL = ""  # set via fly secrets
  REDIS_URL = ""     # set via fly secrets
  STRIPE_SECRET_KEY = ""
  NEXTAUTH_URL = "https://kubera-api.fly.dev"
```

#### 4.3 Attach PostgreSQL

```bash
# Create managed Postgres
fly pg create --name kubera-db --region ams --initial-cluster-size 1

# Attach to backend app
fly pg attach kubera-db --app kubera-api

# Create and attach Redis (via Upstash)
fly redis create --name kubera-redis --region ams
fly redis attach kubera-redis --app kubera-api
```

#### 4.4 Set Secrets

```bash
# Set secrets (avoids storing in fly.toml)
fly secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  SENTRY_DSN=https://...
```

#### 4.5 Deploy

```bash
# Backend
cd backend && fly deploy

# Frontend (update NEXTAUTH_URL + NEXT_PUBLIC_API_URL first)
cd ../frontend
fly secrets set \
  NEXTAUTH_URL=https://kubera.fly.dev \
  NEXT_PUBLIC_API_URL=https://kubera-api.fly.dev
fly deploy
```

#### 4.6 Cost Estimate

| Item | Cost |
|---|---|
| Shared CPU (1x 256MB) × 2 services | ~$12–15/mo |
| Fly Postgres (1GB RAM, 10GB disk) | ~$15/mo |
| Upstash Redis (256MB) | ~$3/mo |
| **Total** | **~$20–35/mo** |

---

## 5. Production — VPS (Hetzner CPX31)

A VPS gives you full control at the lowest price point. This setup uses Docker Compose for the entire stack (including app services) behind an Nginx reverse proxy with Let's Encrypt TLS.

### 5.1 Initial Server Setup

```bash
# SSH into your Hetzner CPX31 (4 vCPU, 8GB RAM, 80GB NVMe)
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

# Allow non-root user to run Docker
usermod -aG docker $USER

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 5.2 Clone & Configure

```bash
# Clone your fork
git clone https://github.com/your-org/kubera.git /opt/kubera
cd /opt/kubera

# Create production env file
cp .env.production.example .env
nano .env   # fill in all secrets
```

### 5.3 Docker Compose for Production

```yaml
# docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: kubera
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kubera
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kubera"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "alembic upgrade head &&
             uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
    expose:
      - "8000"
    restart: unless-stopped

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    env_file: .env
    depends_on:
      - backend
      - redis
    command: celery -A app.tasks worker --loglevel=info --concurrency=4
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    env_file: .env
    expose:
      - "3000"
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### 5.4 Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/kubera
server {
    listen 80;
    server_name escrow.yourdomain.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name escrow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/escrow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/escrow.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API (FastAPI)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-running escrow operations
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Stripe webhooks need raw body — handled by FastAPI
    location /api/v1/webhooks/stripe {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # DO NOT buffer — Stripe needs raw body for signature verification
        proxy_set_header Content-Type $content_type;
        proxy_request_buffering off;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/api/v1/health;
        proxy_http_version 1.1;
        access_log off;
        return 200 "healthy";
    }
}
```

```bash
# Enable the site and get SSL
ln -s /etc/nginx/sites-available/kubera /etc/nginx/sites-enabled/
certbot --nginx -d escrow.yourdomain.com
nginx -t && systemctl reload nginx
```

### 5.5 Start the Stack

```bash
cd /opt/kubera
docker compose up -d
docker compose logs -f   # watch for startup health
```

### 5.6 Cost Estimate

| Item | Cost |
|---|---|
| Hetzner CPX31 (4 vCPU, 8GB RAM) | ~$9–11/mo |
| Domain + DNS | ~$1–2/mo |
| Backblaze B2 (backup storage) | ~$1/mo |
| **Total** | **~$10–15/mo** |

---

## 6. CI/CD Pipeline (GitHub Actions)

### 6.1 Continuous Integration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/kubera_test
  REDIS_URL: redis://localhost:6379/0
  NEXTAUTH_SECRET: test-secret-not-for-production
  NEXTAUTH_URL: http://localhost:3000
  STRIPE_SECRET_KEY: sk_test_dummy
  STRIPE_WEBHOOK_SECRET: whsec_dummy

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: kubera_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install Poetry
        uses: snok/install-poetry@v1

      - name: Install dependencies
        run: |
          cd backend
          poetry install

      - name: Run linting
        run: |
          cd backend
          poetry run ruff check .
          poetry run ruff format --check .

      - name: Run type checking
        run: |
          cd backend
          poetry run mypy app

      - name: Run migrations
        run: |
          cd backend
          poetry run alembic upgrade head

      - name: Run tests
        run: |
          cd backend
          poetry run pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./backend/coverage.xml

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000
          NEXTAUTH_URL: http://localhost:3000
```

### 6.2 Continuous Deployment (Railway)

Railway supports auto-deploy from GitHub natively — no workflow file needed. For VPS or Docker-based deploys, use:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/kubera
            git pull origin main
            docker compose build --pull
            docker compose up -d --force-recreate
            docker image prune -f
            echo "Deployment successful"
```

### 6.3 Secrets Management

Store these in your GitHub repository: **Settings → Secrets and variables → Actions**

| Secret | Used By | Purpose |
|---|---|---|
| `VPS_HOST` | deploy.yml | Server IP address |
| `VPS_USER` | deploy.yml | SSH username |
| `VPS_SSH_KEY` | deploy.yml | Private SSH key for deploy |
| `DOCKER_USERNAME` | deploy.yml | Docker Hub push (optional) |
| `DOCKER_PASSWORD` | deploy.yml | Docker Hub push (optional) |

---

## 7. Environment Variables Reference

### Backend

| Variable | Description | Required | Default |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | ✅ | — |
| `REDIS_URL` | Redis connection string | ✅ | `redis://localhost:6379/0` |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_*) | ✅ | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_*) | ✅ | — |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_live_*) | ✅ | — |
| `NEXTAUTH_SECRET` | NextAuth.js encryption secret (32+ chars) | ✅ | — |
| `NEXTAUTH_URL` | Deployed frontend URL | ✅ | — |
| `SENTRY_DSN` | Sentry project DSN for error tracking | ❌ | — |
| `SMTP_HOST` | SMTP server hostname | ❌ | — |
| `SMTP_PORT` | SMTP server port | ❌ | `587` |
| `SMTP_USER` | SMTP username | ❌ | — |
| `SMTP_PASS` | SMTP password | ❌ | — |
| `SMTP_FROM` | From address for transactional emails | ❌ | `noreply@kubera.so` |
| `OPEN_EXCHANGE_RATES_KEY` | API key for FX rate data | ❌ | — |
| `CELERY_BROKER_URL` | Celery task broker (use REDIS_URL) | ✅ | — |
| `CELERY_RESULT_BACKEND` | Celery results backend (use REDIS_URL) | ❌ | — |
| `LOG_LEVEL` | Python logging level | ❌ | `INFO` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | ❌ | `http://localhost:3000` |
| `BACKUP_B2_KEY_ID` | Backblaze B2 application key ID | ❌ | — |
| `BACKUP_B2_APP_KEY` | Backblaze B2 application key | ❌ | — |
| `BACKUP_B2_BUCKET` | Backblaze B2 bucket name | ❌ | `kubera-db-backups` |
| `RATE_LIMIT_PER_MINUTE` | Max API requests per minute per IP | ❌ | `60` |
| `ENC_KEY` | Fernet key for sensitive data encryption at rest | ✅ | — |
| `ADMIN_EMAILS` | Comma-separated admin notification emails | ❌ | — |

### Frontend

| Variable | Description | Required | Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public API base URL | ✅ | `http://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_PK` | Stripe publishable key (pk_*) | ✅ | — |
| `NEXTAUTH_URL` | Deployment URL (must match backend) | ✅ | — |
| `NEXTAUTH_SECRET` | Must match backend value | ✅ | — |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend | ❌ | — |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID | ❌ | — |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API key for product analytics | ❌ | — |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance URL | ❌ | — |

---

## 8. Docker Configuration

### 8.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile.backend
# Stage 1: Build
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install "poetry==$POETRY_VERSION"

WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-dev

# Stage 2: Runtime
FROM python:3.12-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -r kubera && useradd -r -g kubera kubera

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

USER kubera
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 8.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile.frontend
# Stage 1: Build
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXTAUTH_SECRET=dummy-build-secret \
    NEXTAUTH_URL=dummy-build-url

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

RUN addgroup -S kubera && adduser -S kubera -G kubera

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/node_modules ./node_modules

USER kubera
EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
```

### 8.3 Docker Compose — Local Dev (Infra Only)

```yaml
# docker-compose.dev.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: kubera
    volumes:
      - pgdata_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata_dev:/data

volumes:
  pgdata_dev:
  redisdata_dev:
```

---

## 9. Monitoring & Logging

### 9.1 Sentry Error Tracking

```python
# backend/app/core/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


def init_sentry(dsn: str | None, environment: str) -> None:
    if not dsn:
        return

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(),
            CeleryIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,       # 10% in production
        profiles_sample_rate=0.1,
        send_default_pii=False,       # GDPR compliance
    )
```

```typescript
// frontend/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 9.2 Health Check Endpoint

```python
# backend/app/api/v1/health.py
from fastapi import APIRouter
from sqlalchemy import text
from app.db.session import async_session_factory

router = APIRouter()


@router.get("/health")
async def health_check():
    db_ok = False
    redis_ok = False

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    try:
        from app.core.redis import redis_client
        await redis_client.ping()
        redis_ok = True
    except Exception:
        pass

    status = "healthy" if (db_ok and redis_ok) else "degraded"
    return {
        "status": status,
        "version": "1.0.0",
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
    }
```

### 9.3 Logging Configuration

```python
# backend/app/core/logging.py
import logging
import structlog


def configure_logging(level: str = "INFO") -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer() if level == "DEBUG"
            else structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    handler = logging.StreamHandler()
    handler.setFormatter(structlog.stdlib.ProcessorFormatter(
        processor=structlog.dev.ConsoleRenderer()
    ))
    root_logger.addHandler(handler)
```

### 9.4 Log Aggregation (Optional — Grafana + Loki)

For VPS deploys, a lightweight Loki + Promtail stack provides centralized log viewing:

```yaml
# docker-compose.monitoring.yml
version: "3.9"

services:
  loki:
    image: grafana/loki:3.0
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:3.0
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/promtail-config.yml:/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:11.0
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml

volumes:
  loki_data:
  grafana_data:
```

---

## 10. Backup Strategy

### Automated PostgreSQL Backups to Backblaze B2

```bash
#!/bin/bash
# scripts/backup-db.sh
# Run daily via cron: 0 3 * * * /opt/kubera/scripts/backup-db.sh

set -euo pipefail

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="/tmp/kubera_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo "[$(date)] Starting PostgreSQL backup..."

# Dump and compress
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h localhost \
    -U kubera \
    -d kubera \
    --no-owner \
    --clean \
    | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup created: $(du -h "$BACKUP_FILE" | cut -f1)"

# Upload to Backblaze B2
curl -X POST \
    -H "Authorization: ${B2_AUTH_TOKEN}" \
    -H "X-Bz-File-Name: db-backups/${BACKUP_FILE##*/}" \
    -H "Content-Type: application/gzip" \
    --data-binary @"$BACKUP_FILE" \
    "https://s3.us-west-001.backblazeb2.com/${B2_BUCKET}/db-backups/${BACKUP_FILE##*/}"

echo "[$(date)] Upload to B2 complete"

# Cleanup local temp
rm -f "$BACKUP_FILE"

# Prune old backups (B2 lifecycle rule can also handle this)
echo "[$(date)] Backup complete"
```

```bash
# Add to crontab
crontab -e
# Add: 0 3 * * * /opt/kubera/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1
```

### Restore Procedure

```bash
# Download latest backup from B2
b2 download-file-by-name kubera-db-backups kubera_db_2025-01-15_03-00-01.sql.gz /tmp/restore.sql.gz

# Restore
gunzip -c /tmp/restore.sql.gz | docker exec -i kubera-postgres-1 psql -U kubera -d kubera

# Verify
docker exec kubera-postgres-1 psql -U kubera -d kubera -c "SELECT count(*) FROM users;"
```

---

## 11. Production Checklist

Use this checklist before inviting your first user.

### Security

- [ ] `NEXTAUTH_SECRET` is a cryptographically random string (run `openssl rand -base64 32`)
- [ ] All Stripe API keys switched from `sk_test_*` to `sk_live_*`
- [ ] Stripe webhook endpoint configured in [Stripe Dashboard](https://dashboard.stripe.com/webhooks) pointing to `https://yourdomain.com/api/v1/webhooks/stripe`
- [ ] Stripe webhook signing secret (`whsec_*`) stored and verified
- [ ] HTTPS enforced globally — Let's Encrypt or platform-managed TLS
- [ ] `CORS_ORIGINS` set to your actual domain (not `*`)
- [ ] Rate limiting enabled (default 60 req/min per IP)
- [ ] `SESSION_COOKIE_SECURE=true` (auto-set in production by Next.js)
- [ ] `ENC_KEY` generated and stored (used for PII encryption at rest)
- [ ] `SECRET_KEY` (FastAPI) regenerated from default

### Infrastructure

- [ ] Database backups tested — run `scripts/backup-db.sh` and verify the B2 bucket has the file
- [ ] Health check endpoint `GET /api/v1/health` returns `{"status":"healthy"}`
- [ ] PostgreSQL connection pool limits configured (default 10–20 connections)
- [ ] Redis maxmemory policy set (`allkeys-lru`) to prevent OOM
- [ ] Docker containers restart on crash (`restart: unless-stopped` in compose)
- [ ] Log rotation configured for Docker containers (local logs won't fill disk)

### Monitoring

- [ ] Sentry DSN configured for both backend and frontend
- [ ] Sentry alerts set up for `Error` level events (email/Slack/PagerDuty)
- [ ] Uptime monitoring configured (e.g., Better Uptime, UptimeRobot, or Railway built-in)
- [ ] Stripe webhook deliveries monitored in Stripe Dashboard

### Compliance

- [ ] Privacy policy and Terms of Service pages deployed
- [ ] Cookie consent banner active (GDPR)
- [ ] `send_default_pii=false` in Sentry config (GDPR)
- [ ] Logs do not capture raw credit card numbers or PII (Stripe handles PCI)
- [ ] Admin emails configured to receive large-transaction notifications

### Performance

- [ ] Next.js ISR revalidation periods tuned per page (default 60s for dashboard, 300s for marketing)
- [ ] API response caching configured for read-heavy endpoints (Redis cache with 30s TTL)
- [ ] Image optimization enabled via `next/image` or external provider (Cloudinary/Imgix)
- [ ] Database indexes verified: `users(email)`, `transactions(escrow_id, status)`, `webhooks(event_type, created_at)`
- [ ] `--workers 4` set for FastAPI (2× CPU cores on 2-core VPS; 4× on 4+ core)

### Go-Live

- [ ] DNS records propagated (TTL set to 300 for launch day)
- [ ] Stripe Connect onboarding flow tested end-to-end with a test account
- [ ] Escrow create → fund → verify → release flow tested with test stripe keys
- [ ] Email templates rendered correctly (SMTP credentials confirmed)
- [ ] `NEXT_PUBLIC_API_URL` points to production API (not localhost)
- [ ] Database migration `alembic upgrade head` has been run against production DB
- [ ] Static pages (marketing, pricing, docs) prerendered with `generateStaticParams`
- [ ] Google Analytics / PostHog tracking events verified

---

## Appendix: Quick Reference Commands

```bash
# Generate a secure random key
openssl rand -base64 32

# Check database connectivity
pg_isready -h localhost -p 5432

# Tail production logs (Docker Compose)
docker compose logs -f --tail=100

# Run DB migration manually
docker compose exec backend alembic upgrade head

# Enter production DB shell
docker compose exec postgres psql -U kubera -d kubera

# Restart all services zero-downtime (Compose)
docker compose up -d --no-deps --build backend frontend

# Check SSL certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

*KUBERA is a boilerplate/SaaS starter kit. You are responsible for hardening, compliance, and infrastructure decisions before accepting real users or payments.*
