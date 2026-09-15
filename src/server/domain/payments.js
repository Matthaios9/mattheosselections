import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { cancelAuthorization, cancelOrder, createOrder, createSession, getOrder } from '@/server/klarna';
import { Checkout, nextOrderNumber, Order } from '@/server/models';
import { releaseStock, reserveStock } from './inventory';
import { priceCart, serializeOrder, stockLine } from './orders';

/**
 * Payments with Klarna Payments (Klarna's widget, embedded in the checkout modal) — the same
 * integration as the WooCommerce shop: Klarna's payment options (Pay now, Pay later, Pay over time)
 * after a regular checkout form.
 *
 * 1. startCheckout — prices the cart and stores it with the customer's details from the checkout form
 *                    as a pending Checkout, then opens a Klarna payment session. The storefront loads
 *                    Klarna's widget with the session's client token. Stock isn't touched.
 * 2. The customer approves the payment in the widget (`authorize()`); Klarna hands the authorization
 *    token to the storefront and to the authorization callback (/api/klarna/authorization).
 * 3. placeOrder    — takes the items out of stock, places the order at Klarna with that token and
 *                    saves it. Both the storefront and the callback call it; only one does the work.
 * The money is only reserved ('authorized') until the order ships — see settlement.js.
 */

const toMinorUnits = (amount) => Math.round(amount * 100); // kr → öre
const taxRate = () => Math.round(storeConfig.vatRate * 100); // 6% → 600

/** Klarna's locale: the shopper's language where Klarna offers it in that country, otherwise English. */
function klarnaLocale(locale, country) {
  const offered = { sv: ['SE', 'FI'], el: ['GR'] }[locale]?.includes(country);
  return `${offered ? locale : 'en'}-${country}`;
}

/** One Klarna order line; prices include VAT, amounts in öre. */
function orderLine({ type, reference, name, quantity, unitPrice, imageUrl, productUrl }) {
  const unit = toMinorUnits(unitPrice);
  const total = unit * quantity;
  const rate = taxRate();
  return {
    type,
    reference: reference.slice(0, 255),
    name: name.slice(0, 255),
    quantity,
    quantity_unit: 'pcs',
    unit_price: unit,
    tax_rate: rate,
    total_amount: total,
    total_discount_amount: 0,
    total_tax_amount: Math.round(total - (total * 10000) / (10000 + rate)),
    ...(imageUrl?.startsWith('https://') && { image_url: imageUrl }),
    ...(productUrl && { product_url: productUrl }),
  };
}

/** The customer's address as Klarna expects it — used as both billing and shipping address. */
function klarnaAddress(customer, country) {
  return {
    given_name: customer.firstName,
    family_name: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    street_address: customer.street,
    ...(customer.street2 && { street_address2: customer.street2 }),
    postal_code: customer.postalCode,
    city: customer.city,
    country,
  };
}

/**
 * → `{ ok, sessionId, clientToken, categories, address }` or `{ ok: false, problems }`. The storefront
 * must authorize with exactly this `address`: Klarna checks it again when the order is placed.
 */
