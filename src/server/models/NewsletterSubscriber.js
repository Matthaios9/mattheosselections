import mongoose from 'mongoose';
import { getModel } from './shared.js';

/** A newsletter sign-up from the storefront. One document per email address. */
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    locale: { type: String, enum: ['en', 'sv', 'el'], default: 'en' },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = getModel('NewsletterSubscriber', newsletterSubscriberSchema);
