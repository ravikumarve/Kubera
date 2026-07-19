import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.engine.state_machine import EscrowState, EscrowStateMachine
from app.models.base import Base, TimestampMixin


class EscrowContract(TimestampMixin, Base):
    __tablename__ = "escrow_contracts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 0),
        comment="Amount in smallest currency unit (e.g., cents)",
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD", comment="ISO 4217")
    fee_amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 0),
        default=0,
        comment="Platform fee in smallest unit",
    )

    status: Mapped[EscrowState] = mapped_column(
        Enum(EscrowState, name="escrow_state", create_constraint=True),
        default=EscrowState.DRAFT,
        nullable=False,
    )

    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    stripe_transfer_ids: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of transfer IDs"
    )

    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    funded_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    buyer = relationship("User", foreign_keys=[buyer_id], lazy="selectin")
    seller = relationship("User", foreign_keys=[seller_id], lazy="selectin")
    milestones = relationship(
        "Milestone",
        back_populates="contract",
        lazy="selectin",
        order_by="Milestone.order_index",
    )
    disputes = relationship("Dispute", back_populates="contract", lazy="selectin")

    def to_state_machine(self) -> EscrowStateMachine:
        return EscrowStateMachine(self)
