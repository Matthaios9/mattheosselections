import { defaultLocale, isLocale, localeCodes } from '@/i18n/config';
import { getCurrentUser } from '@/server/auth/dal';
import { startCheckout } from '@/server/domain/payments';
import { conflict, parseBody, requestOrigin, unavailable, withApi } from '@/server/http';
import { isKlarnaConfigured, KlarnaError } from '@/server/klarna';
import { checkoutInput } from '@/server/validation';

/** Where Klarna sends the customer once the order is placed: the storefront page they checked out from. */
function returnPathFor(path, locale) {
  const pattern = new RegExp(`^/(${localeCodes.join('|')})(/[a-z-]+)?$`);
  return pattern.test(path) ? path : `/${isLocale(locale) ? locale : defaultLocale}/shop`;
}

/** Klarna refused or couldn't be reached: log why, tell the shopper. */
function paymentProviderError(error, country) {
  if (!(error instanceof KlarnaError)) throw error;
  console.error('[checkout]', error.message, error.correlationId ? `(correlation ${error.correlationId})` : '');
  // Klarna only accepts a country's own currency, so it refuses a SEK payment for an address abroad.
  if (error.status === 400 && country !== 'SE') {
    throw conflict('Klarna is not available for addresses in this country.', 'country-unavailable');
  }
  throw unavailable('Online payment is not available right now.', 'payments-unavailable');
}

/**
 * POST /api/checkout — validates the cart against live prices and stock, keeps the customer's details
 * and opens a Klarna payment session. → `{ sessionId, clientToken, categories, address }` (the storefront
 * loads Klarna's widget with the client token and authorizes the payment with that address).
 * Stock is only taken once the order is placed.
 */
export const POST = withApi(async ({ request }) => {
  const { items, country, note, locale, returnPath, ...customer } = await parseBody(request, checkoutInput);
  if (!isKlarnaConfigured()) throw unavailable('Online payment is not available right now.', 'payments-unavailable');

  const result = await startCheckout(
    { items, country, note, locale, customer, returnPath: returnPathFor(returnPath, locale) },
    await getCurrentUser(),
    { origin: requestOrigin(request) }
  ).catch((error) => paymentProviderError(error, country));
  if (!result.ok) {
    throw conflict('Some items are no longer available.', 'items-unavailable', { details: { problems: result.problems } });
  }
  return { sessionId: result.sessionId, clientToken: result.clientToken, categories: result.categories, address: result.address };
});
