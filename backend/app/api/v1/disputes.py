from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin_user, get_current_user
from app.api.deps import get_db as get_db_session
from app.engine.errors import EscrowDomainError
from app.engine.state_machine import EscrowState
from app.models.dispute import Dispute, DisputeStatus
from app.models.escrow_contract import EscrowContract
from app.models.user import User
from app.schemas.dispute import DisputeCreate, DisputeRead, DisputeUpdate

router = APIRouter()
admin_router = APIRouter()


@router.post("/{contract_id}/disputes", response_model=DisputeRead, status_code=201)
async def raise_dispute(
    contract_id: uuid.UUID,
    body: DisputeCreate,
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

    if contract.status not in (EscrowState.FUNDED, EscrowState.IN_PROGRESS):
        raise EscrowDomainError(
            "Contract is not in a disputable state",
            code="CONTRACT_NOT_DISPUTABLE",
        )

    sm = contract.to_state_machine()
    sm.transition(EscrowState.DISPUTED, {"dispute_reason": body.reason})

    dispute = Dispute(
        contract_id=contract_id,
        raised_by_id=current_user.id,
        reason=body.reason,
    )
    contract.status = EscrowState.DISPUTED
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)
    return dispute


@router.get("/{contract_id}/disputes", response_model=list[DisputeRead])
async def list_disputes(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Dispute)
        .options(selectinload(Dispute.evidence))
        .where(Dispute.contract_id == contract_id)
    )
    return result.scalars().all()


@admin_router.patch("/{dispute_id}", response_model=DisputeRead)
async def update_dispute(
    dispute_id: uuid.UUID,
    body: DisputeUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(
        select(Dispute).where(Dispute.id == dispute_id)
    )
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise EscrowDomainError(
            "Dispute not found", code="DISPUTE_NOT_FOUND", status_code=404
        )

    contract_result = await db.execute(
        select(EscrowContract).where(EscrowContract.id == dispute.contract_id)
    )
    contract = contract_result.scalar_one_or_none()

    sm = contract.to_state_machine()

    if body.status == DisputeStatus.RESOLVED_BUYER:
        sm.transition(EscrowState.FUNDED, {})
        contract.status = EscrowState.FUNDED
    elif body.status == DisputeStatus.RESOLVED_SELLER:
        sm.transition(EscrowState.COMPLETED, {})
        contract.status = EscrowState.COMPLETED
        contract.completed_at = datetime.now(timezone.utc)
    elif body.status == DisputeStatus.RESOLVED_REFUND:
        sm.transition(EscrowState.REFUNDED, {})
        contract.status = EscrowState.REFUNDED

    dispute.status = body.status or dispute.status
    dispute.resolution_notes = body.resolution_notes or dispute.resolution_notes
    dispute.resolved_by_id = current_user.id
    dispute.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(dispute)
    return dispute
