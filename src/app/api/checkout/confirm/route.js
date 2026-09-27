import { after } from 'next/server';
import { sendAdminOrderNotice, sendOrderConfirmation } from '@/server/domain/order-emails';
import { finalizeCheckout } from '@/server/domain/payments';
import { conflict, parseBody, requestOrigin, revalidateStorefront, unavailable, withApi } from '@/server/http';
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
  // Only the call that created the order emails the customer and the shop, so the push notification never repeats it.
  if (result.created) {
    const origin = requestOrigin(request);
    after(() => sendOrderConfirmation(result.order, { origin }));
    after(() => sendAdminOrderNotice(result.order, { origin }));
  }
  const { order } = result;
  const soldOut = order.status === 'cancelled';
  return {
    orderNumber: order.number,
    soldOut,
    // Amounts and lines only (never the customer's details), for the Analytics purchase event.
    order: soldOut
      ? null
      : {
          number: order.number,
          currency: order.currency,
          total: order.total,
          shippingFee: order.shippingFee,
          discount: order.discount,
          items: order.items.map(({ product, name, variantLabel, price, quantity, discount }) => ({
            product,
            name,
            variantLabel,
            price,
            quantity,
            discount,
          })),
        },
  };
});
