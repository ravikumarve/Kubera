# KUBERA Database Schema

> **Version:** 1.0.0
> **Stack:** PostgreSQL 16 + SQLAlchemy 2.0 (async) + Alembic
> **Scope:** B2B Trade Finance Escrow — Boilerplate / SaaS Starter Kit

---

## 1. Entity Relationship Diagram

```
┌──────────────────────────┐       ┌────────────────────────────┐
│          users           │       │     stripe_accounts        │
│──────────────────────────│       │────────────────────────────│
│ id              UUID PK │◄──┐   │ id              UUID PK    │
│ email           UNIQUE  │   └───│ user_id         UUID FK     │
│ name            TEXT    │       │ stripe_account_id TEXT      │
│ avatar_url      TEXT    │       │ onboarding_done  BOOL       │
│ role            ENUM    │       │ created_at       TIMESTAMPTZ│
│ email_verified  BOOL    │       └──────────┬─────────────────┘
│ created_at      TIMESTAMPTZ               │
│ updated_at      TIMESTAMPTZ               │
└────────────────────┬─────┘                │
                     │                      │
          ┌──────────┴──────────┐           │
          │                     │           │
          ▼                     ▼           │
┌─────────────────────────────────────┐    │
│         escrow_contracts            │    │
│─────────────────────────────────────│    │
│ id              UUID PK            │    │
│ buyer_id        UUID FK ───────────┘    │
│ seller_id       UUID FK ────────────────┘
│ title           TEXT                    │
│ description     TEXT                    │
│ amount          BIGINT                  │
│ currency        VARCHAR(3)              │
│ state           ENUM                    │
│ stripe_pi_id    TEXT                    │
│ contract_meta   JSONB                   │
│ created_at      TIMESTAMPTZ             │
│ updated_at      TIMESTAMPTZ             │
│ closed_at       TIMESTAMPTZ             │
└──────────┬──────────────────────────────┘
           │
           │
           ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│        milestones        │       │   milestone_documents    │
│──────────────────────────│       │──────────────────────────│
│ id              UUID PK │◄──────│ id              UUID PK  │
│ contract_id     UUID FK │       │ milestone_id    UUID FK  │
│ index           INT     │       │ file_url        TEXT      │
│ title           TEXT    │       │ uploaded_by     UUID FK ──┼──► users
│ description     TEXT    │       │ uploaded_at     TIMESTAMPTZ│
│ percentage      NUMERIC │       └──────────────────────────┘
│ due_date        DATE    │
│ state           ENUM    │
│ released_at     TIMESTAMPTZ
└──────────┬────────────────┘
           │
           ├────────────────────────────────────────────┐
           │                                            │
           ▼                                            ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│       transactions       │       │        disputes          │
│──────────────────────────│       │──────────────────────────│
│ id              UUID PK │       │ id              UUID PK  │
│ contract_id     UUID FK │       │ contract_id     UUID FK  │
│ milestone_id    UUID FK │       │ raised_by       UUID FK ──┼──► users
│ stripe_txn_id   TEXT    │       │ reason          TEXT      │
│ type            ENUM    │       │ status          ENUM     │
│ amount          BIGINT  │       │ resolution      TEXT     │
│ currency        VARCHAR  │       │ created_at      TIMESTAMPTZ
│ status          ENUM    │       │ resolved_at     TIMESTAMPTZ
│ created_at      TIMESTAMPTZ     └──────────────────────────┘
└──────────────────────────┘

┌──────────────────────────┐       ┌──────────────────────────┐
│      currency_rates      │       │        api_keys          │
│──────────────────────────│       │──────────────────────────│
│ base_currency   VARCHAR  │       │ id              UUID PK │
│ target_currency VARCHAR  │       │ user_id         UUID FK ─┼──► users
│ rate            NUMERIC  │       │ key_hash        TEXT     │
│ fetched_at      TIMESTAMPTZ     │ name            TEXT     │
│──────────────────────────│       │ last_used_at    TIMESTAMPTZ
│ PK (base, target)        │       │ created_at      TIMESTAMPTZ
└──────────────────────────┘       └──────────────────────────┘

┌──────────────────────────────────────────────────┐
│                   audit_logs                     │
│──────────────────────────────────────────────────│
│ id              UUID PK                         │
│ user_id         UUID FK NULL ──► users           │
│ action          TEXT                             │
│ entity_type     TEXT                             │
│ entity_id       TEXT                             │
│ old_values      JSONB                            │
│ new_values      JSONB                            │
│ ip_address      INET                             │
│ created_at      TIMESTAMPTZ                      │
└──────────────────────────────────────────────────┘
```

