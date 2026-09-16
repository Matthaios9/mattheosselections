import { GetApiData } from './api';

/**
 * Price the cart and open a Kustom Checkout. → `{ orderId, snippet }` (render the snippet
 * with <KustomCheckout>). Rejects with code 'items-unavailable' (details.problems) or
 * 'payments-unavailable'.
 */
export const startCheckout = async (payload) => {
  const { data } = await GetApiData('/checkout', 'POST', payload, false);
  return data;
};

/** After Kustom's confirmation redirect: create the order. → `{ orderNumber, soldOut }` */
export const confirmPayment = async (orderId) => {
  const { data } = await GetApiData('/checkout/confirm', 'POST', { orderId }, false);
  return data;
};
