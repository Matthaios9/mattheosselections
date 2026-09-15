import { listOrdersForUser } from '@/server/domain/orders';
import { withApi } from '@/server/http';

/** GET /api/admin/users/:id/orders — the account's order history (newest first). */
export const GET = withApi(async ({ params }) => ({ items: await listOrdersForUser(params.id) }), { auth: 'admin' });
