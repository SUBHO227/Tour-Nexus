import { useState } from 'react';

import { DependencyFlow, FlowLegend } from '../../components/DependencyFlow';
import { NodeChip } from '../../components/NodePicker';
import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  PageHeader,
  StatTile,
} from '../../components/ui';
import { IconArrowRight, IconGraph, IconLayers } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { humanise, titleCase } from '../../lib/format';

export default function DependencyGraphPage() {
  const graph = useApi(() => api.analytics.graph(), []);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        emoji="🕸️"
        title="Dependency Graph"
        subtitle="The destination modelled as a directed graph. Nodes are services, transport and attractions; edges carry the weight of one thing's effect on another."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Graph is empty"
        emptyHint="Seed the backend to build the dependency graph."
        skeletonRows={4}
      >
        {(g) => {
          const selectedNode = g.nodes.find((n) => n.id === selected);

          const outgoing = g.edges.filter((e) => e.source === selected);
          const incoming = g.edges.filter((e) => e.target === selected);

          const byType = g.nodes.reduce<Record<string, number>>((acc, node) => {
            acc[node.type] = (acc[node.type] ?? 0) + 1;
            return acc;
          }, {});

          const heaviest = [...g.edges].sort((a, b) => b.weight - a.weight)[0];

          const labelOf = (id: string) =>
            g.nodes.find((n) => n.id === id)?.label ?? id;

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Nodes"
                  value={g.node_count}
                  hint={Object.entries(byType)
                    .map(([type, count]) => `${count} ${type}`)
                    .join(' · ')}
                  tone="brand"
                  icon={<IconGraph />}
                />
                <StatTile
                  label="Dependency edges"
                  value={g.edge_count}
                  hint="Weighted directed relationships"
                  tone="info"
                  icon={<IconArrowRight />}
                  delay={60}
                />
                <StatTile
                  label="Relationship kinds"
                  value={new Set(g.edges.map((e) => e.relationship)).size}
                  hint="Distinct edge semantics"
                  tone="warn"
                  icon={<IconLayers />}
                  delay={120}
                />
                <StatTile
                  label="Strongest link"
                  value={heaviest ? heaviest.weight.toFixed(2) : '—'}
                  hint={
                    heaviest
                      ? `${labelOf(heaviest.source)} → ${labelOf(heaviest.target)}`
                      : undefined
                  }
                  tone="danger"
                  icon={<IconArrowRight />}
                  delay={180}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                <Card>
                  <CardHeader
                    title="Graph view"
                    subtitle="Click a node to inspect its dependencies"
                    icon={<IconGraph />}
                  />
                  <div className="p-4">
                    <DependencyFlow
                      graph={g}
                      height={600}
                      onNodeClick={setSelected}
                      disruptedNode={selected}
                    />
                    <div className="mt-3.5">
                      <FlowLegend />
                    </div>
                  </div>
                </Card>

                <Card delay={60}>
                  <CardHeader
                    title={selectedNode ? selectedNode.label : 'Node inspector'}
                    subtitle={
                      selectedNode
                        ? titleCase(selectedNode.type)
                        : 'Select a node in the graph'
                    }
                    icon={<IconLayers />}
                  />

                  {selectedNode ? (
                    <div className="space-y-5 p-5">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="brand">{titleCase(selectedNode.type)}</Badge>
                        {selectedNode.crowd_level && (
                          <Badge tone="warn">
                            crowd: {selectedNode.crowd_level}
                          </Badge>
                        )}
                        <Badge>{incoming.length} in</Badge>
                        <Badge>{outgoing.length} out</Badge>
                      </div>

                      <EdgeList
                        title="Depends on"
                        hint="Upstream nodes that push load into this one"
                        edges={incoming.map((e) => ({
                          id: e.id,
                          nodeId: e.source,
                          label: labelOf(e.source),
                          relationship: e.relationship,
                          weight: e.weight,
                        }))}
                      />

                      <EdgeList
                        title="Affects"
                        hint="Downstream nodes this one pushes load into"
                        edges={outgoing.map((e) => ({
                          id: e.id,
                          nodeId: e.target,
                          label: labelOf(e.target),
                          relationship: e.relationship,
                          weight: e.weight,
                        }))}
                      />
                    </div>
                  ) : (
                    <p className="px-5 py-10 text-center text-xs text-mist-400">
                      Nothing selected.
                    </p>
                  )}
                </Card>
              </div>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}

function EdgeList({
  title,
  hint,
  edges,
}: {
  title: string;
  hint: string;
  edges: {
    id: string;
    nodeId: string;
    label: string;
    relationship: string;
    weight: number;
  }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-mist-400">
        {title}
      </p>
      <p className="mt-0.5 text-[10px] text-mist-500">{hint}</p>

      {edges.length === 0 ? (
        <p className="mt-2 text-xs text-mist-500">None.</p>
      ) : (
        <ul className="mt-2.5 space-y-2">
          {edges.map((edge) => (
            <li key={edge.id}>
              <NodeChip node={{ id: edge.nodeId, label: edge.label }} />
              <p className="ml-1 mt-1 text-[10px] text-mist-500">
                {humanise(edge.relationship)} · weight {edge.weight.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
