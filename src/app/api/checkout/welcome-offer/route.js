import { getCurrentUser } from '@/server/auth/dal';
import { isWelcomeOfferEligible, WELCOME_DISCOUNT_PERCENT } from '@/server/domain/welcome-offer';
import { withApi } from '@/server/http';

/**
 * GET /api/checkout/welcome-offer — may this customer's next order have the welcome offer?
 * → `{ eligible, percent }`. Public, because the checkout asks before anyone has signed in:
 * a guest simply gets `eligible: false` and is invited to log in.
 *
 * This only tells the checkout what to show. The discount itself is granted by the server when
 * the checkout is opened, so a forged answer here changes nothing about what anyone pays.
 */
export const GET = withApi(async () => ({
  eligible: await isWelcomeOfferEligible(await getCurrentUser()),
  percent: WELCOME_DISCOUNT_PERCENT,
}));