---

## 2. Schema Design Principles

### Why PostgreSQL over NoSQL?
- **Escrow demands atomicity.** Funds, milestones, and disputes require ACID guarantees. A document store cannot enforce cross-collection referential integrity.
- **JSONB when you need it**, relational when you don't. `contract_metadata` is JSONB for flexible K/V pairs; everything else is normalized.
- **Rich types.** `NUMERIC` for currency rates, `INET` for audit IPs, `TIMESTAMPTZ` for timezone-safe timestamps, `ENUM` for finite state machines.

### Why UUIDs over auto-increment?
- **Security.** Sequential IDs leak business volume (`/contract/42` vs `/contract/018e0c3a-...`).
- **Client generation.** Frontends can generate UUIDv7 (time-sortable) before the API round-trip.
- **Sharding readiness.** If this starter ever needs read replicas or Citus, UUIDs prevent collision.
- **Migration safety.** No identity-sequence conflicts when merging branches.

### Why `TIMESTAMPTZ`?
- `TIMESTAMPTZ` stores UTC internally and converts on display. An escrow platform spans timezones — a `due_date` in Tokyo must not drift when viewed from New York.
- Always set `timezone = 'UTC'` in `postgresql.conf`; let the application layer handle timezone display.

---

## 3. Complete Table Definitions

