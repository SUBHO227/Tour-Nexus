import { useEffect, useState } from 'react';

import {
  AffectedNodes,
  CascadeChain,
  ImpactSummary,
  InterventionList,
} from '../../components/ImpactPanels';
import { NodePicker } from '../../components/NodePicker';
import {
  AsyncSection,
  Card,
  CardHeader,
  LoadingBlock,
  ErrorBlock,
  PageHeader,
} from '../../components/ui';
import { IconRipple, IconSparkles } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';

export default function ImpactView() {
  const graph = useApi(() => api.analytics.graph(), []);
  const [nodeId, setNodeId] = useState<string | null>(null);

  // Default to the node with the most outgoing edges - the one whose
  // failure explains the most.
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

  return (
    <>
      <PageHeader
        emoji="🌊"
        title="Dependency & Impact View"
        subtitle="Pick a service and see exactly what a problem there would do to the rest of your trip — and what could be done about it."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Dependency graph is empty"
        emptyHint="Seed the backend so the graph has nodes and edges."
        skeletonRows={3}
      >
        {(g) => (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="What if this service is disrupted?"
                subtitle={`${g.node_count} nodes · ${g.edge_count} dependency edges`}
                icon={<IconRipple />}
              />
              <div className="p-5">
                <div className="max-w-md">
                  <NodePicker
                    nodes={g.nodes}
                    value={nodeId}
                    onChange={setNodeId}
                    hint="The engine runs a BFS from this node and scores everything downstream."
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

                <div className="grid gap-6 xl:grid-cols-2">
                  <CascadeChain report={report.data} />
                  <AffectedNodes report={report.data} />
                </div>

                <Card>
                  <CardHeader
                    title="What could fix it"
                    subtitle="Interventions ranked by effect per unit of cost"
                    icon={<IconSparkles />}
                  />
                  <InterventionList
                    interventions={report.data.interventions.slice(0, 3)}
                  />
                </Card>
              </>
            )}
          </div>
        )}
      </AsyncSection>
    </>
  );
}
