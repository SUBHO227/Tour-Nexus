import networkx as nx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dependency import Dependency
def load_dependencies(db: Session):
    result = db.execute(
        select(Dependency).order_by(Dependency.id)
    )

    return result.scalars().all()


def build_graph(dependencies):
    graph = nx.DiGraph()

    for dependency in dependencies:
        source = f"{dependency.source_type}:{dependency.source_id}"
        target = f"{dependency.target_type}:{dependency.target_id}"

        graph.add_edge(
            source,
            target,
            relationship=dependency.relationship,
            weight=dependency.weight,
        )

    return graph
def find_shortest_path(graph, source, target):
    return nx.dijkstra_path(
        graph,
        source,
        target,
        weight="weight",
    )