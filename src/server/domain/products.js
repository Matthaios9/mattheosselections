import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { destroyImages } from '@/server/cloudinary';
import { Product, StockAlert } from '@/server/models';
import { escapeRegex, isObjectId, pageParams, pageResult, plainLocalized, toId, toIso } from '@/server/utils';
import { syncPackStock, withPackStock } from './inventory';

/** Admin product management (all languages, drafts included). The storefront reads through storefront.js. */

const totalStock = (variants = []) => variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);

export function serializeProduct(doc) {
  const variants = (doc.variants ?? []).map((variant) => ({
    key: variant.key,
    label: plainLocalized(variant.label),
    price: variant.price,
    stock: variant.stock ?? 0,
    image: variant.image ?? '',
    contents: (variant.contents ?? []).map((item) => ({
      product: toId(item.product),
      variantKey: item.variantKey,
      quantity: item.quantity,
    })),
  }));
  return {
    id: toId(doc._id),
    sku: doc.sku ?? '',
    slug: doc.slug ?? '',
    category: toId(doc.category?._id ?? doc.category),
    categoryName: doc.category?.name?.en ?? '',
    name: plainLocalized(doc.name),
    description: plainLocalized(doc.description),
    images: (doc.images ?? []).map((image) => ({ url: image.url, publicId: image.publicId ?? '', alt: image.alt ?? '' })),
    variants,
    defaultVariant: doc.defaultVariant ?? '',
    isPack: Boolean(doc.isPack),
    price: doc.price ?? 0,
    totalStock: totalStock(variants),
    inStock: variants.some((variant) => variant.stock > 0),
    badge: doc.badge ?? '',
    featured: Boolean(doc.featured),
    status: doc.status ?? 'active',
    soldCount: doc.soldCount ?? 0,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export async function listProducts({ q = '', category = '', status = '', stock = '', page, pageSize = 15 } = {}) {
  await connectToDatabase();
  const filter = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ 'name.en': pattern }, { 'name.sv': pattern }, { 'name.el': pattern }, { sku: pattern }];
  }
  if (category === 'none') filter.category = null;
  else if (isObjectId(category)) filter.category = category;
  if (['active', 'draft'].includes(status)) filter.status = status;
  if (stock === 'out') filter.inStock = false;
  if (stock === 'in') filter.inStock = true;
  if (stock === 'low') {
    filter.$expr = {
      $and: [
        { $gt: [{ $sum: '$variants.stock' }, 0] },
        { $lte: [{ $sum: '$variants.stock' }, storeConfig.lowStockThreshold] },
      ],
    };
  }

  const paging = pageParams({ page, pageSize });
  const [docs, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ updatedAt: -1 }).skip(paging.skip).limit(paging.pageSize).lean(),
    Product.countDocuments(filter),
  ]);
  return pageResult(docs.map(serializeProduct), total, paging);
}

export async function getProduct(id) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Product.findById(id).populate('category', 'name').lean();
  return doc ? serializeProduct(doc) : null;
}

/** Products that can go into a pack — every product that isn't a pack, drafts included — with each size's stock. */
export async function listPackChoices() {
  await connectToDatabase();
  const docs = await Product.find({ isPack: { $ne: true } }, { name: 1, status: 1, variants: 1, defaultVariant: 1 })
    .sort({ 'name.en': 1 })
    .lean();
  return docs.map((doc) => ({
    id: toId(doc._id),
    name: doc.name?.en ?? '',
    status: doc.status ?? 'active',
    defaultVariant: doc.defaultVariant ?? '',
    variants: (doc.variants ?? []).map((variant) => ({
      key: variant.key,
      label: variant.label?.en || variant.key,
      stock: variant.stock ?? 0,
    })),
  }));
}

const packsHolding = (id) => Product.find({ isPack: true, 'variants.contents.product': id }, { name: 1, variants: 1 }).lean();

/** “the pack “Honey trio”” / “the packs “Honey trio”, “Gift box”” */
const packNames = (packs) =>
  `the pack${packs.length === 1 ? '' : 's'} ${packs.map((pack) => `“${pack.name?.en}”`).join(', ')}`;

