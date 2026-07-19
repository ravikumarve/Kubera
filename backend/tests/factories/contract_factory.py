from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from app.engine.state_machine import EscrowState
from app.models.milestone import MilestoneStatus


def build_user_dict(**overrides: Any) -> dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "email": "user@test.com",
        "name": "Test User",
        "password_hash": "$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5",
        "role": overrides.get("role", "buyer"),
        "email_verified": False,
        "avatar_url": None,
        "stripe_account_id": None,
        "stripe_onboarding_complete": False,
        **overrides,
    }


def build_contract_dict(**overrides: Any) -> dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "buyer_id": uuid.uuid4(),
        "seller_id": uuid.uuid4(),
        "title": "Test Contract",
        "description": "A test escrow contract",
        "amount": 100000,
        "currency": "USD",
        "fee_amount": 2500,
        "status": EscrowState.DRAFT,
        "stripe_payment_intent_id": None,
        "stripe_transfer_ids": None,
        "expires_at": None,
        "funded_at": None,
        "completed_at": None,
        **overrides,
    }


def build_milestone_dict(**overrides: Any) -> dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "contract_id": uuid.uuid4(),
        "description": "Test Milestone",
        "percentage": 50.0,
        "amount": 50000,
        "due_date": datetime.now(timezone.utc),
        "status": MilestoneStatus.PENDING,
        "order_index": 0,
        "stripe_transfer_id": None,
        **overrides,
    }


class MockMilestone:
    def __init__(self, status: MilestoneStatus | str = MilestoneStatus.PENDING):
        if isinstance(status, str):
            status = MilestoneStatus(status)
        self.status = status


class MockContract:
    def __init__(self, status: str = "DRAFT", milestones: list[MockMilestone] | None = None):
        self.status = status
        self.milestones = milestones or []
