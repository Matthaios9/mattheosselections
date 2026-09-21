import { getSubmissionCounts } from '@/server/domain/submissions';
import { withApi } from '@/server/http';

/** GET /api/admin/stats/submissions — { subscribers, messages, unread } for the tabs and sidebar badge. */
export const GET = withApi(() => getSubmissionCounts(), { auth: 'admin' });
