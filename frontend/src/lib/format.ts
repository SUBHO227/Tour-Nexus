/** Small display helpers shared across pages. */

export const pct = (value: number, digits = 0): string =>
  `${(value * 100).toFixed(digits)}%`;

export const num = (value: number): string =>
  new Intl.NumberFormat('en-IN').format(value);

export function relativeTime(iso: string): string {
  const then = new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime();

  if (Number.isNaN(then)) return '—';

  const seconds = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(seconds);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
    ['year', Number.POSITIVE_INFINITY],
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  let value = abs;

  for (const [unit, step] of units) {
    if (value < step) {
      return formatter.format(
        seconds < 0 ? Math.round(value) : -Math.round(value),
        unit,
      );
    }
    value /= step;
  }

  return '—';
}

export function timeOfDay(iso: string | null): string {
  if (!iso) return '—';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function dayLabel(iso: string | null): string {
  if (!iso) return '—';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** "attraction:3" -> "Attraction" */
export function nodeTypeLabel(nodeId: string): string {
  const type = nodeId.split(':')[0] ?? nodeId;
  return type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** "footfall_increases_load" -> "footfall increases load" */
export const humanise = (value: string): string =>
  value.replace(/_/g, ' ').toLowerCase();

export const titleCase = (value: string): string =>
  value.replace(/[_-]/g, ' ').replace(/\b./g, (c) => c.toUpperCase());
