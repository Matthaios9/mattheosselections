import { listOrders } from '@/server/domain/orders';
import { withApi } from '@/server/http';
import { ORDER_STATUSES } from '@/server/models/Order';

/** GET /api/admin/orders — paginated list. Query: q (number, name or email), status, page. */
export const GET = withApi(
  ({ query }) =>
    listOrders({
      q: query.q ?? '',
      status: ORDER_STATUSES.includes(query.status) ? query.status : '',
      page: query.page,
    }),
  { auth: 'admin' }
);
