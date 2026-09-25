import { after } from 'next/server';
import { sendPasswordResetEmail } from '@/server/domain/password-emails';
import { createPasswordReset } from '@/server/domain/password-reset';
import { forbidden, notFound, parseBody, requestOrigin, withApi } from '@/server/http';
import { forgotPasswordInput } from '@/server/validation';

/**
 * POST /api/auth/forgot-password — email a link for choosing a new password.
 * Body: { email, locale }.
 *
 * Answers 404 `no-account` when no account uses the address and 403 `disabled` for a disabled
 * account, so the form can say so (sign-up already reveals whether an email is registered).
 * The email goes out from `after()`, so the response doesn't wait for SMTP.
 */
export const POST = withApi(async ({ request }) => {
  const { email, locale } = await parseBody(request, forgotPasswordInput);
  const reset = await createPasswordReset(email);
  if (!reset.ok) {
    if (reset.reason === 'disabled') throw forbidden('This account has been disabled.', 'disabled');
    throw notFound('No account uses this email address.', 'no-account');
  }
  const { user, token } = reset;
  const origin = requestOrigin(request);
  after(() => sendPasswordResetEmail({ user, token, locale }, { origin }));
  return { ok: true };
}, { rateLimit: { name: 'forgot-password', limit: 5, window: 900 } });
