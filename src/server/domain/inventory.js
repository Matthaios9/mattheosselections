import 'server-only';
import { Product } from '@/server/models';

/**
 * Stock is held per size (variant). Reservations use a conditional update so two
 * customers can never buy the same last unit: the decrement only applies while
 * `stock >= quantity`. Lines are `{ product, variantKey, quantity }`.
 */

async function syncInStock(productIds) {
  if (!productIds.length) return;
  await Product.collection.updateMany({ _id: { $in: productIds } }, [
    {
      $set: {
        inStock: { $anyElementTrue: [{ $map: { input: '$variants', as: 'v', in: { $gt: ['$$v.stock', 0] } } }] },
      },
    },
  ]);
}

export async function releaseStock(lines) {
  for (const line of lines) {
    await Product.updateOne(
      { _id: line.product, 'variants.key': line.variantKey },
      { $inc: { 'variants.$.stock': line.quantity, soldCount: -line.quantity } }
    );
  }
  await syncInStock([...new Set(lines.map((line) => line.product))]);
}

/**
 * Reserve every line or none. Lines whose product no longer exists are skipped
 * (e.g. reopening an old order). Returns { ok } or { ok: false, failed: line }.
 */
export async function reserveStock(lines) {
  const reserved = [];
  for (const line of lines) {
    if (!(await Product.exists({ _id: line.product }))) continue;
    const result = await Product.updateOne(
      { _id: line.product, variants: { $elemMatch: { key: line.variantKey, stock: { $gte: line.quantity } } } },
      { $inc: { 'variants.$.stock': -line.quantity, soldCount: line.quantity } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(reserved);
      return { ok: false, failed: line };
    }
    reserved.push(line);
  }
  await syncInStock([...new Set(reserved.map((line) => line.product))]);
  return { ok: true };
}
