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
import { IconAlert, IconUser, IconUsers } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { dayLabel, num, pct } from '../../lib/format';

/**
 * Affected Tourists: joins itineraries against active disruptions and
 * crowd readings to work out which travellers are actually exposed, and
 * how badly.
 */
export default function AffectedTourists() {
  const data = useApi(async () => {
    const [itineraries, attractions, crowd, disruptions] = await Promise.all([
      api.itineraries.list(),
      api.attractions.list(),
      api.crowd.latest(),
      api.disruptions.active(),
    ]);

    const items = await Promise.all(
      itineraries.map((itinerary) =>
        api.itineraries
          .items(itinerary.id)
          .then((rows) => ({ itinerary, rows })),
      ),
    );

    return { items, attractions, crowd, disruptions };
  }, []);

  return (
    <>
      <PageHeader
        emoji="👥"
        title="Affected Tourists"
        subtitle="Which travellers have a disrupted or critically crowded stop in their plan, ranked by how much of their trip is hit."
      />

      <AsyncSection
        state={data}
        isEmpty={(d) => d.items.length === 0}
        emptyTitle="No itineraries registered"
        emptyHint="Tourists have not saved any plans yet."
        skeletonRows={4}
      >
        {({ items, attractions, crowd, disruptions }) => {
          const attractionById = new Map(attractions.map((a) => [a.id, a]));
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const disruptionFor = new Map(
            disruptions
              .filter((d) => d.attraction_id !== null)
              .map((d) => [d.attraction_id as number, d]),
          );

          const profiles = items
            .map(({ itinerary, rows }) => {
              const stops = rows.map((row) => ({
                row,
                attraction: attractionById.get(row.entity_id),
                reading: readingFor.get(row.entity_id),
                disruption: disruptionFor.get(row.entity_id),
              }));

              const hit = stops.filter(
                (s) =>
                  s.disruption || s.reading?.crowd_level === 'critical',
              );

              return {
                itinerary,
                stops,
                hit,
                exposure: stops.length ? hit.length / stops.length : 0,
              };
            })
            .sort((a, b) => b.exposure - a.exposure);

          const affected = profiles.filter((p) => p.hit.length > 0);

          const totalStops = profiles.reduce(
            (sum, p) => sum + p.stops.length,
            0,
          );

          const totalHit = profiles.reduce((sum, p) => sum + p.hit.length, 0);

          return (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Registered itineraries"
                  value={profiles.length}
                  hint={`${totalStops} planned stops in total`}
                  tone="brand"
                  icon={<IconUsers />}
                />
                <StatTile
                  label="Tourists affected"
                  value={affected.length}
                  hint="At least one stop compromised"
                  tone={affected.length ? 'danger' : 'ok'}
                  icon={<IconAlert />}
                  delay={60}
                />
                <StatTile
                  label="Stops compromised"
                  value={totalHit}
                  hint={
                    totalStops
                      ? `${pct(totalHit / totalStops)} of all planned stops`
                      : undefined
                  }
                  tone="warn"
                  icon={<IconAlert />}
                  delay={120}
                />
                <StatTile
                  label="Worst exposure"
                  value={pct(profiles[0]?.exposure ?? 0)}
                  hint={profiles[0]?.itinerary.title}
                  tone="danger"
                  icon={<IconUser />}
                  delay={180}
                />
              </div>

              <div className="space-y-6">
                {profiles.map((profile, index) => (
                  <Card key={profile.itinerary.id} delay={index * 60}>
                    <CardHeader
                      title={profile.itinerary.title}
                      subtitle={`Tourist #${profile.itinerary.tourist_id} · ${dayLabel(
                        profile.itinerary.start_date,
                      )} — ${dayLabel(profile.itinerary.end_date)}`}
                      icon={<IconUser />}
                      action={
                        <Badge
                          tone={
                            profile.exposure >= 0.4
                              ? 'danger'
                              : profile.exposure > 0
                                ? 'warn'
                                : 'ok'
                          }
                        >
                          {profile.hit.length} of {profile.stops.length} stops hit
                        </Badge>
                      }
                    />

                    <div className="px-5 pt-4">
                      <Meter
                        value={profile.exposure}
                        tone={
                          profile.exposure >= 0.4
                            ? 'danger'
                            : profile.exposure > 0
                              ? 'warn'
                              : 'ok'
                        }
                      />
                      <p className="mt-1.5 text-[11px] text-mist-500">
                        {pct(profile.exposure)} of this itinerary is affected.
                      </p>
                    </div>

                    <div className="grid gap-px bg-line p-px pt-4 sm:grid-cols-2 lg:grid-cols-3">
                      {profile.stops.map((stop) => {
                        const compromised =
                          stop.disruption ||
                          stop.reading?.crowd_level === 'critical';

                        return (
                          <div
                            key={stop.row.id}
                            className={`p-4 ${compromised ? 'bg-danger/6' : 'bg-ink-800'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-[12px] font-semibold text-white">
                                {stop.attraction?.name ?? '—'}
                              </p>
                              {stop.reading && (
                                <Badge tone={crowdTone(stop.reading.crowd_level)}>
                                  {stop.reading.crowd_level}
                                </Badge>
                              )}
                            </div>

                            {stop.disruption && (
                              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-danger">
                                <IconAlert className="h-3 w-3" />
                                {stop.disruption.disruption_type}
                              </p>
                            )}

                            {stop.reading && (
                              <p className="mt-1.5 text-[10px] text-mist-500">
                                {num(stop.reading.estimated_visitors)} of{' '}
                                {num(stop.reading.capacity)} ·{' '}
                                {pct(stop.reading.crowd_score)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
