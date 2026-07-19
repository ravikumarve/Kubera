from __future__ import annotations

from httpx import ASGITransport, AsyncClient

from app.main import create_app


def _raw_client():
    app = create_app()
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test/api/v1")


class TestRegister:
    async def test_register_success(self, async_client):
        payload = {
            "email": "newuser@test.com",
            "password": "StrongPass1!",
            "name": "New User",
        }
        resp = await async_client.post("/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, async_client):
        payload = {
            "email": "dupe@test.com",
            "password": "StrongPass1!",
            "name": "First",
        }
        resp1 = await async_client.post("/auth/register", json=payload)
        assert resp1.status_code == 201

        resp2 = await async_client.post("/auth/register", json=payload)
        assert resp2.status_code == 409

    async def test_register_invalid_email(self, async_client):
        resp = await async_client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass1!",
            "name": "Bad Email",
        })
        assert resp.status_code == 422

    async def test_register_missing_fields(self, async_client):
        resp = await async_client.post("/auth/register", json={})
        assert resp.status_code == 422

    async def test_register_weak_password(self, async_client):
        resp = await async_client.post("/auth/register", json={
            "email": "weak@test.com",
            "password": "short",
            "name": "Weak Password",
        })
        assert resp.status_code == 201


class TestLogin:
    async def test_login_success(self, async_client):
        await async_client.post("/auth/register", json={
            "email": "login@test.com",
            "password": "StrongPass1!",
            "name": "Login User",
        })
        resp = await async_client.post("/auth/login", json={
            "email": "login@test.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, async_client):
        await async_client.post("/auth/register", json={
            "email": "wrongpw@test.com",
            "password": "StrongPass1!",
            "name": "Wrong",
        })
        resp = await async_client.post("/auth/login", json={
            "email": "wrongpw@test.com",
            "password": "WrongPass1!",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, async_client):
        resp = await async_client.post("/auth/login", json={
            "email": "nobody@test.com",
            "password": "SomePass1!",
        })
        assert resp.status_code == 401


class TestRefresh:
    async def test_refresh_success(self, async_client):
        register_resp = await async_client.post("/auth/register", json={
            "email": "refresh@test.com",
            "password": "StrongPass1!",
            "name": "Refresh",
        })
        refresh_token = register_resp.json()["refresh_token"]

        resp = await async_client.post("/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["expires_in"] == 900

    async def test_refresh_with_access_token_fails(self, async_client):
        register_resp = await async_client.post("/auth/register", json={
            "email": "refresh_bad@test.com",
            "password": "StrongPass1!",
            "name": "Refresh Bad",
        })
        access_token = register_resp.json()["access_token"]

        resp = await async_client.post("/auth/refresh", json={
            "refresh_token": access_token,
        })
        assert resp.status_code == 401

    async def test_refresh_invalid_token(self, async_client):
        resp = await async_client.post("/auth/refresh", json={
            "refresh_token": "totally-invalid-token",
        })
        assert resp.status_code == 401


class TestMe:
    async def test_me_with_override_returns_test_user(self, async_client):
        resp = await async_client.get("/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "buyer@test.com"
        assert data["name"] == "Test Buyer"

    async def test_me_without_token(self):
        async with _raw_client() as client:
            resp = await client.get("/auth/me")
        assert resp.status_code == 401

    async def test_me_with_invalid_token(self):
        async with _raw_client() as client:
            resp = await client.get("/auth/me", headers={
                "Authorization": "Bearer invalid-token",
            })
        assert resp.status_code == 401
