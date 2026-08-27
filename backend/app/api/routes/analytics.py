"""
Aggregate endpoints that back the dashboards.

Everything here is derived from the dependency graph and live rows, so the
frontend never has to compute or invent these numbers.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attraction import Attraction
from app.models.crowd import CrowdData
from app.models.destination import Destination
from app.models.disruption import Disruption
from app.models.event import Event
from app.models.hotel import Hotel
from app.models.restaurant import Restaurant
from app.models.service import Service
from app.models.transport import Transport
from app.services.dependency_graph import build_graph, load_dependencies
from app.services.intervention import rank_interventions
from app.services.ripple_analysis import analyze_impact


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


def _build_label_map(db: Session) -> dict[str, str]:
    """Human-readable name for every node id in the dependency graph."""

    labels: dict[str, str] = {}

    model_by_type = {
        "destination": Destination,
        "attraction": Attraction,
        "hotel": Hotel,
        "restaurant": Restaurant,
        "transport": Transport,
        "event": Event,
        "service": Service,
    }

    for node_type, model in model_by_type.items():
        rows = db.execute(select(model)).scalars().all()

        for row in rows:
            labels[f"{node_type}:{row.id}"] = row.name

    return labels


def _latest_crowd(db: Session) -> dict[int, CrowdData]:
    rows = db.execute(
        select(CrowdData).order_by(CrowdData.timestamp.desc())
    ).scalars().all()

    latest: dict[int, CrowdData] = {}

    for row in rows:
        latest.setdefault(row.attraction_id, row)

    return latest


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    """KPI strip for the Authority Dashboard."""

    latest = _latest_crowd(db)

    attractions = db.execute(select(Attraction)).scalars().all()

    active_disruptions = db.execute(
        select(Disruption).where(Disruption.status == "active")
    ).scalars().all()

    crowd_scores = [row.crowd_score for row in latest.values()]

    average_crowd = (
        sum(crowd_scores) / len(crowd_scores) if crowd_scores else 0.0
    )

    level_counts: dict[str, int] = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0,
    }

    for row in latest.values():
        if row.crowd_level in level_counts:
            level_counts[row.crowd_level] += 1

    # Destination health: high crowd and active disruptions both pull it down.
    disruption_penalty = min(len(active_disruptions) * 0.08, 0.4)
    health = max(0.0, 1.0 - average_crowd - disruption_penalty)

    if health >= 0.65:
        health_label = "Stable"
    elif health >= 0.4:
        health_label = "Strained"
    elif health >= 0.2:
        health_label = "Stressed"
    else:
        health_label = "Critical"

    total_visitors = sum(row.estimated_visitors for row in latest.values())
    total_capacity = sum(row.capacity for row in latest.values())

    return {
        "destination_health": round(health, 3),
        "destination_health_label": health_label,
        "average_crowd_score": round(average_crowd, 3),
        "estimated_visitors": total_visitors,
        "total_capacity": total_capacity,
        "utilisation": (
            round(total_visitors / total_capacity, 3)
            if total_capacity
            else 0.0
        ),
        "attraction_count": len(attractions),
        "monitored_attractions": len(latest),
        "active_disruption_count": len(active_disruptions),
        "crowd_level_counts": level_counts,
        "hotel_count": len(db.execute(select(Hotel)).scalars().all()),
        "restaurant_count": len(
            db.execute(select(Restaurant)).scalars().all()
        ),
        "transport_count": len(
            db.execute(select(Transport)).scalars().all()
        ),
    }


@router.get("/graph")
def get_dependency_graph(db: Session = Depends(get_db)):
    """
    The dependency graph in a node/edge shape React Flow can render
    directly, with names resolved and crowd pressure attached.
    """

    dependencies = load_dependencies(db)
    labels = _build_label_map(db)
    latest = _latest_crowd(db)

    node_ids: set[str] = set()

    for dependency in dependencies:
        node_ids.add(f"{dependency.source_type}:{dependency.source_id}")
        node_ids.add(f"{dependency.target_type}:{dependency.target_id}")

    nodes = []

    for node_id in sorted(node_ids):
        node_type, raw_id = node_id.split(":", 1)

        crowd = (
            latest.get(int(raw_id))
            if node_type == "attraction" and raw_id.isdigit()
            else None
        )

        nodes.append(
            {
                "id": node_id,
                "type": node_type,
                "entity_id": int(raw_id) if raw_id.isdigit() else None,
                "label": labels.get(node_id, node_id),
                "crowd_score": crowd.crowd_score if crowd else None,
                "crowd_level": crowd.crowd_level if crowd else None,
            }
        )

    edges = [
        {
            "id": f"e{dependency.id}",
            "source": f"{dependency.source_type}:{dependency.source_id}",
            "target": f"{dependency.target_type}:{dependency.target_id}",
            "relationship": dependency.relationship,
            "weight": dependency.weight,
        }
        for dependency in dependencies
    ]

    return {
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


@router.get("/interventions/{source_type}/{source_id}")
def get_ranked_interventions(
    source_type: str,
    source_id: int,
    db: Session = Depends(get_db),
):
    """
    Rank the intervention catalogue against the ripple caused by one
    disrupted node. This is the decision-support step the concept
    document describes in Section 8.
    """

    dependencies = load_dependencies(db)
    graph = build_graph(dependencies)

    disrupted_node = f"{source_type}:{source_id}"

    if disrupted_node not in graph:
        raise HTTPException(
            status_code=404,
            detail=f"Node {disrupted_node} is not in the dependency graph",
        )

    analysis = analyze_impact(graph, disrupted_node)
    labels = _build_label_map(db)

    return {
        "disrupted_node": disrupted_node,
        "disrupted_label": labels.get(disrupted_node, disrupted_node),
        "impact_level": analysis["impact_level"],
        "affected_count": analysis["affected_count"],
        "max_depth": analysis["max_depth"],
        "affected_nodes": [
            {
                "id": node,
                "label": labels.get(node, node),
                "depth": analysis["depths"].get(node, 0),
            }
            for node in analysis["affected_nodes"]
        ],
        "dependency_chain": [
            {
                "source": source,
                "target": target,
                "source_label": labels.get(source, source),
                "target_label": labels.get(target, target),
            }
            for source, target in analysis["dependency_chain"]
        ],
        "interventions": rank_interventions(analysis),
    }
