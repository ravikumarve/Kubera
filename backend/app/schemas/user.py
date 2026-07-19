from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None = None
    role: str
    email_verified: bool
    stripe_account_id: str | None = None
    stripe_onboarding_complete: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
