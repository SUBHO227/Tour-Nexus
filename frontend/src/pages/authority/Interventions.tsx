import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import { InterventionList } from '../../components/ImpactPanels';
import { NodePicker } from '../../components/NodePicker';
import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatTile,
  impactTone,
} from '../../components/ui';
import { IconSparkles, IconClock, IconLayers } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { pct } from '../../lib/format';

/**
 * Intervention prioritization — Section 8 of the concept document.
 * Authorities have limited money and staff, so the platform ranks the
 * options rather than just listing them.
 */
export default function Interventions() {
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

  return (
    <>
      <PageHeader
        emoji="🎯"
        title="Intervention Prioritization"
        subtitle="Finding the bottleneck is not enough. These options are scored on how much of the live cascade they actually relieve, divided by what they cost."
      />

      <AsyncSection
        state={graph}
        isEmpty={(g) => g.nodes.length === 0}
        emptyTitle="Graph is empty"
        emptyHint="Seed the backend to score interventions."
        skeletonRows={4}
      >
        {(g) => (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Which disruption are we responding to?"
                icon={<IconSparkles />}
              />
              <div className="p-5">
                <div className="max-w-md">
                  <NodePicker
                    nodes={g.nodes}
                    value={nodeId}
                    onChange={setNodeId}
                    hint="Scores are recomputed against this node's live ripple."
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
                    label="Responding to"
                    value={report.data.disrupted_label}
                    hint={`${report.data.affected_count} services affected`}
                    tone={impactTone(report.data.impact_level)}
                    icon={<IconLayers />}
                  />
                  <StatTile
                    label="Recommended"
                    value={report.data.interventions[0]?.name.split(' ')[0] ?? '—'}
                    hint={report.data.interventions[0]?.name}
                    tone="brand"
                    icon={<IconSparkles />}
                    delay={60}
                  />
                  <StatTile
                    label="Best coverage"
                    value={pct(report.data.interventions[0]?.reach ?? 0)}
                    hint="Share of the weighted ripple it touches"
                    tone="ok"
                    icon={<IconLayers />}
                    delay={120}
                  />
                  <StatTile
                    label="Fastest option"
                    value={`${Math.min(
                      ...report.data.interventions.map(
                        (i) => i.lead_time_hours,
                      ),
                    )}h`}
                    hint="Shortest lead time in the catalogue"
                    tone="info"
                    icon={<IconClock />}
                    delay={180}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
                  <Card>
                    <CardHeader
                      title="Ranked interventions"
                      subtitle="Effectiveness divided by cost, highest first"
                      icon={<IconSparkles />}
                      action={
                        <Badge tone={impactTone(report.data.impact_level)}>
                          {report.data.impact_level} impact event
                        </Badge>
                      }
                    />
                    <InterventionList interventions={report.data.interventions} />
                  </Card>

                  <Card delay={60}>
                    <CardHeader
                      title="Cost vs effectiveness"
                      subtitle="Top-left is cheap and effective"
                    />
                    <div className="p-5 pt-4">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart
                            margin={{ top: 10, right: 16, bottom: 34, left: 4 }}
                          >
                            <CartesianGrid stroke="#1f2b45" />
                            <XAxis
                              type="number"
                              dataKey="cost"
                              name="Cost"
                              stroke="#475569"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              label={{
                                value: 'Relative cost',
                                position: 'insideBottom',
                                offset: -18,
                                fill: '#475569',
                                fontSize: 11,
                              }}
                            />
                            <YAxis
                              type="number"
                              dataKey="effectiveness"
                              name="Effectiveness"
                              stroke="#475569"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v: number) =>
                                `${Math.round(v * 100)}%`
                              }
                            />
                            <ZAxis
                              type="number"
                              dataKey="size"
                              range={[70, 320]}
                            />
                            <Tooltip
                              cursor={{ strokeDasharray: '3 3' }}
                              contentStyle={{
                                background: '#111a2e',
                                border: '1px solid #1f2b45',
                                borderRadius: 12,
                                fontSize: 12,
                              }}
                              formatter={(value, key) =>
                                key === 'effectiveness'
                                  ? [pct(Number(value)), 'Effectiveness']
                                  : [String(value), String(key)]
                              }
                              labelFormatter={() => ''}
                            />
                            <Scatter
                              data={report.data.interventions.map((option) => ({
                                cost: option.cost_index,
                                effectiveness: option.effectiveness,
                                size: option.score * 100,
                                name: option.name,
                              }))}
                              fill="#6366f1"
                              fillOpacity={0.7}
                              stroke="#a5b4fc"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>

                      <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                        {report.data.interventions.slice(0, 3).map((option) => (
                          <li
                            key={option.key}
                            className="flex items-center gap-2 text-[11px]"
                          >
                            <span className="grid h-4 w-4 place-items-center rounded bg-brand-500/20 text-[9px] font-bold text-brand-300">
                              {option.rank}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-mist-300">
                              {option.name}
                            </span>
                            <span className="font-mono text-mist-500">
                              {option.score.toFixed(3)}
                            </span>
                          </li>
                        ))}
                      </ul>
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
