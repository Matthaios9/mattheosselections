import { subscribeToNewsletter } from '@/server/domain/submissions';
import { canReceiveEmail } from '@/server/email-domain';
import { badRequest, conflict, created, parseBody, withApi } from '@/server/http';
import { newsletterInput } from '@/server/validation';

/** POST /api/newsletter — newsletter sign-up. Body: { email, locale }. 409 `already-subscribed` if the email is on the list. */
export const POST = withApi(async ({ request }) => {
  const { website, ...input } = await parseBody(request, newsletterInput);
  // The hidden honeypot field is only ever filled in by bots: answer as usual, save nothing.
  if (website) return created({ ok: true });
  if (!(await canReceiveEmail(input.email))) throw badRequest('This email domain cannot receive email.', 'email-domain');
  const added = await subscribeToNewsletter(input);
  if (!added) throw conflict('This email is already subscribed.', 'already-subscribed');
  return created({ ok: true });
}, { rateLimit: { name: 'newsletter', limit: 5, window: 600 } });
