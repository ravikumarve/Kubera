from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.engine.state_machine import EscrowState
from app.schemas.milestone import MilestoneRead
from app.schemas.user import UserRead


class MilestoneInput(BaseModel):
    description: str
    percentage: float
    due_date: datetime | None = None


class ContractCreate(BaseModel):
    seller_id: uuid.UUID
    title: str
    description: str | None = None
    amount: int
    currency: str = "USD"
    fee_amount: int = 0
    milestones: list[MilestoneInput] | None = None


class ContractUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    amount: int | None = None
    currency: str | None = None


class ContractRead(BaseModel):
    id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    title: str
    description: str | None = None
    amount: int
    currency: str
    fee_amount: int
    status: EscrowState
    stripe_payment_intent_id: str | None = None
    expires_at: datetime | None = None
    funded_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    buyer: UserRead | None = None
    seller: UserRead | None = None
    milestones: list[MilestoneRead] | None = None

    model_config = {"from_attributes": True}
