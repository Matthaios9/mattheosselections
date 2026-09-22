import 'server-only';
import mongoose from 'mongoose';
import { Product } from '@/server/models';

/**
 * Stock is held per size (variant). Reservations use a conditional update so two
 * customers can never buy the same last unit: the decrement only applies while
 * `stock >= quantity`. Lines are `{ product, variantKey, quantity, contents? }`.
 *
 * Packs (e.g. a gift box of three honeys) have no stock of their own: each pack size lists
 * its `contents` — sizes of other products — and selling a pack takes those out of stock.
 * The pack's `stock` is how many complete packs the contents make up; syncPackStock keeps
 * it current whenever the stock of a product inside changes.
 */

const uniqueIds = (ids) => [...new Map(ids.map((id) => [String(id), id])).values()];

/** What one line takes from stock: its own size, or for a pack, each product inside it. */
export const stockMoves = (line) =>
  line.contents?.length
    ? line.contents.map((item) => ({ product: item.product, variantKey: item.variantKey, quantity: item.quantity * line.quantity }))
    : [{ product: line.product, variantKey: line.variantKey, quantity: line.quantity }];

async function syncInStock(productIds) {
  if (!productIds.length) return;
  await Product.collection.updateMany({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(String(id))) } }, [
    {
      $set: {
        inStock: { $anyElementTrue: [{ $map: { input: '$variants', as: 'v', in: { $gt: ['$$v.stock', 0] } } }] },
      },
    },
  ]);
}

/** Current stock of every size of these products, as `(productId, variantKey) → units`. */
async function stockLookup(productIds) {
  const products = await Product.find({ _id: { $in: productIds } }, { variants: 1 }).lean();
  const stock = new Map(
    products.flatMap((product) => product.variants.map((variant) => [`${product._id}:${variant.key}`, variant.stock ?? 0]))
  );
  return (productId, variantKey) => stock.get(`${productId}:${variantKey}`) ?? 0;
}

/** How many complete packs the contents make up: the scarcest product decides. */
const packsAvailable = (contents, stockOf) =>
  Math.min(...contents.map((item) => Math.floor(stockOf(item.product, item.variantKey) / item.quantity)));

/** Fill in each pack size's `stock` from the products inside it, before a pack is saved. */
export async function withPackStock(variants) {
  const stockOf = await stockLookup(uniqueIds(variants.flatMap((variant) => variant.contents.map((item) => item.product))));
  return variants.map((variant) =>
    variant.contents.length ? { ...variant, stock: packsAvailable(variant.contents, stockOf) } : variant
  );
}

/** Recompute the stock of every pack that holds one of these products. */
export async function syncPackStock(productIds) {
  if (!productIds.length) return;
  const packs = await Product.find({ isPack: true, 'variants.contents.product': { $in: productIds } }, { variants: 1 }).lean();
  if (!packs.length) return;

  const packSizes = packs.flatMap((pack) =>
    pack.variants.filter((variant) => variant.contents?.length).map((variant) => ({ pack, variant }))
  );
  const stockOf = await stockLookup(uniqueIds(packSizes.flatMap(({ variant }) => variant.contents.map((item) => item.product))));
  const updates = packSizes
    .map(({ pack, variant }) => ({ pack, variant, stock: packsAvailable(variant.contents, stockOf) }))
    .filter(({ variant, stock }) => variant.stock !== stock)
    .map(({ pack, variant, stock }) => ({
      updateOne: {
        filter: { _id: pack._id, 'variants.key': variant.key },
        update: { $set: { 'variants.$.stock': stock } },
        timestamps: false, // derived from the products inside; not an edit of the pack
      },
    }));
  if (!updates.length) return;
  await Product.bulkWrite(updates);
  await syncInStock(uniqueIds(updates.map((update) => update.updateOne.filter._id)));
}

async function returnMoves(moves) {
  for (const move of moves) {
    await Product.updateOne(
      { _id: move.product, 'variants.key': move.variantKey },
      { $inc: { 'variants.$.stock': move.quantity } }
    );
  }
}

/** soldCount powers "Best selling": a pack counts as sold itself, not the products inside it. */
async function countSold(lines, sign) {
  for (const line of lines) {
    await Product.updateOne({ _id: line.product }, { $inc: { soldCount: sign * line.quantity } });
  }
}

async function afterStockChange(moves) {
  const productIds = uniqueIds(moves.map((move) => move.product));
  await syncInStock(productIds);
  await syncPackStock(productIds);
}

export async function releaseStock(lines) {
  const moves = lines.flatMap(stockMoves);
  await returnMoves(moves);
  await countSold(lines, -1);
  await afterStockChange(moves);
}

/**
 * Reserve every line or none. Products that no longer exist are skipped
 * (e.g. reopening an old order). Returns { ok } or { ok: false, failed: line }.
 */
export async function reserveStock(lines) {
  const taken = [];
  try {
    for (const line of lines) {
      for (const move of stockMoves(line)) {
        if (!(await Product.exists({ _id: move.product }))) continue;
        const result = await Product.updateOne(
          { _id: move.product, variants: { $elemMatch: { key: move.variantKey, stock: { $gte: move.quantity } } } },
          { $inc: { 'variants.$.stock': -move.quantity } }
        );
        if (result.modifiedCount !== 1) {
          await returnMoves(taken);
          await afterStockChange(taken);
          return { ok: false, failed: line };
        }
        taken.push(move);
      }
    }
  } catch (error) {
    // A database error part-way: put back what was taken, so that a retry starts from the full stock.
    await returnMoves(taken);
    throw error;
  }
  await countSold(lines, 1);
  await afterStockChange(taken);
  return { ok: true };
}
