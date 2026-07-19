from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    base_currency: Mapped[str] = mapped_column(String(3), primary_key=True)
    target_currency: Mapped[str] = mapped_column(String(3), primary_key=True)
    rate: Mapped[Decimal] = mapped_column(
        Numeric(20, 8),
        comment="1 base_currency = rate target_currency",
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
