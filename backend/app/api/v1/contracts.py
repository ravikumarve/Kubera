from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.deps import get_db as get_db_session
from app.engine.errors import EscrowDomainError
from app.middleware.rate_limit import limiter
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.user import User
from app.schemas.escrow import ContractCreate, ContractRead, ContractUpdate
from app.services.escrow import EscrowService
from app.services.stripe_service import StripeService

router = APIRouter()


async def get_escrow_service(db: AsyncSession = Depends(get_db_session)):
    stripe_svc = StripeService()
    return EscrowService(db=db, stripe_svc=stripe_svc)


@router.post("", response_model=ContractRead, status_code=201)
@limiter.limit("60/minute")
async def create_contract(
    request: Request,
    body: ContractCreate,
    current_user: User = Depends(get_current_user),
    svc: EscrowService = Depends(get_escrow_service),
):
    contract = await svc.create_contract(
        buyer_id=current_user.id,
        seller_id=body.seller_id,
        title=body.title,
        amount=body.amount,
        currency=body.currency or "USD",
        description=body.description,
        fee_amount=body.fee_amount or 0,
        milestones_data=[m.model_dump() for m in body.milestones] if body.milestones else None,
    )
    return contract


@router.get("", response_model=list[ContractRead])
@limiter.limit("60/minute")
async def list_contracts(
    request: Request,
    status: str | None = Query(None),
    role: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    query = select(EscrowContract).options(
        selectinload(EscrowContract.milestones),
        selectinload(EscrowContract.buyer),
        selectinload(EscrowContract.seller),
    )

    if role == "buyer":
        query = query.where(EscrowContract.buyer_id == current_user.id)
    elif role == "seller":
        query = query.where(EscrowContract.seller_id == current_user.id)
    else:
        query = query.where(
            (EscrowContract.buyer_id == current_user.id)
            | (EscrowContract.seller_id == current_user.id)
        )

    if status:
        query = query.where(EscrowContract.status == EscrowState(status.upper()))

    query = query.offset(skip).limit(limit).order_by(EscrowContract.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{contract_id}", response_model=ContractRead)
@limiter.limit("60/minute")
async def get_contract(
    request: Request,
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EscrowContract)
        .options(
            selectinload(EscrowContract.milestones),
            selectinload(EscrowContract.buyer),
            selectinload(EscrowContract.seller),
            selectinload(EscrowContract.disputes),
        )
        .where(EscrowContract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise EscrowDomainError(
            "Contract not found", code="CONTRACT_NOT_FOUND", status_code=404
        )
    return contract


@router.patch("/{contract_id}", response_model=ContractRead)
@limiter.limit("60/minute")
async def update_contract(
    request: Request,
    contract_id: uuid.UUID,
    body: ContractUpdate,
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
    if contract.status != EscrowState.DRAFT:
        raise EscrowDomainError(
            "Only draft contracts can be edited",
            code="CONTRACT_NOT_DRAFT",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)

    await db.commit()
    await db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
@limiter.limit("60/minute")
async def delete_contract(
    request: Request,
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
    if contract.status != EscrowState.DRAFT:
        raise EscrowDomainError(
            "Only draft contracts can be deleted",
            code="CONTRACT_NOT_DRAFT",
        )
    await db.delete(contract)
    await db.commit()


@router.post("/{contract_id}/cancel", response_model=ContractRead)
@limiter.limit("60/minute")
async def cancel_contract(
    request: Request,
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

    sm = contract.to_state_machine()
    sm.transition(EscrowState.CANCELLED)
    contract.status = EscrowState.CANCELLED
    await db.commit()
    await db.refresh(contract)
    return contract
