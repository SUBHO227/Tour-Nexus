import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';

import type { DependencyGraph } from '../lib/types';

/**
 * Renders the dependency graph with React Flow.
 *
 * Positions are computed by layering nodes on their longest distance from
 * a root (a node with no incoming edges), which mirrors how the cascade
 * actually flows: parking on the left, sanitation and waste on the right.
 */

const TYPE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  service: { bg: '#0c2a3a', border: '#0ea5e9', text: '#7dd3fc' },
  transport: { bg: '#1e1b4b', border: '#6366f1', text: '#a5b4fc' },
  attraction: { bg: '#3b2506', border: '#f59e0b', text: '#fcd34d' },
  destination: { bg: '#132033', border: '#475569', text: '#cbd5e1' },
};

const DEFAULT_STYLE = { bg: '#131d34', border: '#2b3a5c', text: '#cbd5e1' };

const CROWD_BORDER: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function computeLayers(graph: DependencyGraph): Map<string, number> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of graph.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of graph.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const layer = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, count] of incoming) {
    if (count === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  }

  // Longest-path layering. Cycles are handled by the visited guard so a
  // cyclic graph still lays out rather than hanging.
  const seen = new Map<string, number>();

  while (queue.length) {
    const current = queue.shift()!;
    const currentLayer = layer.get(current) ?? 0;

    const visits = (seen.get(current) ?? 0) + 1;
    seen.set(current, visits);

    if (visits > graph.nodes.length) continue;

    for (const next of outgoing.get(current) ?? []) {
      const candidate = currentLayer + 1;

      if (candidate > (layer.get(next) ?? -1)) {
        layer.set(next, candidate);
        queue.push(next);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!layer.has(node.id)) layer.set(node.id, 0);
  }

  return layer;
}

export function DependencyFlow({
  graph,
  highlighted,
  disruptedNode,
  height = 560,
  onNodeClick,
}: {
  graph: DependencyGraph;
  /** Node ids to emphasise; everything else is dimmed. */
  highlighted?: Set<string>;
  disruptedNode?: string | null;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const layers = computeLayers(graph);

    const perLayer = new Map<number, number>();

    const flowNodes: Node[] = graph.nodes.map((node) => {
      const layer = layers.get(node.id) ?? 0;
      const index = perLayer.get(layer) ?? 0;
      perLayer.set(layer, index + 1);

      const palette = TYPE_STYLE[node.type] ?? DEFAULT_STYLE;

      const isDisrupted = disruptedNode === node.id;
      const isHighlighted = !highlighted || highlighted.has(node.id);

      const borderColor = isDisrupted
        ? '#ef4444'
        : node.crowd_level
          ? CROWD_BORDER[node.crowd_level]
          : palette.border;

      return {
        id: node.id,
        position: { x: layer * 250, y: index * 92 },
        data: {
          label: (
            <div className="px-1 text-left">
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                {node.type}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold leading-snug">
                {node.label}
              </div>
              {node.crowd_level && (
                <div className="mt-0.5 text-[9px] opacity-70">
                  crowd: {node.crowd_level}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: palette.bg,
          border: `${isDisrupted ? 2.5 : 1.5}px solid ${borderColor}`,
          borderRadius: 12,
          color: palette.text,
          width: 172,
          padding: '8px 6px',
          fontSize: 11,
          opacity: isHighlighted ? 1 : 0.22,
          boxShadow: isDisrupted
            ? '0 0 0 4px rgba(239,68,68,0.18)'
            : '0 4px 14px rgba(0,0,0,0.3)',
          transition: 'opacity 0.25s ease',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    const flowEdges: Edge[] = graph.edges.map((edge) => {
      const lit =
        !highlighted ||
        (highlighted.has(edge.source) && highlighted.has(edge.target));

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.weight.toFixed(2),
        animated: lit && highlighted !== undefined,
        style: {
          stroke: lit ? '#6366f1' : '#1f2b45',
          strokeWidth: Math.max(1, edge.weight * 2.4),
          opacity: lit ? 0.85 : 0.18,
        },
        labelStyle: {
          fill: lit ? '#a5b4fc' : '#334155',
          fontSize: 9,
          fontWeight: 600,
        },
        labelBgStyle: { fill: '#0b1220', fillOpacity: lit ? 0.9 : 0.4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: lit ? '#6366f1' : '#1f2b45',
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph, highlighted, disruptedNode]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-line bg-ink-950"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: false }}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={
          onNodeClick ? (_, node) => onNodeClick(node.id) : undefined
        }
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#1f2b45"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function FlowLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-mist-400">
      {Object.entries(TYPE_STYLE).map(([type, style]) => (
        <span key={type} className="flex items-center gap-1.5 capitalize">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{ background: style.bg, borderColor: style.border }}
          />
          {type}
        </span>
      ))}
      <span className="text-mist-500">Edge thickness = dependency weight</span>
    </div>
  );
}
