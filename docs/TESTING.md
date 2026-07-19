# KUBERA — Testing Guide

> **Pro Tier Differentiator ($249):** This testing suite is the crown jewel of the Pro edition. Standard ($149) buyers get the source code without tests. Pro buyers get exhaustive backend unit/integration tests, frontend component tests, Playwright E2E suites, CI configurations, and test factories — everything needed to ship with confidence.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Stack](#2-test-stack)
3. [Backend Testing (pytest)](#3-backend-testing-pytest)
4. [Frontend Testing (Vitest + Testing Library)](#4-frontend-testing-vitest--testing-library)
5. [E2E Testing (Playwright)](#5-e2e-testing-playwright)
6. [CI Integration](#6-ci-integration)
7. [Test Data & Factories](#7-test-data--factories)
8. [Running Tests Locally](#8-running-tests-locally)
9. [Quality Gates](#9-quality-gates)

---

## 1. Testing Philosophy

KUBERA is a **B2B trade finance escrow boilerplate** — the core business logic is an escrow state machine that moves money between parties. If that state machine is wrong, money gets lost. If the Stripe webhook handler is wrong, funds never release. If the UI shows the wrong contract status, users panic.

We test in layers, prioritized by risk:

| Layer | Risk | Approach | Coverage Target |
|-------|------|----------|-----------------|
| Escrow state machine | **Critical** — incorrect transitions lose money | Exhaustive unit tests, every valid AND invalid transition | 100% of states/transitions |
| Stripe integration | **Critical** — webhook errors block payments | Mocked integration tests covering all webhook event types | 95%+ |
| API endpoints | **High** — malformed requests corrupt data | Integration tests with real PostgreSQL | 90%+ routes |
| Frontend components | **Medium** — wrong status shown to users | Component tests with mocked API | 80%+ |
| E2E flows | **Medium** — broken user journeys | Playwright covering 3 critical paths | All critical paths |
| Visual regression | **Low** — cosmetic | Deferred to v2 | — |
| Performance benchmarks | **Low** — not yet at scale | Deferred to v2 | — |

### What We Do NOT Test (v1)

- **Visual regression** — No Percy/Chromatic snapshots. v1 prioritizes functional correctness over pixel perfection.
- **Performance benchmarks** — No k6/artillery load tests. The boilerplate is a starting point, not a production deployment at scale.
- **Third-party UIs** — Stripe Checkout iframe, email client rendering. These are outside our control.

---

## 2. Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Backend unit** | pytest + pytest-asyncio | Async test runner for Python |
| **Backend coverage** | pytest-cov | Coverage reports, enforced at CI |
| **Backend DB** | pytest-asyncio + SQLAlchemy + asyncpg | Real PostgreSQL via TestContainers or local DB |
| **Backend mocks** | pytest-mock + stripe-testing | Deterministic Stripe mocking |
| **Frontend unit** | Vitest | Fast, Jest-compatible runner with ESM support |
| **Frontend rendering** | @testing-library/react | Component tests by user behavior, not implementation |
| **Frontend hooks** | @testing-library/react-hooks | Isolated hook testing |
| **E2E** | Playwright | Cross-browser E2E for critical user journeys |
| **Validation** | Zod (shared schemas) | Runtime type checking in both frontend and backend tests |
| **CI** | GitHub Actions | pytest + vitest on every push, Playwright on PRs to main |
| **DB for CI** | TestContainers (optional) | Ephemeral PostgreSQL in CI; can use service containers instead |

---

## 3. Backend Testing (pytest)

### 3.1 Structure

```
backend/
└── tests/
    ├── conftest.py              # Global fixtures (db session, test client, auth headers)
    ├── fixtures/
    │   ├── __init__.py
    │   ├── users.py             # User factory functions
    │   ├── contracts.py         # Contract & milestone factories
    │   ├── stripe_mocks.py      # Stripe mock responses
    │   └── db.py                # Database session fixtures
    ├── unit/
    │   ├── __init__.py
    │   ├── test_state_machine.py   # Escrow state transition tests (exhaustive)
    │   ├── test_escrow_service.py  # Escrow service logic
    │   ├── test_stripe_service.py  # Stripe service unit tests
    │   └── test_auth_service.py    # Auth logic (JWT, hashing)
    └── integration/
        ├── __init__.py
        ├── test_auth_api.py        # Register, login, refresh
        ├── test_contracts_api.py   # CRUD + state transitions via API
        ├── test_milestones_api.py  # Milestone lifecycle
        ├── test_payments_api.py    # PaymentIntent creation
        ├── test_webhooks.py        # Stripe webhook handling
        └── test_disputes_api.py    # Dispute workflow
```

### 3.2 Fixtures

#### Database Session (`tests/fixtures/db.py`)

```python
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base
from app.config import settings

TEST_DATABASE_URL = settings.database_url + "_test"

@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
```

#### Test Client (`tests/conftest.py`)

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import create_app
from app.database import get_db

@pytest_asyncio.fixture
async def client(db_session):
    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
```

#### Auth Headers (`tests/fixtures/users.py`)

```python
import pytest
from app.services.auth import create_access_token
from app.models.user import User

@pytest_asyncio.fixture
async def buyer_user(db_session):
    user = User(email="buyer@test.com", name="Test Buyer", role="buyer")
    user.set_password("password123")
    db_session.add(user)
    await db_session.commit()
    return user

@pytest_asyncio.fixture
async def buyer_headers(buyer_user):
    token = create_access_token({"sub": str(buyer_user.id), "role": "buyer"})
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def seller_user(db_session):
    user = User(email="seller@test.com", name="Test Seller", role="seller")
    user.set_password("password123")
    user.stripe_account_id = "acct_test_seller"
    db_session.add(user)
    await db_session.commit()
    return user

@pytest_asyncio.fixture
async def seller_headers(seller_user):
    token = create_access_token({"sub": str(seller_user.id), "role": "seller"})
    return {"Authorization": f"Bearer {token}"}
```

#### Stripe Mocks (`tests/fixtures/stripe_mocks.py`)

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_stripe():
    with patch("app.services.stripe_service.stripe") as mock:
        mock.PaymentIntent.create_async = AsyncMock(return_value=MockPaymentIntent())
        mock.Transfer.create_async = AsyncMock(return_value=MockTransfer())
        mock.Webhook.construct_event.return_value = MockEvent()
        yield mock

class MockPaymentIntent:
    id = "pi_test_123"
    amount = 10000
    currency = "usd"
    status = "succeeded"
    client_secret = "secret_test_123"

class MockTransfer:
    id = "tr_test_123"
    amount = 9500
    status = "succeeded"
    destination_payment = "py_test_456"

class MockEvent:
    type = "payment_intent.succeeded"
    data = {"object": {"id": "pi_test_123", "amount": 10000, "currency": "usd"}}
```

### 3.3 Escrow State Machine Tests — Exhaustive

The state machine lives in `app/engine/state_machine.py`. Every valid and invalid transition is tested explicitly.

```python
# tests/unit/test_state_machine.py

import pytest
from app.engine.state_machine import EscrowStateMachine, EscrowState, EscrowTransitionError

class TestEscrowStateMachine:
    """Every valid and invalid transition is tested explicitly.

    State diagram:
      DRAFT ──(fund)──► FUNDED ──(start)──► IN_PROGRESS ──(complete)──► COMPLETED
        │                                      │
        └──(cancel)──► CANCELLED               └──(dispute)──► DISPUTED
                                                                    │
                                          ┌─────────────────────────┘
                                          ▼
                                      REFUNDED / COMPLETED

    Valid transitions:  DRAFT→FUNDED, DRAFT→CANCELLED,
                        FUNDED→IN_PROGRESS, FUNDED→CANCELLED,
                        IN_PROGRESS→COMPLETED, IN_PROGRESS→DISPUTED,
                        DISPUTED→REFUNDED, DISPUTED→COMPLETED

    Invalid transitions (must raise):  DRAFT→COMPLETED, FUNDED→DRAFT,
                                        FUNDED→COMPLETED, COMPLETED→DISPUTED, etc.
    """

    def setup_method(self):
        self.sm = EscrowStateMachine()

    # ── Valid transitions ──

    @pytest.mark.parametrize("from_state,to_state,action,context", [
        (EscrowState.DRAFT, EscrowState.FUNDED, "fund", {"payment_intent_id": "pi_test"}),
        (EscrowState.DRAFT, EscrowState.CANCELLED, "cancel", {"reason": "buyer_requested"}),
        (EscrowState.FUNDED, EscrowState.IN_PROGRESS, "start", {}),
        (EscrowState.FUNDED, EscrowState.CANCELLED, "cancel", {"reason": "mutual_agreement"}),
        (EscrowState.IN_PROGRESS, EscrowState.COMPLETED, "complete", {}),
        (EscrowState.IN_PROGRESS, EscrowState.DISPUTED, "dispute", {"raised_by": "buyer"}),
        (EscrowState.DISPUTED, EscrowState.REFUNDED, "resolve_refund", {}),
        (EscrowState.DISPUTED, EscrowState.COMPLETED, "resolve_seller", {}),
    ])
    def test_valid_transitions(self, from_state, to_state, action, context):
        result = self.sm.transition(from_state, action, context)
        assert result == to_state

    # ── Invalid transitions ──

    @pytest.mark.parametrize("from_state,action,context", [
        (EscrowState.DRAFT, "complete", {}),
        (EscrowState.FUNDED, "refund", {}),
        (EscrowState.IN_PROGRESS, "fund", {}),
        (EscrowState.COMPLETED, "dispute", {}),
        (EscrowState.CANCELLED, "fund", {}),
        (EscrowState.DRAFT, "dispute", {}),
        (EscrowState.REFUNDED, "fund", {}),
        (EscrowState.DRAFT, "start", {}),
    ])
    def test_invalid_transitions_raise_error(self, from_state, action, context):
        with pytest.raises(EscrowTransitionError):
            self.sm.transition(from_state, action, context)

    # ── Edge cases ──

    @pytest.mark.parametrize("from_state,action", [
        (EscrowState.FUNDED, "fund"),
        (EscrowState.IN_PROGRESS, "start"),
        (EscrowState.COMPLETED, "complete"),
    ])
    def test_double_transition_raises_error(self, from_state, action):
        """Attempting the same transition twice must fail."""
        context = {"payment_intent_id": "pi_test"} if action == "fund" else {}
        self.sm.transition(from_state, action, context)
        with pytest.raises(EscrowTransitionError):
            self.sm.transition(from_state, action, context)
```

### 3.4 API Integration Tests

```python
# tests/integration/test_contracts_api.py

import pytest
from httpx import AsyncClient

class TestContractLifecycle:
    """Full escrow lifecycle via API — buyer creates, funds, approves, release."""

    async def test_create_contract(self, client: AsyncClient, buyer_headers: dict, seller_user):
        payload = {
            "title": "Q4 Widget Supply",
            "description": "10,000 units of widgets",
            "amount": 50000,
            "currency": "usd",
            "seller_id": str(seller_user.id),
            "milestones": [
                {"title": "Deposit", "amount": 10000, "due_date": "2026-08-01"},
                {"title": "Final Delivery", "amount": 40000, "due_date": "2026-09-01"},
            ],
        }
        resp = await client.post("/api/v1/contracts", json=payload, headers=buyer_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "DRAFT"
        assert len(data["milestones"]) == 2
        assert data["buyer_id"] is not None

    async def test_full_flow(
        self,
        client: AsyncClient,
        db_session,
        buyer_headers: dict,
        seller_headers: dict,
        mock_stripe,
    ):
        # 1. Buyer creates contract
        contract = await self._create_contract(client, buyer_headers)
        contract_id = contract["id"]

        # 2. Buyer funds contract
        resp = await client.post(
            f"/api/v1/contracts/{contract_id}/fund",
            headers=buyer_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "FUNDED"

        # 3. Both parties confirm → IN_PROGRESS
        resp = await client.post(
            f"/api/v1/contracts/{contract_id}/start",
            headers=buyer_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "IN_PROGRESS"

        # 4. Seller completes milestone
        milestone_id = contract["milestones"][0]["id"]
        resp = await client.post(
            f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/complete",
            headers=seller_headers,
        )
        assert resp.status_code == 200

        # 5. Buyer approves milestone → funds released
        resp = await client.post(
            f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/approve",
            headers=buyer_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["milestones"][0]["status"] == "RELEASED"

    async def _create_contract(self, client, headers):
        resp = await client.post(
            "/api/v1/contracts",
            json={
                "title": "Test Contract",
                "description": "E2E test",
                "amount": 50000,
                "currency": "usd",
                "seller_id": "00000000-0000-0000-0000-000000000002",
                "milestones": [
                    {"title": "M1", "amount": 50000, "due_date": "2026-08-01"},
                ],
            },
            headers=headers,
        )
        return resp.json()
```

### 3.5 Stripe Webhook Tests

```python
# tests/integration/test_webhooks.py

import json
import hmac
import hashlib
from app.config import settings

class TestStripeWebhooks:
    async def test_payment_intent_succeeded(self, client, db_session, mock_stripe):
        payload = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test_123",
                    "amount": 50000,
                    "currency": "usd",
                    "metadata": {"contract_id": str(self.contract_id)},
                }
            },
        }
        signature = self._generate_signature(json.dumps(payload))
        resp = await client.post(
            "/api/v1/webhooks/stripe",
            content=json.dumps(payload),
            headers={
                "Content-Type": "application/json",
                "Stripe-Signature": signature,
            },
        )
        assert resp.status_code == 200

    def _generate_signature(self, payload: str) -> str:
        timestamp = "1234567890"
        signed_payload = f"{timestamp}.{payload}"
        signature = hmac.new(
            settings.stripe_webhook_secret.encode(),
            signed_payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"t={timestamp},v1={signature}"
```

---

## 4. Frontend Testing (Vitest + Testing Library)

### 4.1 Structure

```
frontend/src/
└── __tests__/
    ├── setup.ts                      # Vitest setup (cleanup, mocks)
    ├── components/
    │   ├── contract-timeline.test.tsx
    │   ├── milestone-card.test.tsx
    │   ├── payment-section.test.tsx
    │   └── contract-wizard.test.tsx
    ├── hooks/
    │   ├── use-contracts.test.ts
    │   └── use-payments.test.ts
    └── validation/
        └── schemas.test.ts           # Zod schema tests
```

### 4.2 Setup (`src/__tests__/setup.ts`)

```typescript
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: "test-contract-id" }),
  usePathname: () => "/dashboard/contracts",
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
```

### 4.3 Component Tests

```typescript
// src/__tests__/components/contract-timeline.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContractTimeline } from "@/components/contracts/contract-timeline";

describe("ContractTimeline", () => {
  const milestones = [
    { id: "1", title: "Deposit", status: "RELEASED", amount: 10000, dueDate: "2026-08-01" },
    { id: "2", title: "Final Delivery", status: "PENDING", amount: 40000, dueDate: "2026-09-01" },
  ];

  it("renders all milestones in order", () => {
    render(<ContractTimeline milestones={milestones} />);
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Final Delivery")).toBeInTheDocument();
  });

  it("shows released milestone as completed", () => {
    render(<ContractTimeline milestones={milestones} />);
    const depositItem = screen.getByText("Deposit").closest("li");
    expect(depositItem).toHaveClass("line-through");
  });

  it("shows pending milestone as active", () => {
    render(<ContractTimeline milestones={milestones} />);
    const deliveryItem = screen.getByText("Final Delivery").closest("li");
    expect(deliveryItem).not.toHaveClass("line-through");
  });

  it("displays formatted currency amounts", () => {
    render(<ContractTimeline milestones={milestones} />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$400.00")).toBeInTheDocument();
  });

  it("renders empty state when no milestones", () => {
    render(<ContractTimeline milestones={[]} />);
    expect(screen.getByText("No milestones yet")).toBeInTheDocument();
  });
});
```

### 4.4 Hook Tests

```typescript
// src/__tests__/hooks/use-contracts.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContracts } from "@/hooks/use-contracts";

describe("useContracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contracts from API", async () => {
    const mockContracts = [
      { id: "1", title: "Q4 Supply", status: "FUNDED", amount: 50000 },
      { id: "2", title: "Software Dev", status: "DRAFT", amount: 25000 },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockContracts, pagination: { page: 1, limit: 20, total: 2 } }),
    } as Response);

    const { result } = renderHook(() => useContracts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].title).toBe("Q4 Supply");
  });

  it("handles API error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useContracts());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 4.5 Zod Schema Tests

```typescript
// src/__tests__/validation/schemas.test.ts

import { describe, it, expect } from "vitest";
import { contractSchema } from "@/lib/validations/contract";

describe("contractSchema", () => {
  const validContract = {
    title: "Q4 Widget Supply",
    description: "10k units",
    amount: 50000,
    currency: "usd",
    sellerId: "550e8400-e29b-41d4-a716-446655440000",
    milestones: [
      { title: "Deposit", amount: 10000, dueDate: "2026-08-01" },
    ],
  };

  it("accepts valid contract input", () => {
    const result = contractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = contractSchema.safeParse({ ...validContract, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = contractSchema.safeParse({ ...validContract, amount: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched milestone amounts (sum != total)", () => {
    const result = contractSchema.safeParse({
      ...validContract,
      milestones: [
        { title: "Deposit", amount: 10000, dueDate: "2026-08-01" },
        { title: "Final", amount: 30000, dueDate: "2026-09-01" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid currency code", () => {
    const result = contractSchema.safeParse({ ...validContract, currency: "btc" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID seller ID", () => {
    const result = contractSchema.safeParse({ ...validContract, sellerId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
```

---

## 5. E2E Testing (Playwright)

The E2E suite is the **Pro-tier differentiator**. Three critical user journeys are automated to run against a real browser.

### 5.1 Structure

```
e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.ts                  # API-based login helper (skip UI auth)
│   └── test-data.ts             # Seeded test accounts
├── tests/
│   ├── auth.setup.ts            # Global auth setup (seed test users)
│   ├── journey-1-buyer-flow.spec.ts
│   ├── journey-2-seller-flow.spec.ts
│   └── journey-3-admin-flow.spec.ts
└── reports/                     # Test reports (gitignored)
```

### 5.2 Playwright Config (`e2e/playwright.config.ts`)

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "reports" }], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
      dependencies: ["setup"],
    },
  ],
});
```

### 5.3 Auth Setup (`e2e/tests/auth.setup.ts`)

```typescript
import { test as setup, expect } from "@playwright/test";
import { execSync } from "child_process";

setup("seed test users and authenticate", async ({ request }) => {
  // Seed test users via backend API (not UI — faster and more reliable)
  const seedResult = execSync(
    "cd ../backend && python scripts/seed_test_data.py",
    { encoding: "utf-8" }
  );
  console.log("Seed output:", seedResult);

  // Verify users exist by logging in
  const buyerLogin = await request.post("/api/v1/auth/login", {
    data: { email: "e2e-buyer@test.com", password: "TestPass123!" },
  });
  expect(buyerLogin.ok()).toBeTruthy();
  const buyerToken = (await buyerLogin.json()).access_token;

  const sellerLogin = await request.post("/api/v1/auth/login", {
    data: { email: "e2e-seller@test.com", password: "TestPass123!" },
  });
  expect(sellerLogin.ok()).toBeTruthy();
  const sellerToken = (await sellerLogin.json()).access_token;

  const adminLogin = await request.post("/api/v1/auth/login", {
    data: { email: "e2e-admin@test.com", password: "TestPass123!" },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminToken = (await adminLogin.json()).access_token;

  // Store tokens in environment for test use
  process.env.E2E_BUYER_TOKEN = buyerToken;
  process.env.E2E_SELLER_TOKEN = sellerToken;
  process.env.E2E_ADMIN_TOKEN = adminToken;
});
```

### 5.4 Journey 1 — Buyer Creates & Funds Contract

```typescript
// e2e/tests/journey-1-buyer-flow.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Journey 1: Buyer creates contract and funds", () => {
  test.use({
    storageState: undefined, // Use API auth via localStorage
  });

  test.beforeEach(async ({ page }) => {
    // Inject JWT into localStorage before page load
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("auth_token", token);
    }, process.env.E2E_BUYER_TOKEN);
  });

  test("buyer creates a new contract with milestones", async ({ page }) => {
    await page.goto("/dashboard/contracts/new");

    // Step 1: Contract details
    await page.fill("input[name='title']", "E2E Test Supply Contract");
    await page.fill("textarea[name='description']", "10,000 units tested via Playwright");
    await page.fill("input[name='amount']", "25000");
    await page.selectOption("select[name='currency']", "usd");
    await page.click("button:has-text('Continue')");

    // Step 2: Add milestones
    await page.fill("input[name='milestones.0.title']", "Initial Payment");
    await page.fill("input[name='milestones.0.amount']", "5000");
    await page.fill("input[name='milestones.1.title']", "Final Delivery");
    await page.fill("input[name='milestones.1.amount']", "20000");
    await page.click("button:has-text('Continue')");

    // Step 3: Preview & submit
    await expect(page.locator("text=E2E Test Supply Contract")).toBeVisible();
    await expect(page.locator("text=$250.00")).toBeVisible();
    await page.click("button:has-text('Create Contract')");

    // Verify redirect to contract detail
    await expect(page).toHaveURL(/\/dashboard\/contracts\//);
    await expect(page.locator("text=DRAFT")).toBeVisible();
  });

  test("buyer funds a DRAFT contract", async ({ page }) => {
    // Navigate to an existing DRAFT contract
    await page.goto("/dashboard/contracts");
    await page.click("a:has-text('E2E Test Supply Contract')");
    await page.click("button:has-text('Fund Contract')");

    // Stripe Checkout iframe opens — use test card
    const stripeFrame = page.frameLocator("iframe[title*='Stripe']");
    await stripeFrame.locator("input[placeholder='4242424242424242']").fill("4242424242424242");
    await stripeFrame.locator("input[placeholder='MM / YY']").fill("1230");
    await stripeFrame.locator("input[placeholder='CVC']").fill("123");
    await stripeFrame.locator("button:has-text('Pay')").click();

    // Wait for redirect back
    await expect(page.locator("text=FUNDED")).toBeVisible({ timeout: 15000 });
  });
});
```

### 5.5 Journey 2 — Seller Completes Milestone

```typescript
// e2e/tests/journey-2-seller-flow.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Journey 2: Seller completes milestone, buyer approves", () => {
  test("seller views assigned contract and completes milestone", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("auth_token", token);
    }, process.env.E2E_SELLER_TOKEN);

    await page.goto("/dashboard/contracts");
    await page.click("a:has-text('E2E Test Supply Contract')");

    // Verify contract details
    await expect(page.locator("text=FUNDED")).toBeVisible();
    await expect(page.locator("text=Initial Payment")).toBeVisible();

    // Seller marks milestone as complete
    await page.click("button:has-text('Complete Milestone')");
    await page.fill("textarea[name='completion_notes']", "Goods shipped, tracking: TRACK123");
    await page.click("button:has-text('Confirm')");

    // Verify milestone status updated
    await expect(page.locator("text=Pending Approval")).toBeVisible();
  });
});
```

### 5.6 Mobile Viewport Testing

```typescript
// Included via Playwright config project
// e2e/tests/journey-1-buyer-flow.spec.ts

test("dashboard is responsive on mobile", async ({ page }) => {
  await page.evaluate((token) => {
    localStorage.setItem("auth_token", token);
  }, process.env.E2E_BUYER_TOKEN);

  await page.goto("/dashboard/contracts");

  // Hamburger menu should be visible on mobile
  await expect(page.locator("button[aria-label='Open sidebar']")).toBeVisible();

  // Contract table should be scrollable horizontally
  const table = page.locator("table");
  const tableBox = await table.boundingBox();
  expect(tableBox!.width).toBeLessThan(400);

  // Tap hamburger, verify sidebar opens
  await page.locator("button[aria-label='Open sidebar']").click();
  await expect(page.locator("nav[aria-label='Sidebar']")).toBeVisible();
});
```

---

## 6. CI Integration

### 6.1 GitHub Actions — Backend + Frontend (Every Push)

```yaml
# .github/workflows/test.yml

name: Test Suite
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: kuber
          POSTGRES_PASSWORD: kuber_test
          POSTGRES_DB: kuber_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
      - run: pip install -r backend/requirements-dev.txt
      - run: pytest backend/tests/ --cov=backend/app --cov-report=term-missing
        env:
          DATABASE_URL: postgresql+asyncpg://kuber:kuber_test@localhost:5432/kuber_test
          STRIPE_SECRET_KEY: sk_test_mock
          STRIPE_WEBHOOK_SECRET: whsec_mock

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run test:coverage
        working-directory: frontend
      - run: npm run typecheck
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend

  e2e:
    if: github.event_name == 'pull_request' && github.base_ref == 'main'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: kuber
          POSTGRES_PASSWORD: kuber_test
          POSTGRES_DB: kuber_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: pip install -r backend/requirements-dev.txt
      - run: npm ci
        working-directory: frontend
      - run: npm ci
        working-directory: e2e
      - run: npx playwright install chromium
        working-directory: e2e
      - run: |
          cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          cd frontend && npm run build && npm start -- -p 3000 &
      - run: npx playwright test
        working-directory: e2e
        env:
          E2E_BASE_URL: http://localhost:3000
          DATABASE_URL: postgresql+asyncpg://kuber:kuber_test@localhost:5432/kuber_test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/reports/
```

### 6.2 Coverage Reporting

Coverage is printed inline in CI output via `--cov-report=term-missing`. A summary badge can be generated for the README:

```yaml
# Additional step in backend/frontend jobs
- run: |
    total=$(pytest backend/tests/ --cov=backend/app --cov-report=term | tail -1 | grep -oP '\d+%')
    echo "COVERAGE=$total" >> $GITHUB_ENV
```

---

## 7. Test Data & Factories

### 7.1 Contract Factory (`backend/tests/fixtures/contracts.py`)

```python
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from app.models.escrow_contract import EscrowContract, ContractStatus
from app.models.milestone import Milestone

class ContractFactory:
    @staticmethod
    async def create(db_session, buyer_id: uuid.UUID, seller_id: uuid.UUID,
                     status: ContractStatus = ContractStatus.DRAFT,
                     **overrides) -> EscrowContract:
        contract = EscrowContract(
            buyer_id=buyer_id,
            seller_id=seller_id,
            title=overrides.get("title", "Test Contract"),
            description=overrides.get("description", "Test description"),
            amount=overrides.get("amount", Decimal("50000.00")),
            currency=overrides.get("currency", "usd"),
            status=status,
            platform_fee_percent=overrides.get("platform_fee_percent", Decimal("5.00")),
        )
        db_session.add(contract)
        await db_session.flush()
        return contract

    @staticmethod
    async def with_milestones(db_session, buyer_id: uuid.UUID, seller_id: uuid.UUID,
                               milestone_data: list[dict] | None = None,
                               **overrides) -> tuple[EscrowContract, list[Milestone]]:
        contract = await ContractFactory.create(db_session, buyer_id, seller_id, **overrides)
        milestones = []
        data = milestone_data or [
            {"title": "Deposit", "amount": Decimal("10000.00"), "due_date": datetime(2026, 8, 1, tzinfo=timezone.utc)},
            {"title": "Final", "amount": Decimal("40000.00"), "due_date": datetime(2026, 9, 1, tzinfo=timezone.utc)},
        ]
        for md in data:
            milestone = Milestone(
                contract_id=contract.id,
                title=md["title"],
                amount=md["amount"],
                due_date=md["due_date"],
            )
            db_session.add(milestone)
            milestones.append(milestone)
        await db_session.flush()
        return contract, milestones
```

### 7.2 Database Seeding Script (`backend/scripts/seed_test_data.py`)

```python
"""Seed test data for E2E and integration tests.

Usage:
    python scripts/seed_test_data.py [--reset]

Creates:
    - e2e-buyer@test.com (buyer, verified)
    - e2e-seller@test.com (seller, verified, with Stripe Connect account)
    - e2e-admin@test.com (admin, verified)
    - 2 sample DRAFT contracts for the buyer
    - 1 FUNDED contract with milestones for E2E flow
"""
import asyncio
import sys
from app.database import AsyncSessionFactory
from app.models.user import User, UserRole
from app.models.escrow_contract import EscrowContract, ContractStatus
from app.models.milestone import Milestone
from app.services.auth import hash_password

SEED_USERS = [
    {
        "email": "e2e-buyer@test.com",
        "password": "TestPass123!",
        "name": "E2E Buyer",
        "role": UserRole.BUYER,
    },
    {
        "email": "e2e-seller@test.com",
        "password": "TestPass123!",
        "name": "E2E Seller",
        "role": UserRole.SELLER,
        "stripe_account_id": "acct_e2e_seller",
    },
    {
        "email": "e2e-admin@test.com",
        "password": "TestPass123!",
        "name": "E2E Admin",
        "role": UserRole.ADMIN,
    },
]


async def seed():
    async with AsyncSessionFactory() as session:
        for user_data in SEED_USERS:
            existing = await session.execute(
                "SELECT id FROM users WHERE email = :email",
                {"email": user_data["email"]},
            )
            if existing.scalar():
                print(f"User {user_data['email']} already exists, skipping.")
                continue

            user = User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                email_verified=True,
                stripe_account_id=user_data.get("stripe_account_id"),
            )
            session.add(user)
            await session.flush()

            if user_data["role"] == UserRole.BUYER:
                # Create sample contracts
                contract = EscrowContract(
                    buyer_id=user.id,
                    seller_id=...,  # Reference e2e-seller
                    title="E2E Sample Contract",
                    amount=Decimal("50000.00"),
                    currency="usd",
                    status=ContractStatus.DRAFT,
                )
                session.add(contract)

        await session.commit()
        print("Seed complete. Users: e2e-buyer, e2e-seller, e2e-admin / TestPass123!")


if __name__ == "__main__":
    asyncio.run(seed())
```

---

## 8. Running Tests Locally

### 8.1 Prerequisites

```bash
# Start PostgreSQL (Docker)
docker run -d --name kuber-test-db \
  -e POSTGRES_USER=kuber \
  -e POSTGRES_PASSWORD=kuber_test \
  -e POSTGRES_DB=kuber_test \
  -p 5432:5432 \
  postgres:16-alpine

# Set environment
export DATABASE_URL="postgresql+asyncpg://kuber:kuber_test@localhost:5432/kuber_test"
export STRIPE_SECRET_KEY="sk_test_<your_test_key>"
export STRIPE_WEBHOOK_SECRET="whsec_<your_test_secret>"
```

### 8.2 Backend Tests

```bash
# All backend tests
cd backend
pytest

# With coverage
pytest --cov=app tests/
pytest --cov=app tests/ --cov-report=html  # HTML report

# By category
pytest tests/unit/ -v
pytest tests/integration/ -v

# By keyword
pytest -k "state_machine" -v
pytest -k "webhook" -v

# Fast fail on first error
pytest -x tests/integration/

# Re-run last failed
pytest --lf
```

### 8.3 Frontend Tests

```bash
# All frontend tests
cd frontend
npm test

# Watch mode
npm test -- --watch

# With coverage
npm run test:coverage

# Specific file
npx vitest src/__tests__/components/contract-timeline.test.tsx

# UI mode (Vitest GUI)
npx vitest --ui
```

### 8.4 E2E Tests (Pro Tier)

```bash
# Start backend + frontend
cd backend && uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev &

# Seed test data
cd backend && python scripts/seed_test_data.py

# All E2E tests
cd e2e
npx playwright test

# With browser visible
npx playwright test --headed

# Specific test file
npx playwright test tests/journey-1-buyer-flow.spec.ts

# Debug mode
npx playwright test --debug

# View last report
npx playwright show-report

# Mobile viewport only
npx playwright test --project=mobile
```

---

## 9. Quality Gates

Before every release (tag or PR merge to `main`), the following gates must pass:

| Gate | Check | Enforcement |
|------|-------|-------------|
| **All tests pass** | `pytest && npm test && npx playwright test` | CI pipeline — blocks merge |
| **Backend coverage ≥ 90%** models + services | `pytest --cov=app/app/services --cov=app/app/models` | CI threshold via `.coveragerc` |
| **Backend coverage ≥ 80%** routes | `pytest --cov=app/app/api` | CI threshold via `.coveragerc` |
| **Frontend coverage ≥ 80%** | `npm run test:coverage` | CI threshold in Vitest config |
| **No flaky tests** | 3 consecutive green runs | Manual check before release branch |
| **No P0/P1 security findings** | `bandit -r backend/` | CI step with exit code on high severity |
| **TypeScript strict passes** | `npm run typecheck` | CI — no `any` or `null` escapes |
| **Lint passes** | `npm run lint` | CI — ESLint with `error` severity |

### `.coveragerc` Configuration

```ini
# backend/.coveragerc
[run]
source = app
omit = app/tests/*, app/alembic/*

[report]
exclude_lines =
    pragma: no cover
    raise NotImplementedError
    if __name__ == "__main__":
    def __repr__
    @abstractmethod

[coverage:cobertura]
show_missing = True
fail_under = 85
```

### Release Checklist Script

```bash
#!/usr/bin/env bash
# scripts/pre-release-check.sh
# Run from repo root. Exit code 0 = ready to release.

set -euo pipefail

echo "=== Backend Tests ==="
cd backend && pytest --cov=app --cov-fail-under=85
echo "PASS"

echo "=== Security Scan ==="
bandit -r app/ -x app/tests,app/alembic -ll
echo "PASS"

echo "=== Frontend Tests ==="
cd ../frontend && npm run test:coverage && npm run typecheck && npm run lint
echo "PASS"

echo "=== E2E Tests ==="
cd ../e2e && npx playwright test
echo "PASS"

echo ""
echo "✓ All quality gates passed. Ready for release."
```

---

> **Pro Tier Reminder:** This entire testing suite — every fixture, every test file, every CI configuration, every seed script — is included only in the **Pro ($249)** edition. Standard ($149) buyers receive the source code without any test files. This is the single strongest argument for upgrading.
