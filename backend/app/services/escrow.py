from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.errors import EscrowDomainError
from app.engine.state_machine import EscrowState
from app.models.escrow_contract import EscrowContract
from app.models.milestone import Milestone, MilestoneStatus
from app.models.payment import Transaction, TransactionType, TransactionStatus
from app.models.user import User
from app.services.stripe_service import StripeService


class EscrowService:
    def __init__(self, db: AsyncSession, stripe_svc: StripeService):
        self.db = db
        self.stripe = stripe_svc

    async def create_contract(
        self,
        buyer_id: uuid.UUID,
        seller_id: uuid.UUID,
        title: str,
        amount: int,
        currency: str = "USD",
        description: str | None = None,
        fee_amount: int = 0,
        milestones_data: list[dict] | None = None,
    ) -> EscrowContract:
        contract = EscrowContract(
            buyer_id=buyer_id,
            seller_id=seller_id,
            title=title,
            description=description,
            amount=amount,
            currency=currency,
            fee_amount=fee_amount,
            status=EscrowState.DRAFT,
        )
        self.db.add(contract)
        await self.db.flush()

        if milestones_data:
            for i, md in enumerate(milestones_data):
                milestone = Milestone(
                    contract_id=contract.id,
                    description=md.get("description", ""),
                    percentage=md["percentage"],
                    amount=int(amount * md["percentage"] / 100),
                    due_date=md.get("due_date"),
                    order_index=i,
                    status=MilestoneStatus.PENDING,
                )
                self.db.add(milestone)

        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def fund_contract(
        self, contract_id: uuid.UUID, payment_intent_id: str
    ) -> EscrowContract:
        contract = await self.db.get(EscrowContract, contract_id)
        if not contract:
            raise EscrowDomainError(
                "Contract not found", code="CONTRACT_NOT_FOUND", status_code=404
            )

        sm = contract.to_state_machine()
        sm.transition(
            EscrowState.FUNDED, {"payment_intent_id": payment_intent_id}
        )

        contract.status = EscrowState.FUNDED
        contract.stripe_payment_intent_id = payment_intent_id
        contract.funded_at = datetime.now(timezone.utc)

        txn = Transaction(
            contract_id=contract.id,
            type=TransactionType.FUND,
            amount=contract.amount,
            currency=contract.currency,
            status=TransactionStatus.SUCCEEDED,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def complete_milestone(
        self, contract_id: uuid.UUID, milestone_id: uuid.UUID, user_id: uuid.UUID
    ) -> Milestone:
        milestone = await self.db.get(Milestone, milestone_id)
        if not milestone or milestone.contract_id != contract_id:
            raise EscrowDomainError(
                "Milestone not found", code="MILESTONE_NOT_FOUND", status_code=404
            )
        if milestone.status != MilestoneStatus.PENDING:
            raise EscrowDomainError(
                "Milestone already completed or released",
                code="MILESTONE_ALREADY_PROCESSED",
            )

        contract = await self.db.get(EscrowContract, contract_id)
        sm = contract.to_state_machine()
        sm.transition(EscrowState.IN_PROGRESS, {"milestone": milestone})

        milestone.status = MilestoneStatus.APPROVED
        contract.status = EscrowState.IN_PROGRESS
        await self.db.commit()
        await self.db.refresh(milestone)
        return milestone

    async def approve_milestone(
        self, contract_id: uuid.UUID, milestone_id: uuid.UUID, user_id: uuid.UUID
    ) -> Milestone:
        milestone = await self.db.get(Milestone, milestone_id)
        if not milestone or milestone.contract_id != contract_id:
            raise EscrowDomainError(
                "Milestone not found", code="MILESTONE_NOT_FOUND", status_code=404
            )
        if milestone.status != MilestoneStatus.APPROVED:
            raise EscrowDomainError(
                "Milestone must be approved first",
                code="MILESTONE_NOT_APPROVED",
            )

        contract = await self.db.get(EscrowContract, contract_id)
        if not contract.seller.stripe_account_id:
            raise EscrowDomainError(
                "Seller has not connected Stripe account",
                code="SELLER_STRIPE_NOT_CONNECTED",
            )

        transfer = await self.stripe.create_transfer(
            amount=int(milestone.amount),
            currency=contract.currency,
            destination_stripe_account_id=contract.seller.stripe_account_id,
            transfer_group=str(contract.id),
        )

        milestone.status = MilestoneStatus.RELEASED
        milestone.stripe_transfer_id = transfer.id

        txn = Transaction(
            contract_id=contract.id,
            milestone_id=milestone.id,
            stripe_transaction_id=transfer.id,
            type=TransactionType.RELEASE,
            amount=milestone.amount,
            currency=contract.currency,
            status=TransactionStatus.SUCCEEDED,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(txn)

        sm = contract.to_state_machine()

        if all(m.status == MilestoneStatus.RELEASED for m in contract.milestones):
            final_state = sm.transition(EscrowState.COMPLETED)
            contract.status = final_state.value
            contract.completed_at = datetime.now(timezone.utc)
        else:
            sm.transition(EscrowState.IN_PROGRESS, {"milestone": milestone})
            contract.status = EscrowState.IN_PROGRESS.value

        await self.db.commit()
        await self.db.refresh(milestone)
        return milestone

    async def release_milestone(
        self, contract_id: uuid.UUID, milestone_id: uuid.UUID, user_id: uuid.UUID
    ) -> Milestone:
        milestone = await self.db.get(Milestone, milestone_id)
        if not milestone or milestone.contract_id != contract_id:
            raise EscrowDomainError(
                "Milestone not found", code="MILESTONE_NOT_FOUND", status_code=404
            )
        return await self.approve_milestone(contract_id, milestone_id, user_id)

    async def get_contract_with_milestones(
        self, contract_id: uuid.UUID
    ) -> EscrowContract | None:
        result = await self.db.execute(
            select(EscrowContract).where(EscrowContract.id == contract_id)
        )
        return result.scalar_one_or_none()
