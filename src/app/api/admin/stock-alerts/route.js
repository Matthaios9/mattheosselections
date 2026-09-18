import { listStockAlerts, sendBackInStockEmails } from '@/server/domain/stock-alerts';
import { requestOrigin, withApi } from '@/server/http';

/** GET /api/admin/stock-alerts — paginated list. Query: status (waiting | notified), q (email), product, page. */
export const GET = withApi(
  ({ query: { status, q, product, page } }) => listStockAlerts({ status, q, product, page }),
  { auth: 'admin' }
);

/** POST /api/admin/stock-alerts — email every waiting customer whose size is in stock now → { sent, failed, due, configured }. */
export const POST = withApi(({ request }) => sendBackInStockEmails({ origin: requestOrigin(request) }), { auth: 'admin' });
