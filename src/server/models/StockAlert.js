import mongoose from 'mongoose';
import { getModel } from './shared.js';

export const STOCK_ALERT_STATUSES = ['waiting', 'notified'];

/**
 * "Notify me when available": a customer waiting for one size of a sold-out product.
 * Emailed once when the size is back in stock, then kept as 'notified' for the admin's overview.
 */
const stockAlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantKey: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    locale: { type: String, enum: ['en', 'sv', 'el'], default: 'en' },
    status: { type: String, enum: STOCK_ALERT_STATUSES, default: 'waiting', index: true },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One open request per customer and size; after the email is sent they can sign up again.
stockAlertSchema.index(
  { product: 1, variantKey: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: 'waiting' } }
);

export const StockAlert = getModel('StockAlert', stockAlertSchema);
