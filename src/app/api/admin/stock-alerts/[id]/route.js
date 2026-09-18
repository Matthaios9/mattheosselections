import { deleteStockAlert } from '@/server/domain/stock-alerts';
import { notFound, withApi } from '@/server/http';

/** DELETE /api/admin/stock-alerts/:id */
export const DELETE = withApi(
  async ({ params }) => {
    if (!(await deleteStockAlert(params.id))) throw notFound('Request not found.');
    return { ok: true };
  },
  { auth: 'admin' }
);
