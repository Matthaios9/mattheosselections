import mongoose from 'mongoose';
import { getModel } from './shared.js';

/**
 * A cart waiting for payment in Kustom Checkout. The real order is only created once
 * Kustom confirms the purchase. Kustom keeps an unfinished checkout for 48 hours and
 * retries its confirmation for another 48, so abandoned carts are removed after 7 days.
 */
const checkoutSchema = new mongoose.Schema({
  kustomOrderId: { type: String, index: true },
  order: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
});

export const Checkout = getModel('Checkout', checkoutSchema);
