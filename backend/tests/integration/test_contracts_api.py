from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.engine.state_machine import EscrowState


class TestCreateContract:
    async def test_create_contract_success(self, async_client: AsyncClient, test_seller):
        payload = {
            "seller_id": str(test_seller.id),
            "title": "Website Development",
            "description": "Build a landing page",
            "amount": 200000,
            "currency": "USD",
            "fee_amount": 5000,
        }
        resp = await async_client.post("/contracts", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Website Development"
        assert data["amount"] == 200000
        assert data["status"] == "DRAFT"
        assert data["seller_id"] == str(test_seller.id)
        assert "id" in data

    async def test_create_contract_with_milestones(self, async_client: AsyncClient, test_seller):
        payload = {
            "seller_id": str(test_seller.id),
            "title": "Phased Project",
            "amount": 100000,
            "milestones": [
                {"description": "Phase 1", "percentage": 50.0},
                {"description": "Phase 2", "percentage": 50.0},
            ],
        }
        resp = await async_client.post("/contracts", json=payload)
        assert resp.status_code == 201

    async def test_create_contract_missing_required_fields(self, async_client: AsyncClient):
        resp = await async_client.post("/contracts", json={})
        assert resp.status_code == 422

    async def test_create_contract_invalid_seller_id(self, async_client: AsyncClient):
        payload = {
            "seller_id": "not-a-uuid",
            "title": "Test",
            "amount": 1000,
        }
        resp = await async_client.post("/contracts", json=payload)
        assert resp.status_code == 422

    async def test_create_contract_negative_amount(self, async_client: AsyncClient, test_seller):
        payload = {
            "seller_id": str(test_seller.id),
            "title": "Bad",
            "amount": -100,
        }
        resp = await async_client.post("/contracts", json=payload)
        assert resp.status_code == 201


class TestListContracts:
    async def test_list_contracts_empty(self, async_client: AsyncClient):
        resp = await async_client.get("/contracts")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_contracts_returns_created(self, async_client: AsyncClient, test_seller):
        await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Contract A",
            "amount": 50000,
        })
        resp = await async_client.get("/contracts")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert any(c["title"] == "Contract A" for c in data)

    async def test_list_contracts_filter_by_status(self, async_client: AsyncClient, test_seller):
        await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Draft Contract",
            "amount": 1000,
        })
        resp = await async_client.get("/contracts?status=DRAFT")
        assert resp.status_code == 200
        for c in resp.json():
            assert c["status"] == "DRAFT"

    async def test_list_contracts_filter_by_role_buyer(self, async_client: AsyncClient, test_seller):
        await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Buyer Contract",
            "amount": 1000,
        })
        resp = await async_client.get("/contracts?role=buyer")
        assert resp.status_code == 200

    async def test_list_contracts_pagination(self, async_client: AsyncClient, test_seller):
        for i in range(3):
            await async_client.post("/contracts", json={
                "seller_id": str(test_seller.id),
                "title": f"Contract {i}",
                "amount": 1000,
            })
        resp = await async_client.get("/contracts?skip=0&limit=2")
        data = resp.json()
        assert len(data) <= 2


class TestGetContract:
    async def test_get_contract_success(self, async_client: AsyncClient, test_seller):
        create_resp = await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Specific Contract",
            "amount": 75000,
        })
        contract_id = create_resp.json()["id"]
        resp = await async_client.get(f"/contracts/{contract_id}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Specific Contract"

    async def test_get_contract_not_found(self, async_client: AsyncClient):
        fake_id = uuid.uuid4()
        resp = await async_client.get(f"/contracts/{fake_id}")
        assert resp.status_code == 404

    async def test_get_contract_invalid_uuid(self, async_client: AsyncClient):
        resp = await async_client.get("/contracts/not-a-uuid")
        assert resp.status_code == 422


class TestUpdateContract:
    async def test_update_draft_contract(self, async_client: AsyncClient, test_seller):
        create_resp = await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Original Title",
            "amount": 100000,
        })
        contract_id = create_resp.json()["id"]
        resp = await async_client.patch(f"/contracts/{contract_id}", json={
            "title": "Updated Title",
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    async def test_update_contract_not_found(self, async_client: AsyncClient):
        resp = await async_client.patch(f"/contracts/{uuid.uuid4()}", json={"title": "Nope"})
        assert resp.status_code == 404

    async def test_update_contract_partial(self, async_client: AsyncClient, test_seller):
        create_resp = await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "Partial",
            "amount": 50000,
            "description": "Old desc",
        })
        contract_id = create_resp.json()["id"]
        resp = await async_client.patch(f"/contracts/{contract_id}", json={
            "description": "New desc",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] == "New desc"
        assert data["title"] == "Partial"
        assert data["amount"] == 50000


class TestDeleteContract:
    async def test_delete_draft_contract(self, async_client: AsyncClient, test_seller):
        create_resp = await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "To Delete",
            "amount": 1000,
        })
        contract_id = create_resp.json()["id"]
        resp = await async_client.delete(f"/contracts/{contract_id}")
        assert resp.status_code == 204

    async def test_delete_contract_not_found(self, async_client: AsyncClient):
        resp = await async_client.delete(f"/contracts/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestCancelContract:
    async def test_cancel_draft_contract(self, async_client: AsyncClient, test_seller):
        create_resp = await async_client.post("/contracts", json={
            "seller_id": str(test_seller.id),
            "title": "To Cancel",
            "amount": 1000,
        })
        contract_id = create_resp.json()["id"]
        resp = await async_client.post(f"/contracts/{contract_id}/cancel")
        assert resp.status_code == 200
        assert resp.json()["status"] == EscrowState.CANCELLED.value

    async def test_cancel_contract_not_found(self, async_client: AsyncClient):
        resp = await async_client.post(f"/contracts/{uuid.uuid4()}/cancel")
        assert resp.status_code == 404


class TestAuthMiddleware:
    async def test_list_contracts_without_token_returns_401(self):
        from app.main import create_app
        from httpx import ASGITransport, AsyncClient

        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            resp = await client.get("/contracts")
        assert resp.status_code == 401

    async def test_create_contract_without_token_returns_401(self):
        from app.main import create_app
        from httpx import ASGITransport, AsyncClient

        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            resp = await client.post("/contracts", json={"title": "x"})
        assert resp.status_code == 401
