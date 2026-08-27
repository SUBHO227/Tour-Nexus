"""
Intervention prioritization.

Section 8 of the concept document: finding a bottleneck is not enough,
because authorities have limited money, staff and vehicles. This module
scores candidate interventions against a live ripple analysis so the
dashboard can rank them instead of listing them.

An intervention is scored on three things:

  reach     how much of the current ripple it actually touches, weighted
            so that nodes close to the disruption count for more
  strength   how much relief the intervention gives a node it touches
  cost       relative effort/expense

  effectiveness = reach * strength
  score         = effectiveness / cost
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Intervention:
    key: str
    name: str
    description: str
    # Node type prefixes this intervention can relieve, e.g. "attraction".
    targets: tuple[str, ...]
    # Fraction of stress removed from a node this intervention reaches.
    strength: float
    # Relative cost, 1.0 = the cheapest option.
    cost: float
    cost_label: str
    lead_time_hours: int
    owner: str
    tags: tuple[str, ...] = field(default_factory=tuple)


# Catalogue drawn from the concept document's worked Puri example.
INTERVENTIONS: tuple[Intervention, ...] = (
    Intervention(
        key="redirect_visitors",
        name="Redirect visitors to alternative attractions",
        description=(
            "Push crowd away from the stressed attraction using the app, "
            "signage and on-ground guides."
        ),
        targets=("attraction", "destination"),
        strength=0.55,
        cost=1.0,
        cost_label="Low",
        lead_time_hours=1,
        owner="Tourism Authority",
        tags=("demand-side", "immediate"),
    ),
    Intervention(
        key="increase_shuttles",
        name="Increase shuttle bus capacity",
        description=(
            "Add shuttle frequency on the affected corridor to reduce "
            "private vehicle load and clear waiting crowds faster."
        ),
        targets=("transport", "attraction"),
        strength=0.60,
        cost=2.0,
        cost_label="Medium",
        lead_time_hours=4,
        owner="Transport Department",
        tags=("supply-side",),
    ),
    Intervention(
        key="waste_collection",
        name="Increase waste collection rounds",
        description=(
            "Add collection trips and temporary bins around high-footfall "
            "points before sanitation load peaks."
        ),
        targets=("attraction", "destination"),
        strength=0.45,
        cost=2.0,
        cost_label="Medium",
        lead_time_hours=6,
        owner="Municipal Corporation",
        tags=("downstream", "sanitation"),
    ),
    Intervention(
        key="temporary_parking",
        name="Open temporary parking ground",
        description=(
            "Release an overflow parking ground with a feeder service to "
            "the attraction entrance."
        ),
        targets=("transport", "destination"),
        strength=0.50,
        cost=3.5,
        cost_label="High",
        lead_time_hours=12,
        owner="District Administration",
        tags=("supply-side", "infrastructure"),
    ),
    Intervention(
        key="timed_entry",
        name="Introduce timed-entry slots",
        description=(
            "Spread arrivals across the day with booked entry windows so "
            "peak concurrency drops without reducing total visitors."
        ),
        targets=("attraction",),
        strength=0.65,
        cost=1.5,
        cost_label="Low-Medium",
        lead_time_hours=24,
        owner="Tourism Authority",
        tags=("demand-side", "scheduling"),
    ),
    Intervention(
        key="reroute_traffic",
        name="Reroute through-traffic around the core",
        description=(
            "Divert non-tourist traffic away from the congested stretch to "
            "recover transport travel times."
        ),
        targets=("transport", "route"),
        strength=0.50,
        cost=2.5,
        cost_label="Medium",
        lead_time_hours=3,
        owner="Traffic Police",
        tags=("supply-side", "traffic"),
    ),
)


def _node_type(node: str) -> str:
    return node.split(":", 1)[0] if ":" in node else node


def _reach(
    intervention: Intervention,
    affected_nodes: list[str],
    depths: dict[str, int],
) -> tuple[float, list[str]]:
    """
    Weighted share of the ripple this intervention can touch.

    A node one hop from the disruption carries more weight than a node
    four hops away, because relieving it stops more of the cascade.
    """

    total_weight = 0.0
    covered_weight = 0.0
    covered_nodes: list[str] = []

    for node in affected_nodes:
        weight = 1.0 / (1.0 + depths.get(node, 0))
        total_weight += weight

        if _node_type(node) in intervention.targets:
            covered_weight += weight
            covered_nodes.append(node)

    if total_weight == 0:
        return 0.0, []

    return covered_weight / total_weight, covered_nodes


def rank_interventions(analysis: dict) -> list[dict]:
    """
    Rank the catalogue against one ripple analysis.

    `analysis` is the dict returned by ripple_analysis.analyze_impact.
    """

    affected_nodes = analysis.get("affected_nodes", [])
    depths = analysis.get("depths", {})

    ranked: list[dict] = []

    for intervention in INTERVENTIONS:
        reach, covered_nodes = _reach(
            intervention,
            affected_nodes,
            depths,
        )

        effectiveness = reach * intervention.strength
        score = effectiveness / intervention.cost

        if effectiveness >= 0.35:
            impact_label = "High"
        elif effectiveness >= 0.15:
            impact_label = "Moderate"
        elif effectiveness > 0:
            impact_label = "Low"
        else:
            impact_label = "None"

        ranked.append(
            {
                "key": intervention.key,
                "name": intervention.name,
                "description": intervention.description,
                "owner": intervention.owner,
                "cost_label": intervention.cost_label,
                "cost_index": intervention.cost,
                "lead_time_hours": intervention.lead_time_hours,
                "tags": list(intervention.tags),
                "reach": round(reach, 3),
                "effectiveness": round(effectiveness, 3),
                "impact_label": impact_label,
                "score": round(score, 3),
                "covered_nodes": covered_nodes,
                "covered_count": len(covered_nodes),
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)

    for position, item in enumerate(ranked, start=1):
        item["rank"] = position

    return ranked
