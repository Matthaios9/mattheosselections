import { after } from 'next/server';
import { sendAdminContactNotice } from '@/server/domain/contact-emails';
import { saveContactMessage } from '@/server/domain/submissions';
import { created, parseBody, requestOrigin, withApi } from '@/server/http';
import { contactMessageInput } from '@/server/validation';

/**
 * POST /api/contact — the contact form. Body: { name, email, subject, message, locale }.
 * Saves the message and emails a copy to the shop (ADMIN_EMAIL) only — the visitor gets no email.
 */
export const POST = withApi(async ({ request }) => {
  const { website, ...input } = await parseBody(request, contactMessageInput);
  // The hidden honeypot field is only ever filled in by bots: answer as usual, save and send nothing.
  if (!website) {
    await saveContactMessage(input);
    const origin = requestOrigin(request);
    after(() => sendAdminContactNotice(input, { origin }));
  }
  return created({ ok: true });
}, { rateLimit: { name: 'contact', limit: 5, window: 600 } });
