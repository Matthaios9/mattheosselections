import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { destroyImages } from '@/server/cloudinary';
import { Product, StockAlert } from '@/server/models';
import { escapeRegex, isObjectId, pageParams, pageResult, plainLocalized, toId, toIso } from '@/server/utils';

/** Admin product management (all languages, drafts included). The storefront reads through storefront.js. */

const totalStock = (variants = []) => variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);

export function serializeProduct(doc) {
  const variants = (doc.variants ?? []).map((variant) => ({
    key: variant.key,
    label: plainLocalized(variant.label),
    price: variant.price,
    stock: variant.stock ?? 0,
    image: variant.image ?? '',
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

export async function createProduct(input) {
  await connectToDatabase();
  const doc = await Product.create(input);
  return serializeProduct(doc.toObject());
}

export async function updateProduct(id, input) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Product.findById(id);
  if (!doc) return null;
  const previousIds = doc.images.map((image) => image.publicId).filter(Boolean);
  doc.set(input);
  await doc.save();
  // Clean up Cloudinary assets that were removed from the product.
  const keptIds = new Set(input.images.map((image) => image.publicId).filter(Boolean));
  await destroyImages(previousIds.filter((publicId) => !keptIds.has(publicId)));
  return serializeProduct(doc.toObject());
}

export async function deleteProduct(id) {
  if (!isObjectId(id)) return false;
  await connectToDatabase();
  const doc = await Product.findByIdAndDelete(id).lean();
  if (!doc) return false;
  await StockAlert.deleteMany({ product: id });
  await destroyImages((doc.images ?? []).map((image) => image.publicId));
  return true;
}

export async function setProductFlags(id, flags) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Product.findByIdAndUpdate(id, flags, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeProduct(doc) : null;
}
