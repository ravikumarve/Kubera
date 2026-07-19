# KUBERA — Coding Standards & Contribution Guide

> **Audience:** Developers extending the KUBERA boilerplate or contributing to the repository  
> **Stack:** Next.js 16 (App Router) + FastAPI + PostgreSQL 16 + Stripe Connect + Tailwind CSS v4 + shadcn/ui + TypeScript strict  
> **Version:** 1.0.0

---

## Table of Contents

1. [Code Style & Linting](#1-code-style--linting)
2. [Git Conventions](#2-git-conventions)
3. [Project Organization](#3-project-organization)
4. [Backend Code Standards](#4-backend-code-standards)
5. [Frontend Code Standards](#5-frontend-code-standards)
6. [API Design Standards](#6-api-design-standards)
7. [Database Standards](#7-database-standards)
8. [Testing Standards](#8-testing-standards)
9. [Security Checklist for Code Changes](#9-security-checklist-for-code-changes)
10. [Contribution Workflow](#10-contribution-workflow)

---

## 1. Code Style & Linting

### 1.1 Python (Backend)

| Tool | Setting | Enforcement |
|------|---------|-------------|
| **Black** | Line length 88, `--target-version py312` | Pre-commit + CI |
| **Ruff** | All rules in `F`, `E`, `W`, `I`, `N`, `UP`, `B`, `SIM`, `ARG`, `C4` | Pre-commit + CI |
| **mypy** | `--strict` | Pre-commit + CI |
| **isort** | Black-compatible, `--profile black` | Pre-commit + CI |

#### `pyproject.toml`

```toml
[tool.black]
line-length = 88
target-version = ["py312"]

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["F", "E", "W", "I", "N", "UP", "B", "SIM", "ARG", "C4", "ASYNC", "RUF"]
ignore = ["SIM108", "ARG001", "RUF012"]

[tool.ruff.lint.per-file-ignores"]
"tests/*" = ["ARG001", "ASYNC100"]

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
strict = true
python_version = "3.12"
warn_unused_configs = true
warn_redundant_casts = true
warn_unused_ignores = true
disallow_any_unimported = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_return_any = true
strict_equality = true
```

### 1.2 TypeScript (Frontend)

| Tool | Setting | Enforcement |
|------|---------|-------------|
| **Prettier** | Line length 120, `--single-quote`, `--trailing-comma all` | Pre-commit + CI |
| **ESLint** | `recommended` + `plugin:react/recommended` + `plugin:@typescript-eslint/strict` | Pre-commit + CI |
| **TypeScript** | `strict: true` | `tsconfig.json` |

#### `tsconfig.json` (strict settings)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

### 1.3 Pre-commit Hooks

Use `husky` + `lint-staged` for the frontend and `pre-commit` for the backend. Both projects must pass lint and type-check before any commit.

#### Python `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        args: ["--strict"]
        additional_dependencies: ["pydantic", "sqlalchemy", "stripe"]
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.9
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
        exclude: "tests/"
```

#### Frontend `package.json` (lint-staged)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### 1.4 EditorConfig

Place a `.editorconfig` at the monorepo root:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.py]
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

---

## 2. Git Conventions

### 2.1 Conventional Commits

Every commit message must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature for the buyer | `feat(escrow): add milestone-based fund release` |
| `fix` | Bug fix | `fix(stripe): handle webhook idempotency key collision` |
| `docs` | Documentation changes | `docs: add API endpoint reference for disputes` |
| `test` | Adding or updating tests | `test(contracts): cover state transition edge cases` |
| `refactor` | Code change that is neither feature nor bug | `refactor(api): extract payout service from webhook handler` |
| `chore` | Maintenance tasks (deps, CI, config) | `chore(deps): upgrade FastAPI to 0.115` |
| `style` | Formatting only (no logic change) | `style: run black on backend models` |
| `perf` | Performance improvement | `perf(db): add composite index on contract state queries` |

Breaking changes use `!` after the type: `feat(api)!: remove deprecated /api/v0 endpoints`.

### 2.2 Branch Naming

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `docs/<short-description>` — documentation
- `chore/<short-description>` — maintenance

Examples: `feat/escrow-timeline`, `fix/stripe-webhook-retry`, `chore/upgrade-tailwind-v4`.

### 2.3 Commit Granularity

- One commit per logical change. Do not bundle unrelated changes.
- Squash fixup commits before merging. No "wip", "fixup", or "oops" commits on main.
- Rebasing is preferred over merge commits for feature branches.

---

## 3. Project Organization

KUBERA is a monorepo with two application projects:

```
kuber/
├── backend/          # FastAPI application (Python 3.12+)
│   ├── alembic/      # Migration scripts
│   ├── app/          # Application source
│   │   ├── api/      # Route handlers (v1 versioned)
│   │   ├── core/     # Config, security, dependencies
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic request/response models
│   │   ├── services/ # Business logic layer
│   │   └── repositories/ # Data access layer
│   ├── tests/        # Backend tests
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/         # Next.js 16 application (TypeScript)
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/ # React components
│   │   ├── lib/      # Utilities, API client, hooks
│   │   ├── stores/   # Zustand state stores
│   │   └── types/    # TypeScript type definitions
│   ├── public/       # Static assets
│   ├── tests/        # Frontend tests
│   ├── package.json
│   └── Dockerfile
├── e2e/              # Playwright E2E tests
│   ├── specs/        # Test specifications
│   ├── fixtures/     # Test data and mocks
│   └── playwright.config.ts
├── docs/             # Documentation
│   ├── ARCHITECTURE.md
│   ├── BACKEND.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── FRONTEND.md
│   ├── GUIDELINES.md
│   ├── PRD.md
│   ├── ROADMAP.md
│   └── SECURITY.md
├── infra/            # Infrastructure configs
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
├── .github/          # CI/CD workflows
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── .editorconfig
├── .pre-commit-config.yaml
└── README.md
```

### 3.1 Key Principles

- **No circular dependencies** between packages/modules. The dependency graph flows: `api → services → repositories → models`.
- **No shared code** between `backend/` and `frontend/` avoids coupling. If types must be shared, use an OpenAPI spec → codegen pipeline, not direct imports.
- **`e2e/` is independent** — it curls deployed URLs and does not import application code.

---

## 4. Backend Code Standards

### 4.1 Architectural Layers

| Layer | Module | Responsibility | Imported By |
|-------|--------|----------------|-------------|
| **API (routers)** | `app/api/v1/*.py` | HTTP handling, auth checks, input validation, response formatting | `router.py` aggregator |
| **Services** | `app/services/*.py` | Business logic, orchestrating multiple repository calls | API routers |
| **Repositories** | `app/repositories/*.py` | Data access (SQLAlchemy queries), one per entity | Services |
| **Models** | `app/models/*.py` | SQLAlchemy ORM table definitions | Repositories |
| **Schemas** | `app/schemas/*.py` | Pydantic v2 request/response models | API routers |

**Repository pattern rules:**

```python
# ✅ Correct — Repository encapsulates DB logic
class ContractRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, contract_id: UUID) -> Contract | None:
        stmt = select(Contract).where(Contract.id == contract_id)
        return await self._session.scalar(stmt)

    async def create(self, data: ContractCreate) -> Contract:
        contract = Contract(**data.model_dump())
        self._session.add(contract)
        await self._session.commit()
        await self._session.refresh(contract)
        return contract

# ❌ Incorrect — raw queries in service layer
class ContractService:
    async def get_contract(self, db: AsyncSession, contract_id: UUID):
        result = await db.execute(select(Contract).where(Contract.id == contract_id))  # Move to repository
        return result.scalar_one_or_none()
```

**Service layer rules:**

```python
# ✅ Correct — Service orchestrates, never accesses DB directly
class EscrowService:
    def __init__(
        self,
        contract_repo: ContractRepository,
        transaction_repo: TransactionRepository,
        stripe_client: StripeClient,
    ) -> None:
        self._contract_repo = contract_repo
        self._transaction_repo = transaction_repo
        self._stripe_client = stripe_client

    async def release_milestone(
        self, contract_id: UUID, milestone_id: UUID, actor: User
    ) -> MilestoneResponse:
        contract = await self._contract_repo.get_by_id(contract_id)
        if contract.seller_id != actor.id:
            raise AuthorizationError("Only the seller can release milestones")
        # ... orchestrate stripe, persist, return
```

### 4.2 Pydantic vs SQLAlchemy

- **Pydantic v2 schemas** in `app/schemas/` — for API request/response validation only.
- **SQLAlchemy 2.0 models** in `app/models/` — for database persistence only.
- Never return ORM models from API endpoints. Always convert to Pydantic schemas first.

```python
# ✅ Correct — separate schema and model
class ContractCreate(BaseModel):
    seller_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., pattern=r"^[A-Z]{3}$")

class ContractResponse(BaseModel):
    id: UUID
    title: str
    amount: Decimal
    state: ContractState
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# In the router:
@router.post("/contracts", response_model=ContractResponse)
async def create_contract(
    body: ContractCreate,
    service: Annotated[ContractService, Depends(get_contract_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> ContractResponse:
    contract = await service.create(body, actor=user)
    return ContractResponse.model_validate(contract)
```

### 4.3 SQLAlchemy 2.0 Async Style

Always use the **2.0 style** — no `Query` objects, no `session.query()`, no `Model.query`:

```python
# ✅ Correct — 2.0 async style
stmt = select(Contract).where(
    Contract.buyer_id == user_id,
    Contract.state.in_([ContractState.FUNDED, ContractState.IN_PROGRESS]),
)
result = await session.execute(stmt)
contracts = result.scalars().all()

# ❌ Incorrect — 1.x style
contracts = session.query(Contract).filter(Contract.buyer_id == user_id).all()
```

### 4.4 Type Hints & Docstrings

- Type hints on **all** function signatures — no exceptions.
- Return type annotation on **every** function, including `-> None`.
- Use `| None` over `Optional[Type]` (Python 3.10+ syntax).
- Google-style docstrings on all public functions:

```python
async def release_milestone_payment(
    contract_id: UUID,
    milestone_id: UUID,
    actor: User,
) -> MilestoneResponse:
    """Release held funds for a completed milestone.

    Validates the milestone belongs to the contract, checks the actor
    is authorized, and initiates the Stripe transfer to the seller's
    connected account.

    Args:
        contract_id: UUID of the parent escrow contract.
        milestone_id: UUID of the milestone to release.
        actor: The authenticated user performing the action.

    Returns:
        MilestoneResponse with the updated milestone state and
        transaction reference.

    Raises:
        AuthorizationError: If actor is not the contract buyer.
        StateTransitionError: If milestone is not in APPROVED state.
        StripeTransferError: If the payout transfer fails.
    """
```

### 4.5 File & Module Naming

| Element | Convention | Example |
|---------|------------|---------|
| Python modules | `snake_case` | `contract_repository.py` |
| Classes | `PascalCase` | `ContractRepository`, `EscrowService` |
| Functions/methods | `snake_case` | `release_milestone()`, `get_by_id()` |
| Variables | `snake_case` | `contract_id`, `stripe_client` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |

### 4.6 Import Order

Within each file, imports must follow: **stdlib → third-party → local**, with a blank line between groups.

```python
# stdlib
from datetime import datetime, timezone
from uuid import UUID

# third-party
from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# local
from app.models.contract import Contract
from app.repositories.contract import ContractRepository
from app.schemas.contract import ContractCreate, ContractResponse
```

---

## 5. Frontend Code Standards

### 5.1 Server Components vs Client Components

- **Server Components by default.** Every component in `src/app/` is a Server Component unless it needs interactivity.
- **`'use client'` only when** the component uses:
  - React event handlers (`onClick`, `onSubmit`, etc.)
  - React hooks (`useState`, `useEffect`, `useContext`, `useReducer`)
  - Browser-only APIs (`localStorage`, `navigator`, `window`)
  - Zustand stores (client-side state)
  - TanStack Query mutations (not prefetched data)

```tsx
// ✅ Server Component (default)
// src/app/(marketing)/page.tsx
async function HomePage() {
  const stats = await getPublicStats(); // Server fetch
  return (
    <div>
      <HeroSection />
      <FeatureGrid features={FEATURES} />
    </div>
  );
}

// ✅ Client Component — only when needed
// src/components/contracts/release-milestone-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { useReleaseMilestone } from "@lib/hooks/use-escrow";

interface Props {
  contractId: string;
  milestoneId: string;
}

export function ReleaseMilestoneButton({ contractId, milestoneId }: Props) {
  const [open, setOpen] = useState(false);
  const mutation = useReleaseMilestone();

  return (
    <>
      <Button onClick={() => setOpen(true)}>Release Funds</Button>
      {/* confirmation dialog */}
    </>
  );
}
```

### 5.2 File & Component Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | `kebab-case` | `release-milestone-button.tsx` |
| Components | `PascalCase` | `ReleaseMilestoneButton` |
| Utilities | `camelCase` | `formatCurrency()`, `cn()` |
| Hooks | `camelCase` with `use` prefix | `useContract()`, `useMilestoneRelease()` |
| Types/Interfaces | `PascalCase` with `Props` suffix for component props | `ContractListProps`, `UserResponse` |

### 5.3 One Component Per File

Each file exports exactly one primary component. Helper sub-components used only by that component may be in the same file, but prefer extraction.

```tsx
// ✅ Correct
// src/components/contracts/contract-status-badge.tsx
export function ContractStatusBadge({ state }: ContractStatusBadgeProps) { ... }
```

### 5.4 Colocate Tests

Place test files next to their source:

```
components/
├── contracts/
│   ├── contract-status-badge.tsx
│   └── contract-status-badge.test.tsx
│   ├── release-milestone-button.tsx
│   └── release-milestone-button.test.tsx
```

### 5.5 Conditional Class Names

Use the `cn()` utility (re-exported from `class-variance-authority` + `tailwind-merge`) for all conditional class names. **Never use template literals for conditional classes.**

```tsx
import { cn } from "@lib/utils";

// ✅ Correct
<button className={cn("px-4 py-2 rounded", isActive && "bg-blue-600 text-white", !isActive && "bg-gray-100")} />

// ❌ Incorrect — fragile template literal merging
<button className={`px-4 py-2 rounded ${isActive ? "bg-blue-600 text-white" : "bg-gray-100"}`} />
```

### 5.6 Import Order

```tsx
// 1. React
import { useState } from "react";

// 2. Next.js
import { useRouter } from "next/navigation";
import Link from "next/link";

// 3. Third-party
import { useQuery } from "@tanstack/react-query";

// 4. Local components
import { Button } from "@components/ui/button";
import { ContractStatusBadge } from "@components/contracts/contract-status-badge";

// 5. Utilities / lib
import { cn, formatCurrency } from "@lib/utils";

// 6. Types
import type { Contract, ContractState } from "@types/contract";
```

---

## 6. API Design Standards

### 6.1 RESTful URLs

Use nouns, not verbs:

| Purpose | Method | URL |
|---------|--------|-----|
| List contracts | `GET` | `/api/v1/contracts` |
| Get single contract | `GET` | `/api/v1/contracts/:id` |
| Create contract | `POST` | `/api/v1/contracts` |
| Release milestone | `POST` | `/api/v1/contracts/:id/milestones/:mid/release` |
| List transactions | `GET` | `/api/v1/contracts/:id/transactions` |

**Resource nesting**: maximum 3 levels deep. For deeper resources, flatten with query parameters.

### 6.2 Version Prefix

All API routes are prefixed with `/api/v1/`. When breaking changes are necessary, create `/api/v2/` and deprecate v1 with a `Sunset` header.

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(contracts_router, prefix="/contracts", tags=["contracts"])
router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
```

### 6.3 Consistent Error Format

All error responses follow a uniform structure:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The escrow balance is insufficient to release this milestone payment.",
    "details": {
      "available": 500000,
      "required": 750000,
      "currency": "USD"
    }
  }
}
```

Standard error codes:

| HTTP Status | Code | When |
|-------------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails Pydantic validation |
| 401 | `UNAUTHORIZED` | Missing or expired authentication |
| 403 | `FORBIDDEN` | Authenticated but not authorized |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `STATE_CONFLICT` | Contract state does not allow the transition |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic violation |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### 6.4 Pagination

- **Cursor-based** for real-time lists (contracts, transactions) — `?cursor=<opaque>&limit=20`.
- **Page/limit** for admin dashboards — `?page=1&limit=50`.

```json
// Cursor-based response
{
  "data": [...],
  "meta": {
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "has_more": true,
    "limit": 20
  }
}

// Page-based response
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 342,
    "total_pages": 7
  }
}
```

### 6.5 Response Envelope

All successful responses use a `data` envelope. List endpoints add `meta`:

```json
// Single resource
{
  "data": {
    "id": "uuid-here",
    "title": "Widget Supply Contract",
    "amount": 50000,
    "currency": "USD",
    "state": "funded"
  }
}

// Collection
{
  "data": [
    { "id": "uuid-1", "title": "Contract A", ... },
    { "id": "uuid-2", "title": "Contract B", ... }
  ],
  "meta": {
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "has_more": true,
    "limit": 20
  }
}
```

### 6.6 OpenAPI & Type Generation

- FastAPI auto-generates OpenAPI 3.1 schema at `/docs` and `/openapi.json`.
- Frontend uses `openapi-typescript` (or `openapi-zod-client`) to generate typed API clients from `openapi.json`.
- Run `npm run api:generate` in the frontend after backend schema changes to regenerate types.

---

## 7. Database Standards

### 7.1 Migrations (Alembic)

- Migrations are **auto-generated** with `alembic revision --autogenerate -m "description"`.
- Auto-generated migrations are **always reviewed** before committing. The migration script is hand-edited to:
  - Verify `upgrade()` and `downgrade()` are symmetric.
  - Add explicit `batch` mode for column type changes (SQLite incompatibility prevention).
  - Remove extraneous `ALTER TABLE` noise from auto-detection.
- Migration names follow `{yyyy}_{mm}_{dd}_{short_description}.py`.

### 7.2 Required Columns

```python
# Base mixin for all tables
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
        nullable=True,
    )
```

- **All** tables have `created_at` and `updated_at`.
- **Financial tables** (escrow_contracts, transactions, disputes) use soft delete via `deleted_at`. Hard deletion is forbidden for financial data — use `deleted_at` + a background cleanup job for GDPR right-to-deletion requests.
- Non-financial reference tables (currency_rates, audit_log) may use hard delete.

### 7.3 Foreign Keys & Indexes

```python
class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    contract_id: Mapped[UUID] = mapped_column(
        ForeignKey("escrow_contracts.id", ondelete="CASCADE"),
        index=True,  # ✅ Foreign keys always indexed
        nullable=False,
    )
```

Rules:
- Every `ForeignKey` must have a corresponding `index=True`.
- Composite indexes for query patterns: `Index("ix_contracts_buyer_state", "buyer_id", "state")`.
- Use `Index` for multi-column or functional indexes; do not use raw `CREATE INDEX` in migrations.

### 7.4 JSONB Usage

- **Allowed for:** metadata, config, flexible attributes (e.g., `contract_meta` on escrow_contracts for custom buyer fields).
- **Not allowed for:** queryable data. If you filter or join on a JSONB key, it deserves a proper column.
- Max JSONB document size: 10 KB per row. Larger blobs go to S3/R2 with a URL reference.

### 7.5 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | `snake_case`, plural | `escrow_contracts`, `milestones` |
| Columns | `snake_case` | `buyer_id`, `stripe_pi_id` |
| Primary keys | `id` (UUID, not auto-increment) | `id: Mapped[UUID]` |
| Foreign keys | `<referenced_table_singular>_id` | `contract_id`, `buyer_id` |
| Indexes | `ix_<table>_<columns>` | `ix_contracts_buyer_state` |
| Enums | `UPPER_SNAKE_CASE` | `FUNDED`, `IN_PROGRESS`, `COMPLETED` |

---

## 8. Testing Standards

### 8.1 File Structure Mirroring

Tests mirror the source directory structure exactly:

```
backend/
├── app/
│   └── services/
│       └── escrow_service.py
└── tests/
    └── services/
        └── test_escrow_service.py

frontend/
├── src/
│   └── components/
│       └── contracts/
│           └── contract-status-badge.tsx
└── tests/
    └── components/
        └── contracts/
            └── contract-status-badge.test.tsx
```

### 8.2 Test Pyramid

| Layer | Scope | Dependencies | Speed |
|-------|-------|-------------|-------|
| **Unit** | Single function/class, no DB | Mocks for everything external | < 10ms per test |
| **Integration** | Route + service + repo + real DB | Real PostgreSQL (testcontainer or local), mock Stripe | < 500ms per test |
| **E2E** | Full user journey via Playwright | Real DB + Stripe test mode + Next.js dev server | < 30s per spec |

### 8.3 Test Naming

**Backend (Python):**

```python
# Format: test_<function>_<scenario>
async def test_release_milestone_seller_not_authorized_raises_error() -> None:
    ...

async def test_create_contract_with_invalid_currency_returns_422() -> None:
    ...
```

**Frontend (TypeScript):**

```typescript
// Format: should <expected> when <condition>
describe("ReleaseMilestoneButton", () => {
  it("should show confirmation dialog when clicked", () => { ... });
  it("should disable button when contract is not funded", () => { ... });
  it("should show error toast on stripe transfer failure", () => { ... });
});
```

### 8.4 Backend Test Fixtures

```python
# conftest.py
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
    await engine.dispose()

@pytest_asyncio.fixture
async def contract_repo(db_session: AsyncSession) -> ContractRepository:
    return ContractRepository(db_session)

@pytest_asyncio.fixture
def mock_stripe_client() -> MockStripeClient:
    return MockStripeClient()

@pytest_asyncio.fixture
async def escrow_service(
    contract_repo: ContractRepository,
    transaction_repo: TransactionRepository,
    mock_stripe_client: MockStripeClient,
) -> EscrowService:
    return EscrowService(contract_repo, transaction_repo, mock_stripe_client)
```

### 8.5 Coverage Targets

| Layer | Minimum Coverage | Measured By |
|-------|-----------------|-------------|
| Escrow state machine | 100% (all transitions) | pytest-cov |
| Services | 90%+ | pytest-cov |
| API routes | 90%+ | pytest-cov |
| Frontend components | 80%+ | Vitest |

The CI pipeline blocks merges below these thresholds.

---

## 9. Security Checklist for Code Changes

Before every commit, verify:

1. **No secrets in code**
   - API keys, JWT secrets, database URLs, Stripe keys in `.env` only.
   - `.env`, `*.key`, `*.pem`, and `credentials.*` in `.gitignore`.
   - Run `git diff --staged` and scan for hardcoded credentials.
   - Use `bandit` on the backend and `secretlint` on the frontend.

2. **Input validated on both client and server**
   - Zod schema on the frontend (form validation).
   - Pydantic on the backend (API validation).
   - Never trust client-provided values for authorization checks.

3. **Auth check on every new endpoint**
   - New API routes must include `Depends(get_current_user)` or equivalent.
   - Server Component pages must check session before rendering sensitive data.

4. **No SQL injection**
   - Always use SQLAlchemy parameterized queries (2.0 style). Never interpolate user input into raw SQL strings.
   - If raw SQL is unavoidable (e.g., full-text search), use `text()` with bound parameters.

5. **Rate limiting considered for new endpoints**
   - Public endpoints (login, register, password reset) must have rate limiting.
   - Stripe webhook endpoints must have IP allowlisting AND signature verification.
   - Admin endpoints should have stricter limits than user endpoints.

6. **Stripe webhook signature verified**
   - Every webhook handler must call `stripe.Webhook.construct_event()` to verify the payload signature before processing.

7. **No sensitive data in logs or error responses**
   - Strip `cvv`, `pan`, `stripe_account_id` from log lines.
   - Return user-facing error messages, not internal stack traces.

```
# Integration with your pre-commit hook
stages:
  - manual
  - commit
```

---

## 10. Contribution Workflow

### 10.1 For External Contributors (Buyers)

KUBERA is a paid boilerplate, but bug reports and documentation improvements are welcome from all buyers.

1. **Fork** the repository.
2. **Create a branch** from `main` following the branch naming convention (Section 2.2).
3. **Make changes** following all standards in this guide.
4. **Run checks locally:**
   - Backend: `cd backend && pre-commit run --all-files && pytest`
   - Frontend: `cd frontend && npm run lint && npm run typecheck && npm test`
   - E2E: `cd e2e && npx playwright test`
5. **Commit using Conventional Commits** (Section 2.1).
6. **Push** and open a pull request against `main`.
7. **Complete the PR template** — it includes the security checklist (Section 9).

### 10.2 Pull Request Template

```markdown
## Description
<!-- Briefly describe the change and why it's needed -->

## Type of Change
- [ ] feat (new feature)
- [ ] fix (bug fix)
- [ ] refactor (no functional change)
- [ ] test (adding or updating tests)
- [ ] docs (documentation only)
- [ ] chore (dependencies, CI, config)

## Security Checklist
- [ ] No secrets in code
- [ ] Input validated on both client and server
- [ ] Auth check on new endpoints
- [ ] No SQL injection (parameterized queries)
- [ ] Rate limiting considered for new endpoints

## Testing
- [ ] Backend tests pass (`pytest`)
- [ ] Frontend tests pass (`npm test`)
- [ ] Type checks pass (`mypy` + `npm run typecheck`)
- [ ] Lint passes (`ruff` + `eslint`)
- [ ] E2E tests pass (if applicable)

## Breaking Changes
- [ ] Yes — this change modifies the API contract or database schema
- [ ] No

<!-- If yes, describe migration path -->
```

### 10.3 Code Review Expectations

- Every PR requires at least one approval from a maintainer.
- Reviewers check:
  - Standards compliance (this document).
  - Security checklist completeness.
  - Test coverage for new logic.
  - No unnecessary breaking changes to the API contract.
- PRs with failing CI are not merged.
- Squash-merge is the default merge strategy — the squashed commit message becomes the single entry in `main` history.

### 10.4 Versioning & Releases

- KUBERA follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).
- MAJOR: Breaking API contract or database schema changes.
- MINOR: New features, non-breaking additions.
- PATCH: Bug fixes, security patches, documentation.

Releases are tagged with `vMAJOR.MINOR.PATCH` and include a GitHub Release with changelog summaries from commit history.

---

> **Final rule:** When in doubt, follow the patterns established in the existing codebase. Consistency trumps personal preference. If a pattern in the existing code violates this guide, file an issue — don't perpetuate the inconsistency.
