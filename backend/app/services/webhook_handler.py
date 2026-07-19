from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy.exc import OperationalError, DatabaseError

from app.database import async_session_factory
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.user import User

logger = structlog.get_logger("kubera.webhooks")

_processed_webhooks: set[str] = set()


async def is_duplicate_webhook(key: str) -> bool:
    return key in _processed_webhooks


async def mark_webhook_processed(key: str) -> None:
    _processed_webhooks.add(key)


class WebhookHandler:
    def __init__(self):
        self.db = None

    async def dispatch(self, event: stripe.Event) -> None:
        method_name = f"handle_{event.type.replace('.', '_')}"
        handler = getattr(self, method_name, self._handle_unknown)

        try:
            await handler(event)
        except Exception as e:
            logger.error("webhook handler failed", event_type=event.type, error=str(e))

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((OperationalError, DatabaseError)),
    )
    async def handle_payment_intent_succeeded(self, event: stripe.Event) -> None:
        pi = event.data.object
        contract_id = pi.metadata.get("contract_id")
        if not contract_id:
            return

        async with async_session_factory() as db:
            result = await db.execute(
                select(EscrowContract).where(EscrowContract.id == contract_id)
            )
            contract = result.scalar_one_or_none()
            if not contract:
                logger.warning("contract not found for webhook", contract_id=contract_id)
                return

            sm = contract.to_state_machine()
            new_state = sm.transition(
                EscrowState.FUNDED, {"payment_intent_id": pi.id}
            )
            contract.status = new_state.value
            contract.funded_at = datetime.now(timezone.utc)
            contract.stripe_payment_intent_id = pi.id
            await db.commit()
            logger.info("contract funded via webhook", contract_id=contract_id)

    async def handle_payment_intent_payment_failed(self, event: stripe.Event) -> None:
        pi = event.data.object
        logger.error(
            "payment failed",
            payment_intent_id=pi.id,
            error=pi.last_payment_error,
        )

    async def handle_account_updated(self, event: stripe.Event) -> None:
        account = event.data.object
        charges_enabled = account.charges_enabled
        details_submitted = account.details_submitted

        async with async_session_factory() as db:
            result = await db.execute(
                select(User).where(User.stripe_account_id == account.id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.stripe_onboarding_complete = charges_enabled and details_submitted
                await db.commit()
                logger.info(
                    "stripe onboarding updated", user_id=user.id, account_id=account.id
                )

    async def handle_transfer_created(self, event: stripe.Event) -> None:
        transfer = event.data.object
        logger.info(
            "transfer created",
            transfer_id=transfer.id,
            amount=transfer.amount,
        )

    async def _handle_unknown(self, event: stripe.Event) -> None:
        logger.info("unhandled webhook event", event_type=event.type, event_id=event.id)
