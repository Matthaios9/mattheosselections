import { listNewsletterSubscribers } from '@/server/domain/submissions';
import { withApi } from '@/server/http';

/** GET /api/admin/newsletter — paginated sign-ups, newest first. Query: q (email), page. */
export const GET = withApi(({ query: { q, page } }) => listNewsletterSubscribers({ q, page }), { auth: 'admin' });
