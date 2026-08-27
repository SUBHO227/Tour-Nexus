import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  Dot,
  PageHeader,
  StatTile,
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
import { relativeTime } from '../../lib/format';

type Filter = 'active' | 'resolved' | 'all';

const TYPE_TONE: Record<string, 'danger' | 'warn' | 'info'> = {
  Overcrowding: 'danger',
  'Partial Closure': 'warn',
  'Weather Advisory': 'info',
  'Road Closure': 'warn',
};

export default function DisruptionAlerts() {
  const [filter, setFilter] = useState<Filter>('active');

  const data = useApi(
    () => Promise.all([api.disruptions.list(), api.attractions.list()]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="🚨"
        title="Disruption Alerts"
        subtitle="Everything currently affecting the destinations on your trip, straight from /api/disruptions."
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
        emptyTitle="No disruptions recorded"
        emptyHint="Nothing has been reported for these destinations."
        skeletonRows={4}
      >
        {([rows, attractions]) => {
          const nameOf = new Map(attractions.map((a) => [a.id, a.name]));

          const active = rows.filter((r) => r.status === 'active');
          const resolved = rows.filter((r) => r.status !== 'active');

          const shown =
            filter === 'active' ? active : filter === 'resolved' ? resolved : rows;

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <StatTile
                  label="Active now"
                  value={active.length}
                  hint="Currently affecting your stops"
                  tone={active.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                />
                <StatTile
                  label="Resolved"
                  value={resolved.length}
                  hint="Cleared in the last few days"
                  tone="ok"
                  icon={<IconCheck />}
                  delay={60}
                />
                <StatTile
                  label="Distinct types"
                  value={new Set(rows.map((r) => r.disruption_type)).size}
                  hint="Closures, weather, crowding"
                  tone="info"
                  icon={<IconClock />}
                  delay={120}
                />
              </div>

              <Card delay={60}>
                <CardHeader
                  title="Alert feed"
                  subtitle={`${shown.length} shown`}
                  icon={<IconAlert />}
                  action={
                    <div className="flex gap-1 rounded-lg border border-line p-0.5">
                      {(['active', 'resolved', 'all'] as Filter[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => setFilter(key)}
                          aria-pressed={filter === key}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                            filter === key
                              ? 'bg-brand-500/20 text-brand-300'
                              : 'text-mist-400 hover:text-mist-200'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  }
                />

                {shown.length === 0 ? (
                  <p className="px-5 py-12 text-center text-sm text-mist-400">
                    Nothing in this filter.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {shown.map((row) => {
                      const isActive = row.status === 'active';

                      return (
                        <li key={row.id} className="px-5 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span
                                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                                  isActive
                                    ? 'bg-danger/15 text-danger'
                                    : 'bg-ok/15 text-ok'
                                }`}
                              >
                                {isActive ? (
                                  <IconAlert className="h-[18px] w-[18px]" />
                                ) : (
                                  <IconCheck className="h-[18px] w-[18px]" />
                                )}
                              </span>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-bold text-white">
                                    {row.disruption_type}
                                  </h3>
                                  <Badge
                                    tone={
                                      TYPE_TONE[row.disruption_type] ?? 'neutral'
                                    }
                                  >
                                    {row.attraction_id
                                      ? (nameOf.get(row.attraction_id) ??
                                        `Attraction ${row.attraction_id}`)
                                      : 'Destination-wide'}
                                  </Badge>
                                </div>

                                {row.description && (
                                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-mist-300">
                                    {row.description}
                                  </p>
                                )}

                                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist-500">
                                  <span className="flex items-center gap-1.5">
                                    <Dot tone={isActive ? 'danger' : 'ok'} />
                                    {isActive ? 'Active' : 'Resolved'}
                                  </span>
                                  <span>
                                    Started {relativeTime(row.started_at)}
                                  </span>
                                  {row.resolved_at && (
                                    <span>
                                      Cleared {relativeTime(row.resolved_at)}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {isActive && (
                              <Link
                                to="/app/impact"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:border-brand-500/40 hover:bg-brand-500/8"
                              >
                                Trace impact
                                <IconArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
