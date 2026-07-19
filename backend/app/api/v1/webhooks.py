from __future__ import annotations

import structlog
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from app.services.stripe_service import StripeService
from app.services.webhook_handler import WebhookHandler, is_duplicate_webhook, mark_webhook_processed

logger = structlog.get_logger("kubera.webhooks")

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    idempotency_key = request.headers.get("Idempotency-Key")

    if idempotency_key and await is_duplicate_webhook(idempotency_key):
        logger.info("duplicate webhook received", idempotency_key=idempotency_key)
        return {"received": True, "duplicate": True}

    stripe_svc = StripeService()

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

    if idempotency_key:
        await mark_webhook_processed(idempotency_key)

    logger.info("webhook processed", event_type=event.type, event_id=event.id)
    return {"received": True}
