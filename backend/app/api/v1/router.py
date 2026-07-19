from fastapi import APIRouter

from app.api.v1 import auth, contracts, currencies, disputes, milestones, payments, webhooks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Escrow Contracts"])
api_router.include_router(milestones.router, prefix="/contracts", tags=["Milestones"])
api_router.include_router(disputes.router, prefix="/contracts", tags=["Disputes"])
api_router.include_router(disputes.admin_router, prefix="/disputes", tags=["Disputes"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
api_router.include_router(currencies.router, prefix="/currencies", tags=["Currencies"])
