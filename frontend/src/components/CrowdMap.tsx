import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';

import type { Attraction, CrowdLevel, CrowdReading } from '../lib/types';
import { num, pct } from '../lib/format';

/**
 * Shared Leaflet map. Uses CircleMarker rather than the default pin so
 * there is no marker-image asset to bundle, and so the colour can carry
 * the crowd level directly.
 */

const LEVEL_COLOR: Record<CrowdLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const UNKNOWN_COLOR = '#64748b';

export interface MapPoint {
  attraction: Attraction;
  reading?: CrowdReading;
  disrupted?: boolean;
}

export function CrowdMap({
  points,
  height = 520,
  onSelect,
  selectedId,
}: {
  points: MapPoint[];
  height?: number;
  onSelect?: (attraction: Attraction) => void;
  selectedId?: number | null;
}) {
  const located = points.filter(
    (p) => p.attraction.latitude !== null && p.attraction.longitude !== null,
  );

  if (located.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-line bg-ink-850 text-sm text-mist-400"
        style={{ height }}
      >
        No attractions have coordinates yet.
      </div>
    );
  }

  const centre: [number, number] = [
    located.reduce((sum, p) => sum + (p.attraction.latitude ?? 0), 0) /
      located.length,
    located.reduce((sum, p) => sum + (p.attraction.longitude ?? 0), 0) /
      located.length,
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-line"
      style={{ height }}
    >
      <MapContainer
        center={centre}
        zoom={9}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {located.map(({ attraction, reading, disrupted }) => {
          const color = reading
            ? LEVEL_COLOR[reading.crowd_level]
            : UNKNOWN_COLOR;

          const selected = selectedId === attraction.id;

          return (
            <CircleMarker
              key={attraction.id}
              center={[attraction.latitude!, attraction.longitude!]}
              radius={selected ? 14 : 9 + (reading?.crowd_score ?? 0) * 6}
              pathOptions={{
                color: disrupted ? '#ef4444' : color,
                weight: selected ? 3 : disrupted ? 2.5 : 1.5,
                fillColor: color,
                fillOpacity: 0.55,
                dashArray: disrupted ? '4 3' : undefined,
              }}
              eventHandlers={
                onSelect ? { click: () => onSelect(attraction) } : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="text-xs font-semibold">{attraction.name}</span>
              </Tooltip>

              <Popup>
                <div className="min-w-[190px] space-y-1.5">
                  <p className="text-[13px] font-bold text-white">
                    {attraction.name}
                  </p>
                  {attraction.category && (
                    <p className="text-[11px] text-mist-400">
                      {attraction.category}
                    </p>
                  )}
                  {reading ? (
                    <>
                      <p className="text-[11px] text-mist-300">
                        Crowd:{' '}
                        <strong style={{ color }}>{reading.crowd_level}</strong>{' '}
                        ({pct(reading.crowd_score)})
                      </p>
                      <p className="text-[11px] text-mist-400">
                        {num(reading.estimated_visitors)} of{' '}
                        {num(reading.capacity)} · {reading.source}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-mist-400">
                      No crowd reading available.
                    </p>
                  )}
                  {disrupted && (
                    <p className="text-[11px] font-semibold text-danger">
                      Active disruption reported
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-mist-400">
      {(
        [
          ['low', 'Low'],
          ['medium', 'Medium'],
          ['high', 'High'],
          ['critical', 'Critical'],
        ] as [CrowdLevel, string][]
      ).map(([level, label]) => (
        <span key={level} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: LEVEL_COLOR[level] }}
          />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-danger" />
        Disrupted
      </span>
      <span className="text-mist-500">Circle size follows crowd score</span>
    </div>
  );
}
