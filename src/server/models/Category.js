import mongoose from 'mongoose';
import { categorySlug } from '../../utils/slug.js';
import { getModel, imageSchema, localizedString } from './shared.js';

const categorySchema = new mongoose.Schema(
  {
    // Category page URL: /{lang}/shop/{slug}, the same in every language. Generated when left empty.
    slug: { type: String, trim: true, unique: true, sparse: true },
    name: { type: localizedString({ required: true }), required: true },
    description: { type: localizedString(), default: () => ({}) },
    image: { type: imageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** A category without a slug gets the one its page already uses (see categorySlug), numbered if taken. */
categorySchema.pre('validate', async function assignSlug() {
  if (this.slug) return;
  const base = categorySlug(this);
  let slug = base;
  for (let n = 2; await this.constructor.exists({ slug, _id: { $ne: this._id } }); n += 1) slug = `${base}-${n}`;
  this.slug = slug;
});

export const Category = getModel('Category', categorySchema);
