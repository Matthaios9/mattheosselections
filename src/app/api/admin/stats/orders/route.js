import { getOrderStatusCounts } from '@/server/domain/orders';
import { withApi } from '@/server/http';

/** GET /api/admin/stats/orders — number of orders per status (`all`, `pending`, …). */
export const GET = withApi(() => getOrderStatusCounts(), { auth: 'admin' });
