import { saveContactMessage } from '@/server/domain/submissions';
import { created, parseBody, withApi } from '@/server/http';
import { contactMessageInput } from '@/server/validation';

/** POST /api/contact — the contact form. Body: { name, email, subject, message, locale }. */
export const POST = withApi(async ({ request }) => {
  const { website, ...input } = await parseBody(request, contactMessageInput);
  // The hidden honeypot field is only ever filled in by bots: answer as usual, save nothing.
  if (!website) await saveContactMessage(input);
  return created({ ok: true });
});
