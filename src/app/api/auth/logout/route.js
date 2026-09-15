import { endSession } from '@/server/auth/dal';
import { withApi } from '@/server/http';

/** POST /api/auth/logout — ends the session (storefront and admin). */
export const POST = withApi(
  async () => {
    await endSession();
    return { ok: true };
  },
  { requireDatabase: false }
);
