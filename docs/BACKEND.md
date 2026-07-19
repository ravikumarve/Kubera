# KUBERA — Backend Architecture Guide

> **Boilerplate Status**: This document describes the backend architecture of the KUBERA boilerplate. It is sold as source code — not a live platform. Every component is designed to be modular, extensible, and ready for production deployment after your own configuration and hardening.

---

## Table of Contents

1. [Tech Stack Deep Dive](#1-tech-stack-deep-dive)
2. [Project Structure](#2-project-structure)
3. [API Design Principles](#3-api-design-principles)
4. [Escrow Engine](#4-escrow-engine)
5. [Stripe Connect Integration](#5-stripe-connect-integration)
6. [Multi-currency Architecture](#6-multi-currency-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Background Jobs](#8-background-jobs)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Performance Considerations](#11-performance-considerations)

---

## 1. Tech Stack Deep Dive

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime** | Python 3.12+ | Fast async support, pattern matching, improved type hints |
| **Framework** | FastAPI | Async-native, OpenAPI auto-generation, Pydantic v2 integration |
| **ASGI Server** | Uvicorn + Gunicorn | Production-grade, graceful shutdown, worker management |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, well-tested, rich query API |
| **Driver** | asyncpg | Fastest PostgreSQL async driver for Python |
| **Migrations** | Alembic | Declarative, auto-generation, reversible |
| **Validation** | Pydantic v2 | Rust-core `pydantic-core`, 5-50x faster than v1 |
| **Payments** | Stripe SDK (async) | Stripe Connect for marketplace escrow |
| **Background Tasks** | Celery + Redis | Reliable task queue with retry & scheduling |
| **Cache** | Redis | Session store, rate-limit counters, temp data |
| **Testing** | pytest + httpx + pytest-asyncio | Fast, fixtures, async support |
| **Mocking** | pytest-mock + stripe-testing | Deterministic payment testing |

### Why This Stack

- **FastAPI over Django REST**: Lighter, async-first, better DX for API-only backends. KUBERA has no admin panel or ORM-heavy CRUD — FastAPI's dependency injection and Pydantic integration reduce boilerplate significantly.
- **SQLAlchemy 2.0 async over raw asyncpg**: SQLAlchemy provides migrations, relationship loading, and query builder ergonomics. Raw asyncpg is reserved for hot-path queries where every millisecond matters (e.g., escrow balance checks).
- **Celery over FastAPI BackgroundTasks**: BackgroundTasks in FastAPI run in-process and block shutdown. Celery provides persistence, retries, priority queues, and worker isolation — critical for payment webhook processing.

---

## 2. Project Structure

```
backend/
├── alembic/
│   ├── versions/          # Migration files
│   ├── env.py
│   └── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory, lifespan, middleware
│   ├── config.py            # Pydantic Settings (env-based config)
│   ├── database.py          # AsyncEngine, AsyncSession factory
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # Shared dependencies (get_db, get_current_user)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py    # Aggregates all v1 routers
│   │       ├── auth.py      # Login, register, token refresh
│   │       ├── users.py     # User CRUD, profile
│   │       ├── contracts.py # Escrow contract endpoints
│   │       ├── milestones.py
│   │       ├── disputes.py
│   │       ├── payments.py  # Stripe PaymentIntent creation
│   │       ├── webhooks.py  # Stripe webhook receiver
│   │       ├── currencies.py
│   │       └── admin.py     # Admin-only routes
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py          # DeclarativeBase, common mixins (TimestampMixin)
│   │   ├── user.py
│   │   ├── escrow_contract.py
│   │   ├── milestone.py
│   │   ├── dispute.py
│   │   ├── payment.py
│   │   ├── currency.py
│   │   └── webhook_event.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── escrow.py
│   │   ├── milestone.py
│   │   ├── dispute.py
│   │   ├── payment.py
│   │   └── common.py        # PaginatedResponse, ErrorResponse, etc.
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT encode/decode, password hashing
│   │   ├── escrow.py        # Escrow state machine, business logic
│   │   ├── stripe_service.py # Stripe API abstraction
│   │   ├── currency.py      # Exchange rate fetching & conversion
│   │   ├── notification.py  # Email/Slack/Push notifications
│   │   └── webhook_handler.py # Webhook event dispatching
│   │
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── state_machine.py # EscrowState enum, transitions, guards
│   │   ├── errors.py        # Domain-specific exceptions
│   │   └── validators.py    # Contract validation rules
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py    # Celery app instance
│   │   ├── cleanup.py       # Expired contract cleanup
│   │   ├── notifications.py # Milestone reminders
│   │   └── webhooks.py      # Webhook retry logic
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── logging.py       # Structured request logging
│   │   ├── error_handler.py # Global exception handlers
│   │   └── rate_limit.py    # Redis-backed rate limiter
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py      # Crypto helpers, API key generation
│       └── pagination.py    # Cursor & offset pagination helpers
│
├── tests/
│   ├── conftest.py          # Fixtures: db session, test client, stripe mocks
│   ├── factories/           # Model factories (factory_boy or custom)
│   ├── unit/
│   │   ├── test_state_machine.py
│   │   ├── test_escrow_service.py
│   │   ├── test_currency.py
│   │   └── test_auth.py
│   ├── integration/
│   │   ├── test_contract_endpoints.py
│   │   ├── test_payment_flow.py
│   │   └── test_webhooks.py
│   └── conftest_stripe.py   # Stripe mock fixtures
│
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
│
├── Dockerfile
├── docker-compose.yml        # API + Redis + Celery worker
└── pyproject.toml
```

---

## 3. API Design Principles

### 3.1 Versioning

All routes are prefixed with `/api/v1/`. Versioning is URL-based (not header-based) because it is explicit, cache-friendly, and easier for boilerplate consumers to understand.

```python
# app/api/v1/router.py
from fastapi import APIRouter
from . import auth, users, contracts, milestones, disputes, payments, webhooks, currencies, admin

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(contracts.router, prefix="/contracts", tags=["Escrow Contracts"])
router.include_router(milestones.router, prefix="/milestones", tags=["Milestones"])
router.include_router(disputes.router, prefix="/disputes", tags=["Disputes"])
router.include_router(payments.router, prefix="/payments", tags=["Payments"])
router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
router.include_router(currencies.router, prefix="/currencies", tags=["Currencies"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
```

### 3.2 Consistent Error Responses

Every error follows a uniform schema:

```python
# app/schemas/common.py
from datetime import datetime, timezone
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    field: str | None = None
    message: str

class ErrorResponse(BaseModel):
    error: str                     # Machine-readable code: "CONTRACT_NOT_FOUND"
    message: str                   # Human-readable description
    details: list[ErrorDetail] = []  # Validation errors per field
    timestamp: datetime = datetime.now(timezone.utc)
    request_id: str | None = None
```

```python
# app/middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
from app.engine.errors import EscrowDomainError, EscrowStateTransitionError

async def escrow_domain_error_handler(request: Request, exc: EscrowDomainError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.code,
            "message": str(exc),
            "details": exc.details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": getattr(request.state, "request_id", None),
        },
    )

def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(EscrowDomainError, escrow_domain_error_handler)
    app.add_exception_handler(EscrowStateTransitionError, escrow_domain_error_handler)
```

### 3.3 OpenAPI / Swagger

FastAPI generates OpenAPI 3.1 automatically. Configuration in `app/main.py`:

```python
app = FastAPI(
    title="KUBERA API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "Login, register, token ops"},
        {"name": "Escrow Contracts", "description": "Create, fund, release, dispute"},
        {"name": "Payments", "description": "Stripe PaymentIntent integration"},
        {"name": "Webhooks", "description": "Stripe event processing"},
    ],
)
```

---

## 4. Escrow Engine

The escrow engine is the heart of KUBERA. It enforces a strict state machine that prevents invalid transitions and ensures funds are never released without proper authorization.

### 4.1 EscrowState Enum & State Machine

```python
# app/engine/state_machine.py
from enum import StrEnum, auto
from dataclasses import dataclass

class EscrowState(StrEnum):
    DRAFT = "DRAFT"
    PENDING_FUNDING = "PENDING_FUNDING"
    FUNDED = "FUNDED"
    IN_PROGRESS = "IN_PROGRESS"    # Milestone releases underway
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    REFUNDED = "REFUNDED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

# Allowed transitions: {(from_state, to_state): guard_function}
TRANSITIONS: dict[tuple[EscrowState, EscrowState], str] = {
    (EscrowState.DRAFT, EscrowState.PENDING_FUNDING): "validate_contract_ready",
    (EscrowState.PENDING_FUNDING, EscrowState.FUNDED): "validate_funding_received",
    (EscrowState.FUNDED, EscrowState.IN_PROGRESS): "validate_first_milestone",
    (EscrowState.IN_PROGRESS, EscrowState.IN_PROGRESS): "validate_milestone_release",
    (EscrowState.IN_PROGRESS, EscrowState.COMPLETED): "validate_all_milestones_released",
    (EscrowState.DRAFT, EscrowState.CANCELLED): "validate_canceller_is_creator",
    (EscrowState.PENDING_FUNDING, EscrowState.CANCELLED): "validate_no_funds_received",
    (EscrowState.FUNDED, EscrowState.DISPUTED): "validate_dispute_has_evidence",
    (EscrowState.IN_PROGRESS, EscrowState.DISPUTED): "validate_dispute_has_evidence",
    (EscrowState.DISPUTED, EscrowState.FUNDED): "validate_dispute_resolved_buyer",
    (EscrowState.DISPUTED, EscrowState.REFUNDED): "validate_dispute_resolved_refund",
    (EscrowState.DISPUTED, EscrowState.COMPLETED): "validate_dispute_resolved_seller",
    (EscrowState.PENDING_FUNDING, EscrowState.EXPIRED): "validate_expiration_window",
    (EscrowState.FUNDED, EscrowState.REFUNDED): "validate_both_parties_consent",
}

@dataclass
class TransitionGuard:
    name: str
    description: str

class EscrowStateMachine:
    def __init__(self, contract: "EscrowContract"):
        self.contract = contract
        self._current = EscrowState(contract.status)

    def transition(self, target: EscrowState, context: dict | None = None) -> EscrowState:
        key = (self._current, target)
        if key not in TRANSITIONS:
            raise EscrowStateTransitionError(
                f"Cannot transition from {self._current.value} to {target.value}",
                code="INVALID_STATE_TRANSITION",
            )
        context = context or {}
        self._validate_guard(TRANSITIONS[key], context)
        self._current = target
        return self._current

    def _validate_guard(self, guard_name: str, context: dict) -> None:
        guard_method = getattr(self, f"_{guard_name}", None)
        if guard_method and not guard_method(context):
            raise EscrowStateTransitionError(
                f"Guard '{guard_name}' rejected transition",
                code="GUARD_REJECTED",
            )
```

### 4.2 SQLAlchemy Models

```python
# app/models/escrow_contract.py
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampMixin, Base
from app.engine.state_machine import EscrowState

class EscrowContract(TimestampMixin, Base):
    __tablename__ = "escrow_contracts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    amount: Mapped[int] = mapped_column(Numeric(20, 0), comment="Amount in smallest currency unit (e.g., cents)")
    currency: Mapped[str] = mapped_column(String(3), default="USD", comment="ISO 4217")
    fee_amount: Mapped[int] = mapped_column(Numeric(20, 0), default=0, comment="Platform fee in smallest unit")

    status: Mapped[EscrowState] = mapped_column(
        Enum(EscrowState, name="escrow_state"),
        default=EscrowState.DRAFT,
        nullable=False,
    )

    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    stripe_transfer_ids: Mapped[str | None] = mapped_column(Text, comment="JSON array of transfer IDs")

    expires_at: Mapped[datetime | None] = mapped_column()
    funded_at: Mapped[datetime | None] = mapped_column()
    completed_at: Mapped[datetime | None] = mapped_column()

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], lazy="selectin")
    seller = relationship("User", foreign_keys=[seller_id], lazy="selectin")
    milestones = relationship("Milestone", back_populates="contract", lazy="selectin",
                              order_by="Milestone.order_index")
    disputes = relationship("Dispute", back_populates="contract", lazy="selectin")

    def to_state_machine(self) -> EscrowStateMachine:
        return EscrowStateMachine(self)
```

### 4.3 Milestone Model

```python
# app/models/milestone.py
from decimal import Decimal
from sqlalchemy import String, Numeric, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampMixin, Base
import enum

class MilestoneStatus(StrEnum):
    PENDING = "PENDING"
    RELEASED = "RELEASED"
    DISPUTED = "DISPUTED"

class Milestone(TimestampMixin, Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("escrow_contracts.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), comment="Percentage of total (e.g., 25.00)")
    amount: Mapped[int] = mapped_column(Numeric(20, 0), comment="Calculated amount in smallest unit")
    due_date: Mapped[datetime | None] = mapped_column()
    status: Mapped[MilestoneStatus] = mapped_column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    stripe_transfer_id: Mapped[str | None] = mapped_column(String(255))

    proof_documents: Mapped[list["MilestoneDocument"]] = relationship(
        back_populates="milestone", lazy="selectin"
    )
    contract = relationship("EscrowContract", back_populates="milestones")
```

### 4.4 Dispute Workflow

```python
# app/models/dispute.py
class DisputeStatus(StrEnum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED_BUYER = "RESOLVED_BUYER"
    RESOLVED_SELLER = "RESOLVED_SELLER"
    RESOLVED_REFUND = "RESOLVED_REFUND"

class Dispute(TimestampMixin, Base):
    __tablename__ = "disputes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("escrow_contracts.id"), nullable=False)
    raised_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(1000))
    status: Mapped[DisputeStatus] = mapped_column(Enum(DisputeStatus), default=DisputeStatus.OPEN)
    resolution_notes: Mapped[str | None] = mapped_column(Text)
    resolved_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    resolved_at: Mapped[datetime | None] = mapped_column()

    contract = relationship("EscrowContract", back_populates="disputes")
    evidence = relationship("DisputeEvidence", back_populates="dispute", lazy="selectin")
```

**Dispute flow:**
1. Buyer or seller raises a dispute → contract transitions to `DISPUTED`, all milestone releases pause.
2. Both parties upload evidence (documents, communications).
3. Admin (or arbitrator) reviews and sets status to `UNDER_REVIEW`.
4. Resolution options:
   - `RESOLVED_BUYER`: Contract returns to `FUNDED`, buyer can choose to cancel or continue.
   - `RESOLVED_SELLER`: Contract transitions to `COMPLETED`, remaining funds released.
   - `RESOLVED_REFUND`: Full refund via Stripe Transfer reversal, contract → `REFUNDED`.

### 4.5 State Machine Validation in Practice

```python
# app/services/escrow.py
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.milestone import Milestone, MilestoneStatus

class EscrowService:
    def __init__(self, db: AsyncSession, stripe_svc: StripeService):
        self.db = db
        self.stripe = stripe_svc

    async def release_milestone(self, contract_id: uuid.UUID, milestone_id: uuid.UUID, user_id: uuid.UUID) -> Milestone:
        contract = await self.db.get(EscrowContract, contract_id)
        milestone = await self.db.get(Milestone, milestone_id)

        if milestone.status != MilestoneStatus.PENDING:
            raise EscrowDomainError("Milestone already released", code="MILESTONE_ALREADY_RELEASED")

        sm = contract.to_state_machine()
        new_state = sm.transition(EscrowState.IN_PROGRESS, {"milestone": milestone})

        transfer = await self.stripe.create_transfer(
            amount=milestone.amount,
            currency=contract.currency,
            destination_stripe_account_id=contract.seller.stripe_account_id,
            transfer_group=str(contract.id),
        )

        milestone.status = MilestoneStatus.RELEASED
        milestone.stripe_transfer_id = transfer.id
        contract.status = new_state.value

        if all(m.status == MilestoneStatus.RELEASED for m in contract.milestones):
            final_state = sm.transition(EscrowState.COMPLETED)
            contract.status = final_state.value
            contract.completed_at = datetime.now(timezone.utc)

        await self.db.commit()
        return milestone
```

---

## 5. Stripe Connect Integration

KUBERA uses **Stripe Connect** with a **platform** architecture. The platform (your KUBERA instance) collects funds, takes a fee, and disburses to sellers.

### 5.1 Account Setup

```python
# app/services/stripe_service.py
import stripe
from dataclasses import dataclass

@dataclass
class StripeAccountResult:
    account_id: str
    onboarding_url: str | None = None

class StripeService:
    def __init__(self, api_key: str, webhook_secret: str):
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret

    async def create_connected_account(self, email: str, country: str) -> StripeAccountResult:
        account = await stripe.Account.create_async(
            type="express",
            country=country,
            email=email,
            capabilities={
                "transfers": {"requested": True},
            },
            business_type="individual",
        )
        return StripeAccountResult(account_id=account.id)

    async def create_account_link(self, account_id: str, refresh_url: str, return_url: str) -> str:
        link = await stripe.AccountLink.create_async(
            account=account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return link.url
```

### 5.2 Payment Flow

```python
    async def create_payment_intent(
        self,
        amount: int,
        currency: str,
        buyer_stripe_id: str | None,
        contract_id: str,
        platform_fee: int,
    ) -> stripe.PaymentIntent:
        intent = await stripe.PaymentIntent.create_async(
            amount=amount,
            currency=currency.lower(),
            customer=buyer_stripe_id,
            metadata={"contract_id": contract_id},
            application_fee_amount=platform_fee,
            transfer_data={
                "destination": None,  # Set on milestone release
            },
            automatic_payment_methods={"enabled": True},
        )
        return intent

    async def create_transfer(
        self,
        amount: int,
        currency: str,
        destination_stripe_account_id: str,
        transfer_group: str,
    ) -> stripe.Transfer:
        transfer = await stripe.Transfer.create_async(
            amount=amount,
            currency=currency.lower(),
            destination=destination_stripe_account_id,
            transfer_group=transfer_group,
        )
        return transfer
```

### 5.3 Webhook Handling

```python
# app/api/v1/webhooks.py
from fastapi import APIRouter, Request, HTTPException
from app.services.stripe_service import StripeService
from app.services.webhook_handler import WebhookHandler

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_svc: StripeService = Depends(get_stripe_service)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_svc.webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    handler = WebhookHandler()
    await handler.dispatch(event)

    return {"received": True}
```

```python
# app/services/webhook_handler.py
import logging
from app.models.webhook_event import WebhookEvent

logger = logging.getLogger("kubera.webhooks")

class WebhookHandler:
    async def dispatch(self, event: stripe.Event) -> None:
        await self._persist_event(event)

        method_name = f"handle_{event.type.replace('.', '_')}"
        handler = getattr(self, method_name, self._handle_unknown)

        try:
            await handler(event)
        except Exception as e:
            logger.error("Webhook handler failed: %s — %s", event.type, e)
            await self._queue_retry(event)

    async def handle_payment_intent_succeeded(self, event: stripe.Event) -> None:
        pi = event.data.object
        contract_id = pi.metadata.get("contract_id")
        if not contract_id:
            return

        async with get_db_session() as db:
            contract = await db.get(EscrowContract, uuid.UUID(contract_id))
            sm = contract.to_state_machine()
            new_state = sm.transition(EscrowState.FUNDED, {"payment_intent": pi})
            contract.status = new_state.value
            contract.funded_at = datetime.now(timezone.utc)
            contract.stripe_payment_intent_id = pi.id
            await db.commit()

    async def handle_transfer_created(self, event: stripe.Event) -> None:
        transfer = event.data.object
        logger.info("Transfer created: %s — amount: %s", transfer.id, transfer.amount)

    async def handle_unknown(self, event: stripe.Event) -> None:
        logger.info("Unhandled webhook event: %s", event.type)

    async def _persist_event(self, event: stripe.Event) -> None:
        async with get_db_session() as db:
            webhook_event = WebhookEvent(
                stripe_event_id=event.id,
                type=event.type,
                data=event.data.object.to_dict(),
                created_at=datetime.fromtimestamp(event.created, tz=timezone.utc),
            )
            db.add(webhook_event)
            await db.commit()
```

**Critical design decision**: Webhook handlers are idempotent. The `WebhookEvent` table stores every received event by `stripe_event_id` (unique). Before processing, the handler checks if the event was already processed:

```python
    async def _is_duplicate(self, stripe_event_id: str) -> bool:
        async with get_db_session() as db:
            existing = await db.execute(
                select(WebhookEvent).where(WebhookEvent.stripe_event_id == stripe_event_id)
            )
            return existing.scalar_one_or_none() is not None
```

---

## 6. Multi-currency Architecture

### 6.1 Storage Convention

All monetary values are stored as **integers in the smallest currency unit** (cents for USD, pence for GBP, sen for JPY, etc.). This avoids floating-point rounding errors entirely.

```python
amount: int = 10000  # $100.00 in USD
```

### 6.2 Currency Model

```python
# app/models/currency.py
class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id: Mapped[int] = mapped_column(primary_key=True)
    base_currency: Mapped[str] = mapped_column(String(3), default="USD")
    target_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(20, 8), comment="1 base_currency = rate target_currency")
    updated_at: Mapped[datetime] = mapped_column()

    __table_args__ = (
        UniqueConstraint("base_currency", "target_currency", name="uq_currency_pair"),
    )
```

### 6.3 Exchange Rate Service

```python
# app/services/currency.py
class CurrencyService:
    def __init__(self, api_key: str, db: AsyncSession):
        self.api_key = api_key
        self.db = db
        self.cache = {}  # Simple in-memory cache; use Redis in production

    async def convert(self, amount: int, from_currency: str, to_currency: str) -> int:
        if from_currency == to_currency:
            return amount

        rate = await self._get_rate(from_currency, to_currency)
        converted = Decimal(str(amount)) * rate
        return int(converted.to_quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    async def _get_rate(self, from_currency: str, to_currency: str) -> Decimal:
        cache_key = f"{from_currency}:{to_currency}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        row = await self.db.execute(
            select(CurrencyRate).where(
                CurrencyRate.base_currency == from_currency,
                CurrencyRate.target_currency == to_currency,
            )
        )
        rate = row.scalar_one_or_none()

        if not rate or (datetime.now(timezone.utc) - rate.updated_at).hours > 1:
            rate = await self._fetch_and_store_rate(from_currency, to_currency)

        self.cache[cache_key] = rate.rate
        return rate.rate

    async def _fetch_and_store_rate(self, from_currency: str, to_currency: str) -> CurrencyRate:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://openexchangerates.org/api/latest.json",
                params={"app_id": self.api_key, "base": from_currency},
            )
            resp.raise_for_status()
            data = resp.json()
            rate_value = Decimal(str(data["rates"][to_currency]))

        rate = CurrencyRate(
            base_currency=from_currency,
            target_currency=to_currency,
            rate=rate_value,
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(rate)
        await self.db.commit()
        return rate
```

### 6.4 Supported Currencies

KUBERA supports all currencies that Stripe supports. The default set configured in `config.py`:

```python
SUPPORTED_CURRENCIES: list[str] = [
    "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR",
    "SGD", "HKD", "CHF", "NZD", "MXN", "BRL",
]
```

Stripe's zero-decimal currencies (`JPY`, `KRW`, etc.) are handled transparently — amounts are stored as-is since they are already in the smallest unit.

---

## 7. Authentication & Authorization

### 7.1 JWT Authentication

```python
# app/services/auth.py
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, secret_key: str, algorithm: str = "HS256", access_expire_minutes: int = 30):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_expire = access_expire_minutes
        self.refresh_expire = 60 * 24 * 7  # 7 days

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    def create_access_token(self, user_id: str, role: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": role,
            "iat": now,
            "exp": now + timedelta(minutes=self.access_expire),
            "type": "access",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user_id: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(minutes=self.refresh_expire),
            "type": "refresh",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except jwt.ExpiredSignatureError:
            raise EscrowDomainError("Token expired", code="TOKEN_EXPIRED", status_code=401)
        except jwt.InvalidTokenError:
            raise EscrowDomainError("Invalid token", code="INVALID_TOKEN", status_code=401)
```

### 7.2 FastAPI Dependency

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth import AuthService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    auth_svc: AuthService = Depends(get_auth_service),
) -> UserPayload:
    payload = auth_svc.decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return UserPayload(id=payload["sub"], role=payload["role"])

async def require_role(role: str):
    def _check(user: UserPayload = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _check
```

### 7.3 NextAuth.js Integration

The frontend uses NextAuth.js which communicates with the KUBERA backend via JWT. The flow:

1. User logs in via `/api/v1/auth/login` → receives access + refresh tokens.
2. NextAuth.js stores tokens in JWT session (httpOnly cookies).
3. Every API request from the frontend includes `Authorization: Bearer <access_token>`.
4. When the access token expires, NextAuth.js calls `/api/v1/auth/refresh` to get a new one.

```python
# app/api/v1/auth.py
@router.post("/login")
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": auth_svc.create_access_token(str(user.id), user.role),
        "refresh_token": auth_svc.create_refresh_token(str(user.id)),
        "token_type": "bearer",
        "expires_in": auth_svc.access_expire * 60,
    }

@router.post("/refresh")
async def refresh(request: RefreshRequest, auth_svc: AuthService = Depends(get_auth_service)):
    payload = auth_svc.decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return {
        "access_token": auth_svc.create_access_token(payload["sub"], payload.get("role", "user")),
        "token_type": "bearer",
    }
```

### 7.4 API Key Authentication (Future)

For programmatic access, a header-based API key scheme is pre-built but disabled by default:

```python
async def get_api_key(
    api_key: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    key = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == sha256(api_key.encode()).hexdigest(), ApiKey.is_active == True)
    )
    key = key.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key
```

---

## 8. Background Jobs

### 8.1 Celery Configuration

```python
# app/tasks/celery_app.py
from celery import Celery

celery_app = Celery(
    "kubera",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.cleanup", "app.tasks.notifications", "app.tasks.webhooks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,       # Re-deliver if worker crashes
    worker_prefetch_multiplier=1,  # Process one task at a time
    beat_schedule={
        "expired-contract-cleanup": {
            "task": "app.tasks.cleanup.cleanup_expired_contracts",
            "schedule": crontab(hour=0, minute=0),  # Daily at midnight
        },
        "milestone-reminders": {
            "task": "app.tasks.notifications.send_milestone_reminders",
            "schedule": crontab(hour=9, minute=0),  # Daily at 9 AM
        },
        "webhook-retry": {
            "task": "app.tasks.webhooks.retry_failed_webhooks",
            "schedule": crontab(hour="*/2"),  # Every 2 hours
        },
    },
)
```

### 8.2 Task Implementations

```python
# app/tasks/cleanup.py
from celery import shared_task
from datetime import datetime, timedelta, timezone

@shared_task(max_retries=3, default_retry_delay=300)
def cleanup_expired_contracts():
    """Transition contracts past expiration to EXPIRED."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    async def _run():
        async with get_db_session() as db:
            result = await db.execute(
                select(EscrowContract).where(
                    EscrowContract.status.in_([EscrowState.DRAFT, EscrowState.PENDING_FUNDING]),
                    EscrowContract.created_at < cutoff,
                )
            )
            contracts = result.scalars().all()
            for contract in contracts:
                try:
                    sm = contract.to_state_machine()
                    new_state = sm.transition(EscrowState.EXPIRED)
                    contract.status = new_state.value
                except EscrowStateTransitionError:
                    continue
            await db.commit()
            return len(contracts)

    return asyncio.run(_run())


# app/tasks/notifications.py
@shared_task
def send_milestone_reminders():
    """Notify sellers about milestones due in the next 48 hours."""
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=48)

    async def _run():
        async with get_db_session() as db:
            milestones = await db.execute(
                select(Milestone).join(EscrowContract).where(
                    Milestone.status == MilestoneStatus.PENDING,
                    Milestone.due_date.between(now, window_end),
                    EscrowContract.status == EscrowState.IN_PROGRESS,
                )
            )
            for m in milestones.scalars():
                notification_svc.send_email(
                    to=m.contract.seller.email,
                    template="milestone_reminder",
                    context={"milestone": m},
                )
    asyncio.run(_run())
```

```python
# app/tasks/webhooks.py
@shared_task(max_retries=5, default_retry_delay=60)
def retry_failed_webhooks():
    """Re-process webhooks that failed initial handling."""
    async def _run():
        async with get_db_session() as db:
            failed = await db.execute(
                select(WebhookEvent).where(
                    WebhookEvent.status == "FAILED",
                    WebhookEvent.retry_count < 5,
                ).limit(50)
            )
            for event in failed.scalars():
                handler = WebhookHandler()
                try:
                    stripe_event = stripe.Event.construct_from(event.data, stripe.api_key)
                    await handler.dispatch(stripe_event)
                    event.status = "PROCESSED"
                except Exception:
                    event.retry_count += 1
                await db.commit()
    asyncio.run(_run())
```

---

## 9. Error Handling Strategy

### 9.1 Error Hierarchy

```python
# app/engine/errors.py
class EscrowError(Exception):
    """Base exception for all KUBERA domain errors."""
    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    details: list[dict] = []

class EscrowDomainError(EscrowError):
    """Generic domain error with custom code and status."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR", status_code: int = 400, details: list[dict] | None = None):
        self.code = code
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)

class EscrowStateTransitionError(EscrowDomainError):
    def __init__(self, message: str, code: str = "STATE_TRANSITION_ERROR", details: list[dict] | None = None):
        super().__init__(message, code=code, status_code=409, details=details)

class EscrowNotFoundError(EscrowDomainError):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(f"{entity} not found: {entity_id}", code="NOT_FOUND", status_code=404)

class EscrowValidationError(EscrowDomainError):
    def __init__(self, message: str, details: list[dict]):
        super().__init__(message, code="VALIDATION_ERROR", status_code=422, details=details)
```

### 9.2 Structured Logging Middleware

```python
# app/middleware/logging.py
import uuid
import time
import structlog
from fastapi import Request

logger = structlog.get_logger("kubera.api")

async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start = time.monotonic()

    response = await call_next(request)

    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "request",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=round(duration_ms, 2),
    )
    return response
```

### 9.3 Global Error Response Format

Every error response follows this shape:

```json
{
  "error": "CONTRACT_NOT_FOUND",
  "message": "Escrow contract not found: abc-123",
  "details": [],
  "timestamp": "2026-07-19T12:00:00Z",
  "request_id": "req-abc-123"
}
```

Validation errors from Pydantic are caught and transformed:

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": [
                {"field": ".".join(err["loc"]), "message": err["msg"]}
                for err in exc.errors()
            ],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
```

---

## 10. Testing Strategy

### 10.1 Fixtures & Conftest

```python
# tests/conftest.py
import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import create_app
from app.database import get_db_session

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session():
    engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/test_kubera")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    app = create_app()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

### 10.2 Mocking Stripe

```python
# tests/conftest_stripe.py
import pytest
from unittest.mock import AsyncMock

@pytest.fixture
def mock_stripe_service():
    svc = AsyncMock()
    svc.create_payment_intent = AsyncMock(return_value={"id": "pi_test_123", "status": "requires_payment_method"})
    svc.create_transfer = AsyncMock(return_value={"id": "tr_test_123", "amount": 5000, "status": "pending"})
    svc.create_connected_account = AsyncMock(return_value=StripeAccountResult(account_id="acct_test_123"))
    return svc
```

### 10.3 State Machine Tests

```python
# tests/unit/test_state_machine.py
import pytest
from app.engine.state_machine import EscrowStateMachine, EscrowState, EscrowStateTransitionError

def make_contract(status=EscrowState.DRAFT):
    mock = MagicMock()
    mock.status = status.value
    return mock

class TestEscrowStateMachine:
    def test_draft_to_pending_funding(self):
        contract = make_contract(EscrowState.DRAFT)
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.PENDING_FUNDING)
        assert result == EscrowState.PENDING_FUNDING

    def test_draft_to_completed_rejected(self):
        contract = make_contract(EscrowState.DRAFT)
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError, match="Cannot transition"):
            sm.transition(EscrowState.COMPLETED)

    def test_funded_to_disputed(self):
        contract = make_contract(EscrowState.FUNDED)
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.DISPUTED, {"evidence": True})
        assert result == EscrowState.DISPUTED

    def test_full_happy_path(self):
        contract = make_contract(EscrowState.DRAFT)
        sm = EscrowStateMachine(contract)

        assert sm.transition(EscrowState.PENDING_FUNDING) == EscrowState.PENDING_FUNDING
        assert sm.transition(EscrowState.FUNDED) == EscrowState.FUNDED
        assert sm.transition(EscrowState.IN_PROGRESS) == EscrowState.IN_PROGRESS
        assert sm.transition(EscrowState.COMPLETED) == EscrowState.COMPLETED
