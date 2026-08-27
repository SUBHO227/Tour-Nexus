import networkx as nx


def find_alternative_paths(
    graph,
    source,
    target,
    disrupted_node=None,
    max_paths=3,
):
    """
    Find alternative paths from source to target.

    If disrupted_node is provided, that node is removed
    from the graph before searching for paths.
    """

    working_graph = graph.copy()

    if disrupted_node and disrupted_node in working_graph:
        working_graph.remove_node(disrupted_node)

    if source not in working_graph:
        return []

    if target not in working_graph:
        return []

    try:
        paths = []

        path_generator = nx.shortest_simple_paths(
            working_graph,
            source,
            target,
            weight="weight",
        )

        for path in path_generator:
            paths.append(path)

            if len(paths) >= max_paths:
                break

        return paths

    except nx.NetworkXNoPath:
        return []