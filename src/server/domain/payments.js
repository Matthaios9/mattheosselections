import 'server-only';
import { siteConfig, storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import {
  acknowledgeOrder,
  cancelOrder,
  createCheckoutOrder,
  getCheckoutOrder,
  KustomError,
  setMerchantReferences,
} from '@/server/kustom';
import { Checkout, nextOrderNumber, Order } from '@/server/models';
import { isObjectId } from '@/server/utils';
import { SHIPPING_COUNTRIES } from '@/utils/shipping';
import { reserveStock } from './inventory';
import { priceCart, serializeOrder, stockLine } from './orders';
import { welcomeDiscountRate } from './welcome-offer';

/**
 * Payments with Kustom Checkout (embedded checkout, formerly Klarna Checkout).
 *
 * 1. startCheckout     — prices the cart, stores it as a pending Checkout and creates a
 *                        Kustom checkout order; the storefront renders its html_snippet.
 *                        Kustom collects the customer's details (private or company) and payment —
 *                        card, Swish, Klarna… whatever is active on the Kustom account. Stock isn't touched.
 * 2. finalizeCheckout  — once Kustom reports `checkout_complete` (confirmation page or push),
 *                        creates the order, takes the items out of stock and acknowledges
 *                        the order at Kustom. Safe to call twice; only the first call does the work.
 * The money is only reserved ('authorized') until the order ships — see settlement.js.
 */

const toMinorUnits = (amount) => Math.round(amount * 100); // kr → öre
const kustomLocale = (locale) => (locale === 'sv' ? 'sv-SE' : 'en-SE'); // Greek shoppers get English

/**
 * One Kustom order line; prices include VAT, amounts in öre.
 * `vatRate` is the rate this line is sold at — food or standard, per product (see utils/vat.js).
 * `discount` is taken off this line, which keeps the VAT of a discounted order right at every rate.
 */
function orderLine({ type, reference, name, quantity, unitPrice, vatRate = storeConfig.vatRate, discount = 0, imageUrl, productUrl }) {
  const unit = toMinorUnits(unitPrice);
  const off = toMinorUnits(discount);
  const total = unit * quantity - off;
  const rate = Math.round(vatRate * 100); // 6% → 600
  return {
    type,
    reference: reference.slice(0, 255),
    name: name.slice(0, 255),
    quantity,
    quantity_unit: 'pcs',
    unit_price: unit,
    tax_rate: rate,
    total_amount: total,
    total_discount_amount: off,
    total_tax_amount: Math.round(total - (total * 10000) / (10000 + rate)),
    ...(imageUrl?.startsWith('https://') && { image_url: imageUrl }),
    ...(productUrl && { product_url: productUrl }),
  };
}

export async function startCheckout({ items, customerType, company, country, note, locale, returnPath }, user, { origin }) {
  await connectToDatabase();
  // Decided here, never taken from the request: the welcome offer is 10% off a signed-in
  // customer's first order (see welcome-offer.js).
  const priced = await priceCart({ items, country, locale, discountRate: await welcomeDiscountRate(user) });
  if (!priced.ok) return priced;

  const checkout = await Checkout.create({
    order: {
      user: user?.id ?? null,
      items: priced.lines,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shippingFee: priced.shippingFee,
      total: priced.total,
      vatRate: storeConfig.vatRate,
      locale,
      customerNote: note,
      company: customerType === 'company' ? company : '',
    },
  });

  const lines = [
    ...priced.lines.map((line) =>
      orderLine({
        type: 'physical',
        reference: `${line.product}:${line.variantKey}`,
        name: line.variantLabel ? `${line.name} (${line.variantLabel})` : line.name,
        quantity: line.quantity,
        unitPrice: line.price,
        vatRate: line.vatRate,
        discount: line.discount,
        imageUrl: line.image,
        productUrl: line.slug
          ? `${origin}/${locale}/product/${line.slug}`
          : `${origin}/${locale}/shop?q=${encodeURIComponent(line.name)}`,
      })
    ),
    ...(priced.shippingFee > 0
      ? [orderLine({ type: 'shipping_fee', reference: 'shipping', name: 'Shipping', quantity: 1, unitPrice: priced.shippingFee })]
      : []),
  ];
  const back = `${origin}${returnPath}`;

  // Kustom offers private and company customers (B2B). Company purchases need B2B activated on the
  // Kustom account; if Kustom refuses them, the checkout opens for private customers only. A company
  // chosen in the checkout modal opens Kustom in company mode with its name filled in.
  const createOrder = (customerTypes) => {
    const asCompany = customerType === 'company' && customerTypes.includes('organization');
    const billingAddress = { ...(user?.email && { email: user.email }), ...(asCompany && { organization_name: company }) };
    return createCheckoutOrder({
      purchase_country: 'SE',
      purchase_currency: storeConfig.currency,
      locale: kustomLocale(locale),
      order_amount: lines.reduce((sum, line) => sum + line.total_amount, 0),
      order_tax_amount: lines.reduce((sum, line) => sum + line.total_tax_amount, 0),
      order_lines: lines,
      // Customers from all delivery countries may use their own billing address (Kustom offers them what
      // their country and SEK allow, at least card); delivery is fixed to the country that set the fee.
      billing_countries: SHIPPING_COUNTRIES,
      shipping_countries: [country],
      ...(asCompany && { customer: { type: 'organization' } }),
      ...(Object.keys(billingAddress).length > 0 && { billing_address: billingAddress }),
      merchant_reference2: String(checkout._id),
      merchant_urls: {
        terms: `${origin}/${locale}${siteConfig.termsPath}`,
        checkout: back,
        confirmation: `${back}?payment=success&order_id={checkout.order.id}`,
        push: `${origin}/api/kustom/push?kustom_order_id={checkout.order.id}`,
        // Kustom only calls HTTPS validation URLs (so not on localhost): a last stock check before payment.
        ...(origin.startsWith('https://') && {
          validation: `${origin}/api/kustom/validate?return_path=${encodeURIComponent(returnPath)}`,
        }),
      },
      options: {
        allowed_customer_types: customerTypes,
        color_button: '#1c1915',
        color_button_text: '#ffffff',
        color_checkbox: '#1c1915',
        color_header: '#1c1915',
        color_link: '#95611a',
      },
    });
  };

  try {
    const kustomOrder = await createOrder(['person', 'organization']).catch((error) => {
      if (!(error instanceof KustomError) || error.status !== 400) throw error;
      console.warn('[kustom] Checkout for company customers was refused, opening it for private customers only:', error.message);
      return createOrder(['person']);
    });
    await Checkout.updateOne({ _id: checkout._id }, { $set: { kustomOrderId: kustomOrder.order_id } });
    return { ok: true, orderId: kustomOrder.order_id, snippet: kustomOrder.html_snippet };
  } catch (error) {
    await Checkout.deleteOne({ _id: checkout._id });
    throw error;
  }
}

const fullName = (address = {}) => [address.given_name, address.family_name].filter(Boolean).join(' ');

/** Acknowledge at Kustom (stops the push notifications) and store our order number there. */
async function confirmAtKustom(kustomOrderId, orderNumber) {
  const results = await Promise.allSettled([
    acknowledgeOrder(kustomOrderId),
    setMerchantReferences(kustomOrderId, { merchant_reference1: orderNumber }),
  ]);
  results
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.error(`[kustom] ${orderNumber}:`, result.reason?.message));
}

