import { listOrdersForUser, toCustomerOrder } from '@/server/domain/orders';
import { withApi } from '@/server/http';

/** GET /api/account/orders — the signed-in customer's orders, newest first. → { items } */
export const GET = withApi(
  async ({ user }) => {
    const orders = await listOrdersForUser(user.id);
    return { items: orders.map(toCustomerOrder) };
  },
  { auth: 'user' }
);
