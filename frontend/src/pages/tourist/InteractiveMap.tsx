import { useState } from 'react';

import { CrowdMap, MapLegend } from '../../components/CrowdMap';
import {
  AsyncSection,
  Badge,
  Card,
  CardHeader,
  Meter,
  PageHeader,
  crowdTone,
} from '../../components/ui';
import { IconAlert, IconMap, IconPin } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct, relativeTime } from '../../lib/format';
import type { Attraction } from '../../lib/types';

export default function InteractiveMap() {
  const [selected, setSelected] = useState<Attraction | null>(null);

  const data = useApi(
    () =>
      Promise.all([
        api.attractions.list(),
        api.crowd.latest(),
        api.disruptions.active(),
        api.destinations.list(),
      ]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="🗺️"
        title="Interactive Map"
        subtitle="Every attraction plotted with its live crowd reading. Larger and redder means busier; dashed outlines mark active disruptions."
      />

      <AsyncSection
        state={data}
        isEmpty={([attractions]) => attractions.length === 0}
        emptyTitle="No attractions to plot"
        emptyHint="Seed the backend to populate the map."
        skeletonRows={4}
      >
        {([attractions, crowd, disruptions, destinations]) => {
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const disruptedIds = new Set(
            disruptions
              .map((d) => d.attraction_id)
              .filter((id): id is number => id !== null),
          );

          const points = attractions.map((attraction) => ({
            attraction,
            reading: readingFor.get(attraction.id),
            disrupted: disruptedIds.has(attraction.id),
          }));

          const destinationName = new Map(
            destinations.map((d) => [d.id, d.name]),
          );

          const selectedReading = selected
            ? readingFor.get(selected.id)
            : undefined;

          const selectedDisruptions = selected
            ? disruptions.filter((d) => d.attraction_id === selected.id)
            : [];

          return (
            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <Card>
                <CardHeader
                  title="Destination map"
                  subtitle={`${points.length} attractions · ${disruptedIds.size} disrupted`}
                  icon={<IconMap />}
                />
                <div className="p-4">
                  <CrowdMap
                    points={points}
                    onSelect={setSelected}
                    selectedId={selected?.id ?? null}
                    height={560}
                  />
                  <div className="mt-3.5">
                    <MapLegend />
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <Card delay={60}>
                  <CardHeader
                    title={selected ? selected.name : 'Select an attraction'}
                    subtitle={
                      selected
                        ? destinationName.get(selected.destination_id)
                        : 'Click any marker to inspect it'
                    }
                    icon={<IconPin />}
                  />

                  {selected ? (
                    <div className="space-y-4 p-5">
                      {selected.description && (
                        <p className="text-xs leading-relaxed text-mist-300">
                          {selected.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {selected.category && <Badge>{selected.category}</Badge>}
                        <Badge
                          tone={selected.status === 'open' ? 'ok' : 'warn'}
                        >
                          {selected.status}
                        </Badge>
                      </div>

                      {selectedReading ? (
                        <div className="rounded-xl border border-line bg-ink-850 p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-400">
                              Crowd now
                            </span>
                            <Badge tone={crowdTone(selectedReading.crowd_level)}>
                              {selectedReading.crowd_level}
                            </Badge>
                          </div>
                          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                            {pct(selectedReading.crowd_score)}
                          </p>
                          <Meter
                            value={selectedReading.crowd_score}
                            tone={crowdTone(selectedReading.crowd_level)}
                            className="mt-2.5"
                          />
                          <p className="mt-2.5 text-[11px] text-mist-400">
                            {num(selectedReading.estimated_visitors)} of{' '}
                            {num(selectedReading.capacity)} capacity
                          </p>
                          <p className="mt-1 text-[11px] text-mist-500">
                            {selectedReading.source} ·{' '}
                            {relativeTime(selectedReading.timestamp)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-mist-400">
                          No crowd reading for this attraction.
                        </p>
                      )}

                      {selectedDisruptions.length > 0 && (
                        <div className="space-y-2">
                          {selectedDisruptions.map((disruption) => (
                            <div
                              key={disruption.id}
                              className="rounded-xl border border-danger/25 bg-danger/8 p-3.5"
                            >
                              <p className="flex items-center gap-2 text-[13px] font-semibold text-danger">
                                <IconAlert className="h-4 w-4" />
                                {disruption.disruption_type}
                              </p>
                              {disruption.description && (
                                <p className="mt-1.5 text-[11px] leading-relaxed text-mist-300">
                                  {disruption.description}
                                </p>
                              )}
                              <p className="mt-1.5 text-[10px] text-mist-500">
                                Started {relativeTime(disruption.started_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="font-mono text-[10px] text-mist-500">
                        {selected.latitude?.toFixed(4)},{' '}
                        {selected.longitude?.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-center text-xs text-mist-400">
                      Nothing selected yet.
                    </p>
                  )}
                </Card>

                <Card delay={120}>
                  <CardHeader
                    title="Busiest right now"
                    subtitle="Ranked by crowd score"
                  />
                  <ul className="divide-y divide-line">
                    {[...crowd]
                      .sort((a, b) => b.crowd_score - a.crowd_score)
                      .slice(0, 5)
                      .map((reading) => {
                        const attraction = attractions.find(
                          (a) => a.id === reading.attraction_id,
                        );

                        return (
                          <li key={reading.id}>
                            <button
                              type="button"
                              onClick={() =>
                                attraction && setSelected(attraction)
                              }
                              className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/3"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium text-white">
                                  {attraction?.name ?? '—'}
                                </span>
                                <Meter
                                  value={reading.crowd_score}
                                  tone={crowdTone(reading.crowd_level)}
                                  className="mt-1.5"
                                />
                              </span>
                              <span className="shrink-0 text-xs font-bold tabular-nums text-mist-300">
                                {pct(reading.crowd_score)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
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
