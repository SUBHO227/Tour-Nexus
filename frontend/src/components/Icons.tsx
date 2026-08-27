/** Inline stroke icons - no icon-font dependency, themeable via currentColor. */

type Props = { className?: string };

const base = 'h-4 w-4';

function Svg({
  className = base,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconGauge = (p: Props) => (
  <Svg {...p}>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="m13.4 10.6 4.1-4.1" />
    <path d="M3.3 17A9 9 0 1 1 20.7 17" />
  </Svg>
);

export const IconPin = (p: Props) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const IconMap = (p: Props) => (
  <Svg {...p}>
    <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
    <path d="M9 3v15M15 6v15" />
  </Svg>
);

export const IconRoute = (p: Props) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="5" r="3" />
    <path d="M9 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6" />
  </Svg>
);

export const IconAlert = (p: Props) => (
  <Svg {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </Svg>
);

export const IconGraph = (p: Props) => (
  <Svg {...p}>
    <circle cx="5" cy="6" r="2.5" />
    <circle cx="19" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M7 7.5 10.5 16M17 7.5 13.5 16M7.5 6h9" />
  </Svg>
);

export const IconRipple = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 7a5 5 0 0 1 5 5M12 3a9 9 0 0 1 9 9" />
    <path d="M12 17a5 5 0 0 1-5-5M12 21a9 9 0 0 1-9-9" />
  </Svg>
);

export const IconSparkles = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
  </Svg>
);

export const IconCalendar = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconUsers = (p: Props) => (
  <Svg {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.9M16.5 3.6a4 4 0 0 1 0 7.3" />
  </Svg>
);

export const IconUser = (p: Props) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const IconShield = (p: Props) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </Svg>
);

export const IconLayers = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
  </Svg>
);

export const IconLogout = (p: Props) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Svg>
);

export const IconRefresh = (p: Props) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const IconCheck = (p: Props) => (
  <Svg {...p}>
    <path d="m4 12 5 5L20 6" />
  </Svg>
);

export const IconArrowRight = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconClock = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IconBed = (p: Props) => (
  <Svg {...p}>
    <path d="M3 18V7M3 12h18v6M7 12V9h6v3" />
  </Svg>
);

export const IconFood = (p: Props) => (
  <Svg {...p}>
    <path d="M4 3v8a3 3 0 0 0 6 0V3M7 11v10" />
    <path d="M17 3c-1.7 1.5-2.5 3.5-2.5 6s.8 3 2.5 3v9" />
  </Svg>
);

export const IconBus = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="12" rx="2" />
    <path d="M4 10h16M7 20v-2M17 20v-2" />
    <circle cx="8" cy="16" r="0.6" fill="currentColor" />
    <circle cx="16" cy="16" r="0.6" fill="currentColor" />
  </Svg>
);

export const IconMenu = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p: Props) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
