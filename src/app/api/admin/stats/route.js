import { getDashboardStats } from '@/server/domain/stats';
import { withApi } from '@/server/http';

/** GET /api/admin/stats — dashboard figures (revenue, orders, top products, stock alerts). */
export const GET = withApi(() => getDashboardStats(), { auth: 'admin' });
