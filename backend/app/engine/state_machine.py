from __future__ import annotations

from enum import StrEnum


class EscrowState(StrEnum):
    DRAFT = "DRAFT"
    PENDING_FUNDING = "PENDING_FUNDING"
    FUNDED = "FUNDED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    REFUNDED = "REFUNDED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


TRANSITIONS: dict[tuple[EscrowState, EscrowState], str] = {
    (EscrowState.DRAFT, EscrowState.PENDING_FUNDING): "validate_contract_ready",
    (EscrowState.PENDING_FUNDING, EscrowState.FUNDED): "validate_funding_received",
    (EscrowState.FUNDED, EscrowState.IN_PROGRESS): "validate_first_milestone",
    (EscrowState.IN_PROGRESS, EscrowState.IN_PROGRESS): "validate_milestone_release",
    (EscrowState.IN_PROGRESS, EscrowState.COMPLETED): "validate_all_milestones_released",
    (EscrowState.DRAFT, EscrowState.CANCELLED): "validate_canceller_is_creator",
    (EscrowState.PENDING_FUNDING, EscrowState.CANCELLED): "validate_no_funds_received",
    (EscrowState.FUNDED, EscrowState.DISPUTED): "validate_dispute_has_evidence",
    (EscrowState.IN_PROGRESS, EscrowState.DISPUTED): "validate_dispute_has_evidence",
    (EscrowState.DISPUTED, EscrowState.FUNDED): "validate_dispute_resolved_buyer",
    (EscrowState.DISPUTED, EscrowState.REFUNDED): "validate_dispute_resolved_refund",
    (EscrowState.DISPUTED, EscrowState.COMPLETED): "validate_dispute_resolved_seller",
    (EscrowState.PENDING_FUNDING, EscrowState.EXPIRED): "validate_expiration_window",
    (EscrowState.FUNDED, EscrowState.REFUNDED): "validate_both_parties_consent",
}


class EscrowStateMachine:
    def __init__(self, contract):
        self.contract = contract
        self._current = EscrowState(contract.status)

    @property
    def current_state(self) -> EscrowState:
        return self._current

    def can_transition_to(self, target: EscrowState) -> bool:
        return (self._current, target) in TRANSITIONS

    def transition(self, target: EscrowState, context: dict | None = None) -> EscrowState:
        key = (self._current, target)
        if key not in TRANSITIONS:
            from app.engine.errors import EscrowStateTransitionError

            raise EscrowStateTransitionError(
                f"Cannot transition from {self._current.value} to {target.value}",
                code="INVALID_STATE_TRANSITION",
            )
        context = context or {}
        self._validate_guard(TRANSITIONS[key], context)
        self._current = target
        return self._current

    def _validate_guard(self, guard_name: str, context: dict) -> None:
        guard_method = getattr(self, f"_{guard_name}", None)
        if guard_method and not guard_method(context):
            from app.engine.errors import EscrowStateTransitionError

            raise EscrowStateTransitionError(
                f"Guard '{guard_name}' rejected transition",
                code="GUARD_REJECTED",
            )

    def _validate_contract_ready(self, ctx: dict) -> bool:
        return bool(ctx.get("parties_signed", False))

    def _validate_funding_received(self, ctx: dict) -> bool:
        return bool(ctx.get("payment_intent_id"))

    def _validate_first_milestone(self, ctx: dict) -> bool:
        return len(self.contract.milestones) > 0

    def _validate_milestone_release(self, ctx: dict) -> bool:
        return bool(ctx.get("milestone"))

    def _validate_all_milestones_released(self, ctx: dict) -> bool:
        return all(m.status.value == "RELEASED" for m in self.contract.milestones)

    def _validate_canceller_is_creator(self, ctx: dict) -> bool:
        return True

    def _validate_no_funds_received(self, ctx: dict) -> bool:
        return True

    def _validate_dispute_has_evidence(self, ctx: dict) -> bool:
        return bool(ctx.get("dispute_reason"))

    def _validate_expiration_window(self, ctx: dict) -> bool:
        return True

    def _validate_both_parties_consent(self, ctx: dict) -> bool:
        return bool(ctx.get("buyer_consent") and ctx.get("seller_consent"))

    def _validate_dispute_resolved_buyer(self, ctx: dict) -> bool:
        return True

    def _validate_dispute_resolved_refund(self, ctx: dict) -> bool:
        return True

    def _validate_dispute_resolved_seller(self, ctx: dict) -> bool:
        return True


def get_valid_transitions(state: EscrowState) -> list[EscrowState]:
    return [to for (fr, to) in TRANSITIONS if fr == state]
