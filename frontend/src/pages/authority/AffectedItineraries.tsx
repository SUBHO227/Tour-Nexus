import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  Meter,
  PageHeader,
  StatTile,
  crowdTone,
} from '../../components/ui';
import {
  IconAlert,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconLayers,
} from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { dayLabel, pct, timeOfDay } from '../../lib/format';

/**
 * Affected Itineraries: the same join as Affected Tourists, but framed
 * around the schedule — which stop, at what time, and what the system
 * would swap it for.
 */
export default function AffectedItineraries() {
  const data = useApi(async () => {
    const [itineraries, attractions, crowd, disruptions] = await Promise.all([
      api.itineraries.list(),
      api.attractions.list(),
      api.crowd.latest(),
      api.disruptions.active(),
    ]);

    const withItems = await Promise.all(
      itineraries.map((itinerary) =>
        api.itineraries
          .items(itinerary.id)
          .then((rows) => ({ itinerary, rows })),
      ),
    );

    return { withItems, attractions, crowd, disruptions };
  }, []);

  return (
    <>
      <PageHeader
        emoji="📋"
        title="Affected Itineraries"
        subtitle="Scheduled stops that need re-planning, with the replacement the adaptation engine would propose."
      />

      <AsyncSection
        state={data}
        isEmpty={(d) => d.withItems.length === 0}
        emptyTitle="No itineraries to check"
        skeletonRows={4}
      >
        {({ withItems, attractions, crowd, disruptions }) => {
          const attractionById = new Map(attractions.map((a) => [a.id, a]));
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const disruptionFor = new Map(
            disruptions
              .filter((d) => d.attraction_id !== null)
              .map((d) => [d.attraction_id as number, d]),
          );

          const flagged = withItems.flatMap(({ itinerary, rows }) => {
            const planned = new Set(rows.map((r) => r.entity_id));

            // Claimed within this itinerary so one alternative is not
            // proposed for two different stops on the same trip.
            const claimed = new Set<number>();

            return rows
              .map((row) => {
                const attraction = attractionById.get(row.entity_id);
                const reading = readingFor.get(row.entity_id);
                const disruption = disruptionFor.get(row.entity_id);

                if (!disruption && reading?.crowd_level !== 'critical') {
                  return null;
                }

                const replacement = attractions
                  .filter(
                    (candidate) =>
                      candidate.destination_id === attraction?.destination_id &&
                      !planned.has(candidate.id) &&
                      !claimed.has(candidate.id) &&
                      !disruptionFor.has(candidate.id),
                  )
                  .sort(
                    (a, b) =>
                      (readingFor.get(a.id)?.crowd_score ?? 1) -
                      (readingFor.get(b.id)?.crowd_score ?? 1),
                  )[0];

                if (replacement) claimed.add(replacement.id);

                return {
                  itinerary,
                  row,
                  attraction,
                  reading,
                  disruption,
                  replacement,
                  replacementReading: replacement
                    ? readingFor.get(replacement.id)
                    : undefined,
                };
              })
              .filter((entry): entry is NonNullable<typeof entry> =>
                Boolean(entry),
              );
          });

          const totalStops = withItems.reduce(
            (sum, entry) => sum + entry.rows.length,
            0,
          );

          const resolvable = flagged.filter((f) => f.replacement).length;

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Itineraries"
                  value={withItems.length}
                  hint={`${totalStops} scheduled stops`}
                  tone="brand"
                  icon={<IconCalendar />}
                />
                <StatTile
                  label="Stops flagged"
                  value={flagged.length}
                  hint={
                    totalStops
                      ? `${pct(flagged.length / totalStops)} of the schedule`
                      : undefined
                  }
                  tone={flagged.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                  delay={60}
                />
                <StatTile
                  label="Auto-resolvable"
                  value={resolvable}
                  hint="A quieter open alternative exists"
                  tone="ok"
                  icon={<IconCheck />}
                  delay={120}
                />
                <StatTile
                  label="Need manual action"
                  value={flagged.length - resolvable}
                  hint="No suitable replacement nearby"
                  tone={flagged.length - resolvable ? 'warn' : 'ok'}
                  icon={<IconLayers />}
                  delay={180}
                />
              </div>

              <Card delay={60}>
                <CardHeader
                  title="Re-planning queue"
                  subtitle="Every stop the engine would change, with its proposed swap"
                  icon={<IconLayers />}
                />

                {flagged.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-ok/15 text-ok">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-white">
                      No itinerary changes needed
                    </p>
                    <p className="max-w-sm text-xs leading-relaxed text-mist-400">
                      Nothing on any registered schedule is disrupted or
                      critically crowded.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left">
                      <thead>
                        <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-mist-500">
                          <th className="px-5 py-3">Itinerary</th>
                          <th className="px-5 py-3">When</th>
                          <th className="px-5 py-3">Affected stop</th>
                          <th className="px-5 py-3">Reason</th>
                          <th className="px-5 py-3">Proposed swap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {flagged.map((entry) => (
                          <tr key={`${entry.itinerary.id}-${entry.row.id}`}>
                            <td className="px-5 py-3.5">
                              <p className="text-[12px] font-semibold text-white">
                                {entry.itinerary.title}
                              </p>
                              <p className="text-[10px] text-mist-500">
                                Tourist #{entry.itinerary.tourist_id}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-mono text-[11px] text-mist-200">
                                {timeOfDay(entry.row.visit_start)}
                              </p>
                              <p className="text-[10px] text-mist-500">
                                {dayLabel(entry.row.visit_start)}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="text-[12px] font-medium text-white">
                                {entry.attraction?.name ?? '—'}
                              </p>
                              {entry.reading && (
                                <div className="mt-1.5 w-28">
                                  <Meter
                                    value={entry.reading.crowd_score}
                                    tone={crowdTone(entry.reading.crowd_level)}
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge tone="danger">
                                {entry.disruption
                                  ? entry.disruption.disruption_type
                                  : 'Critical crowding'}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              {entry.replacement ? (
                                <div className="flex items-center gap-2">
                                  <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-ok" />
                                  <div>
                                    <p className="text-[12px] font-medium text-white">
                                      {entry.replacement.name}
                                    </p>
                                    {entry.replacementReading && (
                                      <p className="text-[10px] text-mist-500">
                                        {pct(
                                          entry.replacementReading.crowd_score,
                                        )}{' '}
                                        full ·{' '}
                                        {entry.replacementReading.crowd_level}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-mist-500">
                                  Manual intervention required
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
