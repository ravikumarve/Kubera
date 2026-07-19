# KUBERA Security Guide

> **Status:** v1.0 — Reference Implementation  
> **Audience:** Developers evaluating or deploying the KUBERA boilerplate  
> **Stack:** Next.js 16 (App Router) + FastAPI + PostgreSQL 16 + Stripe Connect  
> **One-liner:** KUBERA ships production security patterns so you can launch with confidence — but you own the compliance.

---

## Table of Contents

1. [Threat Model (STRIDE)](#1-threat-model-stride)
2. [Authentication Security](#2-authentication-security)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [API Security](#4-api-security)
5. [Stripe Integration Security](#5-stripe-integration-security)
6. [Data Protection](#6-data-protection)
7. [Audit Logging](#7-audit-logging)
8. [Dependency Security](#8-dependency-security)
9. [Environment Security](#9-environment-security)
10. [Secure Headers](#10-secure-headers)
11. [Compliance Note for Buyers](#11-compliance-note-for-buyers)
12. [Production Deployment Security Checklist](#12-production-deployment-security-checklist)

---

## 1. Threat Model (STRIDE)

Every layer of KUBERA is mapped against the STRIDE framework. Mitigations are built into the boilerplate.

| Threat | Layer | Mitigation |
|--------|-------|------------|
| **Spoofing** | Identity | JWT-based auth with OAuth 2.0 (Google), Stripe webhook signature verification (`stripe.Webhook.constructEvent()`) |
| **Tampering** | Data in transit | HTTPS enforced at ingress, signed webhook payloads, database CHECK constraints and foreign keys |
| **Repudiation** | Financial actions | Immutable audit log — INSERT-only table with actor, action, old/new values, IP, and timestamp |
| **Information Disclosure** | Data at rest | TLS 1.3 for transit, PostgreSQL TDE/pgcrypto for PII, no sensitive data in structured logs |
| **Denial of Service** | API surface | Redis-backed rate limiting (5 req/s per user), 1MB request size cap, connection pooling with asyncpg |
| **Elevation of Privilege** | Authorization | RBAC with three roles (`buyer`, `seller`, `admin`), enforced at middleware and database level |

---

## 2. Authentication Security

### 2.1 JWT Token Strategy

KUBERA uses a dual-token JWT scheme with short-lived access tokens and rotating refresh tokens.

| Token | TTL | Storage | Rotation |
|-------|-----|---------|----------|
| Access token | 15 minutes | httpOnly cookie (not localStorage) | N/A |
| Refresh token | 7 days | httpOnly cookie + DB hash | Rotated on every use (old token invalidated) |

```python
# backend/app/services/auth.py
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)
ACCESS_TOKEN_TTL = timedelta(minutes=15)
REFRESH_TOKEN_TTL = timedelta(days=7)

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + ACCESS_TOKEN_TTL,
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + REFRESH_TOKEN_TTL,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_REFRESH_SECRET_KEY, algorithm="HS256")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)
```

### 2.2 Cookie Configuration

Tokens are set as httpOnly, Secure, SameSite=Strict cookies to prevent XSS and CSRF exfiltration:

```python
# backend/app/api/v1/auth.py
from fastapi import Response

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=900,        # 15 minutes
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=604800,     # 7 days
        path="/api/v1/auth",  # only sent to refresh endpoint
    )
```

### 2.3 Rate Limiting — Login Endpoint

```python
# backend/app/middleware/rate_limit.py
import redis.asyncio as redis
from fastapi import Request, HTTPException

r = redis.from_url(settings.REDIS_URL)

async def check_login_rate_limit(email: str) -> None:
    key = f"login_attempts:{email}"
    attempts = await r.incr(key)
    if attempts == 1:
        await r.expire(key, 900)  # 15-minute window
    if attempts > 5:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")
```

### 2.4 OAuth 2.0 with PKCE

Google OAuth uses the authorization code flow with PKCE and `state` parameter validation:

- `state` parameter ties the callback to the original session (anti-CSRF for OAuth)
- PKCE `code_verifier` / `code_challenge` prevents authorization code interception
- Email domain allow-list support for enterprise deployments

### 2.5 Session Invalidation

On password change, all existing refresh tokens for that user are immediately invalidated:

```python
UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :user_id AND revoked_at IS NULL;
```

---

## 3. Authorization (RBAC)

### 3.1 Role Definitions

KUBERA defines three roles as a PostgreSQL ENUM:

```sql
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
```

### 3.2 Permission Matrix

| Action | buyer | seller | admin |
|--------|-------|--------|-------|
| Create contract | ✅ | ❌ | ✅ |
| Fund contract | ✅ | ❌ | ✅ |
| Approve milestone | ✅ | ❌ | ✅ |
| Raise dispute | ✅ | ✅ | ✅ |
| Accept contract | ❌ | ✅ | ✅ |
| Complete milestone | ❌ | ✅ | ✅ |
| Respond to dispute | ✅ | ✅ | ✅ |
| View all contracts | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Resolve dispute | ❌ | ❌ | ✅ |
| Refund contract | ❌ | ❌ | ✅ |

### 3.3 Middleware Enforcement

Every protected endpoint uses a FastAPI dependency that decodes the JWT and checks the role:

```python
# backend/app/api/v1/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

async def require_role(required: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing credentials")
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    if payload.get("role") not in ("admin", required):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return payload["sub"]

# Usage in routes:
# @router.post("/contracts")
# async def create_contract(..., user_id: str = Depends(require_role("buyer"))):
```

### 3.4 Frontend Route Protection

Next.js middleware protects client-side routes. Unauthorized users are redirected to login:

```typescript
// frontend/src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/seller") && token?.role !== "seller" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/buyer") && token?.role !== "buyer" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/buyer/:path*", "/seller/:path*"],
};
```

---

## 4. API Security

### 4.1 Double Validation (Frontend + Backend)

Every input is validated twice:

| Layer | Library | Behavior on failure |
|-------|---------|---------------------|
| Frontend (browser) | Zod | Show inline error before submit |
| Backend (API) | Pydantic v2 | Return 422 with field-level error details |

```python
# backend/app/schemas/escrow.py
from pydantic import BaseModel, Field, PositiveInt

class CreateContractRequest(BaseModel):
    seller_id: str = Field(..., min_length=36, max_length=36, description="UUID of the seller")
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = Field(None, max_length=5000)
    amount: PositiveInt = Field(..., description="Amount in smallest currency unit (e.g., cents)")
    currency: str = Field(..., pattern=r"^[A-Z]{3}$")
```

### 4.2 CORS Configuration

Only explicitly allowed origins may call the API:

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # ["https://app.kubera.com"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)
```

### 4.3 CSRF Protection

API mutations require a CSRF token via double-submit cookie pattern, and cookies use `SameSite=Strict`:

```typescript
// frontend/src/lib/api.ts
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCookie("csrf_token"),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

### 4.4 SQL Injection Prevention

All database queries use SQLAlchemy's parameterized query builder. Raw SQL is strictly forbidden and will fail CI linting:

```python
# Safe — parameterized via SQLAlchemy ORM
stmt = select(Contract).where(Contract.id == contract_id, Contract.buyer_id == user_id)

# Safe — parameterized via SQLAlchemy text()
from sqlalchemy import text
stmt = text("SELECT * FROM escrow_contracts WHERE id = :id AND buyer_id = :buyer_id")
result = await db.execute(stmt, {"id": contract_id, "buyer_id": user_id})
```

### 4.5 Request Size Limit

FastAPI middleware caps request body size at 1 MB:

```python
# backend/app/middleware/error_handler.py
from fastapi import Request, HTTPException

MAX_BODY_SIZE = 1_048_576  # 1 MB

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        raise HTTPException(status_code=413, detail="Request body too large")
    return await call_next(request)
```

---

## 5. Stripe Integration Security

### 5.1 Webhook Signature Verification

Every incoming Stripe webhook is verified cryptographically before any processing:

```python
# backend/app/api/v1/webhooks.py
import stripe
from fastapi import Request, HTTPException

@app.post("/api/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Dispatch to handler
    handler = WEBHOOK_HANDLERS.get(event["type"])
    if handler:
        await handler(event["data"]["object"])

    return {"status": "ok"}
```

### 5.2 Idempotency Keys

All Stripe API mutating calls include an idempotency key:

```python
# backend/app/services/stripe_service.py
import stripe
import uuid

async def create_payment_intent(contract, buyer):
    idempotency_key = f"pi_{contract.id}_{contract.version}"
    return await stripe.PaymentIntent.create_async(
        amount=contract.amount,
        currency=contract.currency.lower(),
        customer=buyer.stripe_customer_id,
        metadata={"contract_id": str(contract.id)},
        idempotency_key=idempotency_key,
    )
```

### 5.3 Secret Key Hygiene

- `STRIPE_SECRET_KEY` exists only as a server-side environment variable
- Never imported or referenced in frontend code
- Stripe publishable key is the only Stripe value exposed to the client
- CI pipeline scans for accidental key commits using `git-secrets`

### 5.4 Webhook Retry with Exponential Backoff

```python
# backend/app/tasks/webhooks.py
from celery import shared_task
import stripe

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_webhook_event(self, event_id: str):
    try:
        event = db.get_webhook_event(event_id)
        handler = WEBHOOK_HANDLERS.get(event.type)
        if handler:
            handler(event.data)
        event.mark_processed()
    except stripe.error.StripeError as exc:
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

### 5.5 Amount Verification

Before confirming any PaymentIntent, the backend verifies the amount matches the contract:

```python
async def confirm_contract_funding(contract, payment_intent_id):
    pi = await stripe.PaymentIntent.retrieve_async(payment_intent_id)
    if pi.amount != contract.amount:
        raise ValueError(
            f"PaymentIntent amount {pi.amount} does not match contract amount {contract.amount}"
        )
    if pi.currency != contract.currency.lower():
        raise ValueError("Currency mismatch")
    # Proceed with state transition
```

---

## 6. Data Protection

### 6.1 Encryption in Transit

| Component | Protocol | Details |
|-----------|----------|---------|
| Client → Next.js | TLS 1.3 | Terminated at reverse proxy (nginx/Caddy) |
| Next.js → FastAPI | TLS 1.3 | Internal or via mesh (Kubernetes) |
| FastAPI → PostgreSQL | TLS 1.3 | `sslmode=require` in connection string |
| HSTS | `max-age=63072000; includeSubDomains; preload` | Enforced at reverse proxy |

### 6.2 Encryption at Rest

- **PostgreSQL storage**: Transparent Data Encryption (TDE) or dm-crypt at the filesystem level
- **PII fields**: Email addresses encrypted with `pgcrypto` using a key stored outside the database

```sql
-- Extension setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted email column
ALTER TABLE users ADD COLUMN email_encrypted BYTEA;
UPDATE users SET email_encrypted = pgp_sym_encrypt(email, current_setting('app.encryption_key'));

-- Read via
SELECT pgp_sym_decrypt(email_encrypted, current_setting('app.encryption_key')) AS email FROM users WHERE id = :id;
```

### 6.3 Data Retention

- Soft deletion marks records with a `deleted_at` timestamp
- A scheduled Celery task hard-deletes soft-deleted records older than 90 days
- Audit logs are retained indefinitely (immutable)

```python
# backend/app/tasks/cleanup.py
@shared_task
def purge_soft_deleted_records():
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    for model in (Contract, Milestone, Dispute):
        stmt = delete(model).where(model.deleted_at < cutoff)
        db.execute(stmt)
```

### 6.4 Log Sanitization

Structured logging never writes PII or secrets:

```python
# backend/app/middleware/logging.py
import re
import structlog

SENSITIVE_FIELDS = {"password", "token", "secret", "authorization", "stripe-signature", "cookie"}

def sanitize_dict(d: dict) -> dict:
    return {
        k: ("[REDACTED]" if k.lower() in SENSITIVE_FIELDS else v)
        for k, v in d.items()
    }

logger = structlog.get_logger()
```

---

## 7. Audit Logging

Every financially significant action is recorded in an append-only audit log.

### 7.1 Audit Log Schema

```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,       -- e.g., 'contract.created', 'milestone.released'
    entity_type VARCHAR(50) NOT NULL,       -- 'contract', 'milestone', 'dispute', 'payment'
    entity_id   UUID NOT NULL,
    old_values  JSONB,                       -- snapshot before change
    new_values  JSONB,                       -- snapshot after change
    ip_address  INET NOT NULL,
    user_agent  TEXT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce immutability
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```

### 7.2 What Gets Logged

| Action | Actor | Data Captured |
|--------|-------|---------------|
| Contract created | buyer | title, amount, currency, seller_id, state=DRAFT |
| Contract funded | buyer | state=FUNDED, stripe_pi_id, amount |
| Milestone released | buyer | milestone index, percentage, released_at |
| Dispute raised | buyer/seller | reason, status=OPEN |
| Dispute resolved | admin | resolution, status=RESOLVED |
| Contract refunded | admin | state=REFUNDED, refund_amount |

### 7.3 Audit Logging Implementation

```python
# backend/app/services/audit.py
from datetime import datetime, timezone
from sqlalchemy import text

async def log_action(db, user_id: str, action: str, entity_type: str,
                     entity_id: str, old_values: dict | None = None,
                     new_values: dict | None = None, ip_address: str = None):
    stmt = text("""
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, timestamp)
        VALUES (:user_id, :action, :entity_type, :entity_id, :old_values::jsonb, :new_values::jsonb, :ip_address::inet, :timestamp)
    """)
    await db.execute(stmt, {
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_values": json.dumps(old_values) if old_values else None,
        "new_values": json.dumps(new_values) if new_values else None,
        "ip_address": ip_address or "0.0.0.0",
        "timestamp": datetime.now(timezone.utc),
    })
```

---

## 8. Dependency Security

### 8.1 Automated Scanning

| Tool | Frequency | Scope |
|------|-----------|-------|
| Dependabot (npm) | Weekly | `frontend/package.json` |
| Dependabot (pip) | Weekly | `backend/requirements/*.txt`, `pyproject.toml` |
| SCA (CI) | On push | `pip-audit` + `npm audit` in CI pipeline |

### 8.2 Lock Files

Both lock files are committed to the repository:

- `frontend/package-lock.json`
- `backend/poetry.lock`

This guarantees reproducible installs and prevents supply-chain substitution attacks.

### 8.3 Dependency Manifesto

- No dependency is added without a clear functional need
- Prefer standard library over third-party packages
- All new dependencies require a security review before PR merge
- Known-vulnerable packages fail CI builds

### 8.4 Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## 9. Environment Security

### 9.1 Template Configuration

```bash
# .env.example (committed to repo — fill in your own values)
# NEVER commit the actual .env file
JWT_SECRET_KEY=<your-256-bit-secret>
JWT_REFRESH_SECRET_KEY=<your-256-bit-secret>
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/kubera
REDIS_URL=redis://localhost:6379/0
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
ENCRYPTION_KEY=<base64-32-byte-key>
ALLOWED_ORIGINS=["https://app.kubera.com"]
```

### 9.2 Rules

- `.env` is in `.gitignore` — a pre-commit hook rejects any attempt to commit it
- All secrets are loaded at runtime from environment variables (via Pydantic `Settings`)
- No hardcoded secrets, API keys, or tokens anywhere in source code
- Production secrets are injected via the deployment platform (Docker secrets, Kubernetes Secrets, or Vault)

### 9.3 Production Startup Checklist

Before going live, rotate every default value:

```
[ ] JWT_SECRET_KEY — generate with: openssl rand -hex 32
[ ] JWT_REFRESH_SECRET_KEY — generate with: openssl rand -hex 32
[ ] ENCRYPTION_KEY — generate with: openssl rand -base64 32
[ ] Stripe webhook secret — from Stripe Dashboard
[ ] Stripe secret key — from Stripe Dashboard (live mode)
[ ] Database password — strong random password
[ ] Redis password — strong random password
```

---

## 10. Secure Headers

KUBERA ships with a recommended Next.js `next.config.ts` that sets security headers. Deployments should also set these at the reverse proxy level.

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "frame-src https://js.stripe.com",
              "img-src 'self' data: https://*.stripe.com",
              "connect-src 'self' https://api.stripe.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Recommended Reverse Proxy Headers (nginx)

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Content-Security-Policy "...";
```

---

## 11. Compliance Note for Buyers

KUBERA is a **source-code boilerplate** — it ships security *patterns* and *implementations*, not compliance attestations. This table clarifies what you get vs what you must own.

| Area | KUBERA Provides | Buyer Must Implement |
|------|-----------------|----------------------|
| **Authentication** | JWT + OAuth 2.0 + bcrypt + rate limiting | User terms of service, privacy policy |
| **Authorization** | RBAC with 3 roles, middleware, route guards | Custom roles or permissions for your domain |
| **Audit Logging** | INSERT-only audit log for financial actions | Data retention policy, log review procedures |
| **Encryption** | TLS 1.3 config, pgcrypto helpers for PII | Key management (KMS/Vault), certificate lifecycle |
| **Stripe Security** | Webhook verification, idempotency keys | Stripe Connect platform agreement, KYC/KYB |
| **API Security** | CORS, CSRF, input validation, rate limiting | WAF configuration, DDoS protection plan |
| **Data Retention** | 90-day soft-delete cleanup job | GDPR data subject request handling, right-to-deletion |
| **Dependencies** | Dependabot config, lock files, SCA CI | Vulnerability disclosure program, SLA for patch deployment |
| **Logging** | Structured logging with PII sanitization | Log aggregation, SIEM, incident response runbook |
| **Compliance** | None | GDPR, SOC 2, PCI-DSS (if handling cards directly), money transmitter licenses |

### Regulatory Warning for Trade Finance

If you deploy KUBERA as a live escrow platform handling real funds:

- **United States**: You likely need a money transmitter license in every state where you have users. Escrow services are regulated at the state level.
- **European Union**: You may need an EMI (Electronic Money Institution) license or partner with a licensed payment institution.
- **UK**: The FCA regulates escrow arrangements. You may need a payment services or e-money license.
- **General**: Always consult with a fintech attorney before handling third-party funds. KUBERA is a tool, not a licensed financial service.

---

## 12. Production Deployment Security Checklist

Before pointing a domain and accepting real users, verify every item:

### Credentials & Secrets
- [ ] All default secrets rotated (JWT, encryption key, DB password)
- [ ] Stripe API keys switched to live mode
- [ ] Stripe webhook endpoint configured in Stripe Dashboard with signing secret
- [ ] Database password uses 32+ character random string
- [ ] Redis password configured and enabled

### Infrastructure
- [ ] TLS certificate installed (Let's Encrypt or commercial CA)
- [ ] HSTS header configured with `max-age=63072000; preload`
- [ ] DDoS protection active (Cloudflare, AWS Shield, or equivalent)
- [ ] WAF rules configured (rate limiting, SQLi/XSS blocking)
- [ ] Database firewall: only allow connections from the application tier
- [ ] Redis firewall: only allow connections from the application tier
- [ ] Regular automated backups configured and tested

### CI/CD
- [ ] Pipeline runs `pip-audit` and `npm audit` on every push
- [ ] Pipeline runs `git-secrets` or equivalent to detect committed secrets
- [ ] Docker images scanned for vulnerabilities (Trivy or equivalent)
- [ ] Staging environment mirrors production configuration
- [ ] Zero-downtime deployment strategy implemented

### Monitoring & Incident Response
- [ ] Application-level error alerting configured (Sentry, DataDog, etc.)
- [ ] Stripe webhook failure alerts configured (Stripe Dashboard)
- [ ] Failed login rate-limit alerts configured
- [ ] Audit log review process documented
- [ ] Incident response runbook written (who to call, what to check)
- [ ] Contract with a security researcher for responsible disclosure

### Compliance & Legal
- [ ] Privacy policy published and linked from sign-up flow
- [ ] Terms of service published and accepted during registration
- [ ] Cookie consent banner implemented (if EU users)
- [ ] Data Processing Agreement (DPA) in place if using third-party processors
- [ ] Money transmitter / EMI license status confirmed with legal counsel
- [ ] Data retention and deletion policy published

### Final Verification
- [ ] No `.env` file, secrets, or credentials in the repository
- [ ] Logs inspected for any leaked PII or secrets
- [ ] Stripe webhook echo test successful end-to-end
- [ ] RBAC boundary test: buyer cannot access seller endpoints and vice versa
- [ ] Rate limiter confirmed functional against login endpoint
- [ ] Session revocation confirmed working after password change
- [ ] All outdated packages updated to latest patch versions
- [ ] `npm audit --audit-level=high` returns zero findings
- [ ] `pip-audit` returns zero findings

---

> **Last updated:** 2026-07-19  
> **Questions or findings?** Open an issue or contribute a PR. Security is a process, not a checkbox.
