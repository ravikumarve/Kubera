from __future__ import annotations

from dataclasses import dataclass

import stripe
from stripe import Account, AccountLink, PaymentIntent, Transfer

from app.config import settings


@dataclass
class StripeAccountResult:
    account_id: str
    onboarding_url: str | None = None


class StripeService:
    def __init__(self):
        stripe.api_key = settings.stripe_secret_key
        self.webhook_secret = settings.stripe_webhook_secret

    async def create_connected_account(
        self, email: str, country: str = "US"
    ) -> StripeAccountResult:
        account: Account = await stripe.Account.create_async(
            type="express",
            country=country,
            email=email,
            capabilities={"transfers": {"requested": True}},
            business_type="individual",
        )
        return StripeAccountResult(account_id=account.id)

    async def create_account_link(
        self, account_id: str, refresh_url: str, return_url: str
    ) -> str:
        link: AccountLink = await stripe.AccountLink.create_async(
            account=account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return link.url

    async def create_payment_intent(
        self,
        amount: int,
        currency: str,
        buyer_stripe_id: str | None,
        contract_id: str,
        platform_fee: int = 0,
    ) -> PaymentIntent:
        intent: PaymentIntent = await stripe.PaymentIntent.create_async(
            amount=amount,
            currency=currency.lower(),
            customer=buyer_stripe_id,
            metadata={"contract_id": contract_id},
            application_fee_amount=platform_fee,
            transfer_data={"destination": None},
            automatic_payment_methods={"enabled": True},
        )
        return intent

    async def create_transfer(
        self,
        amount: int,
        currency: str,
        destination_stripe_account_id: str,
        transfer_group: str,
    ) -> Transfer:
        transfer: Transfer = await stripe.Transfer.create_async(
            amount=amount,
            currency=currency.lower(),
            destination=destination_stripe_account_id,
            transfer_group=transfer_group,
        )
        return transfer

    async def create_refund(
        self, payment_intent_id: str, amount: int | None = None
    ) -> stripe.Refund:
        refund = await stripe.Refund.create_async(
            payment_intent=payment_intent_id,
            amount=amount,
        )
        return refund

    async def construct_webhook_event(
        self, payload: bytes, sig_header: str
    ) -> stripe.Event:
        event = stripe.Webhook.construct_event(
            payload, sig_header, self.webhook_secret
        )
        return event
