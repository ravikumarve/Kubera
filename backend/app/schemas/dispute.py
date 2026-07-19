from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.dispute import DisputeStatus


class DisputeCreate(BaseModel):
    reason: str


class DisputeUpdate(BaseModel):
    status: DisputeStatus | None = None
    resolution_notes: str | None = None


class DisputeRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    raised_by_id: uuid.UUID
    reason: str
    status: DisputeStatus
    resolution_notes: str | None = None
    resolved_by_id: uuid.UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
