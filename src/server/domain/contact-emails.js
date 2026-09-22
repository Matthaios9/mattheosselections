import 'server-only';
import { siteConfig } from '@/config/site';
import { escapeHtml, renderEmail, renderRows } from '@/server/email';
import { isMailConfigured, sendMail } from '@/server/mailer';
import { firstName } from '@/utils/format';

/**
 * Tell the shop about a new contact form message: who sent it and what they wrote, with a link
 * to the messages in the admin panel. Goes only to ADMIN_EMAIL (comma-separated for several), in
 * English like the panel — the visitor gets no email; replying reaches them.
 *
 * The route calls this from `after()`, so sending never delays or fails the form.
 * Returns whether an email went out; never throws. Without SMTP configured nothing is sent.
 */
export async function sendAdminContactNotice({ name, email, subject, message, locale }, { origin } = {}) {
  const to = process.env.ADMIN_EMAIL;
  if (!isMailConfigured() || !to) return false;

  try {
    const sender = renderRows([
      ['Name', name],
      ['Email', email],
      ['Language', locale?.toUpperCase()],
      ['Subject', subject],
    ]);
    const body = `
    <p style="margin:24px 0 0;padding:16px 20px;border-left:3px solid #eee5d8;background:#ffffff;white-space:pre-wrap">${escapeHtml(message)}</p>`;
    await sendMail({
      ...renderEmail({
        to,
        subject: `New message from ${name}: ${subject}`,
        text: `${name} sent a message with the contact form.`,
        details: { html: sender.html + body, text: `${sender.text}\n\n${message}` },
        link: `${origin || siteConfig.url}/admin/submissions?tab=contact`,
        cta: 'Open messages',
        footer: `Sent to ADMIN_EMAIL for every contact form message at ${siteConfig.name}. Reply to this email to answer ${firstName(name) || name}.`,
      }),
      replyTo: email,
    });
    return true;
  } catch (error) {
    console.error(`[contact-emails] admin notice for a message from ${email} failed:`, error.message);
    return false;
  }
}
