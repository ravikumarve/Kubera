import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TransactionType(StrEnum):
    FUND = "FUND"
    RELEASE = "RELEASE"
    REFUND = "REFUND"
    FEE = "FEE"


class TransactionStatus(StrEnum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("escrow_contracts.id"), nullable=False
    )
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("milestones.id"), nullable=True
    )
    stripe_transaction_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    type: Mapped[TransactionType] = mapped_column(
        SAEnum(TransactionType, name="transaction_type", create_constraint=True),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(20, 0), comment="Amount in smallest currency unit"
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, name="transaction_status", create_constraint=True),
        default=TransactionStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
    )
