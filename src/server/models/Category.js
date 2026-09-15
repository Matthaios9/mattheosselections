import mongoose from 'mongoose';
import { getModel, imageSchema, localizedString } from './shared.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: localizedString({ required: true }), required: true },
    description: { type: localizedString(), default: () => ({}) },
    image: { type: imageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = getModel('Category', categorySchema);
