'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const listeners = new Set();

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * JSON state persisted to localStorage and synced across tabs.
 * The server snapshot is always the fallback, so hydration never mismatches.
 */
export function useLocalStorageState(key, fallback) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );

  const value = useMemo(() => {
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback(
    (next) => {
      let current = fallback;
      try {
        const stored = read(key);
        current = stored == null ? fallback : JSON.parse(stored);
      } catch {
        current = fallback;
      }
      const resolved = typeof next === 'function' ? next(current) : next;
      try {
        if (resolved == null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage can be unavailable (private mode, quota) — fail silently.
      }
      listeners.forEach((listener) => listener());
    },
    [key, fallback]
  );

  return [value, setValue];
}
