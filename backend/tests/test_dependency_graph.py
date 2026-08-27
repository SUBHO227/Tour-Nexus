from types import SimpleNamespace

from app.services.dependency_graph import (
    build_graph,
    find_shortest_path,
)
from app.services.ripple_analysis import (
    find_affected_nodes,
    get_dependency_chain,
    get_dependency_depth,
    analyze_impact
)


def test_build_graph():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=2.0,
        ),
    ]

    graph = build_graph(dependencies)

    assert graph.has_edge(
        "attraction:1",
        "transport:2"
    )

    assert graph.has_edge(
        "transport:2",
        "restaurant:3"
    )

    assert graph["attraction:1"]["transport:2"]["weight"] == 1.0


def test_bfs_ripple():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=1.0,
        ),
    ]

    graph = build_graph(dependencies)

    affected = find_affected_nodes(
        graph,
        "attraction:1"
    )

    assert affected == [
        "attraction:1",
        "transport:2",
        "restaurant:3",
    ]


def test_dfs_dependency_chain():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=1.0,
        ),
    ]

    graph = build_graph(dependencies)

    chain = get_dependency_chain(
        graph,
        "attraction:1"
    )

    assert chain == [
        ("attraction:1", "transport:2"),
        ("transport:2", "restaurant:3"),
    ]
def test_dependency_depth():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=1.0,
        ),
    ]

    graph = build_graph(dependencies)

    depths = get_dependency_depth(
        graph,
        "attraction:1"
    )

    assert depths == {
        "attraction:1": 0,
        "transport:2": 1,
        "restaurant:3": 2,
    }  
def test_analyze_impact():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=1.0,
        ),
    ]

    graph = build_graph(dependencies)

    result = analyze_impact(
        graph,
        "attraction:1"
    )

    assert result["disrupted_node"] == "attraction:1"

    assert result["affected_count"] == 2

    assert result["max_depth"] == 2

    assert result["impact_level"] == "MEDIUM" 

def test_dijkstra_shortest_path():

    dependencies = [
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="transport",
            target_id=2,
            relationship="requires",
            weight=1.0,
        ),
        SimpleNamespace(
            source_type="transport",
            source_id=2,
            target_type="restaurant",
            target_id=3,
            relationship="connected_to",
            weight=2.0,
        ),
        SimpleNamespace(
            source_type="attraction",
            source_id=1,
            target_type="restaurant",
            target_id=3,
            relationship="direct",
            weight=10.0,
        ),
    ]

    graph = build_graph(dependencies)

    path = find_shortest_path(
        graph,
        "attraction:1",
        "restaurant:3",
    )

    assert path == [
        "attraction:1",
        "transport:2",
        "restaurant:3",
    ]
         