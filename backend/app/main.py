from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    from app.api.v1.router import api_router
    from app.middleware.error_handler import register_exception_handlers
    from app.middleware.rate_limit import register_rate_limit
    from app.middleware.security import register_security_headers
    from app.services.sentry import init_sentry

    init_sentry()

    app = FastAPI(
        title=settings.project_name,
        version=settings.version,
        lifespan=lifespan,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_security_headers(app)
    app.add_middleware(SlowAPIMiddleware)

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    register_exception_handlers(app)
    register_rate_limit(app)

    return app


app = create_app()