export async function startCheckout({ items, country, note, locale, returnPath, customer }, user, { origin }) {
  await connectToDatabase();
  const priced = await priceCart({ items, country, locale });
  if (!priced.ok) return priced;

  const lines = [
    ...priced.lines.map((line) =>
      orderLine({
        type: 'physical',
        reference: `${line.product}:${line.variantKey}`,
        name: line.variantLabel ? `${line.name} (${line.variantLabel})` : line.name,
        quantity: line.quantity,
        unitPrice: line.price,
        imageUrl: line.image,
        productUrl: `${origin}/${locale}/shop?q=${encodeURIComponent(line.name)}`,
      })
    ),
    ...(priced.shippingFee > 0
      ? [orderLine({ type: 'shipping_fee', reference: 'shipping', name: 'Shipping', quantity: 1, unitPrice: priced.shippingFee })]
      : []),
  ];
  // Klarna offers its payment options by the customer's country (their billing address).
  const purchase = {
    purchase_country: country,
    purchase_currency: storeConfig.currency,
    locale: klarnaLocale(locale, country),
    order_amount: lines.reduce((sum, line) => sum + line.total_amount, 0),
    order_tax_amount: lines.reduce((sum, line) => sum + line.total_tax_amount, 0),
    order_lines: lines,
  };
  const address = klarnaAddress(customer, country);
  // Klarna only calls HTTPS callback URLs (so not on localhost).
  const https = origin.startsWith('https://');

  const checkout = await Checkout.create({
    order: {
      user: user?.id ?? null,
      customer: { name: `${customer.firstName} ${customer.lastName}`, email: customer.email, phone: customer.phone },
      shippingAddress: {
        line1: customer.street,
        line2: customer.street2,
        postalCode: customer.postalCode,
        city: customer.city,
        country,
      },
      items: priced.lines,
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      total: priced.total,
      locale,
      customerNote: note,
    },
    payment: {
      ...purchase,
      billing_address: address,
      shipping_address: address,
      ...(https && { merchant_urls: { notification: `${origin}/api/klarna/notification` } }),
    },
    returnUrl: `${origin}${returnPath}`,
  });

  try {
    const session = await createSession({
      acquiring_channel: 'ECOMMERCE',
      intent: 'buy',
      ...purchase,
      merchant_reference2: String(checkout._id),
      ...(https && { merchant_urls: { authorization: `${origin}/api/klarna/authorization` } }),
    });
    await Checkout.updateOne({ _id: checkout._id }, { $set: { klarnaSessionId: session.session_id } });
    return {
      ok: true,
      sessionId: session.session_id,
      clientToken: session.client_token,
      categories: (session.payment_method_categories ?? []).map(({ identifier, name }) => ({ id: identifier, name })),
      address,
    };
  } catch (error) {
    await Checkout.deleteOne({ _id: checkout._id });
    throw error;
  }
}

const PLACED_NOTE = 'Order placed · paid with Klarna';
const REVIEW_NOTE = 'Klarna is still reviewing this payment — wait until it is accepted before shipping';
const ACCEPTED_NOTE = 'Klarna accepted the payment — the order can be shipped';
// An attempt that never finished (e.g. the server restarted mid-way) may be retried after this.
const PLACING_TIMEOUT = 2 * 60 * 1000;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Place the order for a claimed checkout; records the outcome on it. */
async function placeClaimedOrder(checkout, authorizationToken) {
  const finish = (fields = {}) => Checkout.updateOne({ _id: checkout._id }, { $set: { placingAt: null, ...fields } });
  const lines = checkout.order.items.map(stockLine);

  if (!(await reserveStock(lines)).ok) {
    // Sold out while the customer was paying. Nothing is charged without an order: let the authorization go.
    await cancelAuthorization(authorizationToken).catch((error) =>
      console.error(`[klarna] Could not cancel the authorization for checkout ${checkout._id}:`, error.message)
    );
    await finish({ failure: 'sold-out' });
    return { ok: false, reason: 'sold-out' };
  }

  const number = await nextOrderNumber();
  let klarnaOrder;
  try {
    klarnaOrder = await createOrder(authorizationToken, {
      ...checkout.payment,
      merchant_reference1: number,
      merchant_reference2: String(checkout._id),
      merchant_urls: { ...checkout.payment.merchant_urls, confirmation: `${checkout.returnUrl}?payment=success&order=${number}` },
    });
  } catch (error) {
    await Promise.allSettled([releaseStock(lines), finish()]);
    throw error;
  }

  if (klarnaOrder.fraud_status === 'REJECTED') {
    await Promise.allSettled([cancelOrder(klarnaOrder.order_id), releaseStock(lines), finish({ failure: 'declined' })]);
    return { ok: false, reason: 'declined' };
  }

  let order;
  try {
    order = await Order.create({
      ...checkout.order,
      number,
      paymentStatus: 'authorized',
      paymentMethod: 'klarna',
      klarnaOrderId: klarnaOrder.order_id,
      stockReserved: true,
      history: [
        {
          status: 'pending',
          note: klarnaOrder.fraud_status === 'PENDING' ? `${PLACED_NOTE} · ${REVIEW_NOTE}` : PLACED_NOTE,
          by: checkout.order.customer.email,
        },
      ],
    });
  } catch (error) {
    // Klarna has the order but it couldn't be saved here: cancel it so the customer isn't charged.
    await Promise.allSettled([cancelOrder(klarnaOrder.order_id), releaseStock(lines), finish()]);
    throw error;
  }
  await finish({ orderId: order._id, redirectUrl: klarnaOrder.redirect_url ?? null });
  return { ok: true, created: true, order: serializeOrder(order.toObject()), redirectUrl: klarnaOrder.redirect_url ?? null };
}

