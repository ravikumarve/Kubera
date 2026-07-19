from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.deps import get_db as get_db_session
from app.config import settings
from app.engine.errors import EscrowDomainError
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.user import User
from app.schemas.payment import PaymentIntentCreate, PaymentIntentRead
from app.services.stripe_service import StripeService

router = APIRouter()


@router.post("/create-deposit", response_model=PaymentIntentRead)
async def create_deposit(
    body: PaymentIntentCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EscrowContract)
        .options(selectinload(EscrowContract.seller))
        .where(EscrowContract.id == body.contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise EscrowDomainError(
            "Contract not found", code="CONTRACT_NOT_FOUND", status_code=404
        )
    if contract.status != EscrowState.PENDING_FUNDING:
        raise EscrowDomainError(
            "Contract is not awaiting funding",
            code="CONTRACT_NOT_PENDING_FUNDING",
        )

    stripe_svc = StripeService()
    intent = await stripe_svc.create_payment_intent(
        amount=int(contract.amount),
        currency=contract.currency,
        buyer_stripe_id=None,
        contract_id=str(contract.id),
        platform_fee=int(contract.fee_amount),
    )

    return PaymentIntentRead(
        client_secret=intent.client_secret,
        payment_intent_id=intent.id,
        amount=int(contract.amount),
        currency=contract.currency,
        status=intent.status,
    )


@router.get("/status/{contract_id}")
async def get_payment_status(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EscrowContract).where(EscrowContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise EscrowDomainError(
            "Contract not found", code="CONTRACT_NOT_FOUND", status_code=404
        )
    return {
        "contract_id": str(contract.id),
        "status": contract.status.value,
        "funded": contract.funded_at.isoformat() if contract.funded_at else None,
        "payment_intent_id": contract.stripe_payment_intent_id,
    }


@router.get("/onboarding-link")
async def get_onboarding_link(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_account_id:
        raise EscrowDomainError(
            "No Stripe account connected",
            code="STRIPE_ACCOUNT_NOT_FOUND",
            status_code=404,
        )

    stripe_svc = StripeService()
    link = await stripe_svc.create_account_link(
        account_id=current_user.stripe_account_id,
        refresh_url=f"{settings.nextauth_url}/dashboard/settings",
        return_url=f"{settings.nextauth_url}/dashboard/settings?stripe=complete",
    )
    return {"onboarding_url": link}


@router.post("/create-connect-account")
async def create_connect_account(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.stripe_account_id:
        raise EscrowDomainError(
            "Stripe account already exists",
            code="STRIPE_ACCOUNT_EXISTS",
        )

    stripe_svc = StripeService()
    result = await stripe_svc.create_connected_account(
        email=current_user.email, country="US"
    )

    current_user.stripe_account_id = result.account_id
    await db.commit()

    link = await stripe_svc.create_account_link(
        account_id=result.account_id,
        refresh_url=f"{settings.nextauth_url}/dashboard/settings",
        return_url=f"{settings.nextauth_url}/dashboard/settings?stripe=complete",
    )
    return {"account_id": result.account_id, "onboarding_url": link}
