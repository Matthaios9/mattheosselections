import mongoose from 'mongoose';
import { getModel } from './shared.js';

/**
 * One outstanding "forgot password" link. The token itself is only ever in the email —
 * the database keeps its SHA-256, so a leaked dump can't be used to reset anyone's password.
 * MongoDB deletes expired links on its own (see `expires`).
 */
const passwordResetSchema = new mongoose.Schema(
  {
    _id: { type: String }, // sha256 of the token in the link
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
);

export const PasswordReset = getModel('PasswordReset', passwordResetSchema);
