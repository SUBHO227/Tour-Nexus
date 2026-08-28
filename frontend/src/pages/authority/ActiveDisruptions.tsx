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
  impactTone,
} from '../../components/ui';
import {
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconRefresh,
} from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct, relativeTime } from '../../lib/format';

export default function ActiveDisruptions() {
  const data = useApi(
    () =>
      Promise.all([
        api.disruptions.list(),
        api.attractions.list(),
        api.crowd.latest(),
        api.services.list(),
      ]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="🚨"
        title="Active Disruptions"
        subtitle="Every reported disruption with its live crowd context, so the control room can triage by real pressure rather than report order."
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

      <AsyncSection
        state={data}
        isEmpty={([rows]) => rows.length === 0}
        emptyTitle="No disruptions on record"
        skeletonRows={4}
      >
        {([rows, attractions, crowd, services]) => {
          const nameOf = new Map(attractions.map((a) => [a.id, a.name]));
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const active = rows.filter((r) => r.status === 'active');
          const resolved = rows.filter((r) => r.status !== 'active');

          // Triage: crowd score at the affected site drives severity.
          const triaged = [...active].sort((a, b) => {
            const scoreA = a.attraction_id
              ? (readingFor.get(a.attraction_id)?.crowd_score ?? 0)
              : 0;
            const scoreB = b.attraction_id
              ? (readingFor.get(b.attraction_id)?.crowd_score ?? 0)
              : 0;
            return scoreB - scoreA;
          });

          const criticalServices = services.filter(
            (s) => (s.load_ratio ?? 0) >= 0.9,
          );

          const oldest = active.reduce<string | null>((acc, row) => {
            if (!acc) return row.started_at;
            return row.started_at < acc ? row.started_at : acc;
          }, null);

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Active"
                  value={active.length}
                  hint="Open and unresolved"
                  tone={active.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                />
                <StatTile
                  label="Resolved"
                  value={resolved.length}
                  hint="Cleared recently"
                  tone="ok"
                  icon={<IconCheck />}
                  delay={60}
                />
                <StatTile
                  label="Longest open"
                  value={oldest ? relativeTime(oldest) : '—'}
                  hint="Since the earliest active report"
                  tone="warn"
                  icon={<IconClock />}
                  delay={120}
                />
                <StatTile
                  label="Services ≥90%"
                  value={criticalServices.length}
                  hint="Near or at capacity"
                  tone={criticalServices.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                  delay={180}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                <Card>
                  <CardHeader
                    title="Triage board"
                    subtitle="Active disruptions, most crowded site first"
                    icon={<IconAlert />}
                  />

                  {triaged.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-ok/15 text-ok">
                        <IconCheck className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-white">
                        Nothing active
                      </p>
                      <p className="text-xs text-mist-400">
                        The destination is operating normally.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {triaged.map((row) => {
                        const reading = row.attraction_id
                          ? readingFor.get(row.attraction_id)
                          : undefined;

                        const severity = reading
                          ? reading.crowd_score >= 0.9
                            ? 'HIGH'
                            : reading.crowd_score >= 0.7
                              ? 'MEDIUM'
                              : 'LOW'
                          : 'LOW';

                        return (
                          <li key={row.id} className="px-5 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/15 text-danger">
                                  <IconAlert className="h-[18px] w-[18px]" />
                                </span>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold text-white">
                                      {row.disruption_type}
                                    </h3>
                                    <Badge tone={impactTone(severity)}>
                                      {severity} severity
                                    </Badge>
                                  </div>
                                  <p className="mt-0.5 text-[11px] font-medium text-brand-300">
                                    {row.attraction_id
                                      ? (nameOf.get(row.attraction_id) ?? '—')
                                      : 'Destination-wide'}
                                  </p>
                                  {row.description && (
                                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-mist-300">
                                      {row.description}
                                    </p>
                                  )}

                                  {reading && (
                                    <div className="mt-2.5 max-w-sm">
                                      <div className="flex items-center justify-between text-[10px] text-mist-500">
                                        <span>Crowd at site</span>
                                        <span>
                                          {num(reading.estimated_visitors)} /{' '}
                                          {num(reading.capacity)} ·{' '}
                                          {pct(reading.crowd_score)}
                                        </span>
                                      </div>
                                      <Meter
                                        value={reading.crowd_score}
                                        tone={crowdTone(reading.crowd_level)}
                                        className="mt-1.5"
                                      />
                                    </div>
                                  )}

                                  <p className="mt-2 flex items-center gap-2 text-[11px] text-mist-500">
                                    <Dot tone="danger" />
                                    Open for {relativeTime(row.started_at)}
                                  </p>
                                </div>
                              </div>

                              <Link
                                to="/authority/interventions"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-600"
                              >
                                Plan response
                                <IconArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                <div className="space-y-6">
                  <Card delay={60}>
                    <CardHeader
                      title="Service pressure"
                      subtitle="Civic services near capacity"
                    />
                    <ul className="divide-y divide-line">
                      {[...services]
                        .sort((a, b) => (b.load_ratio ?? 0) - (a.load_ratio ?? 0))
                        .slice(0, 6)
                        .map((service) => (
                          <li key={service.id} className="px-5 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 flex-1 truncate text-[12px] text-mist-200">
                                {service.name}
                              </span>
                              <span className="shrink-0 text-[11px] font-bold tabular-nums text-mist-300">
                                {pct(service.load_ratio ?? 0)}
                              </span>
                            </div>
                            <Meter
                              value={service.load_ratio ?? 0}
                              tone={
                                (service.load_ratio ?? 0) >= 0.9
                                  ? 'danger'
                                  : (service.load_ratio ?? 0) >= 0.75
                                    ? 'warn'
                                    : 'ok'
                              }
                              className="mt-1.5"
                            />
                          </li>
                        ))}
                    </ul>
                  </Card>

                  <Card delay={120}>
                    <CardHeader title="Recently resolved" />
                    {resolved.length === 0 ? (
                      <p className="px-5 py-8 text-center text-xs text-mist-400">
                        Nothing resolved yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {resolved.map((row) => (
                          <li key={row.id} className="px-5 py-3">
                            <p className="text-[12px] font-semibold text-white">
                              {row.disruption_type}
                            </p>
                            <p className="mt-0.5 text-[10px] text-mist-500">
                              {row.attraction_id
                                ? nameOf.get(row.attraction_id)
                                : 'Destination-wide'}{' '}
                              · cleared{' '}
                              {row.resolved_at
                                ? relativeTime(row.resolved_at)
                                : '—'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
