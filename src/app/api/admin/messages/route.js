import { listContactMessages } from '@/server/domain/submissions';
import { withApi } from '@/server/http';

/** GET /api/admin/messages — paginated contact form messages. Query: status (new | read), q, page. */
export const GET = withApi(({ query: { status, q, page } }) => listContactMessages({ status, q, page }), { auth: 'admin' });
