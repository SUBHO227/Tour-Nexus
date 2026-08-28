import { useEffect, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  IconAlert,
  IconCalendar,
  IconClose,
  IconGauge,
  IconGraph,
  IconLayers,
  IconLogout,
  IconMap,
  IconMenu,
  IconPin,
  IconRipple,
  IconRoute,
  IconShield,
  IconSparkles,
  IconUser,
  IconUsers,
} from './Icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const TOURIST_NAV: NavGroup[] = [
  {
    heading: 'Plan',
    items: [
      { to: '/app', label: 'My Profile', icon: IconUser },
      { to: '/app/destinations', label: 'Destination & Preferences', icon: IconPin },
      { to: '/app/generate', label: 'Itinerary Generation', icon: IconSparkles },
      { to: '/app/map', label: 'Interactive Map', icon: IconMap },
    ],
  },
  {
    heading: 'Travel',
    items: [
      { to: '/app/itinerary', label: 'Current Itinerary', icon: IconCalendar },
      { to: '/app/disruptions', label: 'Disruption Alerts', icon: IconAlert },
      { to: '/app/impact', label: 'Dependency & Impact', icon: IconRipple },
      { to: '/app/alternatives', label: 'Alternatives', icon: IconRoute },
      { to: '/app/updated', label: 'Updated Itinerary', icon: IconLayers },
    ],
  },
];

const AUTHORITY_NAV: NavGroup[] = [
  {
    heading: 'Monitor',
    items: [
      { to: '/authority', label: 'Overview & KPIs', icon: IconGauge },
      { to: '/authority/map', label: 'Destination Map', icon: IconMap },
      { to: '/authority/disruptions', label: 'Active Disruptions', icon: IconAlert },
    ],
  },
  {
    heading: 'Analyse',
    items: [
      { to: '/authority/graph', label: 'Dependency Graph', icon: IconGraph },
      { to: '/authority/ripple', label: 'Ripple Effect', icon: IconRipple },
      { to: '/authority/impact', label: 'Impact Analysis', icon: IconLayers },
    ],
  },
  {
    heading: 'Act',
    items: [
      { to: '/authority/interventions', label: 'Interventions', icon: IconSparkles },
      { to: '/authority/tourists', label: 'Affected Tourists', icon: IconUsers },
      { to: '/authority/itineraries', label: 'Affected Itineraries', icon: IconCalendar },
    ],
  },
];

export function Layout({ variant }: { variant: 'tourist' | 'authority' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const groups = variant === 'authority' ? AUTHORITY_NAV : TOURIST_NAV;

  // Close the drawer whenever the route changes on mobile.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-ink-900/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand variant={variant} compact />
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-mist-300"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
        >
          {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-ink-850/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Brand variant={variant} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <Brand variant={variant} compact />
          <button
            onClick={() => setOpen(false)}
            className="text-mist-400"
            aria-label="Close navigation"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.heading} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/app' || item.to === '/authority'}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                          isActive
                            ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-500/25'
                            : 'text-mist-300 hover:bg-white/4 hover:text-mist-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`h-[18px] w-[18px] shrink-0 transition ${
                              isActive
                                ? 'text-brand-400'
                                : 'text-mist-400 group-hover:text-mist-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-info text-xs font-bold text-white">
              {initials(user?.full_name ?? user?.email ?? '?')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {user?.full_name ?? 'Signed in'}
              </p>
              <p className="truncate text-[11px] capitalize text-mist-400">
                {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-mist-400 transition hover:bg-white/5 hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <main id="main" className="px-4 py-6 sm:px-6 lg:ml-[264px] lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function Brand({
  variant,
  compact = false,
}: {
  variant: 'tourist' | 'authority';
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-info shadow-lg shadow-brand-600/25">
        {variant === 'authority' ? (
          <IconShield className="h-[18px] w-[18px] text-white" />
        ) : (
          <IconPin className="h-[18px] w-[18px] text-white" />
        )}
      </span>
      <div className={compact ? '' : 'leading-tight'}>
        <p className="text-[15px] font-extrabold tracking-tight text-white">
          TourNexus
        </p>
        {!compact && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">
            {variant === 'authority' ? 'Authority Console' : 'Tourist App'}
          </p>
        )}
      </div>
    </div>
  );
}

function initials(value: string): string {
  const parts = value.trim().split(/[\s@.]+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
}
