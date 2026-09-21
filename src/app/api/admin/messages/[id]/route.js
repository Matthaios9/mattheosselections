import { deleteContactMessage, setContactMessageStatus } from '@/server/domain/submissions';
import { notFound, parseBody, withApi } from '@/server/http';
import { contactMessageStatusInput } from '@/server/validation';

const missing = () => notFound('Message not found.');

/** PATCH /api/admin/messages/:id — `{ status: 'new' | 'read' }`. */
export const PATCH = withApi(
  async ({ request, params }) => {
    const { status } = await parseBody(request, contactMessageStatusInput);
    const message = await setContactMessageStatus(params.id, status);
    if (!message) throw missing();
    return message;
  },
  { auth: 'admin' }
);

/** DELETE /api/admin/messages/:id */
export const DELETE = withApi(
  async ({ params }) => {
    if (!(await deleteContactMessage(params.id))) throw missing();
    return { ok: true };
  },
  { auth: 'admin' }
);
