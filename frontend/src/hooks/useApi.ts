import { useCallback, useEffect, useRef, useState } from 'react';

import { NetworkError } from '../lib/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  reload: () => void;
}

/**
 * Run an API call and expose loading / error / data as state.
 *
 * Every screen in the app uses this so that "the backend is down" and
 * "the backend returned nothing" are visibly different from "still
 * loading", instead of silently rendering an empty page.
 */
export function useApi<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setOffline(false);

    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setOffline(err instanceof NetworkError);
        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, offline, reload };
}
