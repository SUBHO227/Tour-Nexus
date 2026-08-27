import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  Dot,
  Meter,
  PageHeader,
  StatTile,
  crowdTone,
} from '../../components/ui';
import {
  IconAlert,
  IconArrowRight,
  IconGauge,
  IconLayers,
  IconRefresh,
  IconUsers,
} from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct, relativeTime, titleCase } from '../../lib/format';

const LEVEL_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export default function Overview() {
  const data = useApi(
    () =>
      Promise.all([
        api.analytics.overview(),
        api.crowd.latest(),
        api.crowd.history(),
        api.attractions.list(),
        api.disruptions.active(),
        api.services.list(),
      ]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="🛡️"
        title="Destination Overview"
        subtitle="Live condition of the destination, computed by the backend from crowd readings, service loads and active disruptions."
        action={
          <button
            onClick={data.reload}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/3 px-4 py-2.5 text-sm font-semibold text-mist-100 transition hover:border-line-strong hover:bg-white/6"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <AsyncSection state={data} skeletonRows={4}>
        {([overview, latest, history, attractions, disruptions, services]) => {
          const nameOf = new Map(attractions.map((a) => [a.id, a.name]));

          // Crowd trend: average crowd score per hour bucket.
          const buckets = new Map<string, { sum: number; count: number }>();

          for (const reading of history) {
            const hour = reading.timestamp.slice(11, 13);
            const bucket = buckets.get(hour) ?? { sum: 0, count: 0 };
            bucket.sum += reading.crowd_score;
            bucket.count += 1;
            buckets.set(hour, bucket);
          }

          const trend = [...buckets.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hour, bucket]) => ({
              hour: `${hour}:00`,
              crowd: Number((bucket.sum / bucket.count).toFixed(3)),
            }));

          const crowdBars = latest
            .map((reading) => ({
              name: (nameOf.get(reading.attraction_id) ?? '—')
                .replace(/\s*\(.*\)/, '')
                .split(' ')
                .slice(0, 2)
                .join(' '),
              score: Number(reading.crowd_score.toFixed(3)),
              level: reading.crowd_level,
            }))
            .sort((a, b) => b.score - a.score);

          const strained = services
            .filter((s) => (s.load_ratio ?? 0) >= 0.8)
            .sort((a, b) => (b.load_ratio ?? 0) - (a.load_ratio ?? 0));

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Destination health"
                  value={overview.destination_health_label}
                  hint={`Score ${pct(overview.destination_health)} · crowd + disruption penalty`}
                  tone={
                    overview.destination_health > 0.6
                      ? 'ok'
                      : overview.destination_health > 0.35
                        ? 'warn'
                        : 'danger'
                  }
                  icon={<IconGauge />}
                />
                <StatTile
                  label="Visitors on site"
                  value={num(overview.estimated_visitors)}
                  hint={`${pct(overview.utilisation)} of ${num(overview.total_capacity)} capacity`}
                  tone="info"
                  icon={<IconUsers />}
                  delay={60}
                />
                <StatTile
                  label="Active disruptions"
                  value={overview.active_disruption_count}
                  hint={`${overview.monitored_attractions} attractions monitored`}
                  tone={overview.active_disruption_count ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                  delay={120}
                />
                <StatTile
                  label="Services strained"
                  value={strained.length}
                  hint="At or above 80% of capacity"
                  tone={strained.length ? 'warn' : 'ok'}
                  icon={<IconLayers />}
                  delay={180}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2" delay={60}>
                  <CardHeader
                    title="Crowd trend"
                    subtitle="Average crowd score across all monitored attractions"
                    icon={<IconUsers />}
                  />
                  <div className="p-5 pt-4">
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                          <defs>
                            <linearGradient id="crowdFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#1f2b45" vertical={false} />
                          <XAxis
                            dataKey="hour"
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 1]}
                            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#111a2e',
                              border: '1px solid #1f2b45',
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(value) => [pct(Number(value)), 'Avg crowd']}
                          />
                          <Area
                            type="monotone"
                            dataKey="crowd"
                            stroke="#818cf8"
                            strokeWidth={2}
                            fill="url(#crowdFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>

                <Card delay={120}>
                  <CardHeader
                    title="Crowd distribution"
                    subtitle="Attractions by level"
                  />
                  <div className="space-y-4 p-5">
                    {Object.entries(overview.crowd_level_counts).map(
                      ([level, count]) => (
                        <div key={level}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 capitalize text-mist-300">
                              <Dot tone={crowdTone(level as never)} />
                              {level}
                            </span>
                            <span className="font-bold tabular-nums text-white">
                              {count}
                            </span>
                          </div>
                          <Meter
                            value={
                              overview.monitored_attractions
                                ? count / overview.monitored_attractions
                                : 0
                            }
                            tone={crowdTone(level as never)}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </Card>

                <Card className="xl:col-span-2" delay={180}>
                  <CardHeader
                    title="Crowd by attraction"
                    subtitle="Latest reading, busiest first"
                  />
                  <div className="p-5 pt-4">
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={crowdBars} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid stroke="#1f2b45" horizontal={false} />
                          <XAxis
                            type="number"
                            domain={[0, 1]}
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#475569"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={110}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            contentStyle={{
                              background: '#111a2e',
                              border: '1px solid #1f2b45',
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            formatter={(value) => [pct(Number(value)), 'Crowd']}
                          />
                          <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                            {crowdBars.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={LEVEL_COLOR[entry.level] ?? '#6366f1'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>

                <Card delay={240}>
                  <CardHeader
                    title="Services under strain"
                    subtitle="Load against capacity"
                    icon={<IconLayers />}
                  />
                  {strained.length === 0 ? (
                    <p className="px-5 py-10 text-center text-xs text-mist-400">
                      All services within comfortable limits.
                    </p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {strained.map((service) => (
                        <li key={service.id} className="px-5 py-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-white">
                                {service.name}
                              </p>
                              <p className="text-[10px] text-mist-500">
                                {titleCase(service.service_type)} · {service.source}
                              </p>
                            </div>
                            <Badge
                              tone={
                                (service.load_ratio ?? 0) >= 0.92
                                  ? 'danger'
                                  : 'warn'
                              }
                            >
                              {pct(service.load_ratio ?? 0)}
                            </Badge>
                          </div>
                          <Meter
                            value={service.load_ratio ?? 0}
                            tone={
                              (service.load_ratio ?? 0) >= 0.92 ? 'danger' : 'warn'
                            }
                            className="mt-2.5"
                          />
                          <p className="mt-1.5 text-[10px] text-mist-500">
                            {num(service.current_load ?? 0)} of{' '}
                            {num(service.capacity ?? 0)} {service.unit}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="xl:col-span-3" delay={300}>
                  <CardHeader
                    title="Active disruptions"
                    subtitle="Requiring an intervention decision"
                    icon={<IconAlert />}
                    action={
                      <Link
                        to="/authority/disruptions"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200"
                      >
                        Open board
                        <IconArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    }
                  />
                  {disruptions.length === 0 ? (
                    <p className="px-5 py-10 text-center text-xs text-mist-400">
                      No active disruptions.
                    </p>
                  ) : (
                    <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                      {disruptions.map((disruption) => (
                        <div key={disruption.id} className="bg-ink-800 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-bold text-white">
                              {disruption.disruption_type}
                            </p>
                            <Badge tone="danger">
                              <Dot tone="danger" />
                              active
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-brand-300">
                            {disruption.attraction_id
                              ? (nameOf.get(disruption.attraction_id) ?? '—')
                              : 'Destination-wide'}
                          </p>
                          {disruption.description && (
                            <p className="mt-2 text-[11px] leading-relaxed text-mist-400">
                              {disruption.description}
                            </p>
                          )}
                          <p className="mt-2 text-[10px] text-mist-500">
                            Started {relativeTime(disruption.started_at)}
                          </p>
                        </div>
                      ))}
                    </div>
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
