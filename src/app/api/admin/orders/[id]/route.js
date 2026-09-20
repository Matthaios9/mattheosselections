import { after } from 'next/server';
import { z } from 'zod';
import { sendOrderStatusEmail } from '@/server/domain/order-emails';
import { getOrder, updateOrderFields, updateOrderStatus } from '@/server/domain/orders';
import { sendBackInStockEmails } from '@/server/domain/stock-alerts';
import { conflict, notFound, parseBody, requestOrigin, revalidateStorefront, withApi } from '@/server/http';
import { adminNoteInput, orderStatusInput, paymentStatusInput } from '@/server/validation';

const missing = () => notFound('Order not found.');

/** GET /api/admin/orders/:id */
export const GET = withApi(
  async ({ params }) => {
    const order = await getOrder(params.id);
    if (!order) throw missing();
    return order;
  },
  { auth: 'admin' }
);

// Strict, so each body matches exactly one kind of change (a note is never cleared by accident).
const orderUpdate = z.union([
  orderStatusInput.strict(),
  paymentStatusInput.strict(),
  z.object({ adminNote: adminNoteInput.shape.adminNote.unwrap() }).strict(),
]);

/**
 * PATCH /api/admin/orders/:id — one change at a time:
 *   { status, note }   fulfilment status (cancelling returns the items to stock; for Kustom orders
 *                      shipping captures the payment and cancelling voids or refunds it)
 *   { paymentStatus }  payment status
 *   { adminNote }      internal note
 */
export const PATCH = withApi(
  async ({ request, params, user }) => {
    const body = await parseBody(request, orderUpdate);

    if ('status' in body) {
      const result = await updateOrderStatus(params.id, body, user);
      if (!result.ok && result.reason === 'insufficient-stock') {
        throw conflict(`Not enough stock to reopen this order${result.item ? ` (${result.item})` : ''}.`, 'insufficient-stock');
      }
      if (!result.ok && result.reason === 'payment') throw conflict(result.message, 'payment-failed');
      if (!result.ok) throw missing();
      revalidateStorefront(); // cancelling / reopening changes stock
      const origin = requestOrigin(request);
      // Tell the customer where their order stands. Re-saving the same status is not news to them.
      if (result.changed) after(() => sendOrderStatusEmail(result.order, { origin }));
      if (body.status === 'cancelled') {
        // Items returned to stock may be what someone is waiting for.
        after(() =>
          sendBackInStockEmails({ origin }).catch((error) =>
            console.error('[stock-alerts] Could not send back-in-stock emails:', error.message)
          )
        );
      }
      return result.order;
    }

    const fields = 'paymentStatus' in body ? { paymentStatus: body.paymentStatus } : { adminNote: body.adminNote };
    const order = await updateOrderFields(params.id, fields);
    if (!order) throw missing();
    return order;
  },
  { auth: 'admin' }
);
