import { after } from 'next/server';
import { placeOrder } from '@/server/domain/payments';
import { parseBody, revalidateStorefront, unavailable, withApi } from '@/server/http';
import { isKlarnaConfigured } from '@/server/klarna';
import { klarnaAuthorizationInput } from '@/server/validation';

/**
 * POST /api/klarna/authorization — Klarna's authorization callback (HTTPS only), sent when a customer
 * approves a payment. Places the order even if the customer's browser never reports back; if the
 * storefront is already placing it, nothing more happens. Klarna waits only 2 seconds for an answer,
 * so the order is placed after responding. A forged callback can't place anything: Klarna has to
 * accept the authorization token.
 */
export const POST = withApi(async ({ request }) => {
  if (!isKlarnaConfigured()) throw unavailable('Klarna is not configured.');
  const { session_id: sessionId, authorization_token: authorizationToken } = await parseBody(request, klarnaAuthorizationInput);

  after(async () => {
    try {
      const result = await placeOrder(sessionId, authorizationToken);
      if (result.created) revalidateStorefront();
    } catch (error) {
      console.error('[klarna/authorization]', error.message);
    }
  });
  return new Response(null, { status: 204 });
});
