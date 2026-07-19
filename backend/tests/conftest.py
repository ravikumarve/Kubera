from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.api.deps import get_current_user, get_db
from app.config import Settings
from app.main import create_app
from app.models.base import Base
from app.models.user import User


def pytest_configure(config: pytest.Config) -> None:
    config.option.asyncio_mode = "auto"


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return Settings(
        database_url="sqlite+aiosqlite://",
        stripe_secret_key="sk_test_mock",
        stripe_publishable_key="pk_test_mock",
        stripe_webhook_secret="whsec_mock",
        nextauth_secret="test-secret-key-for-jwt-minimum-32-chars!!",
        environment="test",
    )


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        echo=False,
        connect_args={"timeout": 15, "check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, Any]:
    conn = await test_engine.connect()
    trans = await conn.begin()
    session = AsyncSession(bind=conn, expire_on_commit=False)
    yield session
    await session.close()
    await trans.rollback()
    await conn.close()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="buyer@test.com",
        name="Test Buyer",
        role="buyer",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_seller(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="seller@test.com",
        name="Test Seller",
        role="seller",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def async_client(
    test_engine,
    test_user: User,
) -> AsyncGenerator[AsyncClient, Any]:
    app = create_app()

    conn = await test_engine.connect()
    trans = await conn.begin()

    async def override_get_db() -> AsyncGenerator[AsyncSession, Any]:
        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def override_get_current_user() -> User:
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        yield client

    app.dependency_overrides.clear()
    await trans.rollback()
    await conn.close()
