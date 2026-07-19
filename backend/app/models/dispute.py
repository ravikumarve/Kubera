import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class DisputeStatus(StrEnum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED_BUYER = "RESOLVED_BUYER"
    RESOLVED_SELLER = "RESOLVED_SELLER"
    RESOLVED_REFUND = "RESOLVED_REFUND"


class Dispute(TimestampMixin, Base):
    __tablename__ = "disputes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("escrow_contracts.id"), nullable=False
    )
    raised_by_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(1000))
    status: Mapped[DisputeStatus] = mapped_column(
        SAEnum(DisputeStatus, name="dispute_status", create_constraint=True),
        default=DisputeStatus.OPEN,
    )
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    contract = relationship("EscrowContract", back_populates="disputes")
    evidence = relationship(
        "DisputeEvidence", back_populates="dispute", lazy="selectin"
    )


class DisputeEvidence(TimestampMixin, Base):
    __tablename__ = "dispute_evidence"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    dispute_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("disputes.id"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    dispute = relationship("Dispute", back_populates="evidence")