// Longer than any request can run: an order still unfinished after this was left behind by a stopped server.
const FINALIZE_LEASE_MS = 15 * 60 * 1000;

/**
 * Turn a completed Kustom checkout into an order: create it, take its items out of stock (or cancel it when
 * they sold out meanwhile) and acknowledge it at Kustom. Called by the confirmation page and Kustom's push,
 * in any order and any number of times; `created` is true only for the call that finished the order, which
 * then sends the emails. An order whose finishing step was interrupted is finished by the next call.
 */
export async function finalizeCheckout(kustomOrderId) {
  await connectToDatabase();
  const existing = await Order.findOne({ kustomOrderId }).lean();
  if (existing) {
    const stalled = await claimStalledOrder(kustomOrderId);
    return stalled ? completeOrder(stalled, kustomOrderId) : { ok: true, order: serializeOrder(existing) };
  }

  const kustomOrder = await getCheckoutOrder(kustomOrderId);
  if (kustomOrder.status !== 'checkout_complete') return { ok: false, reason: 'incomplete' };

  const checkout =
    (await Checkout.findOne({ kustomOrderId }).lean()) ??
    (isObjectId(kustomOrder.merchant_reference2) ? await Checkout.findById(kustomOrder.merchant_reference2).lean() : null);
  if (!checkout) {
    console.error(`[kustom] No pending checkout for completed order ${kustomOrderId}`);
    return { ok: false, reason: 'not-found' };
  }
  // Kustom charges what our own order lines said, so this should never differ; if it does, the admin sees it on the order.
  const mismatch = kustomOrder.order_amount !== toMinorUnits(checkout.order.total);
  if (mismatch) console.warn(`[kustom] Amount mismatch for ${kustomOrderId}: ${kustomOrder.order_amount} vs ${checkout.order.total} kr`);

  const { company, ...orderFields } = checkout.order;
  const organization = kustomOrder.customer?.type === 'organization';
  const billing = kustomOrder.billing_address ?? {};
  const shipping = kustomOrder.shipping_address?.street_address ? kustomOrder.shipping_address : billing;
  let order;
  try {
    order = await Order.create({
      ...orderFields,
      number: await nextOrderNumber(),
      customer: {
        name: fullName(billing) || fullName(shipping) || billing.email,
        // A company: bought as one in Kustom Checkout (B2B) or chosen as the customer type in the modal.
        company: (organization && (billing.organization_name ?? shipping.organization_name)) || company || '',
        organizationNumber: (organization && kustomOrder.customer.organization_registration_id) || '',
        email: billing.email ?? shipping.email,
        phone: billing.phone ?? shipping.phone ?? '',
      },
      shippingAddress: {
        line1: shipping.street_address,
        line2: shipping.street_address2 ?? '',
        postalCode: shipping.postal_code,
        city: shipping.city,
        country: String(shipping.country ?? 'SE').toUpperCase(),
      },
      paymentStatus: 'authorized',
      paymentMethod: 'kustom',
      kustomOrderId,
      finalizingSince: new Date(),
      history: [
        { status: 'pending', note: 'Order placed · paid with Kustom Checkout', by: billing.email ?? '' },
        ...(mismatch
          ? [{ status: 'pending', note: `Check before shipping: Kustom reserved ${kustomOrder.order_amount / 100} kr, the order totals ${checkout.order.total} kr.`, by: 'system' }]
          : []),
      ],
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    // The confirmation page and Kustom's push arrived together — the other one created the order.
    const created = await Order.findOne({ kustomOrderId }).lean();
    return created ? { ok: true, order: serializeOrder(created) } : { ok: false, reason: 'not-found' };
  }
  return completeOrder(order, kustomOrderId);
}

/** Claim an order whose finishing step stopped part-way, so that exactly one request resumes it. */
function claimStalledOrder(kustomOrderId) {
  return Order.findOneAndUpdate(
    { kustomOrderId, status: 'pending', stockReserved: false, finalizingSince: { $lt: new Date(Date.now() - FINALIZE_LEASE_MS) } },
    { $set: { finalizingSince: new Date() } },
    { returnDocument: 'after' }
  );
}

/** Take a new order's items out of stock — or cancel it if they sold out meanwhile — and confirm it at Kustom. */
async function completeOrder(order, kustomOrderId) {
  const reservation = await reserveStock(order.items.map(stockLine));
  if (reservation.ok) {
    order.stockReserved = true;
  } else {
    // Someone bought the last units while this customer was paying: nothing has been charged yet,
    // so cancel the reservation at Kustom.
    let note = 'Sold out while the customer was paying — the payment reservation was cancelled at Kustom.';
    try {
      await cancelOrder(kustomOrderId);
      order.paymentStatus = 'unpaid';
    } catch (error) {
      console.error(`[kustom] Cancel failed for ${kustomOrderId}:`, error.message);
      note = 'Sold out while the customer was paying — cancelling the payment at Kustom failed; cancel it in the Kustom portal.';
    }
    order.status = 'cancelled';
    order.history.push({ status: 'cancelled', note, by: 'system' });
  }
  order.finalizingSince = null;
  await order.save();
  await confirmAtKustom(kustomOrderId, order.number);
  await Checkout.deleteMany({ kustomOrderId });
  return { ok: true, created: true, order: serializeOrder(order.toObject()) };
}

/** Kustom's push arrives until the order is acknowledged; acknowledge again in case the first attempt failed. */
export async function handleKustomPush(kustomOrderId) {
  const result = await finalizeCheckout(kustomOrderId);
  if (result.ok && !result.created) await confirmAtKustom(kustomOrderId, result.order.number);
  return result;
}

/** Kustom's validation callback: is everything in the checkout still in stock? */
export async function isKustomOrderInStock(orderLines = []) {
  const items = orderLines
    .filter((line) => line.type === 'physical' && String(line.reference).includes(':'))
    .map((line) => {
      const [productId, variantId] = String(line.reference).split(':');
      return { productId, variantId, quantity: line.quantity };
    });
  if (!items.length) return false;
  const priced = await priceCart({ items, country: 'SE', locale: 'en' });
  return priced.ok;
}
