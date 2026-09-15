import { handleKustomPush } from '@/server/domain/payments';
import { revalidateStorefront, unavailable, withApi } from '@/server/http';
import { isKustomConfigured } from '@/server/kustom';

/**
 * POST /api/kustom/push?kustom_order_id=… — Kustom's push notification after a completed purchase
 * (retried until the order is acknowledged). Creates the order even if the customer never
 * reached the confirmation page. The order data is always read back from Kustom's API,
 * so a forged notification can't create anything.
 */
export const POST = withApi(async ({ query }) => {
  if (!isKustomConfigured()) throw unavailable('Kustom is not configured.');
  if (!query.kustom_order_id) return { ok: false };

  const result = await handleKustomPush(query.kustom_order_id);
  if (result.created) revalidateStorefront();
  return { ok: result.ok };
});
