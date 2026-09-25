import { updateUser } from '@/server/domain/users';
import { notFound, parseBody, withApi } from '@/server/http';
import { profileInput } from '@/server/validation';

/** PATCH /api/account/profile — the signed-in customer changes their name. Body: { name }. → { user } */
export const PATCH = withApi(
  async ({ request, user }) => {
    const { name } = await parseBody(request, profileInput);
    const updated = await updateUser(user.id, { name });
    if (!updated) throw notFound('Account not found.');
    return { user: { ...user, name: updated.name } };
  },
  { auth: 'user' }
);
