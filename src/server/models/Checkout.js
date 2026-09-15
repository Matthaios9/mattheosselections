import mongoose from 'mongoose';
import { getModel } from './shared.js';

/**
 * A cart waiting for payment with Klarna: the priced order, the customer's details and the payment
 * data Klarna checks when the order is placed. The real order is only created once the customer has
 * authorized the payment. Klarna keeps a payment session open for 48 hours, so abandoned checkouts
 * are removed after 7 days.
 */
const checkoutSchema = new mongoose.Schema({
  klarnaSessionId: { type: String, index: true },
  order: { type: mongoose.Schema.Types.Mixed, required: true },
  payment: { type: mongoose.Schema.Types.Mixed, required: true },
  returnUrl: { type: String, required: true },
  // Set while the storefront or Klarna's callback is placing the order, so only one of them does.
  placingAt: { type: Date, default: null },
  // The outcome: the order that was placed, or why it wasn't ('sold-out' | 'declined').
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  redirectUrl: { type: String, default: null },
  failure: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
});

export const Checkout = getModel('Checkout', checkoutSchema);
