import { getCurrentUser } from '@/server/auth/dal';
import { welcomeOfferStatus } from '@/server/domain/welcome-offer';
import { withApi } from '@/server/http';

/**
 * GET /api/checkout/welcome-offer — where this customer stands with the welcome offer.
 * → `{ eligible, subscribed, canJoinToClaim, percent }` (see welcome-offer.js). Public, because the
 * checkout asks before anyone has signed in: a guest gets all false and is invited to log in.
 *
 * This only tells the checkout what to show. The discount itself is granted by the server when
 * the checkout is opened, so a forged answer here changes nothing about what anyone pays.
 */
export const GET = withApi(async () => welcomeOfferStatus(await getCurrentUser()));
