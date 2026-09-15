import { searchStoreProducts, storeQueryToOptions } from '@/server/domain/storefront';
import { withApi } from '@/server/http';

/**
 * GET /api/products — the public catalogue, filtered, sorted and paginated on the server.
 *
 * Query: locale, q, category, price, sizes (comma list), stock=in, featured=1,
 *        ids (comma list), sort, page, pageSize, facets=1 (option counts for the shop filters)
 */
export const GET = withApi(({ query }) => searchStoreProducts(storeQueryToOptions(query)));
