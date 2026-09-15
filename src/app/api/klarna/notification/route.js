import { handleKlarnaNotification } from '@/server/domain/payments';
import { parseBody, revalidateStorefront, unavailable, withApi } from '@/server/http';
import { isKlarnaConfigured } from '@/server/klarna';
import { klarnaNotificationInput } from '@/server/validation';

/**
 * POST /api/klarna/notification — Klarna's decision on an order it was still reviewing (HTTPS only).
 * Accepted: noted on the order. Rejected: the order is cancelled and its items return to stock.
 * The decision is read back from Klarna's API, so a forged notification can't change anything.
 */
export const POST = withApi(async ({ request }) => {
  if (!isKlarnaConfigured()) throw unavailable('Klarna is not configured.');
  const { order_id: klarnaOrderId } = await parseBody(request, klarnaNotificationInput);

  const result = await handleKlarnaNotification(klarnaOrderId);
  if (result.changed) revalidateStorefront();
  return { ok: result.ok };
});
