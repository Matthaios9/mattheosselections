import mongoose from 'mongoose';
import { getModel } from './shared.js';

export const USER_ROLES = ['customer', 'admin'];
export const USER_STATUSES = ['active', 'disabled'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer', index: true },
    status: { type: String, enum: USER_STATUSES, default: 'active' },
    phone: { type: String, trim: true, default: '' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = getModel('User', userSchema);
