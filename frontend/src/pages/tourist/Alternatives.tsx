import { useEffect, useState } from 'react';

import { NodeChip, NodePicker } from '../../components/NodePicker';
import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from '../../components/ui';
import { IconArrowRight, IconRoute } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import type { GraphNode } from '../../lib/types';

/**
 * Alternative routing: when a node in the chain goes down, which other
 * paths still connect source to target? Backed by
 * /api/dependencies/alternative-path, which removes the disrupted node
 * and re-runs a weighted shortest-simple-paths search.
 */
export default function Alternatives() {
  const graph = useApi(() => api.analytics.graph(), []);

  const [source, setSource] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [disrupted, setDisrupted] = useState<string | null>(null);

  useEffect(() => {
    if (!graph.data || source) return;

    const { nodes, edges } = graph.data;

    // Pick a source that has outgoing edges and a target it can reach.
    const sources = new Set(edges.map((e) => e.source));
    const targets = new Set(edges.map((e) => e.target));

    const firstSource = nodes.find(
      (n) => sources.has(n.id) && !targets.has(n.id),
    );

    const attractionTarget = nodes.find(
      (n) => n.type === 'attraction' && targets.has(n.id),
    );

    const middle = nodes.find(
      (n) =>
        n.id !== firstSource?.id &&
        n.id !== attractionTarget?.id &&
        sources.has(n.id) &&
        targets.has(n.id),
    );

    setSource(firstSource?.id ?? nodes[0]?.id ?? null);
    setTarget(attractionTarget?.id ?? nodes[nodes.length - 1]?.id ?? null);
    setDisrupted(middle?.id ?? null);
  }, [graph.data, source]);

  const paths = useApi(() => {
    if (!source || !target || !disrupted) return Promise.resolve(null);
    return api.dependencies.alternativePaths(source, target, disrupted);
  }, [source, target, disrupted]);

  const labelOf = (nodes: GraphNode[], id: string) =>
    nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <>
      <PageHeader
        emoji="🔀"
        title="Alternative Recommendations"
        subtitle="If one link in the chain fails, what routes still get you there? The engine removes the failed node and re-searches the graph."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Dependency graph is empty"
        emptyHint="Seed the backend so alternatives can be computed."
        skeletonRows={3}
      >
        {(g) => (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Route setup"
                subtitle="Choose where you are coming from, where you are going, and what has failed"
                icon={<IconRoute />}
              />
              <div className="grid gap-4 p-5 md:grid-cols-3">
                <NodePicker
                  nodes={g.nodes}
                  value={source}
                  onChange={setSource}
                  label="From"
                />
                <NodePicker
                  nodes={g.nodes}
                  value={target}
                  onChange={setTarget}
                  label="To"
                />
                <NodePicker
                  nodes={g.nodes}
                  value={disrupted}
                  onChange={setDisrupted}
                  label="Disrupted (removed)"
                />
              </div>
            </Card>

            {paths.loading && (
              <Card>
                <LoadingBlock rows={3} />
              </Card>
            )}

            {paths.error && (
              <Card>
                <ErrorBlock
                  message={paths.error}
                  offline={paths.offline}
                  onRetry={paths.reload}
                />
              </Card>
            )}

            {paths.data && !paths.loading && (
              <Card>
                <CardHeader
                  title="Alternative paths"
                  subtitle={`${paths.data.alternative_count} route${
                    paths.data.alternative_count === 1 ? '' : 's'
                  } avoiding ${labelOf(g.nodes, paths.data.disrupted_node)}`}
                  icon={<IconRoute />}
                  action={
                    <Badge
                      tone={paths.data.alternative_count > 0 ? 'ok' : 'danger'}
                    >
                      {paths.data.alternative_count > 0
                        ? 'Reroute possible'
                        : 'No route available'}
                    </Badge>
                  }
                />

                {paths.data.alternative_count === 0 ? (
                  <EmptyBlock
                    title="No alternative route"
                    hint={`Removing ${labelOf(
                      g.nodes,
                      paths.data.disrupted_node,
                    )} disconnects ${labelOf(g.nodes, paths.data.source)} from ${labelOf(
                      g.nodes,
                      paths.data.target,
                    )}. That makes it a single point of failure worth escalating.`}
                  />
                ) : (
                  <ol className="divide-y divide-line">
                    {paths.data.alternative_paths.map((path, index) => (
                      <li key={index} className="px-5 py-4">
                        <div className="mb-3 flex items-center gap-2.5">
                          <span
                            className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold ${
                              index === 0
                                ? 'bg-brand-500 text-white'
                                : 'bg-white/6 text-mist-300'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-[13px] font-semibold text-white">
                            {index === 0 ? 'Best alternative' : `Option ${index + 1}`}
                          </span>
                          <span className="text-[11px] text-mist-500">
                            {path.length} hops
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {path.map((nodeId, hop) => (
                            <span
                              key={`${nodeId}-${hop}`}
                              className="flex items-center gap-2"
                            >
                              <NodeChip
                                node={{
                                  id: nodeId,
                                  label: labelOf(g.nodes, nodeId),
                                }}
                              />
                              {hop < path.length - 1 && (
                                <IconArrowRight className="h-3.5 w-3.5 text-brand-400" />
                              )}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            )}
          </div>
        )}
      </AsyncSection>
    </>
  );
}
