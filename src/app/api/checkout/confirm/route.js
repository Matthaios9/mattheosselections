import { placeOrder } from '@/server/domain/payments';
import { conflict, parseBody, revalidateStorefront, unavailable, withApi } from '@/server/http';
import { isKlarnaConfigured, KlarnaError } from '@/server/klarna';
import { confirmPaymentInput } from '@/server/validation';

/**
 * POST /api/checkout/confirm — called once the customer has approved the payment in Klarna's widget.
 * Takes the items out of stock and places the order (idempotent with Klarna's authorization callback).
 * → `{ orderNumber, redirectUrl }`: the storefront then sends the customer to Klarna's `redirectUrl`,
 * which returns them to the shop with `?payment=success&order=…`.
 * Fails with code 'sold-out' or 'declined' (nothing is charged), or 'not-found' / 'in-progress'.
 */
export const POST = withApi(async ({ request }) => {
  const { sessionId, authorizationToken } = await parseBody(request, confirmPaymentInput);
  if (!isKlarnaConfigured()) throw unavailable('Online payment is not available right now.', 'payments-unavailable');

  const result = await placeOrder(sessionId, authorizationToken, { wait: true }).catch((error) => {
    if (!(error instanceof KlarnaError)) throw error;
    console.error('[checkout/confirm]', error.message, error.correlationId ? `(correlation ${error.correlationId})` : '');
    throw unavailable('The payment could not be completed with Klarna right now.', 'payments-unavailable');
  });
  if (!result.ok) throw conflict('The purchase could not be completed.', result.reason);
  if (result.created) revalidateStorefront();
  return { orderNumber: result.order.number, redirectUrl: result.redirectUrl };
});
