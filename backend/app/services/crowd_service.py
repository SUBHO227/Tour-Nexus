def calculate_crowd_score(
    estimated_visitors: int,
    capacity: int,
) -> float:
    """
    Calculate crowd score as visitors / capacity.

    Returns a value between 0.0 and 1.0.
    """

    if capacity <= 0:
        raise ValueError("Capacity must be greater than zero.")

    if estimated_visitors < 0:
        raise ValueError("Estimated visitors cannot be negative.")

    score = estimated_visitors / capacity

    return min(score, 1.0)


def get_crowd_level(crowd_score: float) -> str:
    """
    Convert crowd score into a human-readable crowd level.
    """

    if crowd_score < 0.40:
        return "low"

    if crowd_score < 0.70:
        return "medium"

    if crowd_score < 0.90:
        return "high"

    return "critical"