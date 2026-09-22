import { startSession, toPublicUser } from '@/server/auth/dal';
import { resetPasswordWithToken } from '@/server/domain/password-reset';
import { badRequest, forbidden, parseBody, withApi } from '@/server/http';
import { resetPasswordInput } from '@/server/validation';

/**
 * POST /api/auth/reset-password — set a new password with the token from the email.
 * Body: { token, password }. The link is spent here, so it works exactly once.
 * On success the customer is signed in (they just proved they own the mailbox).
 */
export const POST = withApi(async ({ request }) => {
  const { token, password } = await parseBody(request, resetPasswordInput);
  const result = await resetPasswordWithToken(token, password);
  if (!result.ok && result.reason === 'disabled') throw forbidden('This account has been disabled.', 'disabled');
  if (!result.ok) throw badRequest('This reset link is no longer valid. Please ask for a new one.', 'invalid-token');
  await startSession(result.user);
  return { user: toPublicUser(result.user) };
}, { rateLimit: { name: 'reset-password', limit: 10, window: 900 } });
