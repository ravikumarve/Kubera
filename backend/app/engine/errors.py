from __future__ import annotations


class EscrowDomainError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "DOMAIN_ERROR",
        status_code: int = 400,
        details: list[dict] | None = None,
    ):
        self.code = code
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class EscrowStateTransitionError(EscrowDomainError):
    def __init__(
        self,
        message: str,
        code: str = "STATE_TRANSITION_ERROR",
        details: list[dict] | None = None,
    ):
        super().__init__(message, code=code, status_code=409, details=details)


class EscrowNotFoundError(EscrowDomainError):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            f"{entity} not found: {entity_id}",
            code="NOT_FOUND",
            status_code=404,
        )


class EscrowValidationError(EscrowDomainError):
    def __init__(self, message: str, details: list[dict] | None = None):
        super().__init__(
            message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details or [],
        )
