/**
 * Shop catalogue options shared by the storefront UI and the products API,
 * so filters mean exactly the same thing on both sides. The API also accepts
 * price ranges, sizes and stock; the shop itself only offers categories and sorting.
 */

export const SORT_OPTIONS = ['popularity', 'featured', 'newest', 'price-asc', 'price-desc'];
export const DEFAULT_SORT = 'popularity';

export const PRICE_RANGES = [
  { id: 'under-150', max: 150 },
  { id: '150-300', min: 150, max: 300 },
  { id: '300-600', min: 300, max: 600 },
  { id: 'over-600', min: 600 },
];

/** The shop filters by category only (plus a search from the header); defaults stay out of the URL. */
export const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
};

/** URL / API query (`?q=&category=&sort=`) → filter state. */
export function filtersFromParams(params = {}) {
  return {
    query: params.q ?? '',
    category: params.category || 'all',
  };
}

export const sortFromParams = (params = {}) => (SORT_OPTIONS.includes(params.sort) ? params.sort : DEFAULT_SORT);

/** Filter state → query params (defaults are left out so URLs stay short). */
export function filtersToParams(filters, sort = DEFAULT_SORT) {
  return {
    q: filters.query.trim(),
    category: filters.category === 'all' ? '' : filters.category,
    sort: sort === DEFAULT_SORT ? '' : sort,
  };
}
