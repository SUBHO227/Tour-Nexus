import { useState } from 'react';

import { CrowdMap, MapLegend } from '../../components/CrowdMap';
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
  IconLayers,
  IconMap,
  IconUsers,
} from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num, pct, titleCase } from '../../lib/format';

export default function DestinationMap() {
  const [destinationId, setDestinationId] = useState<number | 'all'>('all');

  const data = useApi(
    () =>
      Promise.all([
        api.destinations.list(),
        api.attractions.list(),
        api.crowd.latest(),
        api.disruptions.active(),
        api.services.list(),
      ]),
    [],
  );

  return (
    <>
      <PageHeader
        emoji="🗺️"
        title="Destination Map"
        subtitle="Geographic view of load across the destination — every attraction sized and coloured by its live crowd score."
      />

      <AsyncSection
        state={data}
        isEmpty={([, attractions]) => attractions.length === 0}
        emptyTitle="No attractions to plot"
        skeletonRows={4}
      >
        {([destinations, attractions, crowd, disruptions, services]) => {
          const readingFor = new Map(crowd.map((r) => [r.attraction_id, r]));

          const disruptedIds = new Set(
            disruptions
              .map((d) => d.attraction_id)
              .filter((id): id is number => id !== null),
          );

          const inScope =
            destinationId === 'all'
              ? attractions
              : attractions.filter((a) => a.destination_id === destinationId);

          const points = inScope.map((attraction) => ({
            attraction,
            reading: readingFor.get(attraction.id),
            disrupted: disruptedIds.has(attraction.id),
          }));

          const scopedServices =
            destinationId === 'all'
              ? services
              : services.filter((s) => s.destination_id === destinationId);

          const visitors = points.reduce(
            (sum, p) => sum + (p.reading?.estimated_visitors ?? 0),
            0,
          );

          const capacity = points.reduce(
            (sum, p) => sum + (p.reading?.capacity ?? 0),
            0,
          );

          return (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDestinationId('all')}
                  aria-pressed={destinationId === 'all'}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    destinationId === 'all'
                      ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                      : 'border-line text-mist-400 hover:border-line-strong'
                  }`}
                >
                  All destinations
                </button>
                {destinations.map((destination) => (
                  <button
                    key={destination.id}
                    onClick={() => setDestinationId(destination.id)}
                    aria-pressed={destinationId === destination.id}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      destinationId === destination.id
                        ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                        : 'border-line text-mist-400 hover:border-line-strong'
                    }`}
                  >
                    {destination.name}
                  </button>
                ))}
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Sites in view"
                  value={points.length}
                  hint={`${points.filter((p) => p.reading).length} with live readings`}
                  tone="brand"
                  icon={<IconMap />}
                />
                <StatTile
                  label="Visitors"
                  value={num(visitors)}
                  hint={
                    capacity
                      ? `${pct(visitors / capacity)} of ${num(capacity)} capacity`
                      : 'No capacity data'
                  }
                  tone="info"
                  icon={<IconUsers />}
                  delay={60}
                />
                <StatTile
                  label="Disrupted sites"
                  value={points.filter((p) => p.disrupted).length}
                  hint="Marked with a dashed outline"
                  tone={
                    points.some((p) => p.disrupted) ? 'danger' : 'ok'
                  }
                  icon={<IconAlert />}
                  delay={120}
                />
                <StatTile
                  label="Civic services"
                  value={scopedServices.length}
                  hint={`${scopedServices.filter((s) => (s.load_ratio ?? 0) >= 0.8).length} above 80% load`}
                  tone="warn"
                  icon={<IconLayers />}
                  delay={180}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                <Card>
                  <CardHeader
                    title="Live load map"
                    subtitle="OpenStreetMap tiles · crowd readings from /api/crowd/latest"
                    icon={<IconMap />}
                  />
                  <div className="p-4">
                    <CrowdMap points={points} height={580} />
                    <div className="mt-3.5">
                      <MapLegend />
                    </div>
                  </div>
                </Card>

                <Card delay={60}>
                  <CardHeader
                    title="Service load"
                    subtitle="Parking, roads, sanitation, waste"
                    icon={<IconLayers />}
                  />
                  <ul className="divide-y divide-line">
                    {[...scopedServices]
                      .sort((a, b) => (b.load_ratio ?? 0) - (a.load_ratio ?? 0))
                      .map((service) => (
                        <li key={service.id} className="px-5 py-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-white">
                                {service.name}
                              </p>
                              <p className="text-[10px] text-mist-500">
                                {titleCase(service.service_type)} ·{' '}
                                {service.source} · confidence{' '}
                                {pct(service.confidence)}
                              </p>
                            </div>
                            <Badge
                              tone={
                                (service.load_ratio ?? 0) >= 0.9
                                  ? 'danger'
                                  : (service.load_ratio ?? 0) >= 0.75
                                    ? 'warn'
                                    : 'ok'
                              }
                            >
                              {pct(service.load_ratio ?? 0)}
                            </Badge>
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
                            className="mt-2"
                          />
                          <p className="mt-1.5 text-[10px] text-mist-500">
                            {num(service.current_load ?? 0)} /{' '}
                            {num(service.capacity ?? 0)} {service.unit}
                          </p>
                        </li>
                      ))}
                  </ul>
                </Card>

                <Card className="xl:col-span-2" delay={120}>
                  <CardHeader
                    title="Site conditions"
                    subtitle="Every attraction in view"
                  />
                  <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
                    {points.map(({ attraction, reading, disrupted }) => (
                      <div key={attraction.id} className="bg-ink-800 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-white">
                            {attraction.name}
                          </p>
                          {disrupted && <Badge tone="danger">disrupted</Badge>}
                        </div>
                        <p className="mt-0.5 text-[10px] text-mist-500">
                          {attraction.category ?? 'Uncategorised'}
                        </p>
                        {reading ? (
                          <>
                            <Meter
                              value={reading.crowd_score}
                              tone={crowdTone(reading.crowd_level)}
                              className="mt-3"
                            />
                            <p className="mt-1.5 text-[11px] text-mist-400">
                              {pct(reading.crowd_score)} ·{' '}
                              {num(reading.estimated_visitors)} visitors
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-[11px] text-mist-500">
                            No reading.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          );
        }}
      </AsyncSection>
    </>
  );
}
