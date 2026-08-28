/**
 * The single place the frontend talks to the backend.
 *
 * Nothing else in the app should call fetch(). Every endpoint is typed,
 * every failure comes back as an ApiError with a usable message, and the
 * bearer token is attached in one place.
 */

import type {
  AlternativePaths,
  Attraction,
  CrowdReading,
  DependencyGraph,
  Destination,
  Disruption,
  Hotel,
  ImpactReport,
  Itinerary,
  ItineraryItem,
  Overview,
  Restaurant,
  RippleAnalysis,
  Role,
  Service,
  TokenResponse,
  TourismEvent,
  Transport,
  User,
} from './types';

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

const TOKEN_KEY = 'tournexus.token';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Thrown when the backend is unreachable, as opposed to returning an error. */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    /* Private-mode browsers can throw here; the app still works in-memory. */
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new NetworkError(
      'Cannot reach the TourNexus API. Is the backend running on ' +
        `${BASE_URL}?`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(extractMessage(payload, response), response.status);
  }

  return payload as T;
}

function extractMessage(payload: unknown, response: Response): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;

    if (typeof detail === 'string') {
      return detail;
    }

    // FastAPI validation errors arrive as a list of objects.
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined;

      if (first?.msg) {
        const field = Array.isArray(first.loc)
          ? String(first.loc[first.loc.length - 1])
          : null;

        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }
  }

  return `Request failed with status ${response.status}`;
}

const get = <T>(path: string) => request<T>(path);

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  auth: {
    login: (email: string, password: string) =>
      post<TokenResponse>('/auth/login', { email, password }),

    register: (input: {
      email: string;
      password: string;
      full_name?: string;
      role: Role;
    }) => post<TokenResponse>('/auth/register', input),

    me: () => get<User>('/auth/me'),
  },

  destinations: {
    list: () => get<Destination[]>('/destinations/'),
    byId: (id: number) => get<Destination>(`/destinations/${id}`),
  },

  attractions: {
    list: () => get<Attraction[]>('/attractions/'),
    byId: (id: number) => get<Attraction>(`/attractions/${id}`),
    byDestination: (destinationId: number) =>
      get<Attraction[]>(`/attractions/destination/${destinationId}`),
  },

  services: {
    list: (serviceType?: string) =>
      get<Service[]>(
        serviceType
          ? `/services/?service_type=${encodeURIComponent(serviceType)}`
          : '/services/',
      ),
    byDestination: (destinationId: number) =>
      get<Service[]>(`/services/destination/${destinationId}`),
  },

  crowd: {
    latest: () => get<CrowdReading[]>('/crowd/latest'),
    history: () => get<CrowdReading[]>('/crowd/'),
    forAttraction: (attractionId: number) =>
      get<CrowdReading[]>(`/crowd/attraction/${attractionId}`),
  },

  disruptions: {
    list: () => get<Disruption[]>('/disruptions/'),
    active: () => get<Disruption[]>('/disruptions/active'),
  },

  hotels: {
    list: () => get<Hotel[]>('/hotels/'),
    byDestination: (destinationId: number) =>
      get<Hotel[]>(`/hotels/destination/${destinationId}`),
  },

  restaurants: {
    list: () => get<Restaurant[]>('/restaurants/'),
    byDestination: (destinationId: number) =>
      get<Restaurant[]>(`/restaurants/destination/${destinationId}`),
  },

  transport: {
    list: () => get<Transport[]>('/transport/'),
    byDestination: (destinationId: number) =>
      get<Transport[]>(`/transport/destination/${destinationId}`),
  },

  events: {
    list: () => get<TourismEvent[]>('/events/'),
    byDestination: (destinationId: number) =>
      get<TourismEvent[]>(`/events/destination/${destinationId}`),
  },

  itineraries: {
    list: () => get<Itinerary[]>('/itineraries/'),
    byId: (id: number) => get<Itinerary>(`/itineraries/${id}`),
    items: (itineraryId: number) =>
      get<ItineraryItem[]>(`/itinerary-items/itinerary/${itineraryId}`),
  },

  analytics: {
    overview: () => get<Overview>('/analytics/overview'),
    graph: () => get<DependencyGraph>('/analytics/graph'),
    interventions: (sourceType: string, sourceId: number) =>
      get<ImpactReport>(`/analytics/interventions/${sourceType}/${sourceId}`),
  },

  dependencies: {
    analysis: (sourceType: string, sourceId: number) =>
      get<RippleAnalysis>(`/dependencies/analysis/${sourceType}/${sourceId}`),

    alternativePaths: (
      source: string,
      target: string,
      disrupted: string,
    ): Promise<AlternativePaths> => {
      const [st, si] = source.split(':');
      const [tt, ti] = target.split(':');
      const [dt, di] = disrupted.split(':');

      return get<AlternativePaths>(
        `/dependencies/alternative-path/${st}/${si}/${tt}/${ti}` +
          `?disrupted_type=${dt}&disrupted_id=${di}`,
      );
    },
  },
};
