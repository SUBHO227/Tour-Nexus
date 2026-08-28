import networkx as nx

from app.services.alternative_path import find_alternative_paths


def test_find_alternative_path():

    graph = nx.DiGraph()

    graph.add_edge(
        "attraction:1",
        "transport:1",
        weight=1,
    )

    graph.add_edge(
        "transport:1",
        "hotel:1",
        weight=1,
    )

    graph.add_edge(
        "attraction:1",
        "transport:2",
        weight=2,
    )

    graph.add_edge(
        "transport:2",
        "hotel:1",
        weight=2,
    )

    paths = find_alternative_paths(
        graph,
        "attraction:1",
        "hotel:1",
        disrupted_node="transport:1",
    )

    assert paths == [
        [
            "attraction:1",
            "transport:2",
            "hotel:1",
        ]
    ]


def test_no_alternative_path():

    graph = nx.DiGraph()

    graph.add_edge(
        "attraction:1",
        "transport:1",
        weight=1,
    )

    graph.add_edge(
        "transport:1",
        "hotel:1",
        weight=1,
    )

    paths = find_alternative_paths(
        graph,
        "attraction:1",
        "hotel:1",
        disrupted_node="transport:1",
    )

    assert paths == []


def test_multiple_alternative_paths():

    graph = nx.DiGraph()

    graph.add_edge(
        "attraction:1",
        "transport:1",
        weight=1,
    )

    graph.add_edge(
        "transport:1",
        "hotel:1",
        weight=1,
    )

    graph.add_edge(
        "attraction:1",
        "transport:2",
        weight=2,
    )

    graph.add_edge(
        "transport:2",
        "hotel:1",
        weight=1,
    )

    graph.add_edge(
        "attraction:1",
        "transport:3",
        weight=3,
    )

    graph.add_edge(
        "transport:3",
        "hotel:1",
        weight=1,
    )

    paths = find_alternative_paths(
        graph,
        "attraction:1",
        "hotel:1",
        disrupted_node="transport:1",
    )

    assert len(paths) == 2