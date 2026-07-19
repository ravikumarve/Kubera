from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.deps import get_db as get_db_session
from app.engine.errors import EscrowDomainError
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.milestone import Milestone, MilestoneStatus
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneRead, MilestoneUpdate
from app.services.escrow import EscrowService
from app.services.stripe_service import StripeService

router = APIRouter()


async def get_escrow_service(db: AsyncSession = Depends(get_db_session)):
    stripe_svc = StripeService()
    return EscrowService(db=db, stripe_svc=stripe_svc)


@router.post("/{contract_id}/milestones", response_model=MilestoneRead, status_code=201)
async def create_milestone(
    contract_id: uuid.UUID,
    body: MilestoneCreate,
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
            "Can only add milestones to draft contracts",
            code="CONTRACT_NOT_DRAFT",
        )

    count_result = await db.execute(
        select(Milestone).where(Milestone.contract_id == contract_id)
    )
    existing = count_result.scalars().all()

    milestone = Milestone(
        contract_id=contract_id,
        description=body.description,
        percentage=body.percentage,
        amount=int(contract.amount * body.percentage / 100),
        due_date=body.due_date,
        order_index=len(existing),
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.patch("/{contract_id}/milestones/{milestone_id}", response_model=MilestoneRead)
async def update_milestone(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    body: MilestoneUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Milestone).where(
            Milestone.id == milestone_id, Milestone.contract_id == contract_id
        )
    )
    milestone = result.scalar_one_or_none()
    if not milestone:
        raise EscrowDomainError(
            "Milestone not found", code="MILESTONE_NOT_FOUND", status_code=404
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(milestone, key, value)

    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.post(
    "/{contract_id}/milestones/{milestone_id}/complete",
    response_model=MilestoneRead,
)
async def complete_milestone(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    svc: EscrowService = Depends(get_escrow_service),
):
    return await svc.complete_milestone(contract_id, milestone_id, current_user.id)


@router.post(
    "/{contract_id}/milestones/{milestone_id}/approve",
    response_model=MilestoneRead,
)
async def approve_milestone(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    svc: EscrowService = Depends(get_escrow_service),
):
    return await svc.approve_milestone(contract_id, milestone_id, current_user.id)


@router.post(
    "/{contract_id}/milestones/{milestone_id}/release",
    response_model=MilestoneRead,
)
async def release_milestone(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    svc: EscrowService = Depends(get_escrow_service),
):
    return await svc.release_milestone(contract_id, milestone_id, current_user.id)
