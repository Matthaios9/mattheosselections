import { GetApiData } from './api';

/**
 * Price the cart, keep the customer's details and open a Klarna payment session.
 * → `{ sessionId, clientToken, categories, address }` (render <KlarnaPayment> with them).
 * Rejects with code 'items-unavailable' (details.problems), 'country-unavailable' or 'payments-unavailable'.
 */
export const startCheckout = async (payload) => {
  const { data } = await GetApiData('/checkout', 'POST', payload, false);
  return data;
};

/**
 * After the customer approved the payment in Klarna's widget: place the order.
 * → `{ orderNumber, redirectUrl }`. Rejects with code 'sold-out', 'declined' or 'payments-unavailable'.
 */
export const confirmPayment = async (sessionId, authorizationToken) => {
  const { data } = await GetApiData('/checkout/confirm', 'POST', { sessionId, authorizationToken }, false);
  return data;
};
