import { createUser, listUsers } from '@/server/domain/users';
import { conflict, created, parseBody, withApi } from '@/server/http';
import { adminUserInput } from '@/server/validation';

/** GET /api/admin/users — paginated list. Query: q, role, status, page. */
export const GET = withApi(({ query: { q, role, status, page } }) => listUsers({ q, role, status, page }), {
  auth: 'admin',
});

/** POST /api/admin/users — create an admin or customer account. */
export const POST = withApi(
  async ({ request }) => {
    const result = await createUser(await parseBody(request, adminUserInput));
    if (!result.ok) {
      throw conflict('An account with this email already exists.', 'email-taken', {
        fieldErrors: { email: 'An account with this email already exists' },
      });
    }
    return created({ ok: true });
  },
  { auth: 'admin' }
);
