import mongoose from 'mongoose';
import { slugify } from '../../utils/slug.js';
import { getModel, imageSchema, localizedString } from './shared.js';

export const PRODUCT_BADGES = ['', 'bestseller', 'limited', 'new', 'signature', 'gift'];
export const PRODUCT_STATUSES = ['active', 'draft'];

const variantSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // stable id used by carts, e.g. "450g"
    label: { type: localizedString({ required: true }), required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 }, // units available for this size
    image: { type: String, default: '' }, // optional override (one of the product images)
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true, default: '' },
    // Product page URL: /{lang}/product/{slug}, the same in every language. Generated when left empty.
    slug: { type: String, trim: true, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    name: { type: localizedString({ required: true }), required: true },
    description: { type: localizedString(), default: () => ({}) },
    images: { type: [imageSchema], default: [] },
    variants: {
      type: [variantSchema],
      validate: [(value) => value.length > 0, 'A product needs at least one size.'],
    },
    defaultVariant: { type: String, default: '' },
    price: { type: Number, default: 0, index: true }, // lowest size price, kept in sync below
    inStock: { type: Boolean, default: false, index: true }, // true when any size has stock, kept in sync
    badge: { type: String, enum: PRODUCT_BADGES, default: '' },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active', index: true },
    soldCount: { type: Number, default: 0 }, // units sold, powers the "Best selling" sort
  },
  { timestamps: true }
);

productSchema.pre('validate', function syncDerivedFields() {
  if (this.variants?.length) {
    this.price = Math.min(...this.variants.map((variant) => variant.price));
    this.inStock = this.variants.some((variant) => variant.stock > 0);
    if (!this.variants.some((variant) => variant.key === this.defaultVariant)) {
      this.defaultVariant = this.variants[0].key;
    }
  }
});

/** A product without a slug gets one from its Swedish (else English) name, numbered if already taken. */
productSchema.pre('validate', async function assignSlug() {
  if (this.slug) return;
  const base = slugify(this.name?.sv) || slugify(this.name?.en) || String(this._id);
  let slug = base;
  for (let n = 2; await this.constructor.exists({ slug, _id: { $ne: this._id } }); n += 1) slug = `${base}-${n}`;
  this.slug = slug;
});

export const Product = getModel('Product', productSchema);
