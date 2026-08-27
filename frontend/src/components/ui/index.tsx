import type { ReactNode } from 'react';

import type { CrowdLevel } from '../../lib/types';

/* ── Card ──────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  delay = 0,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) {
  return (
    <section
      className={`panel animate-rise ${hover ? 'panel-hover' : ''} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-mist-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────── */

type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-white/5 text-mist-300 ring-white/10',
  brand: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  ok: 'bg-ok/15 text-ok ring-ok/30',
  warn: 'bg-warn/15 text-warn ring-warn/30',
  danger: 'bg-danger/15 text-danger ring-danger/30',
  info: 'bg-info/15 text-info ring-info/30',
};

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'neutral' }: { tone?: Tone }) {
  const color: Record<Tone, string> = {
    neutral: 'bg-mist-400',
    brand: 'bg-brand-400',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  return (
    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color[tone]}`} />
  );
}

/* ── Crowd / impact helpers ────────────────────────────────────────── */

export const crowdTone = (level: CrowdLevel | null | undefined): Tone => {
  switch (level) {
    case 'low':
      return 'ok';
    case 'medium':
      return 'warn';
    case 'high':
      return 'danger';
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
};

export const impactTone = (level: string | null | undefined): Tone => {
  switch (level) {
    case 'HIGH':
    case 'High':
      return 'danger';
    case 'MEDIUM':
    case 'Moderate':
      return 'warn';
    case 'LOW':
    case 'Low':
      return 'ok';
    default:
      return 'neutral';
  }
};

/* ── Stat tile ─────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  tone = 'brand',
  icon,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
  delay?: number;
}) {
  const accent: Record<Tone, string> = {
    neutral: 'from-mist-400/20',
    brand: 'from-brand-500/25',
    ok: 'from-ok/25',
    warn: 'from-warn/25',
    danger: 'from-danger/25',
    info: 'from-info/25',
  };

  return (
    <div
      className="panel panel-hover animate-rise relative overflow-hidden p-4"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent[tone]} to-transparent blur-xl`}
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-400">
          {label}
        </p>
        {icon && <span className="text-mist-400">{icon}</span>}
      </div>
      <p className="relative mt-2 text-2xl font-bold tabular-nums text-white">
        {value}
      </p>
      {hint && <p className="relative mt-1 text-xs text-mist-400">{hint}</p>}
    </div>
  );
}

/* ── Meter ─────────────────────────────────────────────────────────── */

export function Meter({
  value,
  tone = 'brand',
  className = '',
}: {
  /** 0 to 1. */
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const fill: Record<Tone, string> = {
    neutral: 'bg-mist-400',
    brand: 'bg-brand-500',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-white/8 ${className}`}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${fill[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────── */

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'bg-brand-500 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-600 active:scale-[0.98]',
    ghost:
      'border border-line bg-white/3 text-mist-100 hover:border-line-strong hover:bg-white/6',
    danger: 'bg-danger/90 text-white hover:bg-danger',
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Async states ──────────────────────────────────────────────────── */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`shimmer rounded-lg bg-white/4 ${className}`} />
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function ErrorBlock({
  message,
  offline = false,
  onRetry,
}: {
  message: string;
  offline?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-danger/15 text-danger">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-white">
          {offline ? 'Backend not reachable' : 'Could not load this'}
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-mist-400">
          {message}
        </p>
      </div>
      {offline && (
        <code className="rounded-lg border border-line bg-ink-950 px-3 py-2 font-mono text-[11px] text-mist-300">
          cd backend &amp;&amp; uvicorn app.main:app --reload
        </code>
      )}
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyBlock({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-mist-400">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M3 7h18M3 12h18M3 17h10" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {hint && (
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-mist-400">
            {hint}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * The standard wrapper: shows a skeleton, an error with retry, an empty
 * state, or the content. Keeps every page consistent.
 */
export function AsyncSection<T>({
  state,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  skeletonRows = 3,
  children,
}: {
  state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    offline: boolean;
    reload: () => void;
  };
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyHint?: string;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) return <LoadingBlock rows={skeletonRows} />;

  if (state.error) {
    return (
      <ErrorBlock
        message={state.error}
        offline={state.offline}
        onRetry={state.reload}
      />
    );
  }

  if (!state.data) {
    return <EmptyBlock title={emptyTitle} hint={emptyHint} />;
  }

  if (isEmpty?.(state.data)) {
    return <EmptyBlock title={emptyTitle} hint={emptyHint} />;
  }

  return <>{children(state.data)}</>;
}

/* ── Page header ───────────────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {emoji && <span aria-hidden>{emoji}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist-300">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
