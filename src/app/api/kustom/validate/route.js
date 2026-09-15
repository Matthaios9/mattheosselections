import { isKustomOrderInStock } from '@/server/domain/payments';
import { parseBody, requestOrigin, withApi } from '@/server/http';
import { kustomValidationInput } from '@/server/validation';

/**
 * POST /api/kustom/validate?return_path=… — Kustom's last check before the customer pays
 * (HTTPS only). 200 lets the purchase go ahead; a 303 redirect stops it and sends the
 * customer back to the store, where they're told an item sold out. Nothing is charged.
 */
export const POST = withApi(async ({ request, query }) => {
  const order = await parseBody(request, kustomValidationInput);
  if (await isKustomOrderInStock(order.order_lines)) return new Response(null, { status: 200 });

  const back = /^\/[a-z]{2}(\/[a-z-]+)?$/.test(query.return_path ?? '') ? query.return_path : '/en/shop';
  return new Response(null, { status: 303, headers: { Location: `${requestOrigin(request)}${back}?payment=unavailable` } });
});