/**
 * Pack rules the form schema can't check on its own. What goes into a pack must be an existing
 * size of another product that isn't a pack itself; a product inside a pack can't become a pack
 * or drop a size the pack uses. `id` is the product being edited (none when creating).
 * Returns field errors (`{ 'variants.0.contents.1.product': '…' }`) or null.
 */
export async function checkPackRules(input, id = null) {
  await connectToDatabase();
  const errors = {};
  const holding = isObjectId(id) ? await packsHolding(id) : [];

  if (input.isPack) {
    if (holding.length) errors.isPack = `This product is in ${packNames(holding)}, and a pack can't hold another pack.`;
    const ids = input.variants.flatMap((variant) => variant.contents.map((item) => item.product));
    const found = await Product.find({ _id: { $in: ids } }, { isPack: 1, variants: 1 }).lean();
    const byId = new Map(found.map((product) => [toId(product._id), product]));
    input.variants.forEach((variant, index) =>
      variant.contents.forEach((item, position) => {
        const path = `variants.${index}.contents.${position}`;
        const product = byId.get(item.product);
        if (!product) errors[`${path}.product`] = 'This product no longer exists';
        else if (item.product === id) errors[`${path}.product`] = "A pack can't contain itself";
        else if (product.isPack) errors[`${path}.product`] = "A pack can't contain another pack";
        else if (!product.variants.some((size) => size.key === item.variantKey)) errors[`${path}.variantKey`] = 'Choose a size';
      })
    );
  } else if (holding.length) {
    const keys = new Set(input.variants.map((variant) => variant.key));
    const current = await Product.findById(id, { variants: 1 }).lean();
    const removed = (current?.variants ?? []).filter((variant) => !keys.has(variant.key));
    for (const variant of removed) {
      const packs = holding.filter((pack) =>
        pack.variants.some((size) => size.contents?.some((item) => toId(item.product) === id && item.variantKey === variant.key))
      );
      if (packs.length) {
        const size = variant.label?.en || variant.key;
        errors.variants = `“${size}” is in ${packNames(packs)}. Take it out of the pack before removing this size.`;
        break;
      }
    }
  }
  return Object.keys(errors).length ? errors : null;
}

/** A pack's stock is worked out from the products inside it, whatever the form sent. */
const withDerivedStock = async (input) => (input.isPack ? { ...input, variants: await withPackStock(input.variants) } : input);

export async function createProduct(input) {
  await connectToDatabase();
  const doc = await Product.create(await withDerivedStock(input));
  return serializeProduct(doc.toObject());
}

export async function updateProduct(id, input) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Product.findById(id);
  if (!doc) return null;
  const previousIds = doc.images.map((image) => image.publicId).filter(Boolean);
  doc.set(await withDerivedStock(input));
  await doc.save();
  // Packs holding this product follow its stock.
  if (!doc.isPack) await syncPackStock([doc._id]);
  // Clean up Cloudinary assets that were removed from the product.
  const keptIds = new Set(input.images.map((image) => image.publicId).filter(Boolean));
  await destroyImages(previousIds.filter((publicId) => !keptIds.has(publicId)));
  return serializeProduct(doc.toObject());
}

/**
 * A product inside a pack can't be deleted (the pack would be left incomplete).
 * Returns { ok } or { ok: false, reason: 'not-found' | 'in-pack', message? }.
 */
export async function deleteProduct(id) {
  if (!isObjectId(id)) return { ok: false, reason: 'not-found' };
  await connectToDatabase();
  const holding = await packsHolding(id);
  if (holding.length) {
    return { ok: false, reason: 'in-pack', message: `This product is in ${packNames(holding)}. Take it out of the pack first.` };
  }
  const doc = await Product.findByIdAndDelete(id).lean();
  if (!doc) return { ok: false, reason: 'not-found' };
  await StockAlert.deleteMany({ product: id });
  await destroyImages((doc.images ?? []).map((image) => image.publicId));
  return { ok: true };
}

export async function setProductFlags(id, flags) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Product.findByIdAndUpdate(id, flags, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeProduct(doc) : null;
}
