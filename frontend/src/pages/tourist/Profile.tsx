import { Link } from 'react-router-dom';

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
  IconCalendar,
  IconGauge,
  IconPin,
  IconUsers,
} from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { dayLabel, num, pct, relativeTime } from '../../lib/format';

export default function Profile() {
  const { user } = useAuth();

  const overview = useApi(() => api.analytics.overview(), []);
  const disruptions = useApi(() => api.disruptions.active(), []);
  const itineraries = useApi(() => api.itineraries.list(), []);
  const crowd = useApi(
    () => Promise.all([api.crowd.latest(), api.attractions.list()]),
    [],
  );

  const myTrip = itineraries.data?.find((it) => it.tourist_id === user?.id);

  return (
    <>
      <PageHeader
        emoji="👋"
        title={`Welcome back, ${user?.full_name?.split(' ')[0] ?? 'traveller'}`}
        subtitle="Your trip at a glance, with live destination conditions pulled from the TourNexus engine."
        action={
          <Link
            to="/app/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-600"
          >
            Plan a new trip
            <IconArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* KPI strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel shimmer h-[104px]" />
          ))
        ) : overview.data ? (
          <>
            <StatTile
              label="Destination health"
              value={overview.data.destination_health_label}
              hint={`Composite score ${pct(overview.data.destination_health)}`}
              tone={
                overview.data.destination_health > 0.6
                  ? 'ok'
                  : overview.data.destination_health > 0.35
                    ? 'warn'
                    : 'danger'
              }
              icon={<IconGauge />}
              delay={0}
            />
            <StatTile
              label="Average crowd"
              value={pct(overview.data.average_crowd_score)}
              hint={`${num(overview.data.estimated_visitors)} visitors across ${overview.data.monitored_attractions} sites`}
              tone="info"
              icon={<IconUsers />}
              delay={60}
            />
            <StatTile
              label="Active disruptions"
              value={overview.data.active_disruption_count}
              hint="Affecting your planned stops"
              tone={
                overview.data.active_disruption_count > 0 ? 'danger' : 'ok'
              }
              icon={<IconAlert />}
              delay={120}
            />
            <StatTile
              label="Places to explore"
              value={overview.data.attraction_count}
              hint={`${overview.data.hotel_count} hotels · ${overview.data.restaurant_count} restaurants`}
              tone="brand"
              icon={<IconPin />}
              delay={180}
            />
          </>
        ) : (
          <div className="panel sm:col-span-2 xl:col-span-4 p-5 text-sm text-mist-400">
            {overview.error}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Trip */}
        <Card className="xl:col-span-2" delay={60}>
          <CardHeader
            title="Your current trip"
            subtitle="Loaded from /api/itineraries"
            icon={<IconCalendar />}
            action={
              myTrip && (
                <Link
                  to="/app/itinerary"
                  className="text-xs font-semibold text-brand-300 hover:text-brand-200"
                >
                  View full plan
                </Link>
              )
            }
          />

          <AsyncSection
            state={itineraries}
            isEmpty={() => !myTrip}
            emptyTitle="No trip planned yet"
            emptyHint="Generate an itinerary and it will show up here."
            skeletonRows={2}
          >
            {() =>
              myTrip && (
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {myTrip.title}
                      </h3>
                      <p className="mt-1 text-sm text-mist-400">
                        {dayLabel(myTrip.start_date)} — {dayLabel(myTrip.end_date)}
                      </p>
                    </div>
                    <Badge tone={myTrip.status === 'active' ? 'ok' : 'neutral'}>
                      <Dot tone={myTrip.status === 'active' ? 'ok' : 'neutral'} />
                      {myTrip.status}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { to: '/app/itinerary', label: 'Current itinerary', hint: 'Day-by-day plan' },
                      { to: '/app/impact', label: 'Impact view', hint: 'What a disruption touches' },
                      { to: '/app/alternatives', label: 'Alternatives', hint: 'Routes around the problem' },
                    ].map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="group rounded-xl border border-line bg-ink-850/60 p-3.5 transition hover:border-brand-500/40 hover:bg-ink-800"
                      >
                        <p className="flex items-center justify-between text-[13px] font-semibold text-white">
                          {link.label}
                          <IconArrowRight className="h-3.5 w-3.5 text-mist-500 transition group-hover:translate-x-0.5 group-hover:text-brand-400" />
                        </p>
                        <p className="mt-0.5 text-[11px] text-mist-400">
                          {link.hint}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }
          </AsyncSection>
        </Card>

        {/* Alerts */}
        <Card delay={120}>
          <CardHeader
            title="Live alerts"
            subtitle="Active disruptions right now"
            icon={<IconAlert />}
          />
          <AsyncSection
            state={disruptions}
            isEmpty={(rows) => rows.length === 0}
            emptyTitle="All clear"
            emptyHint="No active disruptions at your destinations."
            skeletonRows={3}
          >
            {(rows) => (
              <ul className="divide-y divide-line">
                {rows.slice(0, 4).map((row) => (
                  <li key={row.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold text-white">
                        {row.disruption_type}
                      </p>
                      <span className="shrink-0 text-[10px] text-mist-500">
                        {relativeTime(row.started_at)}
                      </span>
                    </div>
                    {row.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
                        {row.description}
                      </p>
                    )}
                  </li>
                ))}
                <li className="px-5 py-3">
                  <Link
                    to="/app/disruptions"
                    className="text-xs font-semibold text-brand-300 hover:text-brand-200"
                  >
                    See all {rows.length} alerts →
                  </Link>
                </li>
              </ul>
            )}
          </AsyncSection>
        </Card>

        {/* Crowd */}
        <Card className="xl:col-span-3" delay={180}>
          <CardHeader
            title="Crowd right now"
            subtitle="Latest reading per attraction from /api/crowd/latest"
            icon={<IconUsers />}
            action={
              <Link
                to="/app/map"
                className="text-xs font-semibold text-brand-300 hover:text-brand-200"
              >
                Open map
              </Link>
            }
          />
          <AsyncSection
            state={crowd}
            isEmpty={([readings]) => readings.length === 0}
            emptyTitle="No crowd readings"
            emptyHint="Seed the backend to populate crowd data."
            skeletonRows={3}
          >
            {([readings, attractions]) => {
              const nameOf = new Map(attractions.map((a) => [a.id, a.name]));

              return (
                <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {readings.map((reading) => (
                    <div key={reading.id} className="bg-ink-800 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {nameOf.get(reading.attraction_id) ??
                            `Attraction ${reading.attraction_id}`}
                        </p>
                        <Badge tone={crowdTone(reading.crowd_level)}>
                          {reading.crowd_level}
                        </Badge>
                      </div>
                      <Meter
                        value={reading.crowd_score}
                        tone={crowdTone(reading.crowd_level)}
                        className="mt-3"
                      />
                      <p className="mt-2 text-[11px] text-mist-400">
                        {num(reading.estimated_visitors)} of{' '}
                        {num(reading.capacity)} · {reading.source}
                      </p>
                    </div>
                  ))}
                </div>
              );
            }}
          </AsyncSection>
        </Card>
      </div>
    </>
  );
}
