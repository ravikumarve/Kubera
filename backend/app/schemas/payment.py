from __future__ import annotations

import uuid

from pydantic import BaseModel


class PaymentIntentCreate(BaseModel):
    contract_id: uuid.UUID


class PaymentIntentRead(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str
    status: str
