import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  Meter,
  PageHeader,
  crowdTone,
} from '../../components/ui';
import { IconAlert, IconCalendar, IconClock } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { dayLabel, num, pct, timeOfDay } from '../../lib/format';

export default function CurrentItinerary() {
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
        emoji="📅"
        title="Current Itinerary"
        subtitle="Your saved plan, joined against live crowd and disruption data so you can see which stops are at risk."
      />

      <AsyncSection
        state={data}
        isEmpty={(d) => !d.itinerary || d.items.length === 0}
        emptyTitle="No itinerary saved"
        emptyHint="Generate one from the Itinerary Generation page."
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

          const ordered = [...items].sort(
            (a, b) => a.sequence_order - b.sequence_order,
          );

          const byDay = ordered.reduce<Record<string, typeof ordered>>(
            (acc, item) => {
              const key = item.visit_start
                ? item.visit_start.slice(0, 10)
                : 'unscheduled';
              (acc[key] ??= []).push(item);
              return acc;
            },
            {},
          );

          const atRisk = ordered.filter((item) =>
            disruptionFor.has(item.entity_id),
          ).length;

          return (
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {Object.entries(byDay).map(([day, dayItems], dayIndex) => (
                  <Card key={day} delay={dayIndex * 60}>
                    <CardHeader
                      title={day === 'unscheduled' ? 'Unscheduled' : dayLabel(day)}
                      subtitle={`${dayItems.length} stops`}
                      icon={<IconCalendar />}
                    />
                    <ol className="divide-y divide-line">
                      {dayItems.map((item) => {
                        const attraction = attractionById.get(item.entity_id);
                        const reading = readingFor.get(item.entity_id);
                        const disruption = disruptionFor.get(item.entity_id);

                        return (
                          <li key={item.id} className="flex gap-4 px-5 py-4">
                            <div className="w-16 shrink-0 text-right">
                              <p className="font-mono text-[11px] font-semibold text-brand-300">
                                {timeOfDay(item.visit_start)}
                              </p>
                              <p className="font-mono text-[10px] text-mist-500">
                                {timeOfDay(item.visit_end)}
                              </p>
                            </div>

                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                disruption ? 'bg-danger' : 'bg-brand-500'
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-white">
                                  {attraction?.name ??
                                    `${item.entity_type} #${item.entity_id}`}
                                </h4>
                                <div className="flex gap-1.5">
                                  {attraction?.category && (
                                    <Badge>{attraction.category}</Badge>
                                  )}
                                  {reading && (
                                    <Badge tone={crowdTone(reading.crowd_level)}>
                                      {reading.crowd_level}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {reading && (
                                <>
                                  <Meter
                                    value={reading.crowd_score}
                                    tone={crowdTone(reading.crowd_level)}
                                    className="mt-2.5"
                                  />
                                  <p className="mt-1.5 text-[11px] text-mist-500">
                                    {num(reading.estimated_visitors)} of{' '}
                                    {num(reading.capacity)} · {pct(reading.crowd_score)}{' '}
                                    full
                                  </p>
                                </>
                              )}

                              {disruption && (
                                <div className="mt-2.5 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2">
                                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-danger">
                                    <IconAlert className="h-3.5 w-3.5" />
                                    {disruption.disruption_type}
                                  </p>
                                  {disruption.description && (
                                    <p className="mt-1 text-[11px] leading-relaxed text-mist-300">
                                      {disruption.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </Card>
                ))}
              </div>

              <div className="space-y-6">
                <Card delay={60}>
                  <CardHeader title={itinerary!.title} icon={<IconClock />} />
                  <div className="space-y-3 p-5">
                    <Row
                      label="Dates"
                      value={`${dayLabel(itinerary!.start_date)} — ${dayLabel(itinerary!.end_date)}`}
                    />
                    <Row label="Stops" value={String(ordered.length)} />
                    <Row label="Status" value={itinerary!.status} />
                    <div className="border-t border-line pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-mist-400">
                          Stops at risk
                        </span>
                        <Badge tone={atRisk > 0 ? 'danger' : 'ok'}>
                          {atRisk} of {ordered.length}
                        </Badge>
                      </div>
                      <Meter
                        value={ordered.length ? atRisk / ordered.length : 0}
                        tone={atRisk > 0 ? 'danger' : 'ok'}
                        className="mt-2.5"
                      />
                    </div>
                  </div>
                </Card>

                <Card delay={120}>
                  <CardHeader
                    title="Crowd across your plan"
                    subtitle="Stops ordered by how busy they are"
                  />
                  <ul className="divide-y divide-line">
                    {ordered
                      .map((item) => ({
                        item,
                        attraction: attractionById.get(item.entity_id),
                        reading: readingFor.get(item.entity_id),
                      }))
                      .filter((row) => row.reading)
                      .sort(
                        (a, b) =>
                          (b.reading?.crowd_score ?? 0) -
                          (a.reading?.crowd_score ?? 0),
                      )
                      .map((row) => (
                        <li
                          key={row.item.id}
                          className="flex items-center gap-3 px-5 py-3"
                        >
                          <span className="min-w-0 flex-1 truncate text-[12px] text-mist-200">
                            {row.attraction?.name}
                          </span>
                          <Badge tone={crowdTone(row.reading!.crowd_level)}>
                            {pct(row.reading!.crowd_score)}
                          </Badge>
                        </li>
                      ))}
                  </ul>
                </Card>
              </div>
            </div>
          );
        }}
      </AsyncSection>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-mist-400">{label}</span>
      <span className="font-semibold capitalize text-white">{value}</span>
    </div>
  );
}