/**
 * Place the order for an authorized payment. The storefront and Klarna's authorization callback both
 * call this right after the customer pays; whoever claims the checkout first places the order. With
 * `wait`, the other caller waits for that outcome (up to ~15 s) instead of returning 'in-progress'.
 * → `{ ok, order, redirectUrl, created? }` or `{ ok: false, reason: 'not-found' | 'sold-out' | 'declined' | 'in-progress' }`
 */
export async function placeOrder(sessionId, authorizationToken, { wait = false } = {}) {
  await connectToDatabase();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const checkout = await Checkout.findOne({ klarnaSessionId: sessionId }).lean();
    if (!checkout) return { ok: false, reason: 'not-found' };
    if (checkout.failure) return { ok: false, reason: checkout.failure };
    if (checkout.orderId) {
      const order = await Order.findById(checkout.orderId).lean();
      return order ? { ok: true, order: serializeOrder(order), redirectUrl: checkout.redirectUrl } : { ok: false, reason: 'not-found' };
    }

    const claimed = await Checkout.findOneAndUpdate(
      {
        _id: checkout._id,
        orderId: null,
        failure: null,
        $or: [{ placingAt: null }, { placingAt: { $lt: new Date(Date.now() - PLACING_TIMEOUT) } }],
      },
      { $set: { placingAt: new Date() } },
      { returnDocument: 'after' }
    ).lean();
    if (claimed) return placeClaimedOrder(claimed, authorizationToken);
    if (!wait) return { ok: false, reason: 'in-progress' };
    await pause(500);
  }
  return { ok: false, reason: 'in-progress' };
}

/**
 * Klarna's notification for an order it was still reviewing (placed with fraud status PENDING).
 * The notification isn't signed, so the decision is read back from Klarna's API.
 * → `{ ok, changed }` — `changed` when the order was cancelled and its items returned to stock.
 */
export async function handleKlarnaNotification(klarnaOrderId) {
  await connectToDatabase();
  const order = await Order.findOne({ klarnaOrderId });
  if (!order) return { ok: false, changed: false };

  const { fraud_status: fraudStatus } = await getOrder(klarnaOrderId);
  if (fraudStatus === 'ACCEPTED' && !order.history.some((entry) => entry.note === ACCEPTED_NOTE)) {
    order.history.push({ status: order.status, note: ACCEPTED_NOTE, by: 'Klarna' });
    await order.save();
    return { ok: true, changed: false };
  }
  if (fraudStatus === 'REJECTED' && order.status !== 'cancelled') {
    if (order.stockReserved) {
      await releaseStock(order.items.map(stockLine));
      order.stockReserved = false;
    }
    order.status = 'cancelled';
    order.paymentStatus = 'unpaid';
    order.history.push({ status: 'cancelled', note: 'Klarna rejected the payment — the order was cancelled and nothing was charged', by: 'Klarna' });
    await order.save();
    return { ok: true, changed: true };
  }
  return { ok: true, changed: false };
}
