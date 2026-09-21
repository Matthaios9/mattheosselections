import 'server-only';
import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site';

/**
 * Outgoing email over SMTP (e.g. the mailbox behind info@mattheosselections.com).
 *
 * SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASSWORD
 * MAIL_FROM (optional, default "Mattheos Selections <info@mattheosselections.com>")
 *
 * Without SMTP_HOST nothing is sent: callers check `isMailConfigured()` and keep their work for later.
 */

export const isMailConfigured = () => Boolean(process.env.SMTP_HOST);

let transport = null;

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 587 / 25 upgrade with STARTTLS
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transport;
}

/** Send one email: `{ to, subject, text, html, replyTo? }`. Throws when SMTP rejects it. */
export async function sendMail({ to, subject, text, html, replyTo = siteConfig.email }) {
  if (!isMailConfigured()) throw new Error('Email is not configured (SMTP_HOST is missing).');
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || `${siteConfig.name} <${siteConfig.email}>`,
    replyTo,
    to,
    subject,
    text,
    html,
  });
}
