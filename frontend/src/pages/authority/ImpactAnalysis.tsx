import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AffectedNodes, ImpactSummary } from '../../components/ImpactPanels';
import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  impactTone,
} from '../../components/ui';
import { IconLayers } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import type { ImpactReport } from '../../lib/types';

const LEVEL_COLOR: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

/**
 * Compares every node in the graph by how much damage its failure would
 * cause, so the authority can see which services are systemically
 * critical rather than analysing them one at a time.
 */
export default function ImpactAnalysis() {
  const graph = useApi(() => api.analytics.graph(), []);

  const [reports, setReports] = useState<ImpactReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!graph.data) return;

    let cancelled = false;

    // Only nodes with outgoing edges can start a cascade.
    const sources = new Set(graph.data.edges.map((e) => e.source));
    const candidates = graph.data.nodes.filter((n) => sources.has(n.id));

    Promise.all(
      candidates.map((node) => {
        const [type, id] = node.id.split(':');
        return api.analytics.interventions(type, Number(id));
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const sorted = [...results].sort(
          (a, b) =>
            b.affected_count - a.affected_count || b.max_depth - a.max_depth,
        );
        setReports(sorted);
        setSelected((current) => current ?? sorted[0]?.disrupted_node ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Analysis failed.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [graph.data]);

  const active = reports?.find((r) => r.disrupted_node === selected) ?? null;

  return (
    <>
      <PageHeader
        emoji="📊"
        title="Impact Analysis"
        subtitle="Every node that can start a cascade, ranked by how much of the destination its failure would touch."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Graph is empty"
        emptyHint="Seed the backend to run impact analysis."
        skeletonRows={4}
      >
        {(g) => {
          if (error) {
            return (
              <Card>
                <ErrorBlock message={error} onRetry={graph.reload} />
              </Card>
            );
          }

          if (!reports) {
            return (
              <Card>
                <CardHeader
                  title="Running analysis"
                  subtitle="Simulating a failure at every source node"
                />
                <LoadingBlock rows={5} />
              </Card>
            );
          }

          const chart = reports.map((report) => ({
            name: report.disrupted_label
              .replace(/\s*\(.*\)/, '')
              .split(' ')
              .slice(0, 3)
              .join(' '),
            node: report.disrupted_node,
            affected: report.affected_count,
            depth: report.max_depth,
            level: report.impact_level,
          }));

          return (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Systemic criticality"
                  subtitle="Services affected if this node fails — click a bar to inspect"
                  icon={<IconLayers />}
                />
                <div className="p-5 pt-4">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart} margin={{ bottom: 60 }}>
                        <CartesianGrid stroke="#1f2b45" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#475569"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{
                            background: '#111a2e',
                            border: '1px solid #1f2b45',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                          formatter={(value, key) => [
                            String(value),
                            key === 'affected' ? 'Services affected' : 'Depth',
                          ]}
                        />
                        <Bar
                          dataKey="affected"
                          radius={[6, 6, 0, 0]}
                          onClick={(entry) => {
                            const node = (entry as { payload?: { node?: string } })
                              .payload?.node;
                            if (node) setSelected(node);
                          }}
                          className="cursor-pointer"
                        >
                          {chart.map((entry) => (
                            <Cell
                              key={entry.node}
                              fill={LEVEL_COLOR[entry.level] ?? '#6366f1'}
                              opacity={
                                selected === entry.node || !selected ? 1 : 0.45
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                <Card>
                  <CardHeader
                    title="Ranked nodes"
                    subtitle={`${reports.length} cascade origins`}
                  />
                  <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
                    {reports.map((report, index) => (
                      <li key={report.disrupted_node}>
                        <button
                          type="button"
                          onClick={() => setSelected(report.disrupted_node)}
                          className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                            selected === report.disrupted_node
                              ? 'bg-brand-500/10'
                              : 'hover:bg-white/3'
                          }`}
                        >
                          <span className="w-5 shrink-0 font-mono text-[10px] text-mist-500">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-white">
                              {report.disrupted_label}
                            </span>
                            <span className="block text-[10px] text-mist-500">
                              {report.affected_count} affected · depth{' '}
                              {report.max_depth}
                            </span>
                          </span>
                          <Badge tone={impactTone(report.impact_level)}>
                            {report.impact_level}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="space-y-6">
                  {active ? (
                    <>
                      <ImpactSummary report={active} />
                      <AffectedNodes report={active} />
                    </>
                  ) : (
                    <Card>
                      <p className="px-5 py-12 text-center text-sm text-mist-400">
                        Select a node to see its full impact profile.
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              <p className="text-center text-[11px] text-mist-500">
                Analysed {reports.length} of {g.node_count} nodes — only nodes
                with outgoing dependencies can originate a cascade.
              </p>
            </div>
          );
        }}
      </AsyncSection>
    </>
  );
}
