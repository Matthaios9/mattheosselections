import { subscribeToNewsletter } from '@/server/domain/submissions';
import { created, parseBody, withApi } from '@/server/http';
import { newsletterInput } from '@/server/validation';

/** POST /api/newsletter — newsletter sign-up. Body: { email, locale }. */
export const POST = withApi(async ({ request }) => {
  const { website, ...input } = await parseBody(request, newsletterInput);
  // The hidden honeypot field is only ever filled in by bots: answer as usual, save nothing.
  if (!website) await subscribeToNewsletter(input);
  return created({ ok: true });
}, { rateLimit: { name: 'newsletter', limit: 5, window: 600 } });
