import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MilestoneStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    RELEASED = "RELEASED"
    DISPUTED = "DISPUTED"


class Milestone(TimestampMixin, Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("escrow_contracts.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500))
    percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), comment="Percentage of total (e.g., 25.00)"
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 0), comment="Calculated amount in smallest unit"
    )
    due_date: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(
        SAEnum(MilestoneStatus, name="milestone_status", create_constraint=True),
        default=MilestoneStatus.PENDING,
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    stripe_transfer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    contract = relationship("EscrowContract", back_populates="milestones")
    proof_documents = relationship(
        "MilestoneDocument",
        back_populates="milestone",
        lazy="selectin",
    )


class MilestoneDocument(TimestampMixin, Base):
    __tablename__ = "milestone_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    milestone_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("milestones.id"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    milestone = relationship("Milestone", back_populates="proof_documents")
