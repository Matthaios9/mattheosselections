import 'server-only';
import { cancelOrder, captureOrder, isKlarnaConfigured, refundOrder } from '@/server/klarna';

const toMinorUnits = (amount) => Math.round(amount * 100); // kr → öre

/** Raised when Klarna refuses a payment change; the order status is then left as it was. */
export class PaymentUpdateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentUpdateError';
  }
}

/**
 * Keep a Klarna payment in step with the order's fulfilment status. Klarna only
 * reserves the money at checkout ('authorized'):
 *   shipped / delivered → capture (the customer is charged) → 'paid'
 *   cancelled           → void the reservation → 'unpaid', or refund a capture → 'refunded'
 * Mutates `order.paymentStatus` and returns a note for the timeline (or null).
 * Throws PaymentUpdateError if Klarna refuses, so the status change isn't saved.
 */
export async function settleKlarnaPayment(order, nextStatus) {
  if (order.paymentMethod !== 'klarna' || !order.klarnaOrderId) return null;

  const ships = ['shipped', 'delivered'].includes(nextStatus);
  const cancels = nextStatus === 'cancelled';
  const action =
    ships && order.paymentStatus === 'authorized'
      ? 'capture'
      : cancels && order.paymentStatus === 'authorized'
        ? 'void'
        : cancels && order.paymentStatus === 'paid'
          ? 'refund'
          : null;
  if (!action) return null;
  if (!isKlarnaConfigured()) throw new PaymentUpdateError('Klarna is not configured, so the payment could not be updated.');

  try {
    if (action === 'capture') {
      await captureOrder(order.klarnaOrderId, toMinorUnits(order.total), `Order ${order.number}`);
      order.paymentStatus = 'paid';
      return 'Payment captured at Klarna';
    }
    if (action === 'void') {
      await cancelOrder(order.klarnaOrderId);
      order.paymentStatus = 'unpaid';
      return 'Payment reservation cancelled at Klarna — the customer was not charged';
    }
    await refundOrder(order.klarnaOrderId, toMinorUnits(order.total), `Order ${order.number} cancelled`);
    order.paymentStatus = 'refunded';
    return 'Payment refunded in full at Klarna';
  } catch (error) {
    console.error(`[klarna] ${action} failed for ${order.number}:`, error.message);
    throw new PaymentUpdateError(`Could not ${action === 'void' ? 'cancel' : action} the payment at Klarna. ${error.message}`);
  }
}