```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'buyer', 'seller');

CREATE TYPE contract_state AS ENUM (
    'draft',
    'pending_funding',
    'funded',
    'in_progress',
    'completed',
    'disputed',
    'refunded',
    'cancelled'
);

CREATE TYPE milestone_state AS ENUM (
    'locked',
    'available',
    'released',
    'disputed'
);

CREATE TYPE transaction_type AS ENUM (
    'fund',
    'release',
    'refund',
    'fee'
);

CREATE TYPE transaction_status AS ENUM (
    'pending',
    'succeeded',
    'failed'
);

CREATE TYPE dispute_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'rejected'
);

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    name            TEXT NOT NULL,
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'buyer',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE users IS 'All platform users — admins, buyers, and sellers';
COMMENT ON COLUMN users.role IS 'Determines UI access and permission scopes';
COMMENT ON COLUMN users.email_verified IS 'Set to TRUE after email confirmation flow';


CREATE TABLE stripe_accounts (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL,
    stripe_account_id         TEXT NOT NULL,
    stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_stripe_accounts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_stripe_accounts_stripe_id UNIQUE (stripe_account_id),
    CONSTRAINT uq_stripe_accounts_user UNIQUE (user_id)
);

COMMENT ON TABLE stripe_accounts IS 'Links a user to their Stripe Connect account';
COMMENT ON COLUMN stripe_accounts.stripe_onboarding_completed IS
    'TRUE after the user finishes Stripe Connect onboarding';


CREATE TABLE escrow_contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID NOT NULL,
    seller_id           UUID NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    amount              BIGINT NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    state               contract_state NOT NULL DEFAULT 'draft',
    stripe_payment_intent_id TEXT,
    contract_metadata   JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at           TIMESTAMPTZ,

    CONSTRAINT fk_contracts_buyer
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_seller
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT ck_contracts_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_contracts_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_contracts_buyer_seller_differ CHECK (buyer_id <> seller_id)
);

COMMENT ON TABLE escrow_contracts IS 'Core table — each row is one escrow agreement';
COMMENT ON COLUMN escrow_contracts.amount IS 'Amount in smallest currency unit (cents)';
COMMENT ON COLUMN escrow_contracts.contract_metadata IS
    'Arbitrary JSON for custom fields (PO numbers, legal refs, etc.)';
COMMENT ON COLUMN escrow_contracts.closed_at IS
    'Set when state reaches completed, refunded, or cancelled';


CREATE TABLE milestones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL,
    index           INT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    percentage      NUMERIC(5,2) NOT NULL,
    due_date        DATE,
    state           milestone_state NOT NULL DEFAULT 'locked',
    released_at     TIMESTAMPTZ,

    CONSTRAINT fk_milestones_contract
        FOREIGN KEY (contract_id) REFERENCES escrow_contracts(id) ON DELETE CASCADE,

    CONSTRAINT ck_milestones_percentage CHECK (
        percentage > 0 AND percentage <= 100
    ),
    CONSTRAINT ck_milestones_index CHECK (index >= 0),
    CONSTRAINT uq_milestones_contract_index
        UNIQUE (contract_id, index)
);

COMMENT ON TABLE milestones IS 'Milestones within an escrow contract — funds release in stages';
COMMENT ON COLUMN milestones.percentage IS 'Percentage of total contract amount (e.g. 33.50)';


CREATE TABLE milestone_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id    UUID NOT NULL,
    file_url        TEXT NOT NULL,
    uploaded_by     UUID NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_md_milestone
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
    CONSTRAINT fk_md_uploader
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

COMMENT ON TABLE milestone_documents IS 'Supporting documents attached to a milestone';


CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id             UUID NOT NULL,
    milestone_id            UUID,
    stripe_transaction_id   TEXT,
    type                    transaction_type NOT NULL,
    amount                  BIGINT NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'USD',
    status                  transaction_status NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_transactions_contract
        FOREIGN KEY (contract_id) REFERENCES escrow_contracts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_milestone
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,

    CONSTRAINT ck_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_transactions_currency CHECK (currency ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE transactions IS 'Ledger — every money movement inside a contract';
COMMENT ON COLUMN transactions.stripe_transaction_id IS
    'Stripe BalanceTransaction ID for reconciliation';
COMMENT ON COLUMN transactions.milestone_id IS
    'NULL for contract-level transactions (fund, fee, refund)';


CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL,
    raised_by       UUID NOT NULL,
    reason          TEXT NOT NULL,
    status          dispute_status NOT NULL DEFAULT 'open',
    resolution      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,

    CONSTRAINT fk_disputes_contract
        FOREIGN KEY (contract_id) REFERENCES escrow_contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_disputes_raiser
        FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE RESTRICT
);

COMMENT ON TABLE disputes IS 'Dispute lifecycle — from open through investigation to resolution';


CREATE TABLE currency_rates (
    base_currency   VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate            NUMERIC(21,6) NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_currency_rates PRIMARY KEY (base_currency, target_currency),

    CONSTRAINT ck_currency_rates_base CHECK (base_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_currency_rates_target CHECK (target_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_currency_rates_rate_positive CHECK (rate > 0)
);

COMMENT ON TABLE currency_rates IS
    'Exchange rates fetched from external API (updated periodically)';
COMMENT ON COLUMN currency_rates.rate IS 'Rate with 6 decimal places (e.g. 0.912345)';


CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    key_hash        TEXT NOT NULL,
    name            TEXT NOT NULL,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_api_keys_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_api_keys_hash UNIQUE (key_hash)
);

COMMENT ON TABLE api_keys IS 'API keys for programmatic contract management';
COMMENT ON COLUMN api_keys.key_hash IS 'bcrypt hash of the raw API key — never store plaintext';


CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all escrow state changes';
COMMENT ON COLUMN audit_logs.old_values IS 'Snapshot of the row before the change';
COMMENT ON COLUMN audit_logs.new_values IS 'Snapshot of the row after the change';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP at the time of the action';
```

---

## 4. Index Strategy

