import { changePassword } from '@/server/domain/users';
import { badRequest, notFound, parseBody, withApi } from '@/server/http';
import { changePasswordInput } from '@/server/validation';

/**
 * POST /api/account/password — the signed-in customer sets a new password.
 * Body: { currentPassword, newPassword }. 400 `wrong-password` when the current one doesn't match.
 */
export const POST = withApi(
  async ({ request, user }) => {
    const { currentPassword, newPassword } = await parseBody(request, changePasswordInput);
    const result = await changePassword(user.id, currentPassword, newPassword);
    if (!result.ok && result.reason === 'wrong-password') {
      throw badRequest('Your current password is not correct.', 'wrong-password', {
        fieldErrors: { currentPassword: 'Your current password is not correct' },
      });
    }
    if (!result.ok) throw notFound('Account not found.');
    return { ok: true };
  },
  // Limits guessing the current password from an unlocked, signed-in browser.
  { auth: 'user', rateLimit: { name: 'change-password', limit: 10, window: 900 } }
);
