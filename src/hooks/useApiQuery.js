'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

/**
 * Load data from a service function and keep it in sync with its inputs.
 *
 *   const { data, error, loading, refetch } = useApiQuery(['orders', params], () => getAllOrders(params));
 *
 * - `key` (any JSON-serialisable value) identifies the request; when it changes, the data reloads.
 * - The previous data stays visible while the next request loads (no flashing tables).
 * - `initialData` (e.g. rendered on the server) is used for the first key without a request.
 * - `enabled: false` skips loading (e.g. until an overlay opens).
 * - `mutate(updater)` updates the cached data locally after a change.
 */
export function useApiQuery(key, fetcher, { initialData, enabled = true } = {}) {
  const hash = JSON.stringify(key);
  const [version, setVersion] = useState(0);
  const token = `${hash}#${version}`;
  const [state, setState] = useState(() => ({
    token: initialData === undefined ? null : token,
    data: initialData,
    error: null,
  }));
  const loadedRef = useRef(state.token);
  const load = useEffectEvent(() => fetcher());

  useEffect(() => {
    if (!enabled || loadedRef.current === token) return undefined;
    let active = true;
    load().then(
      (data) => {
        if (!active) return;
        loadedRef.current = token;
        setState({ token, data, error: null });
      },
      (error) => {
        if (active) setState((current) => ({ token, data: current.data, error }));
      }
    );
    return () => {
      active = false;
    };
  }, [token, enabled]);

  return {
    data: state.data,
    error: state.token === token ? state.error : null,
    loading: enabled && state.token !== token,
    refetch: () => setVersion((current) => current + 1),
    mutate: (updater) =>
      setState((current) => ({ ...current, data: typeof updater === 'function' ? updater(current.data) : updater })),
  };
}
