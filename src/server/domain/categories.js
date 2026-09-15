import 'server-only';
import { connectToDatabase } from '@/server/db';
import { destroyImages } from '@/server/cloudinary';
import { Category, Product } from '@/server/models';
import { isObjectId, plainLocalized, toId, toIso } from '@/server/utils';

/** Admin category management. The storefront reads categories through storefront.js. */

export function serializeCategory(doc, productCount = 0) {
  return {
    id: toId(doc._id),
    name: plainLocalized(doc.name),
    description: plainLocalized(doc.description),
    image: doc.image?.url ? { url: doc.image.url, publicId: doc.image.publicId ?? '', alt: doc.image.alt ?? '' } : null,
    sortOrder: doc.sortOrder ?? 0,
    active: doc.active !== false,
    productCount,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export async function listCategories() {
  await connectToDatabase();
  const [docs, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((row) => [toId(row._id), row.count]));
  return docs.map((doc) => serializeCategory(doc, countById.get(toId(doc._id)) ?? 0));
}

export async function createCategory(input) {
  await connectToDatabase();
  const doc = await Category.create(input);
  return serializeCategory(doc.toObject());
}

export async function updateCategory(id, input) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const existing = await Category.findById(id).lean();
  if (!existing) return null;
  const doc = await Category.findByIdAndUpdate(id, input, { returnDocument: 'after', runValidators: true }).lean();
  if (existing.image?.publicId && existing.image.publicId !== input.image?.publicId) {
    await destroyImages([existing.image.publicId]);
  }
  return serializeCategory(doc);
}

/** Delete a category; its products stay in the shop as uncategorised. Returns the number moved. */
export async function deleteCategory(id) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Category.findByIdAndDelete(id).lean();
  if (!doc) return null;
  const { modifiedCount } = await Product.updateMany({ category: id }, { $set: { category: null } });
  if (doc.image?.publicId) await destroyImages([doc.image.publicId]);
  return { uncategorised: modifiedCount };
}
