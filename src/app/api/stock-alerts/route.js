import { after } from 'next/server';
import { createStockAlert, sendStockAlertConfirmation } from '@/server/domain/stock-alerts';
import { conflict, created, notFound, parseBody, requestOrigin, withApi } from '@/server/http';
import { stockAlertInput } from '@/server/validation';

/**
 * POST /api/stock-alerts — "Notify me when available" for a sold-out size.
 * Body: { productId, variantKey, email, locale }. A confirmation email goes out after the response.
 */
export const POST = withApi(async ({ request }) => {
  const result = await createStockAlert(await parseBody(request, stockAlertInput));
  if (!result.ok && result.reason === 'in-stock') throw conflict('This size is back in stock.', 'in-stock');
  if (!result.ok) throw notFound('Product not found.');
  if (result.created) {
    const origin = requestOrigin(request);
    after(() => sendStockAlertConfirmation(result.alertId, { origin }));
  }
  return created({ ok: true });
});
