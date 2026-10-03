import 'server-only';

/**
 * Kustom Checkout (formerly Klarna Checkout) API client.
 * Docs: https://docs.kustom.co — Checkout API v3 + Order Management API v1, HTTP Basic auth.
 *
 * KUSTOM_API_KEY: an API key from the Kustom Portal (Developers → API): kco_test_api_… for the playground,
 *                 kco_live_api_… for live — or instead KUSTOM_USERNAME (<MID>-<suffix>) + KUSTOM_PASSWORD (the key).
 * KUSTOM_API_URL: https://api.playground.kustom.co (testing, default) or https://api.kustom.co (live)
 */

const apiUrl = () => (process.env.KUSTOM_API_URL || 'https://api.playground.kustom.co').replace(/\/+$/, '');

export const isKustomConfigured = () =>
  Boolean(process.env.KUSTOM_API_KEY || (process.env.KUSTOM_USERNAME && process.env.KUSTOM_PASSWORD));

/** An API key is sent as is; a username and password the usual Basic way. */
function authorization() {
  const { KUSTOM_API_KEY: apiKey, KUSTOM_USERNAME: username, KUSTOM_PASSWORD: password } = process.env;
  return `Basic ${apiKey || Buffer.from(`${username}:${password}`).toString('base64')}`;
}

/** A failed Kustom API call, with Kustom's error details when available. */
export class KustomError extends Error {
  constructor(status, body) {
    const detail = body?.error_messages?.join(' ') || body?.error_message || body?.error_code || `HTTP ${status}`;
    super(`Kustom: ${detail}`);
    this.name = 'KustomError';
    this.status = status;
    this.code = body?.error_code ?? 'kustom-error';
    this.correlationId = body?.correlation_id;
  }
}

async function request(method, path, body) {
  const response = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: {
      Authorization: authorization(),
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      'User-Agent': 'MattheosSelections/1.0',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Kustom's own errors are JSON; an HTML 403 comes from the firewall in front of the API, which
    // only accepts connections from supported regions (credentials are never even checked).
    if (response.status === 403 && !data) {
      throw new KustomError(403, {
        error_message:
          "Kustom's firewall refused the connection (HTTP 403). The API only accepts requests from supported regions — run the server in Europe or through a European VPN.",
      });
    }
    throw new KustomError(response.status, data);
  }
  return data;
}

const id = (orderId) => encodeURIComponent(orderId);

/* Checkout API — the checkout shown to the customer */

/** → `{ order_id, html_snippet, status, … }` */
export const createCheckoutOrder = (order) => request('POST', '/checkout/v3/orders', order);

/** Status is `checkout_incomplete` until the customer completes the purchase, then `checkout_complete`. */
export const getCheckoutOrder = (orderId) => request('GET', `/checkout/v3/orders/${id(orderId)}`);

/* Order Management API — after the purchase */

export const acknowledgeOrder = (orderId) => request('POST', `/ordermanagement/v1/orders/${id(orderId)}/acknowledge`);

export const setMerchantReferences = (orderId, references) =>
  request('PATCH', `/ordermanagement/v1/orders/${id(orderId)}/merchant-references`, references);

/** → `{ status, order_amount, captured_amount, refunded_amount, remaining_authorized_amount, … }` (amounts in öre) */
export const getOrder = (orderId) => request('GET', `/ordermanagement/v1/orders/${id(orderId)}`);

/** Charge the customer (amount in öre). Done when the order ships. */
export const captureOrder = (orderId, capturedAmount, description) =>
  request('POST', `/ordermanagement/v1/orders/${id(orderId)}/captures`, { captured_amount: capturedAmount, description });

/** Void an authorization that has not been captured. */
export const cancelOrder = (orderId) => request('POST', `/ordermanagement/v1/orders/${id(orderId)}/cancel`);

/** Give money back after a capture (amount in öre). */
export const refundOrder = (orderId, refundedAmount, description) =>
  request('POST', `/ordermanagement/v1/orders/${id(orderId)}/refunds`, { refunded_amount: refundedAmount, description });
