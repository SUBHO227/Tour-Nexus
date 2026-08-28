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
  IconCheck,
  IconLayers,
  IconSparkles,
} from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct, timeOfDay } from '../../lib/format';

/**
 * The adaptation step: takes the saved itinerary, marks stops hit by an
 * active disruption or critical crowding, and proposes a swap from the
 * quietest unvisited attraction in the same destination.
 */
export default function UpdatedItinerary() {
  const { user } = useAuth();

  const data = useApi(async () => {
    const [itineraries, attractions, crowd, disruptions] = await Promise.all([
      api.itineraries.list(),
      api.attractions.list(),
      api.crowd.latest(),
      api.disruptions.active(),
    ]);

    const mine =
      itineraries.find((it) => it.tourist_id === user?.id) ?? itineraries[0];

    const items = mine ? await api.itineraries.items(mine.id) : [];

    return { itinerary: mine, items, attractions, crowd, disruptions };
  }, [user?.id]);

  return (
    <>
      <PageHeader
        emoji="🔄"
        title="Updated Itinerary"
        subtitle="Your plan re-checked against current conditions, with swaps proposed for stops that are disrupted or critically crowded."
      />

      <AsyncSection
        state={data}
        isEmpty={(d) => !d.itinerary || d.items.length === 0}
        emptyTitle="No itinerary to adapt"
        emptyHint="Generate an itinerary first."
        skeletonRows={4}
      >
        {({ itinerary, items, attractions, crowd, disruptions }) => {
          const attractionById = new Map(attractions.map((a) => [a.id, a]));
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const disruptionFor = new Map(
            disruptions
              .filter((d) => d.attraction_id !== null)
              .map((d) => [d.attraction_id as number, d]),
          );

          const plannedIds = new Set(items.map((i) => i.entity_id));

          const ordered = [...items].sort(
            (a, b) => a.sequence_order - b.sequence_order,
          );

          // Replacements are claimed as they are assigned, so two
          // disrupted stops never get sent to the same alternative.
          const claimed = new Set<number>();

          const rows = ordered.map((item) => {
            const attraction = attractionById.get(item.entity_id);
            const reading = readingFor.get(item.entity_id);
            const disruption = disruptionFor.get(item.entity_id);

            const needsChange =
              Boolean(disruption) || reading?.crowd_level === 'critical';

            // Quietest attraction in the same destination that is not
            // already in the plan, not itself disrupted, and not already
            // handed to an earlier stop.
            const replacement = needsChange
              ? attractions
                  .filter(
                    (candidate) =>
                      candidate.destination_id === attraction?.destination_id &&
                      !plannedIds.has(candidate.id) &&
                      !claimed.has(candidate.id) &&
                      !disruptionFor.has(candidate.id),
                  )
                  .sort(
                    (a, b) =>
                      (readingFor.get(a.id)?.crowd_score ?? 1) -
                      (readingFor.get(b.id)?.crowd_score ?? 1),
                  )[0]
              : undefined;

            if (replacement) claimed.add(replacement.id);

            return {
              item,
              attraction,
              reading,
              disruption,
              needsChange,
              replacement,
              replacementReading: replacement
                ? readingFor.get(replacement.id)
                : undefined,
            };
          });

          const changed = rows.filter((r) => r.needsChange);
          const resolvable = changed.filter((r) => r.replacement);

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Stops in plan"
                  value={rows.length}
                  hint={itinerary!.title}
                  tone="brand"
                  icon={<IconLayers />}
                />
                <StatTile
                  label="Need changing"
                  value={changed.length}
                  hint="Disrupted or critically crowded"
                  tone={changed.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                  delay={60}
                />
                <StatTile
                  label="Swaps available"
                  value={resolvable.length}
                  hint="Quieter open alternatives found"
                  tone="ok"
                  icon={<IconSparkles />}
                  delay={120}
                />
                <StatTile
                  label="Unaffected"
                  value={rows.length - changed.length}
                  hint="Keep these as planned"
                  tone="info"
                  icon={<IconCheck />}
                  delay={180}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader
                    title="Proposed changes"
                    subtitle={`${changed.length} stop${changed.length === 1 ? '' : 's'} flagged`}
                    icon={<IconSparkles />}
                  />

                  {changed.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-ok/15 text-ok">
                        <IconCheck className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-white">
                        No changes needed
                      </p>
                      <p className="max-w-xs text-xs leading-relaxed text-mist-400">
                        Nothing in your plan is disrupted or critically crowded
                        right now.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {changed.map((row) => (
                        <li key={row.item.id} className="px-5 py-4">
                          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-danger">
                            <IconAlert className="h-3.5 w-3.5" />
                            {row.disruption
                              ? row.disruption.disruption_type
                              : 'Critical crowding'}
                            <span className="font-normal text-mist-500">
                              · {timeOfDay(row.item.visit_start)}
                            </span>
                          </p>

                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
                            <div className="flex-1 rounded-xl border border-danger/25 bg-danger/6 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-danger">
                                Remove
                              </p>
                              <p className="mt-1 text-[13px] font-semibold text-white">
                                {row.attraction?.name}
                              </p>
                              {row.reading && (
                                <>
                                  <Meter
                                    value={row.reading.crowd_score}
                                    tone="danger"
                                    className="mt-2"
                                  />
                                  <p className="mt-1.5 text-[10px] text-mist-400">
                                    {pct(row.reading.crowd_score)} full ·{' '}
                                    {num(row.reading.estimated_visitors)} visitors
                                  </p>
                                </>
                              )}
                            </div>

                            <div className="grid shrink-0 place-items-center px-1">
                              <IconArrowRight className="h-4 w-4 rotate-90 text-brand-400 sm:rotate-0" />
                            </div>

                            <div className="flex-1 rounded-xl border border-ok/25 bg-ok/6 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-ok">
                                Suggested
                              </p>
                              {row.replacement ? (
                                <>
                                  <p className="mt-1 text-[13px] font-semibold text-white">
                                    {row.replacement.name}
                                  </p>
                                  {row.replacementReading ? (
                                    <>
                                      <Meter
                                        value={row.replacementReading.crowd_score}
                                        tone={crowdTone(
                                          row.replacementReading.crowd_level,
                                        )}
                                        className="mt-2"
                                      />
                                      <p className="mt-1.5 text-[10px] text-mist-400">
                                        {pct(row.replacementReading.crowd_score)}{' '}
                                        full · {row.replacementReading.crowd_level}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-[10px] text-mist-400">
                                      No crowd reading yet.
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="mt-1 text-[12px] text-mist-400">
                                  No quieter open alternative in this destination.
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card delay={60}>
                  <CardHeader
                    title="Adapted plan"
                    subtitle="Your itinerary with the swaps applied"
                    icon={<IconLayers />}
                  />
                  <ol className="divide-y divide-line">
                    {rows.map((row) => {
                      const final = row.replacement ?? row.attraction;
                      const swapped = Boolean(row.replacement);

                      return (
                        <li
                          key={row.item.id}
                          className="flex items-center gap-3.5 px-5 py-3.5"
                        >
                          <span className="w-12 shrink-0 font-mono text-[11px] text-mist-500">
                            {timeOfDay(row.item.visit_start)}
                          </span>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              swapped
                                ? 'bg-ok'
                                : row.needsChange
                                  ? 'bg-danger'
                                  : 'bg-brand-500'
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-white">
                              {final?.name ?? '—'}
                            </span>
                            {swapped && (
                              <span className="block text-[10px] text-mist-500 line-through">
                                was {row.attraction?.name}
                              </span>
                            )}
                          </span>
                          {swapped ? (
                            <Badge tone="ok">swapped</Badge>
                          ) : row.needsChange ? (
                            <Badge tone="danger">at risk</Badge>
                          ) : (
                            <Badge tone="neutral">kept</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </div>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
