import { after } from 'next/server';
import { createStockAlert, sendStockAlertConfirmation } from '@/server/domain/stock-alerts';
import { canReceiveEmail } from '@/server/email-domain';
import { badRequest, conflict, created, notFound, parseBody, requestOrigin, withApi } from '@/server/http';
import { stockAlertInput } from '@/server/validation';

/**
 * POST /api/stock-alerts — "Notify me when available" for a sold-out size.
 * Body: { productId, variantKey, email, locale }. A confirmation email goes out after the response.
 */
export const POST = withApi(async ({ request }) => {
  const { website, ...input } = await parseBody(request, stockAlertInput);
  // The hidden honeypot field is only ever filled in by bots: answer as usual, save and send nothing.
  if (website) return created({ ok: true });
  if (!(await canReceiveEmail(input.email))) throw badRequest('This email domain cannot receive email.', 'email-domain');
  const result = await createStockAlert(input);
  if (!result.ok && result.reason === 'in-stock') throw conflict('This size is back in stock.', 'in-stock');
  if (!result.ok) throw notFound('Product not found.');
  if (result.created) {
    const origin = requestOrigin(request);
    after(() => sendStockAlertConfirmation(result.alertId, { origin }));
  }
  return created({ ok: true });
}, { rateLimit: { name: 'stock-alert', limit: 10, window: 3600 } });
