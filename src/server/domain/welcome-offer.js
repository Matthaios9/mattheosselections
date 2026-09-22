import 'server-only';
import { storeConfig } from '@/config/site';
import { connectToDatabase } from '@/server/db';
import { NewsletterSubscriber, Order, User } from '@/server/models';
import { isObjectId } from '@/server/utils';
import { subscribeToNewsletter } from './submissions';

/**
 * The welcome offer: a thank-you for joining the email list, worth this much off one order.
 *
 * Three separate questions must all be answered yes, and none of them stands in for another:
 *   1. is this customer on the email list?  (ticking the box at checkout counts, and so does
 *      having signed up long ago — an existing subscriber has not used anything up)
 *   2. have they never placed an order?     (an account is not a customer; having signed up,
 *      logged in or browsed is not an order)
 *   3. have they never had this discount?
 *
 * Question 3 is recorded on the customer as `welcomeDiscountUsedAt`, set the moment an order is
 * created carrying the discount. It is deliberately not derived from anything else:
 *   - not from the newsletter list, because unsubscribing deletes that row entirely
 *     (deleteNewsletterSubscriber), so rejoining would otherwise hand out a second discount;
 *   - not from the order count, because an order can be cancelled afterwards, which would put the
 *     count back to zero even though the discount had already been given.
 *
 * Question 2 counts orders that were not cancelled: a cancelled order is one nobody was charged
 * for — the shop cancels them itself when stock runs out mid-payment — so it must not make someone
 * an "existing customer" who never bought anything. Should that attempt have carried the discount,
 * question 3 still blocks a second one.
 *
 * Only a signed-in customer can qualify: all three questions need to know who is buying, and Kustom
 * collects a guest's email only after the price has been fixed. The checkout invites guests to log in.
 */

/** The offer as a percentage. Set in src/config/site.js; 0 switches it off everywhere. */
export const WELCOME_DISCOUNT_PERCENT = storeConfig.welcomeDiscountPercent;

export const WELCOME_DISCOUNT_RATE = WELCOME_DISCOUNT_PERCENT / 100;

/** Round kronor to whole öre — amounts below that can't be charged and would drift from Kustom. */
export const toOre = (amount) => Math.round(amount * 100) / 100;

/** What `rate` takes off `amount`, rounded to whole öre so the totals stay exact in Kustom. */
export const discountOn = (amount, rate) => (rate > 0 ? toOre(amount * rate) : 0);

const NO_OFFER = { eligible: false, subscribed: false, canJoinToClaim: false, percent: WELCOME_DISCOUNT_PERCENT };

/**
 * Where a customer stands with the welcome offer:
 *   `eligible`       — it applies to the order being placed right now
 *   `subscribed`     — already on the email list
 *   `canJoinToClaim` — everything holds except the sign-up, so joining now would claim it
 * A customer who has ordered before, or already had the discount, gets all three false.
 */
export async function welcomeOfferStatus(user) {
  if (!WELCOME_DISCOUNT_PERCENT || !user?.id || !isObjectId(user.id)) return NO_OFFER;

  await connectToDatabase();
  // Read the address from the account rather than the caller: the list is keyed by email.
  const account = await User.findById(user.id, { email: 1, welcomeDiscountUsedAt: 1 }).lean();
  if (!account) return NO_OFFER;

  const [orderCount, subscribed] = await Promise.all([
    Order.countDocuments({ user: account._id, status: { $ne: 'cancelled' } }),
    NewsletterSubscriber.exists({ email: account.email }).then(Boolean),
  ]);

  const unclaimed = !account.welcomeDiscountUsedAt && orderCount === 0;
  return {
    eligible: unclaimed && subscribed,
    subscribed,
    canJoinToClaim: unclaimed && !subscribed,
    percent: WELCOME_DISCOUNT_PERCENT,
  };
}

/**
 * Join the email list from the checkout to claim the offer. Only subscribes when there is an offer
 * left to claim, so ticking the box on an order that gets nothing can't be used to fill the list.
 * Returns the customer's standing afterwards.
 */
export async function joinListForWelcomeOffer(user, locale) {
  const status = await welcomeOfferStatus(user);
  if (!status.canJoinToClaim) return status;

  const account = await User.findById(user.id, { email: 1 }).lean();
  await subscribeToNewsletter({ email: account.email, locale });
  return { ...status, subscribed: true, eligible: true, canJoinToClaim: false };
}

/**
 * Record that this customer's welcome discount has been spent — called once, when an order carrying
 * it is created. The guard keeps the first timestamp if two requests finish the same order at once.
 */
export async function markWelcomeDiscountUsed(userId) {
  if (!isObjectId(userId)) return;
  await connectToDatabase();
  await User.updateOne({ _id: userId, welcomeDiscountUsedAt: null }, { $set: { welcomeDiscountUsedAt: new Date() } });
}
