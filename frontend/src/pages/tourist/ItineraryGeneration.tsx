import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AsyncSection,
  Badge,
  Button,
  Card,
  CardHeader,
  Meter,
  PageHeader,
  crowdTone,
} from '../../components/ui';
import {
  IconArrowRight,
  IconBed,
  IconBus,
  IconClock,
  IconFood,
  IconSparkles,
} from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct } from '../../lib/format';
import { loadPreferences } from './DestinationPreferences';

const PACE_SLOTS: Record<string, number> = {
  Relaxed: 2,
  Balanced: 3,
  Packed: 4,
};

const SLOT_TIMES = ['08:00', '11:00', '14:30', '17:00'];

/**
 * Slot attractions into days using the saved preferences and live crowd
 * readings. Quieter and non-disrupted sites are scheduled first, so the
 * plan reflects real conditions rather than a fixed list.
 */
export default function ItineraryGeneration() {
  const prefs = useMemo(() => loadPreferences(), []);

  const [generated, setGenerated] = useState(false);
  const [days, setDays] = useState(4);

  const data = useApi(
    () =>
      Promise.all([
        api.destinations.list(),
        api.attractions.list(),
        api.crowd.latest(),
        api.disruptions.active(),
        api.hotels.list(),
        api.restaurants.list(),
        api.transport.list(),
      ]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="✨"
        title="Itinerary Generation"
        subtitle="Builds a day plan from your saved preferences, live crowd readings and active disruptions."
        action={
          <Button onClick={() => setGenerated(true)}>
            <IconSparkles className="h-4 w-4" />
            {generated ? 'Regenerate' : 'Generate itinerary'}
          </Button>
        }
      />

      <AsyncSection
        state={data}
        isEmpty={([, attractions]) => attractions.length === 0}
        emptyTitle="No attractions available"
        emptyHint="Seed the backend so the planner has something to schedule."
        skeletonRows={4}
      >
        {([destinations, attractions, crowd, disruptions, hotels, restaurants, transport]) => {
          const crowdByAttraction = new Map(
            crowd.map((reading) => [reading.attraction_id, reading]),
          );

          const disruptedIds = new Set(
            disruptions
              .map((d) => d.attraction_id)
              .filter((id): id is number => id !== null),
          );

          const chosenDestinations = prefs.destinationIds.length
            ? destinations.filter((d) => prefs.destinationIds.includes(d.id))
            : destinations;

          const chosenIds = new Set(chosenDestinations.map((d) => d.id));

          // Rank: quiet first, disrupted last.
          const pool = attractions
            .filter((a) => chosenIds.has(a.destination_id))
            .map((attraction) => {
              const reading = crowdByAttraction.get(attraction.id);
              const crowdScore = reading?.crowd_score ?? 0.5;
              const disrupted = disruptedIds.has(attraction.id);

              return {
                attraction,
                reading,
                disrupted,
                rank: crowdScore + (disrupted ? 1 : 0),
              };
            })
            .sort((a, b) => a.rank - b.rank);

          const perDay = PACE_SLOTS[prefs.pace] ?? 3;
          const plan: (typeof pool)[] = [];

          for (let day = 0; day < days; day += 1) {
            const slice = pool.slice(day * perDay, day * perDay + perDay);
            if (slice.length) plan.push(slice);
          }

          const scheduled = plan.flat().length;

          return (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                {!generated ? (
                  <Card>
                    <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
                        <IconSparkles className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Ready to plan {chosenDestinations.length}{' '}
                          {chosenDestinations.length === 1
                            ? 'destination'
                            : 'destinations'}
                        </h3>
                        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-mist-400">
                          {pool.length} attractions in range,{' '}
                          {disruptedIds.size} currently disrupted. The planner
                          schedules quieter sites earlier and pushes disrupted
                          ones to the end.
                        </p>
                      </div>
                      <Button onClick={() => setGenerated(true)}>
                        <IconSparkles className="h-4 w-4" />
                        Generate itinerary
                      </Button>
                    </div>
                  </Card>
                ) : (
                  plan.map((slots, dayIndex) => (
                    <Card key={dayIndex} delay={dayIndex * 60}>
                      <CardHeader
                        title={`Day ${dayIndex + 1}`}
                        subtitle={`${slots.length} stops · ${prefs.pace.toLowerCase()} pace`}
                        icon={<IconClock />}
                      />
                      <ol className="divide-y divide-line">
                        {slots.map((slot, slotIndex) => (
                          <li
                            key={slot.attraction.id}
                            className="flex gap-4 px-5 py-4"
                          >
                            <div className="flex w-14 shrink-0 flex-col items-center">
                              <span className="font-mono text-[11px] font-semibold text-brand-300">
                                {SLOT_TIMES[slotIndex] ?? '—'}
                              </span>
                              <span className="mt-2 h-full w-px bg-line" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-white">
                                  {slot.attraction.name}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                  {slot.attraction.category && (
                                    <Badge>{slot.attraction.category}</Badge>
                                  )}
                                  {slot.reading && (
                                    <Badge tone={crowdTone(slot.reading.crowd_level)}>
                                      {slot.reading.crowd_level}
                                    </Badge>
                                  )}
                                  {slot.disrupted && (
                                    <Badge tone="danger">disrupted</Badge>
                                  )}
                                </div>
                              </div>

                              {slot.attraction.description && (
                                <p className="mt-1 text-xs leading-relaxed text-mist-400">
                                  {slot.attraction.description}
                                </p>
                              )}

                              {slot.reading && (
                                <div className="mt-2.5">
                                  <Meter
                                    value={slot.reading.crowd_score}
                                    tone={crowdTone(slot.reading.crowd_level)}
                                  />
                                  <p className="mt-1.5 text-[11px] text-mist-500">
                                    {num(slot.reading.estimated_visitors)} of{' '}
                                    {num(slot.reading.capacity)} capacity ·{' '}
                                    {pct(slot.reading.crowd_score)} full
                                  </p>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </Card>
                  ))
                )}
              </div>

              <div className="space-y-6">
                <Card delay={60}>
                  <CardHeader title="Planner inputs" subtitle="From your saved preferences" />
                  <div className="space-y-2.5 p-5 text-xs">
                    <Line label="Pace" value={`${prefs.pace} · ${perDay}/day`} />
                    <Line label="Travellers" value={String(prefs.travellers)} />
                    <Line label="Budget" value={`₹${num(prefs.budget)} pp`} />
                    <Line label="Transport" value={prefs.transport} />
                    <Line label="Diet" value={prefs.diet} />
                    <Line
                      label="Interests"
                      value={`${prefs.interests.length} selected`}
                    />
                    <Link
                      to="/app/destinations"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200"
                    >
                      Change preferences
                      <IconArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>

                <Card delay={120}>
                  <CardHeader title="Trip length" />
                  <div className="p-5">
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setDays(option)}
                          aria-pressed={days === option}
                          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                            days === option
                              ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                              : 'border-line text-mist-400 hover:border-line-strong'
                          }`}
                        >
                          {option}d
                        </button>
                      ))}
                    </div>
                    {generated && (
                      <p className="mt-3 text-[11px] text-mist-400">
                        {scheduled} of {pool.length} attractions scheduled across{' '}
                        {plan.length} days.
                      </p>
                    )}
                  </div>
                </Card>

                <Card delay={180}>
                  <CardHeader title="Available nearby" subtitle="Live counts from the API" />
                  <div className="divide-y divide-line">
                    <Resource
                      icon={<IconBed />}
                      label="Hotels"
                      count={hotels.filter((h) => chosenIds.has(h.destination_id)).length}
                      detail={`${hotels.filter((h) => h.status === 'available').length} available`}
                    />
                    <Resource
                      icon={<IconFood />}
                      label="Restaurants"
                      count={
                        restaurants.filter((r) => chosenIds.has(r.destination_id))
                          .length
                      }
                      detail={`${new Set(restaurants.map((r) => r.cuisine).filter(Boolean)).size} cuisines`}
                    />
                    <Resource
                      icon={<IconBus />}
                      label="Transport"
                      count={
                        transport.filter((t) => chosenIds.has(t.destination_id)).length
                      }
                      detail={`${transport.filter((t) => t.status !== 'available').length} disrupted`}
                    />
                  </div>
                </Card>
              </div>
            </div>
          );
        }}
      </AsyncSection>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-mist-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function Resource({
  icon,
  label,
  count,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-mist-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white">{label}</p>
        <p className="text-[11px] text-mist-400">{detail}</p>
      </div>
      <span className="text-lg font-bold tabular-nums text-brand-300">
        {count}
      </span>
    </div>
  );
}
