import 'server-only';
import { cancelOrder, captureOrder, getOrder, isKustomConfigured, refundOrder } from '@/server/kustom';

const toMinorUnits = (amount) => Math.round(amount * 100); // kr → öre

/** The payment status Kustom actually has — it changes when someone captures, cancels or refunds in the Kustom Portal. */
async function kustomPaymentStatus(kustomOrderId) {
  const { status, captured_amount: captured = 0, refunded_amount: refunded = 0 } = await getOrder(kustomOrderId);
  if (captured > 0) return refunded >= captured ? 'refunded' : 'paid';
  if (['CANCELLED', 'EXPIRED', 'CLOSED'].includes(status)) return 'unpaid';
  return 'authorized';
}

const pickAction = (paymentStatus, ships, cancels) =>
  ships && paymentStatus === 'authorized'
    ? 'capture'
    : cancels && paymentStatus === 'authorized'
      ? 'void'
      : cancels && paymentStatus === 'paid'
        ? 'refund'
        : null;

/** Raised when Kustom refuses a payment change; the order status is then left as it was. */
export class PaymentUpdateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentUpdateError';
  }
}

/**
 * Keep a Kustom payment in step with the order's fulfilment status. Kustom only
 * reserves the money at checkout ('authorized'):
 *   shipped / delivered → capture (the customer is charged) → 'paid'
 *   cancelled           → void the reservation → 'unpaid', or refund a capture → 'refunded'
 * Mutates `order.paymentStatus` and returns a note for the timeline (or null).
 * Throws PaymentUpdateError if Kustom refuses, so the status change isn't saved.
 */
export async function settleKustomPayment(order, nextStatus) {
  if (order.paymentMethod !== 'kustom' || !order.kustomOrderId) return null;

  const ships = ['shipped', 'delivered'].includes(nextStatus);
  const cancels = nextStatus === 'cancelled';

  // Catch up with changes made in the Kustom Portal first, so we never capture, cancel or refund twice.
  let syncNote = null;
  if (pickAction(order.paymentStatus, ships, cancels)) {
    if (!isKustomConfigured()) throw new PaymentUpdateError('Kustom is not configured, so the payment could not be updated.');
    let actual;
    try {
      actual = await kustomPaymentStatus(order.kustomOrderId);
    } catch (error) {
      console.error(`[kustom] status check failed for ${order.number}:`, error.message);
      throw new PaymentUpdateError(`Could not check the payment at Kustom. ${error.message}`);
    }
    if (actual !== order.paymentStatus) {
      syncNote = `Payment was already ${actual} at Kustom`;
      order.paymentStatus = actual;
    }
  }

  // A reservation that was released (or a payment refunded) can't be captured any more: shipping or
  // reopening such an order would send goods nobody pays for.
  if (!cancels && !['authorized', 'paid'].includes(order.paymentStatus) && (ships || order.status === 'cancelled')) {
    throw new PaymentUpdateError(
      `This order's Kustom payment is ${order.paymentStatus}, so the customer can't be charged for it. Ask them to place a new order.`
    );
  }
  const action = pickAction(order.paymentStatus, ships, cancels);
  if (!action) return syncNote;

  try {
    if (action === 'capture') {
      await captureOrder(order.kustomOrderId, toMinorUnits(order.total), `Order ${order.number}`);
      order.paymentStatus = 'paid';
      return 'Payment captured at Kustom';
    }
    if (action === 'void') {
      await cancelOrder(order.kustomOrderId);
      order.paymentStatus = 'unpaid';
      return 'Payment reservation cancelled at Kustom — the customer was not charged';
    }
    await refundOrder(order.kustomOrderId, toMinorUnits(order.total), `Order ${order.number} cancelled`);
    order.paymentStatus = 'refunded';
    return [syncNote, 'Payment refunded in full at Kustom'].filter(Boolean).join(' · ');
  } catch (error) {
    console.error(`[kustom] ${action} failed for ${order.number}:`, error.message);
    throw new PaymentUpdateError(`Could not ${action === 'void' ? 'cancel' : action} the payment at Kustom. ${error.message}`);
  }
}
