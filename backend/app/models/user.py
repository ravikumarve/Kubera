import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="buyer")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_account_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    stripe_onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)

    buyer_contracts = relationship(
        "EscrowContract",
        foreign_keys="EscrowContract.buyer_id",
        back_populates="buyer",
        lazy="selectin",
    )
    seller_contracts = relationship(
        "EscrowContract",
        foreign_keys="EscrowContract.seller_id",
        back_populates="seller",
        lazy="selectin",
    )
