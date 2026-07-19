from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db as get_db_session
from app.models.currency import CurrencyRate

router = APIRouter()

SUPPORTED_CURRENCIES = [
    "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR",
    "SGD", "HKD", "CHF", "NZD", "MXN", "BRL",
]


@router.get("")
async def list_currencies():
    return {"currencies": SUPPORTED_CURRENCIES}


@router.get("/rates")
async def get_rates(
    base: str = Query("USD"),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(CurrencyRate).where(CurrencyRate.base_currency == base.upper())
    )
    rates = result.scalars().all()
    return {
        "base": base.upper(),
        "rates": {r.target_currency: float(r.rate) for r in rates},
        "updated_at": max((r.fetched_at for r in rates), default=None),
    }
