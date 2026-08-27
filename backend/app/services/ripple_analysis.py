import networkx as nx


def find_affected_nodes(graph, disrupted_node):
    affected_nodes = list(
        nx.bfs_tree(
            graph,
            source=disrupted_node
        ).nodes
    )

    return affected_nodes

def get_dependency_chain(graph, disrupted_node):
    return list(
        nx.dfs_edges(
            graph,
            source=disrupted_node
        )
    )
def get_dependency_depth(graph, disrupted_node):
    return dict(
        nx.single_source_shortest_path_length(
            graph,
            disrupted_node
        )
    )
def analyze_impact(graph, disrupted_node):
    affected_nodes = find_affected_nodes(
        graph,
        disrupted_node
    )

    dependency_chain = get_dependency_chain(
        graph,
        disrupted_node
    )

    depths = get_dependency_depth(
        graph,
        disrupted_node
    )

    affected_count = len(affected_nodes) - 1

    max_depth = max(depths.values()) if depths else 0

    if affected_count >= 5 or max_depth >= 4:
        impact_level = "HIGH"
    elif affected_count >= 3 or max_depth >= 2:
        impact_level = "MEDIUM"
    else:
        impact_level = "LOW"

    return {
        "disrupted_node": disrupted_node,
        "affected_nodes": affected_nodes,
        "dependency_chain": dependency_chain,
        "depths": depths,
        "affected_count": affected_count,
        "max_depth": max_depth,
        "impact_level": impact_level,
    }