import { siteConfig, storeConfig } from '@/config/site';

/**
 * Google Analytics 4 e-commerce events (https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).
 * Events go onto window.dataLayer, which the snippet in <GoogleAnalytics> creates before the page hydrates,
 * so an event fired on mount is queued until gtag.js has loaded. Without that snippet (development builds)
 * every call does nothing.
 *
 * item_id is the product's database id — the same in every language and on the orders — and item_variant the size.
 */
function send(name, params) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, { currency: storeConfig.currency, ...params });
}

const round = (amount) => Math.round(amount * 100) / 100;

/** A product (as the storefront serves it) and one of its sizes, as a GA item. */
function productItem(product, variant, quantity = 1) {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_variant: variant?.label || undefined,
    item_category: product.categoryName || undefined,
    item_brand: siteConfig.name,
    price: variant?.price ?? product.price,
    quantity,
  };
}

/** A cart line (see CartContext), as a GA item. */
function cartItem(item) {
  return {
    item_id: String(item.productId),
    item_name: item.name,
    item_variant: item.variantLabel || undefined,
    item_category: item.product?.categoryName || undefined,
    item_brand: siteConfig.name,
    price: item.price,
    quantity: item.quantity,
  };
}

/** The product page or quick view was opened. */
export function trackViewItem(product, variant) {
  const item = productItem(product, variant);
  send('view_item', { value: item.price, items: [item] });
}

/** Units actually added to the cart (never more than the stock allows). */
export function trackAddToCart(product, variant, quantity) {
  const item = productItem(product, variant, quantity);
  send('add_to_cart', { value: round(item.price * quantity), items: [item] });
}

/** The cart drawer was opened with something in it. */
export function trackViewCart(items, subtotal) {
  send('view_cart', { value: round(subtotal), items: items.map(cartItem) });
}

/** The checkout modal was opened. */
export function trackBeginCheckout(items, subtotal) {
  send('begin_checkout', { value: round(subtotal), items: items.map(cartItem) });
}

/** The customer went on to pay: Kustom Checkout has been opened for this cart. */
export function trackAddPaymentInfo(items, total, { discount = 0 } = {}) {
  send('add_payment_info', {
    value: round(total),
    coupon: discount > 0 ? 'welcome-offer' : undefined,
    payment_type: 'Kustom Checkout',
    items: items.map(cartItem),
  });
}

/**
 * A paid order (from POST /api/checkout/confirm). The order number is the transaction id, so
 * GA counts an order once even if the confirmation were reported twice. value is what the
 * customer paid, VAT and shipping included; shipping is also reported on its own.
 */
export function trackPurchase(order) {
  send('purchase', {
    transaction_id: order.number,
    currency: order.currency || storeConfig.currency,
    value: round(order.total),
    shipping: round(order.shippingFee),
    coupon: order.discount > 0 ? 'welcome-offer' : undefined,
    items: order.items.map((item) => ({
      item_id: String(item.product),
      item_name: item.name,
      item_variant: item.variantLabel || undefined,
      item_brand: siteConfig.name,
      price: item.price,
      // The line's share of the order discount, per unit.
      discount: item.discount > 0 ? round(item.discount / item.quantity) : undefined,
      quantity: item.quantity,
    })),
  });
}
