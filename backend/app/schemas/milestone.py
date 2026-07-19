from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.milestone import MilestoneStatus


class MilestoneCreate(BaseModel):
    description: str
    percentage: float
    due_date: datetime | None = None


class MilestoneUpdate(BaseModel):
    description: str | None = None
    percentage: float | None = None
    due_date: datetime | None = None
    status: MilestoneStatus | None = None


class MilestoneRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    description: str
    percentage: float
    amount: int
    due_date: datetime | None = None
    status: MilestoneStatus
    order_index: int
    stripe_transfer_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
