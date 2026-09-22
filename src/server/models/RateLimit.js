import mongoose from 'mongoose';
import { getModel } from './shared.js';

/** Requests counted per client and time window (see src/server/http/rate-limit.js); MongoDB deletes expired windows. */
const rateLimitSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "<route>:<ip>:<window number>"
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false }
);

export const RateLimit = getModel('RateLimit', rateLimitSchema);
