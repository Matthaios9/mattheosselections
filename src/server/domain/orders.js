import 'server-only';
import { connectToDatabase } from '@/server/db';
import { Order, Product } from '@/server/models';
import { calculateShipping } from '@/utils/shipping';
import { vatRateFor } from '@/utils/vat';
import { releaseStock, reserveStock, stockMoves } from './inventory';
import { PaymentUpdateError, settleKustomPayment } from './settlement';
import { discountOn, toOre } from './welcome-offer';
import { escapeRegex, isObjectId, pageParams, pageResult, toId, toIso } from '@/server/utils';

export function serializeOrder(doc) {
  return {
    id: toId(doc._id),
    number: doc.number,
    user: toId(doc.user?._id ?? doc.user),
    customer: {
      name: doc.customer?.name ?? '',
      company: doc.customer?.company ?? '',
      organizationNumber: doc.customer?.organizationNumber ?? '',
      email: doc.customer?.email ?? '',
      phone: doc.customer?.phone ?? '',
    },
    shippingAddress: {
      line1: doc.shippingAddress?.line1 ?? '',
      line2: doc.shippingAddress?.line2 ?? '',
      postalCode: doc.shippingAddress?.postalCode ?? '',
      city: doc.shippingAddress?.city ?? '',
      country: doc.shippingAddress?.country ?? '',
    },
    items: (doc.items ?? []).map((item) => ({
      product: toId(item.product),
      name: item.name,
      variantKey: item.variantKey,
      variantLabel: item.variantLabel,
      image: item.image,
      price: item.price,
      vatRate: item.vatRate ?? null,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      discount: item.discount ?? 0,
      contents: (item.contents ?? []).map((entry) => ({
        product: toId(entry.product),
        name: entry.name,
        variantKey: entry.variantKey,
        variantLabel: entry.variantLabel,
        quantity: entry.quantity,
      })),
    })),
    itemCount: (doc.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    subtotal: doc.subtotal,
    discount: doc.discount ?? 0,
    shippingFee: doc.shippingFee,
    total: doc.total,
    currency: doc.currency,
    vatRate: doc.vatRate ?? null,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    kustomOrderId: doc.kustomOrderId ?? '',
    locale: doc.locale,
    customerNote: doc.customerNote ?? '',
    adminNote: doc.adminNote ?? '',
    history: (doc.history ?? []).map((entry) => ({
      status: entry.status,
      note: entry.note,
      by: entry.by,
      at: toIso(entry.at),
    })),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export const stockLine = (item) => ({
  product: item.product,
  variantKey: item.variantKey,
  quantity: item.quantity,
  contents: (item.contents ?? []).map(({ product, variantKey, quantity }) => ({ product, variantKey, quantity })),
});

/**
 * Price a cart for checkout. Prices, names and stock are always re-read from the
 * database — the client only sends ids and quantities. Nothing is saved here: the
 * order is created once the payment succeeds (see payments.js).
 * A pack line carries its `contents` (with names), so the order records what went into it.
 * Returns { ok, lines, subtotal, shippingFee, total } or { ok: false, problems }.
 */
export async function priceCart({ items, country, locale, discountRate = 0 }) {
  await connectToDatabase();

  // Merge duplicate lines for the same product + size.
  const merged = new Map();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId}`;
    merged.set(key, { ...item, quantity: (merged.get(key)?.quantity ?? 0) + item.quantity });
  }
  const wanted = [...merged.values()];

  const ids = [...new Set(wanted.map((item) => item.productId))].filter(isObjectId);
  const products = await Product.find({ _id: { $in: ids }, status: 'active' }).lean();
  const byId = new Map(products.map((product) => [toId(product._id), product]));
  // The products inside packs (in any status: some are only sold in packs).
  const packedIds = products.flatMap((product) =>
    product.variants.flatMap((variant) => (variant.contents ?? []).map((item) => item.product))
  );
  const packed = packedIds.length ? await Product.find({ _id: { $in: packedIds } }, { name: 1, variants: 1 }).lean() : [];
  const sizes = new Map(
    [...products, ...packed].flatMap((product) =>
      product.variants.map((variant) => [`${product._id}:${variant.key}`, { product, variant }])
    )
  );
  const localized = (value) => value?.[locale] || value?.en;

  const lines = [];
  const problems = [];
  for (const item of wanted) {
    const product = byId.get(item.productId);
    const variant = product?.variants.find((entry) => entry.key === item.variantId);
    const contents = variant?.contents ?? [];
    const inside = contents.map((entry) => sizes.get(`${entry.product}:${entry.variantKey}`));
    if (!product || !variant || inside.some((entry) => !entry)) {
      problems.push({ productId: item.productId, variantId: item.variantId, available: 0 });
      continue;
    }
    lines.push({
      product: product._id,
      slug: product.slug ?? '',
      name: localized(product.name),
      variantKey: variant.key,
      variantLabel: localized(variant.label),
      image: variant.image || product.images?.[0]?.url || '',
      price: variant.price,
      vatRate: vatRateFor(product.standardVat),
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity,
      ...(contents.length && {
        contents: contents.map((entry, index) => ({
          product: entry.product,
          name: localized(inside[index].product.name),
          variantKey: entry.variantKey,
          variantLabel: localized(inside[index].variant.label),
          quantity: entry.quantity,
        })),
      }),
    });
  }

  // Check stock for the cart as a whole: a pack needs the products inside it, which may also be in the cart on their own.
  const needed = new Map();
  for (const move of lines.flatMap(stockMoves)) {
    const key = `${move.product}:${move.variantKey}`;
    needed.set(key, (needed.get(key) ?? 0) + move.quantity);
  }
  const short = new Set(
    [...needed].filter(([key, quantity]) => (sizes.get(key)?.variant.stock ?? 0) < quantity).map(([key]) => key)
  );
  for (const line of lines) {
    if (stockMoves(line).some((move) => short.has(`${move.product}:${move.variantKey}`))) {
      const available = sizes.get(`${line.product}:${line.variantKey}`).variant.stock ?? 0;
      problems.push({ productId: toId(line.product), variantId: line.variantKey, available });
    }
  }
  if (problems.length) return { ok: false, problems };

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  // Shipping is worked out on the full subtotal on purpose: a discount must never push an order
  // back below the free-shipping threshold and hand the customer a fee they didn't have before.
  const shippingFee = calculateShipping(subtotal, country);
  // A discount comes off each line rather than off the sum, so every line keeps its own VAT rate and
  // the order lines sent to Kustom add up to exactly the total below, to the öre.
  for (const line of lines) line.discount = discountOn(line.lineTotal, discountRate);
  const discount = toOre(lines.reduce((sum, line) => sum + line.discount, 0));
  return { ok: true, lines, subtotal, discount, shippingFee, total: subtotal - discount + shippingFee };
}

export async function listOrders({ q = '', status = '', page, pageSize = 20 } = {}) {
  await connectToDatabase();
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ number: pattern }, { 'customer.name': pattern }, { 'customer.email': pattern }];
  }
  const paging = pageParams({ page, pageSize });
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.pageSize).lean(),
    Order.countDocuments(filter),
  ]);
  return pageResult(docs.map(serializeOrder), total, paging);
}

export async function getOrderStatusCounts() {
  await connectToDatabase();
  const rows = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  counts.all = rows.reduce((sum, row) => sum + row.count, 0);
  return counts;
}

export async function getOrder(id) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Order.findById(id).lean();
  return doc ? serializeOrder(doc) : null;
}

export async function listOrdersForUser(userId, limit = 50) {
  if (!isObjectId(userId)) return [];
  await connectToDatabase();
  const docs = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map(serializeOrder);
}

/**
 * Change an order's status. Cancelling returns its items to stock; reopening a
 * cancelled order reserves the stock again (fails if it is no longer available).
 * Kustom payments follow along: shipping captures the payment, cancelling voids or refunds it.
 * `changed` is false when the order already had this status — the caller then skips the customer email.
 * Returns { ok, changed, order } or { ok: false, reason: 'not-found' | 'insufficient-stock' | 'payment', item?, message? }.
 */
export async function updateOrderStatus(id, { status, note }, admin) {
  if (!isObjectId(id)) return { ok: false, reason: 'not-found' };
  await connectToDatabase();
  const order = await Order.findById(id);
  if (!order) return { ok: false, reason: 'not-found' };

  const previousStatus = order.status;
  const lines = order.items.filter((item) => item.product).map(stockLine);
  const cancelling = status === 'cancelled' && order.status !== 'cancelled';
  const reopening = order.status === 'cancelled' && status !== 'cancelled';

  let paymentNote = null;
  try {
    paymentNote = await settleKustomPayment(order, status);
  } catch (error) {
    if (error instanceof PaymentUpdateError) return { ok: false, reason: 'payment', message: error.message };
    throw error;
  }

  if (cancelling && order.stockReserved) {
    await releaseStock(lines);
    order.stockReserved = false;
  }
  if (reopening && !order.stockReserved) {
    const reservation = await reserveStock(lines);
    if (!reservation.ok) {
      const item = order.items.find((entry) => String(entry.product) === String(reservation.failed.product));
      return { ok: false, reason: 'insufficient-stock', item: item ? `${item.name} (${item.variantLabel})` : '' };
    }
    order.stockReserved = true;
  }

  order.status = status;
  order.history.push({ status, note: [note, paymentNote].filter(Boolean).join(' · '), by: admin.email, at: new Date() });
  await order.save();
  return { ok: true, changed: previousStatus !== status, order: serializeOrder(order.toObject()) };
}

/**
 * Set the payment status by hand — for orders paid outside Kustom. A Kustom payment follows the order
 * status instead (see settlement.js), so changing it here would put it out of step with Kustom.
 * Returns { ok, order } or { ok: false, reason: 'not-found' | 'kustom' }.
 */
export async function updatePaymentStatus(id, paymentStatus) {
  if (!isObjectId(id)) return { ok: false, reason: 'not-found' };
  await connectToDatabase();
  const order = await Order.findById(id);
  if (!order) return { ok: false, reason: 'not-found' };
  if (order.paymentMethod === 'kustom') return { ok: false, reason: 'kustom' };
  order.paymentStatus = paymentStatus;
  await order.save();
  return { ok: true, order: serializeOrder(order.toObject()) };
}

export async function updateOrderFields(id, fields) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Order.findByIdAndUpdate(id, fields, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeOrder(doc) : null;
}
