import { deleteNewsletterSubscriber } from '@/server/domain/submissions';
import { notFound, withApi } from '@/server/http';

/** DELETE /api/admin/newsletter/:id — remove a sign-up (e.g. when someone asks to unsubscribe). */
export const DELETE = withApi(
  async ({ params }) => {
    if (!(await deleteNewsletterSubscriber(params.id))) throw notFound('Sign-up not found.');
    return { ok: true };
  },
  { auth: 'admin' }
);
