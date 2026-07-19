from __future__ import annotations

import pytest

from app.engine.errors import EscrowStateTransitionError
from app.engine.state_machine import (
    TRANSITIONS,
    EscrowState,
    EscrowStateMachine,
    get_valid_transitions,
)
from tests.factories import MockContract, MockMilestone


class TestEscrowStateEnum:
    def test_all_nine_states_exist(self):
        assert len(EscrowState) == 9
        assert EscrowState.DRAFT == "DRAFT"
        assert EscrowState.PENDING_FUNDING == "PENDING_FUNDING"
        assert EscrowState.FUNDED == "FUNDED"
        assert EscrowState.IN_PROGRESS == "IN_PROGRESS"
        assert EscrowState.COMPLETED == "COMPLETED"
        assert EscrowState.DISPUTED == "DISPUTED"
        assert EscrowState.REFUNDED == "REFUNDED"
        assert EscrowState.CANCELLED == "CANCELLED"
        assert EscrowState.EXPIRED == "EXPIRED"


class TestTransitionsTable:
    def test_transitions_count(self):
        assert len(TRANSITIONS) == 14

    def test_draft_transitions(self):
        valid = get_valid_transitions(EscrowState.DRAFT)
        assert EscrowState.PENDING_FUNDING in valid
        assert EscrowState.CANCELLED in valid
        assert len(valid) == 2

    def test_pending_funding_transitions(self):
        valid = get_valid_transitions(EscrowState.PENDING_FUNDING)
        assert EscrowState.FUNDED in valid
        assert EscrowState.CANCELLED in valid
        assert EscrowState.EXPIRED in valid
        assert len(valid) == 3

    def test_funded_transitions(self):
        valid = get_valid_transitions(EscrowState.FUNDED)
        assert EscrowState.IN_PROGRESS in valid
        assert EscrowState.DISPUTED in valid
        assert EscrowState.REFUNDED in valid
        assert len(valid) == 3

    def test_in_progress_transitions(self):
        valid = get_valid_transitions(EscrowState.IN_PROGRESS)
        assert EscrowState.IN_PROGRESS in valid
        assert EscrowState.COMPLETED in valid
        assert EscrowState.DISPUTED in valid
        assert len(valid) == 3

    def test_disputed_transitions(self):
        valid = get_valid_transitions(EscrowState.DISPUTED)
        assert EscrowState.FUNDED in valid
        assert EscrowState.REFUNDED in valid
        assert EscrowState.COMPLETED in valid
        assert len(valid) == 3

    def test_completed_has_no_transitions(self):
        valid = get_valid_transitions(EscrowState.COMPLETED)
        assert len(valid) == 0

    def test_refunded_has_no_transitions(self):
        valid = get_valid_transitions(EscrowState.REFUNDED)
        assert len(valid) == 0

    def test_cancelled_has_no_transitions(self):
        valid = get_valid_transitions(EscrowState.CANCELLED)
        assert len(valid) == 0

    def test_expired_has_no_transitions(self):
        valid = get_valid_transitions(EscrowState.EXPIRED)
        assert len(valid) == 0


