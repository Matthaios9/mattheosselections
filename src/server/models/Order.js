import mongoose from 'mongoose';
import { getModel } from './shared.js';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
// 'authorized': reserved by Kustom at checkout, captured (→ 'paid') when the order ships.
export const PAYMENT_STATUSES = ['unpaid', 'authorized', 'paid', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    variantKey: { type: String, default: '' },
    variantLabel: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    by: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      phone: { type: String, trim: true, default: '' },
    },
    shippingAddress: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true, default: '' },
      postalCode: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SEK' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    // 'kustom' for Kustom Checkout; older orders: 'invoice' (manual) or 'card' (previous Stripe integration)
    paymentMethod: { type: String, default: 'invoice' },
    kustomOrderId: { type: String, unique: true, sparse: true },
    locale: { type: String, default: 'en' },
    customerNote: { type: String, default: '' },
    adminNote: { type: String, default: '' },
    // true while this order's items are deducted from product stock (orders placed before stock tracking stay false)
    stockReserved: { type: Boolean, default: false },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order = getModel('Order', orderSchema);

/** Sequential, human-friendly order numbers (MS-100001, MS-100002, …). */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = getModel('Counter', counterSchema);

const ORDER_NUMBER_OFFSET = 100000;

export async function nextOrderNumber() {
  const counter = await Counter.findOneAndUpdate({ _id: 'orders' }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
  return `MS-${ORDER_NUMBER_OFFSET + counter.seq}`;
}