```sql
-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Buyer dashboard: "show me all my contracts grouped by status"
CREATE INDEX idx_contracts_buyer_status
    ON escrow_contracts (buyer_id, state);

-- Seller dashboard: "show me all contracts I'm selling"
CREATE INDEX idx_contracts_seller_status
    ON escrow_contracts (seller_id, state);

-- Deadline checks: "which milestones are coming due?"
CREATE INDEX idx_milestones_contract_due
    ON milestones (contract_id, due_date)
    WHERE due_date IS NOT NULL;

-- Transaction history per contract
CREATE INDEX idx_transactions_contract
    ON transactions (contract_id, created_at DESC);

-- Active disputes — partial index for the hot path
CREATE INDEX idx_disputes_open
    ON disputes (created_at DESC)
    WHERE status IN ('open', 'investigating');

-- Milestone date-range lookups (GiST for overlap queries)
CREATE INDEX idx_milestones_due_date_range
    ON milestones USING GiST (due_date)
    WHERE due_date IS NOT NULL;

-- Audit log lookups by entity
CREATE INDEX idx_audit_entity
    ON audit_logs (entity_type, entity_id, created_at DESC);

-- Fast user lookup by email on login
CREATE INDEX idx_users_email
    ON users (email);

-- API key lookups
CREATE INDEX idx_api_keys_user
    ON api_keys (user_id);
```

### Why These Indexes?

| Index | Rationale |
|-------|-----------|
| `idx_contracts_buyer_status` | Covers the most frequent query pattern — buyers loading their contract list filtered by state. Composite index lets PostgreSQL do an index-only scan when `state` is also filtered. |
| `idx_contracts_seller_status` | Same pattern for the seller dashboard. |
| `idx_milestones_contract_due` | The background job that checks for approaching/overdue milestones filters by `contract_id` then sorts/filters by `due_date`. Partial index skips NULLs. |
| `idx_transactions_contract` | Ledger view for a contract — sorted newest-first. `DESC` index avoids a backwards scan. |
| `idx_disputes_open` | Partial index (small, fast) on the active-dispute hot path. 99% of disputes are closed; no reason to index those. |
| `idx_milestones_due_date_range` | GiST index enables `&&` (overlap), `-|-` (adjacent), and range queries on `due_date`. Useful for "show me milestones due this quarter." |
| `idx_audit_entity` | Compliance queries always filter by `(entity_type, entity_id)` with a time sort. |
| `idx_users_email` | Login and invite flows need exact email match. |

---

## 5. Migration Strategy

### Tooling
Alembic with async SQLAlchemy — configured via `alembic.ini` + `async_engine` in `env.py`.

### Naming Convention
```python
# alembic/env.py
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

### Migration File Naming
```
001_create_users_table.py
002_create_stripe_accounts_table.py
003_create_escrow_contracts_table.py
004_create_milestones_table.py
005_create_transactions_table.py
006_create_disputes_table.py
007_create_currency_rates_table.py
008_create_api_keys_table.py
009_create_audit_logs_table.py
010_add_role_to_users.py
011_create_indexes.py
```

### Auto-generation Workflow
```bash
# After model changes:
alembic revision --autogenerate -m "add_role_to_users"

# Always review the generated migration before applying:
alembic upgrade head --sql  # dry-run

