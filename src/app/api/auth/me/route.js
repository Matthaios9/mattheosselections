import { getCurrentUser } from '@/server/auth/dal';
import { withApi } from '@/server/http';

/** GET /api/auth/me — the signed-in user, or `{ user: null }`. */
export const GET = withApi(
  async () => {
    try {
      return { user: await getCurrentUser() };
    } catch {
      return { user: null };
    }
  },
  { requireDatabase: false }
);
