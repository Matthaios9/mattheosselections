'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { fromSearchParams, toQueryString } from '@/utils/url';

/**
 * Query-string state for lists and filters. The URL is the single source of truth,
 * so filtered views are shareable and survive refresh and back/forward.
 *
 *   const [params, setParams] = useUrlParams();
 *   setParams({ status: 'pending' });   // any change except `page` goes back to page 1
 *
 * Uses the History API, which Next.js syncs with useSearchParams — no server round-trip.
 */
export function useUrlParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const setParams = (patch, { replace = false } = {}) => {
    const next = { ...fromSearchParams(new URLSearchParams(window.location.search)), ...patch };
    if (!('page' in patch) || Number(next.page) <= 1) delete next.page;
    const query = toQueryString(next);
    window.history[replace ? 'replaceState' : 'pushState'](null, '', `${pathname}${query ? `?${query}` : ''}`);
  };

  return [fromSearchParams(searchParams), setParams];
}
