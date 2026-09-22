import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { Order } from '@/server/models';
import { isObjectId } from '@/server/utils';

/**
 * The welcome offer: 10% off the goods on a customer's very first order.
 *
 * Only a signed-in customer can qualify. The price has to be fixed before Kustom Checkout opens,
 * and Kustom collects a guest's name and email only after that — so at the moment the discount
 * would have to be granted, a guest is still anonymous. The checkout invites them to log in
 * instead (see CheckoutModal), which is also the only way the "first order" can be counted at all.
 *
 * A cancelled order doesn't count: a purchase that fell through must not cost someone their offer.
 * Eligibility is always decided here on the server — the client is only ever told the answer.
 */

/** The welcome offer as a percentage, for copy and order lines ("10%"). Set in src/config/site.js. */
export const WELCOME_DISCOUNT_PERCENT = storeConfig.welcomeDiscountPercent;

export const WELCOME_DISCOUNT_RATE = WELCOME_DISCOUNT_PERCENT / 100;

/** Round kronor to whole öre — amounts below that can't be charged and would drift from Kustom. */
export const toOre = (amount) => Math.round(amount * 100) / 100;

/** What `rate` takes off `amount`, rounded to whole öre so the totals stay exact in Kustom. */
export const discountOn = (amount, rate) => (rate > 0 ? toOre(amount * rate) : 0);

/** True when this signed-in customer has never completed an order. */
export async function isWelcomeOfferEligible(user) {
  if (!WELCOME_DISCOUNT_PERCENT || !user?.id || !isObjectId(user.id)) return false;
  await connectToDatabase();
  return (await Order.countDocuments({ user: user.id, status: { $ne: 'cancelled' } })) === 0;
}

/** The discount rate this customer's next order gets: 10% for a first order, otherwise none. */
export async function welcomeDiscountRate(user) {
  return (await isWelcomeOfferEligible(user)) ? WELCOME_DISCOUNT_RATE : 0;
}