class TestInit:
    def test_initializes_from_contract_status(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        assert sm.current_state == EscrowState.DRAFT

    def test_initializes_to_funded(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        assert sm.current_state == EscrowState.FUNDED

    def test_initializes_to_disputed(self):
        sm = EscrowStateMachine(MockContract(status="DISPUTED"))
        assert sm.current_state == EscrowState.DISPUTED

    def test_invalid_status_raises_value_error(self):
        with pytest.raises(ValueError):
            EscrowStateMachine(MockContract(status="INVALID_STATUS"))


class TestCanTransitionTo:
    def test_valid_transition_returns_true(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        assert sm.can_transition_to(EscrowState.PENDING_FUNDING) is True

    def test_invalid_transition_returns_false(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        assert sm.can_transition_to(EscrowState.COMPLETED) is False

    def test_invalid_transition_from_terminal_state(self):
        sm = EscrowStateMachine(MockContract(status="COMPLETED"))
        assert sm.can_transition_to(EscrowState.DISPUTED) is False


class TestTransitionsSuccess:
    def test_draft_to_pending_funding(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        result = sm.transition(EscrowState.PENDING_FUNDING, {"parties_signed": True})
        assert result == EscrowState.PENDING_FUNDING
        assert sm.current_state == EscrowState.PENDING_FUNDING

    def test_pending_funding_to_funded(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        result = sm.transition(EscrowState.FUNDED, {"payment_intent_id": "pi_123"})
        assert result == EscrowState.FUNDED

    def test_funded_to_in_progress(self):
        contract = MockContract(status="FUNDED", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.IN_PROGRESS)
        assert result == EscrowState.IN_PROGRESS

    def test_in_progress_to_in_progress_milestone_release(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.IN_PROGRESS, {"milestone": MockMilestone()})
        assert result == EscrowState.IN_PROGRESS

    def test_in_progress_to_completed(self):
        milestone = MockMilestone(status="RELEASED")
        contract = MockContract(status="IN_PROGRESS", milestones=[milestone])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.COMPLETED)
        assert result == EscrowState.COMPLETED

    def test_draft_to_cancelled(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        result = sm.transition(EscrowState.CANCELLED)
        assert result == EscrowState.CANCELLED

    def test_pending_funding_to_cancelled(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        result = sm.transition(EscrowState.CANCELLED)
        assert result == EscrowState.CANCELLED

    def test_funded_to_disputed(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        result = sm.transition(EscrowState.DISPUTED, {"dispute_reason": "Fraud"})
        assert result == EscrowState.DISPUTED

    def test_in_progress_to_disputed(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.DISPUTED, {"dispute_reason": "Quality issue"})
        assert result == EscrowState.DISPUTED

    def test_disputed_to_funded(self):
        sm = EscrowStateMachine(MockContract(status="DISPUTED"))
        result = sm.transition(EscrowState.FUNDED)
        assert result == EscrowState.FUNDED

    def test_disputed_to_refunded(self):
        sm = EscrowStateMachine(MockContract(status="DISPUTED"))
        result = sm.transition(EscrowState.REFUNDED)
        assert result == EscrowState.REFUNDED

    def test_disputed_to_completed(self):
        sm = EscrowStateMachine(MockContract(status="DISPUTED"))
        result = sm.transition(EscrowState.COMPLETED)
        assert result == EscrowState.COMPLETED

    def test_pending_funding_to_expired(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        result = sm.transition(EscrowState.EXPIRED)
        assert result == EscrowState.EXPIRED

    def test_funded_to_refunded(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        result = sm.transition(EscrowState.REFUNDED, {
            "buyer_consent": True,
            "seller_consent": True,
        })
        assert result == EscrowState.REFUNDED


class TestGuardContractReady:
    def test_passes_when_parties_signed(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        result = sm.transition(EscrowState.PENDING_FUNDING, {"parties_signed": True})
        assert result == EscrowState.PENDING_FUNDING

    def test_fails_when_not_signed(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        with pytest.raises(EscrowStateTransitionError, match="Guard.*rejected"):
            sm.transition(EscrowState.PENDING_FUNDING, {"parties_signed": False})

    def test_fails_when_parties_signed_missing(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.PENDING_FUNDING, {})


class TestGuardFundingReceived:
    def test_passes_with_payment_intent_id(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        result = sm.transition(EscrowState.FUNDED, {"payment_intent_id": "pi_abc"})
        assert result == EscrowState.FUNDED

    def test_fails_without_payment_intent_id(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.FUNDED, {})

    def test_fails_with_empty_payment_intent_id(self):
        sm = EscrowStateMachine(MockContract(status="PENDING_FUNDING"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.FUNDED, {"payment_intent_id": ""})


class TestGuardFirstMilestone:
    def test_passes_with_milestones(self):
        contract = MockContract(status="FUNDED", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.IN_PROGRESS)
        assert result == EscrowState.IN_PROGRESS

    def test_fails_without_milestones(self):
        contract = MockContract(status="FUNDED", milestones=[])
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.IN_PROGRESS)


class TestGuardMilestoneRelease:
    def test_passes_with_milestone_in_context(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.IN_PROGRESS, {"milestone": "ms_1"})
        assert result == EscrowState.IN_PROGRESS

    def test_fails_without_milestone_in_context(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.IN_PROGRESS, {})

    def test_fails_with_none_milestone(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.IN_PROGRESS, {"milestone": None})


class TestGuardAllMilestonesReleased:
    def test_passes_when_all_released(self):
        m1 = MockMilestone(status="RELEASED")
        m2 = MockMilestone(status="RELEASED")
        contract = MockContract(status="IN_PROGRESS", milestones=[m1, m2])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.COMPLETED)
        assert result == EscrowState.COMPLETED

    def test_fails_when_one_pending(self):
        m1 = MockMilestone(status="RELEASED")
        m2 = MockMilestone(status="PENDING")
        contract = MockContract(status="IN_PROGRESS", milestones=[m1, m2])
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.COMPLETED)

    def test_vacuously_true_when_no_milestones(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[])
        sm = EscrowStateMachine(contract)
        result = sm.transition(EscrowState.COMPLETED)
        assert result == EscrowState.COMPLETED


class TestGuardDisputeHasEvidence:
    def test_passes_with_dispute_reason(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        result = sm.transition(EscrowState.DISPUTED, {"dispute_reason": "Not as described"})
        assert result == EscrowState.DISPUTED

    def test_fails_without_dispute_reason(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.DISPUTED, {})

    def test_fails_with_empty_dispute_reason(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.DISPUTED, {"dispute_reason": ""})

    def test_requires_evidence_from_in_progress_too(self):
        contract = MockContract(status="IN_PROGRESS", milestones=[MockMilestone()])
        sm = EscrowStateMachine(contract)
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.DISPUTED, {})


class TestGuardBothPartiesConsent:
    def test_passes_with_both_consents(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        result = sm.transition(EscrowState.REFUNDED, {
            "buyer_consent": True,
            "seller_consent": True,
        })
        assert result == EscrowState.REFUNDED

    def test_fails_without_buyer_consent(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.REFUNDED, {
                "buyer_consent": False,
                "seller_consent": True,
            })

    def test_fails_without_seller_consent(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.REFUNDED, {
                "buyer_consent": True,
                "seller_consent": False,
            })

    def test_fails_when_both_missing(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.REFUNDED, {})


class TestGuardAlwaysTrue:
    @pytest.mark.parametrize("from_state,to_state,guard_name", [
        (EscrowState.DRAFT, EscrowState.CANCELLED, "canceller_is_creator"),
        (EscrowState.PENDING_FUNDING, EscrowState.CANCELLED, "no_funds_received"),
        (EscrowState.PENDING_FUNDING, EscrowState.EXPIRED, "expiration_window"),
        (EscrowState.DISPUTED, EscrowState.FUNDED, "dispute_resolved_buyer"),
        (EscrowState.DISPUTED, EscrowState.REFUNDED, "dispute_resolved_refund"),
        (EscrowState.DISPUTED, EscrowState.COMPLETED, "dispute_resolved_seller"),
    ])
    def test_always_true_guards_accept_empty_context(self, from_state, to_state, guard_name):
        sm = EscrowStateMachine(MockContract(status=from_state.value))
        result = sm.transition(to_state)
        assert result == to_state

    @pytest.mark.parametrize("from_state,to_state", [
        (EscrowState.DRAFT, EscrowState.CANCELLED),
        (EscrowState.PENDING_FUNDING, EscrowState.CANCELLED),
        (EscrowState.PENDING_FUNDING, EscrowState.EXPIRED),
        (EscrowState.DISPUTED, EscrowState.FUNDED),
        (EscrowState.DISPUTED, EscrowState.REFUNDED),
        (EscrowState.DISPUTED, EscrowState.COMPLETED),
    ])
    def test_always_true_guards_accept_none_context(self, from_state, to_state):
        sm = EscrowStateMachine(MockContract(status=from_state.value))
        result = sm.transition(to_state, None)
        assert result == to_state


class TestInvalidTransitions:
    def test_draft_to_completed_invalid(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        with pytest.raises(EscrowStateTransitionError, match="Cannot transition from DRAFT to COMPLETED"):
            sm.transition(EscrowState.COMPLETED)

    def test_funded_to_expired_invalid(self):
        sm = EscrowStateMachine(MockContract(status="FUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.EXPIRED)

    def test_cancelled_to_anything_invalid(self):
        sm = EscrowStateMachine(MockContract(status="CANCELLED"))
        for state in EscrowState:
            if state != EscrowState.CANCELLED:
                with pytest.raises(EscrowStateTransitionError):
                    sm.transition(state)

    def test_completed_to_anything_invalid(self):
        sm = EscrowStateMachine(MockContract(status="COMPLETED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.DISPUTED)

    def test_refunded_to_anything_invalid(self):
        sm = EscrowStateMachine(MockContract(status="REFUNDED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.FUNDED)

    def test_expired_to_anything_invalid(self):
        sm = EscrowStateMachine(MockContract(status="EXPIRED"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.FUNDED)


class TestGetValidTransitions:
    def test_function_returns_correct_states(self):
        states = get_valid_transitions(EscrowState.DRAFT)
        assert set(states) == {EscrowState.PENDING_FUNDING, EscrowState.CANCELLED}

    def test_terminal_state_returns_empty(self):
        assert get_valid_transitions(EscrowState.COMPLETED) == []
        assert get_valid_transitions(EscrowState.CANCELLED) == []
        assert get_valid_transitions(EscrowState.REFUNDED) == []
        assert get_valid_transitions(EscrowState.EXPIRED) == []


class TestEdgeCases:
    def test_empty_context_defaults_to_empty_dict(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        with pytest.raises(EscrowStateTransitionError):
            sm.transition(EscrowState.PENDING_FUNDING)

    def test_context_with_extra_keys_ignored(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        result = sm.transition(EscrowState.PENDING_FUNDING, {
            "parties_signed": True,
            "unused_key": "value",
        })
        assert result == EscrowState.PENDING_FUNDING

    def test_current_state_property(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        assert sm.current_state == EscrowState.DRAFT
        sm.transition(EscrowState.PENDING_FUNDING, {"parties_signed": True})
        assert sm.current_state == EscrowState.PENDING_FUNDING

    def test_chain_transitions_draft_to_cancelled(self):
        sm = EscrowStateMachine(MockContract(status="DRAFT"))
        sm.transition(EscrowState.CANCELLED)
        assert sm.current_state == EscrowState.CANCELLED
        for state in EscrowState:
            if state != EscrowState.CANCELLED:
                assert sm.can_transition_to(state) is False
