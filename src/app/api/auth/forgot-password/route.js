import { after } from 'next/server';
import { sendPasswordResetEmail } from '@/server/domain/password-emails';
import { createPasswordReset } from '@/server/domain/password-reset';
import { parseBody, requestOrigin, withApi } from '@/server/http';
import { forgotPasswordInput } from '@/server/validation';

/**
 * POST /api/auth/forgot-password — email a link for choosing a new password.
 * Body: { email, locale }.
 *
 * Always answers `{ ok: true }`, whether or not the address has an account: anything else
 * would turn this route into a way of testing which emails are customers here. The email
 * goes out from `after()`, so the response doesn't wait for SMTP either.
 */
export const POST = withApi(async ({ request }) => {
  const { email, locale } = await parseBody(request, forgotPasswordInput);
  const reset = await createPasswordReset(email);
  if (reset) {
    const origin = requestOrigin(request);
    after(() => sendPasswordResetEmail({ ...reset, locale }, { origin }));
  }
  return { ok: true };
}, { rateLimit: { name: 'forgot-password', limit: 5, window: 900 } });
