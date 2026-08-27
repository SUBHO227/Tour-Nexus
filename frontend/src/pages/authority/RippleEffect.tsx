import { useEffect, useMemo, useState } from 'react';

import { DependencyFlow, FlowLegend } from '../../components/DependencyFlow';
import { CascadeChain, ImpactSummary } from '../../components/ImpactPanels';
import { NodePicker } from '../../components/NodePicker';
import {
  AsyncSection,
  Card,
  CardHeader,
  ErrorBlock,
  LoadingBlock,
  Meter,
  PageHeader,
} from '../../components/ui';
import { IconRipple } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';

/**
 * Ripple Effect Visualization: pick a node, and the graph dims everything
 * the disruption cannot reach so the cascade is the only thing lit.
 */
export default function RippleEffect() {
  const graph = useApi(() => api.analytics.graph(), []);
  const [nodeId, setNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (nodeId || !graph.data) return;

    const outDegree = new Map<string, number>();

    for (const edge of graph.data.edges) {
      outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
    }

    const busiest = [...outDegree.entries()].sort((a, b) => b[1] - a[1])[0];
    setNodeId(busiest?.[0] ?? graph.data.nodes[0]?.id ?? null);
  }, [graph.data, nodeId]);

  const report = useApi(() => {
    if (!nodeId) return Promise.resolve(null);
    const [type, id] = nodeId.split(':');
    return api.analytics.interventions(type, Number(id));
  }, [nodeId]);

  const highlighted = useMemo(() => {
    if (!report.data) return undefined;
    return new Set(report.data.affected_nodes.map((n) => n.id));
  }, [report.data]);

  return (
    <>
      <PageHeader
        emoji="🌊"
        title="Ripple Effect Visualization"
        subtitle="Simulate a failure at any node and watch the cascade light up across the graph, hop by hop."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Graph is empty"
        emptyHint="Seed the backend to run ripple analysis."
        skeletonRows={4}
      >
        {(g) => (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Simulate a disruption"
                subtitle="The engine runs a BFS from this node and measures how far the pressure travels"
                icon={<IconRipple />}
              />
              <div className="p-5">
                <div className="max-w-md">
                  <NodePicker
                    nodes={g.nodes}
                    value={nodeId}
                    onChange={setNodeId}
                  />
                </div>
              </div>
            </Card>

            {report.loading && (
              <Card>
                <LoadingBlock rows={4} />
              </Card>
            )}

            {report.error && (
              <Card>
                <ErrorBlock
                  message={report.error}
                  offline={report.offline}
                  onRetry={report.reload}
                />
              </Card>
            )}

            {report.data && !report.loading && (
              <>
                <ImpactSummary report={report.data} />

                <Card>
                  <CardHeader
                    title="Cascade on the graph"
                    subtitle={`${report.data.affected_count} nodes reachable from ${report.data.disrupted_label} · depth ${report.data.max_depth}`}
                    icon={<IconRipple />}
                  />
                  <div className="p-4">
                    <DependencyFlow
                      graph={g}
                      highlighted={highlighted}
                      disruptedNode={report.data.disrupted_node}
                      height={560}
                      onNodeClick={setNodeId}
                    />
                    <div className="mt-3.5">
                      <FlowLegend />
                    </div>
                  </div>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <CascadeChain report={report.data} />

                  <Card>
                    <CardHeader
                      title="Propagation by hop"
                      subtitle="How many services each additional hop pulls in"
                    />
                    <div className="space-y-4 p-5">
                      {Object.entries(
                        report.data.affected_nodes.reduce<
                          Record<number, number>
                        >((acc, node) => {
                          acc[node.depth] = (acc[node.depth] ?? 0) + 1;
                          return acc;
                        }, {}),
                      )
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([depth, count]) => (
                          <div key={depth}>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <span className="text-mist-300">
                                {depth === '0'
                                  ? 'Origin'
                                  : `Hop ${depth}`}
                              </span>
                              <span className="font-bold tabular-nums text-white">
                                {count}
                              </span>
                            </div>
                            <Meter
                              value={
                                count /
                                Math.max(1, report.data!.affected_nodes.length)
                              }
                              tone={
                                Number(depth) === 0
                                  ? 'danger'
                                  : Number(depth) < 3
                                    ? 'warn'
                                    : 'info'
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </AsyncSection>
    </>
  );
}
