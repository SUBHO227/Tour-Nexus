import pytest

from app.services.crowd_service import (
    calculate_crowd_score,
    get_crowd_level,
)


def test_crowd_score():
    score = calculate_crowd_score(250, 500)

    assert score == 0.5


def test_crowd_level_low():
    assert get_crowd_level(0.2) == "low"


def test_crowd_level_medium():
    assert get_crowd_level(0.5) == "medium"


def test_crowd_level_high():
    assert get_crowd_level(0.8) == "high"


def test_crowd_level_critical():
    assert get_crowd_level(0.95) == "critical"


def test_zero_capacity():
    with pytest.raises(ValueError):
        calculate_crowd_score(10, 0)


def test_negative_visitors():
    with pytest.raises(ValueError):
        calculate_crowd_score(-10, 100)