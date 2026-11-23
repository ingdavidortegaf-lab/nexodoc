import pytest

from app.domain.request_status import (
    LABELS,
    TERMINAL,
    TRANSITIONS,
    InvalidTransition,
    RequestStatus as S,
    assert_transition,
    can_transition,
    requires_note,
)


def test_all_states_have_labels_and_transitions():
    assert len(S) == 13
    assert set(LABELS) == set(S)
    assert set(TRANSITIONS) == set(S)


def test_happy_path_is_valid():
    path = [
        S.AWAITING_VERIFICATION, S.RECEIVED, S.IN_REVIEW, S.QUOTING, S.PENDING_PAYMENT, S.CONFIRMED,
        S.IN_PROGRESS, S.AWAITING_ENTITY, S.DOCUMENT_AVAILABLE, S.DELIVERED, S.CLOSED,
    ]
    for a, b in zip(path, path[1:]):
        assert_transition(a, b, by_system=True)


def test_cannot_skip_payment():
    assert not can_transition(S.QUOTING, S.IN_PROGRESS)
    with pytest.raises(InvalidTransition):
        assert_transition(S.QUOTING, S.CONFIRMED)


@pytest.mark.parametrize("pair", [(S.PENDING_PAYMENT, S.CONFIRMED), (S.AWAITING_VERIFICATION, S.RECEIVED)])
def test_payment_confirmations_are_system_only(pair):
    with pytest.raises(InvalidTransition):
        assert_transition(*pair)
    assert_transition(*pair, by_system=True)


def test_unpaid_verification_can_be_cancelled():
    assert can_transition(S.AWAITING_VERIFICATION, S.REJECTED_CANCELLED)


def test_terminal_states_are_final():
    for t in TERMINAL:
        assert TRANSITIONS[t] == frozenset()


def test_cannot_cancel_after_document_available():
    assert not can_transition(S.DOCUMENT_AVAILABLE, S.REJECTED_CANCELLED)


def test_notes_required_for_info_and_rejection():
    assert requires_note(S.NEEDS_INFO) and requires_note(S.REJECTED_CANCELLED)
    assert not requires_note(S.IN_PROGRESS)
