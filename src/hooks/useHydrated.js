'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` during SSR and hydration, `true` afterwards. Use it to guard UI that
 * depends on browser-only state (e.g. the persisted cart) so server and client
 * markup always match.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
