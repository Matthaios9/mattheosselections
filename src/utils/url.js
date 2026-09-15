/**
 * Query-string helpers shared by the API client, URL-synced lists and route handlers.
 * Empty values ('' / null / undefined / []) are dropped; arrays are comma-joined.
 */
function toSearchParams(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  return search;
}

export const toQueryString = (params) => toSearchParams(params).toString();

/** `?a=1&tags=x,y` → `{ a: '1', tags: 'x,y' }` (first value wins). */
export function fromSearchParams(searchParams) {
  const out = {};
  for (const [key, value] of searchParams.entries()) {
    if (!(key in out)) out[key] = value;
  }
  return out;
}

/** Comma-separated list param → array (`'a,b'` → `['a', 'b']`). */
export const splitList = (value) => (value ? String(value).split(',').filter(Boolean) : []);
