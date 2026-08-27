import { Badge, Card, CardHeader, Meter, StatTile, impactTone } from './ui';
import { NodeChip } from './NodePicker';
import { IconArrowRight, IconLayers, IconRipple, IconSparkles } from './Icons';
import { humanise, pct } from '../lib/format';
import type { ImpactReport, InterventionOption } from '../lib/types';

/**
 * Shared read-outs for a ripple analysis. The tourist and authority
 * screens frame the same report differently, so the panels live here and
 * the pages compose them.
 */

export function ImpactSummary({ report }: { report: ImpactReport }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Impact level"
        value={report.impact_level}
        hint="From affected count and cascade depth"
        tone={impactTone(report.impact_level)}
        icon={<IconRipple />}
      />
      <StatTile
        label="Services affected"
        value={report.affected_count}
        hint="Nodes reachable from the disruption"
        tone="warn"
        icon={<IconLayers />}
        delay={60}
      />
      <StatTile
        label="Cascade depth"
        value={report.max_depth}
        hint="Longest dependency hop count"
        tone="info"
        icon={<IconArrowRight />}
        delay={120}
      />
      <StatTile
        label="Interventions"
        value={report.interventions.length}
        hint={`Top option: ${report.interventions[0]?.name.split(' ').slice(0, 3).join(' ') ?? '—'}`}
        tone="brand"
        icon={<IconSparkles />}
        delay={180}
      />
    </div>
  );
}

export function CascadeChain({ report }: { report: ImpactReport }) {
  return (
    <Card>
      <CardHeader
        title="Dependency cascade"
        subtitle={`How pressure spreads from ${report.disrupted_label}`}
        icon={<IconRipple />}
      />
      {report.dependency_chain.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-mist-400">
          This node has no outgoing dependencies.
        </p>
      ) : (
        <ol className="divide-y divide-line">
          {report.dependency_chain.map((link, index) => (
            <li
              key={`${link.source}-${link.target}-${index}`}
              className="flex flex-wrap items-center gap-2.5 px-5 py-3"
            >
              <span className="w-6 shrink-0 font-mono text-[10px] text-mist-500">
                {String(index + 1).padStart(2, '0')}
              </span>
              <NodeChip node={{ id: link.source, label: link.source_label }} />
              <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-400" />
              <NodeChip node={{ id: link.target, label: link.target_label }} />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function AffectedNodes({ report }: { report: ImpactReport }) {
  const byDepth = report.affected_nodes.reduce<
    Record<number, ImpactReport['affected_nodes']>
  >((acc, node) => {
    (acc[node.depth] ??= []).push(node);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader
        title="Affected services by distance"
        subtitle="Depth 0 is the disrupted node itself"
        icon={<IconLayers />}
      />
      <div className="space-y-4 p-5">
        {Object.entries(byDepth)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([depth, nodes]) => (
            <div key={depth}>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-brand-400">
                  DEPTH {depth}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10px] text-mist-500">
                  {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {nodes.map((node) => (
                  <NodeChip key={node.id} node={node} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export function InterventionList({
  interventions,
  compact = false,
}: {
  interventions: InterventionOption[];
  compact?: boolean;
}) {
  if (interventions.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-mist-400">
        No interventions scored for this disruption.
      </p>
    );
  }

  const best = interventions[0].score || 1;

  return (
    <ul className="divide-y divide-line">
      {interventions.map((option) => (
        <li key={option.key} className="px-5 py-4">
          <div className="flex items-start gap-3.5">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                option.rank === 1
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/6 text-mist-300'
              }`}
            >
              {option.rank}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-[13px] font-bold text-white">
                  {option.name}
                </h4>
                <div className="flex shrink-0 gap-1.5">
                  <Badge tone={impactTone(option.impact_label)}>
                    {option.impact_label} impact
                  </Badge>
                  <Badge>{option.cost_label} cost</Badge>
                </div>
              </div>

              {!compact && (
                <p className="mt-1.5 text-xs leading-relaxed text-mist-400">
                  {option.description}
                </p>
              )}

              <div className="mt-2.5">
                <Meter
                  value={option.score / best}
                  tone={option.rank === 1 ? 'brand' : 'neutral'}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist-500">
                <span>
                  Reach <strong className="text-mist-300">{pct(option.reach)}</strong>
                </span>
                <span>
                  Effectiveness{' '}
                  <strong className="text-mist-300">
                    {pct(option.effectiveness)}
                  </strong>
                </span>
                <span>
                  Lead time{' '}
                  <strong className="text-mist-300">
                    {option.lead_time_hours}h
                  </strong>
                </span>
                <span>{option.owner}</span>
                {!compact &&
                  option.tags.map((tag) => (
                    <span key={tag} className="text-mist-500">
                      #{humanise(tag)}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
