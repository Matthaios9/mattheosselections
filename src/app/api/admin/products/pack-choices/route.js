import { listPackChoices } from '@/server/domain/products';
import { withApi } from '@/server/http';

/** GET /api/admin/products/pack-choices — the products a pack can hold (any product that isn't a pack), with sizes and stock. */
export const GET = withApi(() => listPackChoices(), { auth: 'admin' });