```

### 10.4 API Integration Tests

```python
# tests/integration/test_contract_endpoints.py

class TestContractEndpoints:
    async def test_create_contract(self, client, auth_headers):
        response = await client.post(
            "/api/v1/contracts",
            json={
                "seller_id": str(uuid.uuid4()),
                "title": "Test Widget Order",
                "amount": 50000,
                "currency": "USD",
                "milestones": [
                    {"description": "Deposit", "percentage": 30.0, "due_date": "2026-08-01T00:00:00Z"},
                    {"description": "Final", "percentage": 70.0, "due_date": "2026-09-01T00:00:00Z"},
                ],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "DRAFT"
        assert len(data["milestones"]) == 2

    async def test_fund_contract(self, client, auth_headers, mock_stripe_service):
        # Create contract first, then fund
        contract = await self._create_test_contract(client, auth_headers)
        pi = await client.post(
            f"/api/v1/contracts/{contract['id']}/fund",
            headers=auth_headers,
        )
        assert pi.status_code == 200
        assert "client_secret" in pi.json()
```

### 10.5 Test Running

```bash
# Run all tests
pytest tests/ -v --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_state_machine.py -v

# Run with markers
pytest tests/ -m "integration"

# Run with async support
pytest tests/ -v --asyncio-mode=auto
```

---

## 11. Performance Considerations

### 11.1 Connection Pooling

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,         # Verify connections before using
    pool_recycle=3600,          # Recycle connections every hour
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)
```

### 11.2 Query Optimization Patterns

```python
# Use selectinload instead of joinedload for collections
contract = await db.execute(
    select(EscrowContract)
    .options(selectinload(EscrowContract.milestones))
    .where(EscrowContract.id == contract_id)
)

# Use contains_eager when joining is already happening
contract = await db.execute(
    select(EscrowContract)
    .join(EscrowContract.milestones)
    .options(contains_eager(EscrowContract.milestones))
    .where(EscrowContract.id == contract_id)
)

# Raw SQL via asyncpg for hot-path balance checks
from app.database import get_raw_connection

async def get_contract_balance(contract_id: uuid.UUID) -> int:
    conn = await get_raw_connection()
    try:
        row = await conn.fetchrow(
            "SELECT amount - COALESCE(SUM(released_amount), 0) AS balance "
            "FROM escrow_contracts c "
            "LEFT JOIN milestones m ON m.contract_id = c.id AND m.status = 'RELEASED' "
            "WHERE c.id = $1",
            contract_id,
        )
        return row["balance"] if row else 0
    finally:
        await conn.close()
```

### 11.3 Caching Strategy

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| Exchange rates | Redis (string) | 1 hour | Next fetch overwrites |
| User profile | Redis (hash) | 15 min | On profile update |
| Contract status (non-critical) | Redis (string) | 5 min | On state transition |
| Stripe account IDs | In-memory (dict) | Session | On account connect |

```python
# app/services/cache.py
import json
import redis.asyncio as redis

class CacheService:
    def __init__(self, redis_url: str):
        self.client = redis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> dict | None:
        data = await self.client.get(key)
        return json.loads(data) if data else None

    async def set(self, key: str, value: dict, ttl: int = 300) -> None:
        await self.client.setex(key, ttl, json.dumps(value))

    async def invalidate(self, pattern: str) -> None:
        cursor = 0
        while True:
            cursor, keys = await self.client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await self.client.delete(*keys)
            if cursor == 0:
                break
```

### 11.4 Background Worker Scaling

```ini
# docker-compose.yml
services:
  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    depends_on: [db, redis]

  worker:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4
    depends_on: [redis, db]

  beat:
    build: .
    command: celery -A app.tasks.celery_app beat --loglevel=info
    depends_on: [redis]
```

### 11.5 Rate Limiting

```python
# app/middleware/rate_limit.py
from fastapi import Request, HTTPException
import time

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = int(time.time())
        window_key = f"ratelimit:{key}:{now // window_seconds}"
        count = await self.redis.incr(window_key)
        if count == 1:
            await self.redis.expire(window_key, window_seconds)
        return count <= max_requests

# Usage in middleware
async def rate_limit_middleware(request: Request, call_next):
    limiter = request.app.state.rate_limiter
    client_ip = request.client.host

    if not await limiter.check(f"ip:{client_ip}", 100, 60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    return await call_next(request)
```

---

## Appendix A: Environment Variables

Key configuration in `app/config.py`:

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kubera"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_publishable_key: str

    # Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Currency
    open_exchange_rates_api_key: str = ""

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"

    # App
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

## Appendix B: Migration Workflow

```bash
# Generate a new migration
alembic revision --autogenerate -m "add_escrow_contracts"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# View history
alembic history
```

---

*This document is part of the KUBERA boilerplate. Architecture decisions prioritize clarity, testability, and production readiness. Adapt connection pool sizes, cache TTLs, and worker counts to your expected traffic profile.*
