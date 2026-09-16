import { finalizeCheckout } from '@/server/domain/payments';
import { conflict, parseBody, revalidateStorefront, unavailable, withApi } from '@/server/http';
import { isKustomConfigured, KustomError } from '@/server/kustom';
import { confirmPaymentInput } from '@/server/validation';

/**
 * POST /api/checkout/confirm — called from Kustom's confirmation redirect.
 * Creates the order and takes the items out of stock (idempotent with the push notification).
 */
export const POST = withApi(async ({ request }) => {
  const { orderId } = await parseBody(request, confirmPaymentInput);
  if (!isKustomConfigured()) throw unavailable('Online payment is not available right now.', 'payments-unavailable');

  const result = await finalizeCheckout(orderId).catch((error) => {
    if (!(error instanceof KustomError)) throw error;
    console.error('[checkout/confirm]', error.message);
    throw unavailable('The purchase could not be confirmed with Kustom right now.', 'payments-unavailable');
  });
  if (!result.ok) throw conflict('The purchase could not be confirmed.', result.reason);
  revalidateStorefront();
  return { orderNumber: result.order.number, soldOut: result.order.status === 'cancelled' };
});
