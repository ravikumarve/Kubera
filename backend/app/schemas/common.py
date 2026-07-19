from datetime import datetime, timezone

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: list[ErrorDetail] = []
    timestamp: datetime = datetime.now(timezone.utc)
    request_id: str | None = None


class SuccessResponse(BaseModel):
    message: str
    data: dict | None = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    skip: int
    limit: int
