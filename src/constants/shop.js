import { splitList } from '@/utils/url';

/**
 * Shop catalogue options shared by the storefront UI and the products API,
 * so filters mean exactly the same thing on both sides.
 */

export const SORT_OPTIONS = ['featured', 'popularity', 'newest', 'price-asc', 'price-desc'];
export const DEFAULT_SORT = 'featured';

export const PRICE_RANGES = [
  { id: 'under-150', max: 150 },
  { id: '150-300', min: 150, max: 300 },
  { id: '300-600', min: 300, max: 600 },
  { id: 'over-600', min: 600 },
];

export const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  priceRange: 'any',
  sizes: [],
  inStockOnly: false,
};

/** URL / API query (`?q=&category=&price=&sizes=&stock=in&sort=`) → filter state. */
export function filtersFromParams(params = {}) {
  return {
    query: params.q ?? '',
    category: params.category || 'all',
    priceRange: PRICE_RANGES.some((range) => range.id === params.price) ? params.price : 'any',
    sizes: splitList(params.sizes),
    inStockOnly: params.stock === 'in',
  };
}

export const sortFromParams = (params = {}) => (SORT_OPTIONS.includes(params.sort) ? params.sort : DEFAULT_SORT);

/** Filter state → query params (defaults are left out so URLs stay short). */
export function filtersToParams(filters, sort = DEFAULT_SORT) {
  return {
    q: filters.query.trim(),
    category: filters.category === 'all' ? '' : filters.category,
    price: filters.priceRange === 'any' ? '' : filters.priceRange,
    sizes: filters.sizes,
    stock: filters.inStockOnly ? 'in' : '',
    sort: sort === DEFAULT_SORT ? '' : sort,
  };
}

export function countActiveFilters(filters) {
  return (
    (filters.query ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.priceRange !== 'any' ? 1 : 0) +
    filters.sizes.length +
    (filters.inStockOnly ? 1 : 0)
  );
}
