import mongoose from 'mongoose';
import { getModel } from './shared.js';

export const CONTACT_MESSAGE_STATUSES = ['new', 'read'];

/** A message sent with the contact form. 'new' until an admin opens it. */
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    locale: { type: String, enum: ['en', 'sv', 'el'], default: 'en' },
    status: { type: String, enum: CONTACT_MESSAGE_STATUSES, default: 'new', index: true },
  },
  { timestamps: true }
);

export const ContactMessage = getModel('ContactMessage', contactMessageSchema);