# Apply:
alembic upgrade head
```

### Squashing for Releases
When shipping the boilerplate to customers, squash all migrations into a single `001_initial.py`:
```bash
# 1. Merge all migration files into one
alembic merge -m "squash_v1" $(ls alembic/versions/*.py | tr '\n' ' ')

# 2. Manually consolidate into a single Initial revision
# 3. Delete individual migration files
# 4. Update the stamp in the DB
alembic stamp head
```

For customers upgrading from v1 → v2, keep the squash as `001_initial.py` and provide numbered patches (`002_add_feature_x.py`).

---

## 6. Key Query Patterns

### 6.1 Buyer Dashboard — Active Contracts
```sql
SELECT
    c.id,
    c.title,
    c.amount,
    c.currency,
    c.state,
    c.created_at,
    u.name AS seller_name
FROM escrow_contracts c
JOIN users u ON u.id = c.seller_id
WHERE c.buyer_id = $1
  AND c.state NOT IN ('completed', 'refunded', 'cancelled')
ORDER BY c.created_at DESC;
```
**Uses index:** `idx_contracts_buyer_status`

### 6.2 Dashboard Stats — Aggregated Counts
```sql
SELECT
    COUNT(*) FILTER (WHERE state = 'pending_funding') AS pending_funding,
    COUNT(*) FILTER (WHERE state = 'funded')          AS funded,
    COUNT(*) FILTER (WHERE state = 'in_progress')     AS in_progress,
    COUNT(*) FILTER (WHERE state = 'disputed')        AS disputed,
    COUNT(*) FILTER (WHERE state = 'completed')       AS completed,
    COALESCE(SUM(amount) FILTER (WHERE state NOT IN ('completed', 'refunded', 'cancelled')), 0)
        AS total_at_risk_cents
FROM escrow_contracts
WHERE buyer_id = $1 OR seller_id = $1;
```

### 6.3 Milestone Release Eligibility Check
```sql
-- Returns the next locked milestone when all prior milestones are released
SELECT m.*
FROM milestones m
WHERE m.contract_id = $1
  AND m.state = 'locked'
  AND m.index = (
      SELECT COALESCE(MAX(m2.index), -1) + 1
      FROM milestones m2
      WHERE m2.contract_id = $1
        AND m2.state = 'released'
  );
```

### 6.4 Overdue Milestones (Cron Job)
```sql
SELECT
    m.id,
    m.title,
    m.due_date,
    c.title AS contract_title,
    c.id    AS contract_id
FROM milestones m
JOIN escrow_contracts c ON c.id = m.contract_id
WHERE m.state = 'available'
  AND m.due_date < CURRENT_DATE
ORDER BY m.due_date;
```
**Uses index:** `idx_milestones_contract_due`

### 6.5 Transaction Ledger for a Contract
```sql
SELECT
    t.created_at,
    t.type,
    t.amount,
    t.currency,
    t.status,
    t.stripe_transaction_id,
    m.title AS milestone_title
FROM transactions t
LEFT JOIN milestones m ON m.id = t.milestone_id
WHERE t.contract_id = $1
ORDER BY t.created_at DESC;
```
**Uses index:** `idx_transactions_contract`

### 6.6 Active Disputes Summary
```sql
SELECT
    d.id,
    d.reason,
    d.status,
    d.created_at,
    c.title AS contract_title,
    u.name  AS raised_by_name
FROM disputes d
JOIN escrow_contracts c ON c.id = d.contract_id
JOIN users u ON u.id = d.raised_by
WHERE d.status IN ('open', 'investigating')
ORDER BY d.created_at DESC;
```
**Uses index:** `idx_disputes_open`

### 6.7 Audit Trail for a Specific Entity
```sql
SELECT
    al.created_at,
    al.action,
    al.old_values,
    al.new_values,
    al.ip_address,
    u.name AS performed_by
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.entity_type = $1
  AND al.entity_id = $2
ORDER BY al.created_at DESC;
```
**Uses index:** `idx_audit_entity`

### 6.8 Currency Rate Lookup
```sql
SELECT rate
FROM currency_rates
WHERE base_currency = $1 AND target_currency = $2
ORDER BY fetched_at DESC
LIMIT 1;
```
**Uses PK:** `pk_currency_rates`

---

## 7. Performance

### Connection Pooling
```python
# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost:5432/kubera",
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

| Parameter    | Value | Rationale                                           |
|-------------|-------|------------------------------------------------------|
| `pool_size` | 20    | Comfortable for a single app instance under load     |
| `max_overflow` | 10 | Burst capacity for traffic spikes                   |
| `pool_pre_ping` | True | Drops stale connections before use                |
| `pool_recycle` | 3600s | Prevents AWS RDS / pgBouncer idle timeout kills   |

### pgBouncer Configuration
```ini
[databases]
kubera = host=127.0.0.1 port=5432 dbname=kubera

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
default_pool_size = 25
max_client_conn = 100
max_db_connections = 20
server_idle_timeout = 300
query_timeout = 30
```

**Why `pool_mode = transaction`?** Connections are returned to the pool after each transaction ends. This is the best fit for FastAPI async handlers where every request is a short-lived transaction.

### Query Optimization Tips
1. **Use `EXPLAIN (ANALYZE, BUFFERS)`** before adding an index — don't guess.
2. **Avoid N+1** in GraphQL/REST serializers by using SQLAlchemy `joinedload()` or `selectinload()`.
3. **Keep transactions short** — never hold a transaction open while waiting for external APIs (Stripe, email). Use the fire-and-forget pattern: commit the DB change first, then dispatch the side-effect.
4. **Batch milestone inserts** with `INSERT INTO milestones (...) VALUES (...), (...), (...)` when creating contracts with predefined milestones (single round-trip).
5. **Vacuum critical tables** (`escrow_contracts`, `transactions`) during low-traffic windows. Auto-vacuum should handle this, but monitor `n_dead_tup` in `pg_stat_user_tables`.
6. **Use `pg_stat_statements`** to identify the top-10 queries by total time in production.

---

## 8. Data Integrity

### CHECK Constraints
| Table | Constraint | Purpose |
|-------|-----------|---------|
| `users` | `ck_users_email_format` | Validates email format at the DB level (belt-and-suspenders with app-level validation) |
| `escrow_contracts` | `ck_contracts_amount_positive` | Prevents zero/negative amounts |
| `escrow_contracts` | `ck_contracts_currency` | Ensures 3-letter uppercase currency code |
| `escrow_contracts` | `ck_contracts_buyer_seller_differ` | A user cannot contract with themselves |
| `milestones` | `ck_milestones_percentage` | Percentage must be 0.01–100.00 |
| `milestones` | `ck_milestones_index` | Index must be non-negative |
| `transactions` | `ck_transactions_amount_positive` | Same guard as contracts |
| `transactions` | `ck_transactions_currency` | Same currency format check |
| `currency_rates` | `ck_currency_rates_rate_positive` | Zero or negative rate is meaningless |

### NOT NULL Columns
Every column critical to business logic is `NOT NULL`. Notable exceptions:
- `milestone_due_date` — a milestone may not have a hard deadline.
- `contract_closed_at` — only set on terminal states.
- `audit_logs.user_id` — system actions (cron jobs) have no user.
- `transactions.milestone_id` — contract-level fees/funding have no milestone.

### UNIQUE Constraints
- `users.email` — one account per email.
- `stripe_accounts.stripe_account_id` — one Stripe account per platform account.
- `stripe_accounts.user_id` — one Stripe account per user.
- `milestones (contract_id, index)` — no duplicate milestone positions.
- `currency_rates (base_currency, target_currency)` — composite PK.
- `api_keys.key_hash` — key uniqueness by hash.

### Foreign Key CASCADE Rules
| Parent → Child | Rule | Rationale |
|----------------|------|-----------|
| `users → stripe_accounts` | `CASCADE` | If a user is deleted, their Stripe linkage goes with them |
| `users → api_keys` | `CASCADE` | Clean up API keys on user deletion |
| `users → audit_logs` | `SET NULL` | Preserve audit trail even if the user is deleted |
| `escrow_contracts → milestones` | `CASCADE` | Deleting a contract removes its milestones |
| `escrow_contracts → transactions` | `RESTRICT` | Prevent deleting contracts with financial history |
| `escrow_contracts → disputes` | `CASCADE` | Disputes are meaningless without the contract |
| `milestones → milestone_documents` | `CASCADE` | Documents belong to the milestone |
| `users → escrow_contracts` (buyer/seller) | `RESTRICT` | Never delete a user who is party to a contract |

**Design intent:** `RESTRICT` on financial tables (contracts, transactions) prevents accidental data loss. `SET NULL` on audit logs ensures compliance records survive user deletion. `CASCADE` on children (milestones, documents) keeps cleanup simple.

---

## Migration Bootstrap SQL

One-shot SQL to create the entire schema for local development / CI:

```sql
-- Run this as superuser
CREATE DATABASE kubera;
CREATE USER kubera_app WITH PASSWORD 'replace_me';
GRANT ALL PRIVILEGES ON DATABASE kubera TO kubera_app;

\c kubera

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'buyer', 'seller');
CREATE TYPE contract_state AS ENUM ('draft','pending_funding','funded','in_progress','completed','disputed','refunded','cancelled');
CREATE TYPE milestone_state AS ENUM ('locked','available','released','disputed');
CREATE TYPE transaction_type AS ENUM ('fund','release','refund','fee');
CREATE TYPE transaction_status AS ENUM ('pending','succeeded','failed');
CREATE TYPE dispute_status AS ENUM ('open','investigating','resolved','rejected');

-- Run all CREATE TABLE statements from §3 above
-- Run all CREATE INDEX statements from §4 above

GRANT USAGE ON SCHEMA public TO kubera_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kubera_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kubera_app;
```

---

*End of DATABASE.md — KUBERA v1.0.0*
