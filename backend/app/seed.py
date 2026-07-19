"""Dev-only: auto-seed a test user on first startup."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.services.auth import hash_password

logger = logging.getLogger("kubera.seed")

SEED_EMAIL = "dev@kubera.dev"
SEED_PASSWORD = "demo1234"
SEED_NAME = "Dev User"
SEED_ROLE = "admin"


async def seed_dev_user(db: AsyncSession) -> None:
    """Create a default test user if one doesn't exist (dev environments only)."""
    if settings.environment == "production":
        return

    result = await db.execute(select(User).where(User.email == SEED_EMAIL))
    if result.scalar_one_or_none():
        logger.info("Seed user already exists — skipping.")
        return

    user = User(
        email=SEED_EMAIL,
        password_hash=hash_password(SEED_PASSWORD),
        name=SEED_NAME,
        role=SEED_ROLE,
        email_verified=True,
    )
    db.add(user)
    await db.commit()
    logger.info(
        "Seed user created — email=%s password=%s role=%s",
        SEED_EMAIL,
        SEED_PASSWORD,
        SEED_ROLE,
    )
