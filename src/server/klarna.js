import 'server-only';

/**
 * Klarna Payments API client — Payments API v1 + Order Management API v1, HTTP Basic auth.
 * The same integration as the WooCommerce shop (plugin "Klarna Payments for WooCommerce").
 * Docs: https://docs.klarna.com · API credentials: Klarna Merchant Portal (https://portal.klarna.com).
 *
 * KLARNA_API_KEY: an API key from the portal (klarna_live_api_… / klarna_test_api_…) — or instead the older
 *                 KLARNA_USERNAME + KLARNA_PASSWORD. Not the client identifier (klarna_live_client_…),
 *                 which is only for Klarna's browser SDK.
 * KLARNA_API_URL: https://api.playground.klarna.com (testing, default) or https://api.klarna.com (live)
 */

const apiUrl = () => (process.env.KLARNA_API_URL || 'https://api.playground.klarna.com').replace(/\/+$/, '');

export const isKlarnaConfigured = () =>
  Boolean(process.env.KLARNA_API_KEY || (process.env.KLARNA_USERNAME && process.env.KLARNA_PASSWORD));

/** An API key is sent as is; a username and password the usual Basic way. */
function authorization() {
  const { KLARNA_API_KEY: apiKey, KLARNA_USERNAME: username, KLARNA_PASSWORD: password } = process.env;
  return `Basic ${apiKey || Buffer.from(`${username}:${password}`).toString('base64')}`;
}

/** A failed Klarna API call, with Klarna's error details when available. */
export class KlarnaError extends Error {
  constructor(status, body) {
    const detail = body?.error_messages?.join(' ') || body?.error_message || body?.error_code || `HTTP ${status}`;
    super(`Klarna: ${detail}`);
    this.name = 'KlarnaError';
    this.status = status;
    this.code = body?.error_code ?? 'klarna-error';
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
    // Klarna's own errors are JSON; a bare HTML 403 comes from the firewall in front of the API, which
    // refuses connections from some regions before the credentials are even checked.
    if (response.status === 403 && !data) {
      throw new KlarnaError(403, {
        error_message:
          "Klarna's firewall refused the connection (HTTP 403). The API doesn't accept requests from this network's region — run the server in Europe or through a European VPN.",
      });
    }
    throw new KlarnaError(response.status, data);
  }
  return data;
}

const id = (value) => encodeURIComponent(value);

/* Payments API — the payment in the checkout */

/** → `{ session_id, client_token, payment_method_categories }`. The session stays open for 48 hours. */
export const createSession = (session) => request('POST', '/payments/v1/sessions', session);

/**
 * Place the order for a payment the customer authorized in Klarna's widget (the token is valid for
 * 60 minutes). The order data must match what was authorized. → `{ order_id, redirect_url, fraud_status }`
 */
export const createOrder = (authorizationToken, order) =>
  request('POST', `/payments/v1/authorizations/${id(authorizationToken)}/order`, order);

/** Release an authorization that won't become an order. */
export const cancelAuthorization = (authorizationToken) =>
  request('DELETE', `/payments/v1/authorizations/${id(authorizationToken)}`);

/* Order Management API — after the purchase */

/** → `{ order_id, status, fraud_status, … }` */
export const getOrder = (orderId) => request('GET', `/ordermanagement/v1/orders/${id(orderId)}`);

/** Charge the customer (amount in öre). Done when the order ships. */
export const captureOrder = (orderId, capturedAmount, description) =>
  request('POST', `/ordermanagement/v1/orders/${id(orderId)}/captures`, { captured_amount: capturedAmount, description });

/** Void an authorization that has not been captured. */
export const cancelOrder = (orderId) => request('POST', `/ordermanagement/v1/orders/${id(orderId)}/cancel`);

/** Give money back after a capture (amount in öre). */
export const refundOrder = (orderId, refundedAmount, description) =>
  request('POST', `/ordermanagement/v1/orders/${id(orderId)}/refunds`, { refunded_amount: refundedAmount, description });
