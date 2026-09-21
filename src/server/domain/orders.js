import 'server-only';
import { connectToDatabase } from '@/server/db';
import { Order, Product } from '@/server/models';
import { calculateShipping } from '@/utils/shipping';
import { releaseStock, reserveStock } from './inventory';
import { PaymentUpdateError, settleKustomPayment } from './settlement';
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
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    itemCount: (doc.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    subtotal: doc.subtotal,
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

export const stockLine = (item) => ({ product: item.product, variantKey: item.variantKey, quantity: item.quantity });

/**
 * Price a cart for checkout. Prices, names and stock are always re-read from the
 * database — the client only sends ids and quantities. Nothing is saved here: the
 * order is created once the payment succeeds (see payments.js).
 * Returns { ok, lines, subtotal, shippingFee, total } or { ok: false, problems }.
 */
export async function priceCart({ items, country, locale }) {
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

  const lines = [];
  const problems = [];
  for (const item of wanted) {
    const product = byId.get(item.productId);
    const variant = product?.variants.find((entry) => entry.key === item.variantId);
    const available = variant?.stock ?? 0;
    if (!product || !variant || available < item.quantity) {
      problems.push({ productId: item.productId, variantId: item.variantId, available });
      continue;
    }
    lines.push({
      product: product._id,
      slug: product.slug ?? '',
      name: product.name?.[locale] || product.name?.en,
      variantKey: variant.key,
      variantLabel: variant.label?.[locale] || variant.label?.en,
      image: variant.image || product.images?.[0]?.url || '',
      price: variant.price,
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity,
    });
  }
  if (problems.length) return { ok: false, problems };

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFee = calculateShipping(subtotal, country);
  return { ok: true, lines, subtotal, shippingFee, total: subtotal + shippingFee };
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

export async function updateOrderFields(id, fields) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await Order.findByIdAndUpdate(id, fields, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeOrder(doc) : null;
}
