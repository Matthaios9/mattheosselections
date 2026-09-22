import { defaultLocale, isLocale, localeCodes } from '@/i18n/config';
import { getCurrentUser } from '@/server/auth/dal';
import { startCheckout } from '@/server/domain/payments';
import { conflict, parseBody, requestOrigin, unavailable, withApi } from '@/server/http';
import { isKustomConfigured, KustomError } from '@/server/kustom';
import { checkoutInput } from '@/server/validation';

/** Where Kustom sends the customer after paying: the storefront page they checked out from. */
function returnPathFor(path, locale) {
  const pattern = new RegExp(`^/(${localeCodes.join('|')})(/[a-z-]+)?$`);
  return pattern.test(path) ? path : `/${isLocale(locale) ? locale : defaultLocale}/shop`;
}

/** Kustom refused or couldn't be reached: log why, tell the shopper payment is unavailable. */
function paymentProviderError(error) {
  if (!(error instanceof KustomError)) throw error;
  console.error('[checkout]', error.message, error.correlationId ? `(correlation ${error.correlationId})` : '');
  throw unavailable('Online payment is not available right now.', 'payments-unavailable');
}

/**
 * POST /api/checkout — validates the cart against live prices and stock and creates a
 * Kustom Checkout order. → `{ orderId, snippet }` (the snippet renders Kustom's checkout).
 * Stock is only taken once the purchase is completed.
 */
export const POST = withApi(async ({ request }) => {
  const { returnPath, ...input } = await parseBody(request, checkoutInput);
  if (!isKustomConfigured()) throw unavailable('Online payment is not available right now.', 'payments-unavailable');

  const result = await startCheckout(
    { ...input, returnPath: returnPathFor(returnPath, input.locale) },
    await getCurrentUser(),
    { origin: requestOrigin(request) }
  ).catch(paymentProviderError);
  if (!result.ok) {
    throw conflict('Some items are no longer available.', 'items-unavailable', { details: { problems: result.problems } });
  }
  return { orderId: result.orderId, snippet: result.snippet };
}, { rateLimit: { name: 'checkout', limit: 20, window: 600 } });
