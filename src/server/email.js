import 'server-only';
import { siteConfig } from '@/config/site';

/**
 * The shell every customer email shares: the shop name, one paragraph, an optional
 * details block (an order summary), an optional button and a footer line.
 * Transport lives in mailer.js; the wording of each email lives with its domain.
 */

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Label/value rows as a details block, skipping empty values: `renderRows([['Email', 'anna@…']])`. */
export function renderRows(rows) {
  const filled = rows.filter(([, value]) => value);
  const html = `
    <table role="presentation" width="100%" style="margin:28px 0 0;border-collapse:collapse;font-size:15px">
      <tbody>
        ${filled
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#8a8172;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
                <td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>`;
  const text = filled.map(([label, value]) => `${label}: ${value}`).join('\n');

  return { html, text };
}

/**
 * Build one email: `{ to, subject, text, html }` for sendMail.
 * `details` is a pre-rendered `{ html, text }` block shown under the paragraph.
 */
export function renderEmail({ to, subject, text, details, link, cta, footer }) {
  const button = link
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:#1c1915;color:#ffffff;font-weight:700;text-decoration:none">${escapeHtml(cta)}</a></p>`
    : '';
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#fbf8f3">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#3e382f">
    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;color:#1c1915">${escapeHtml(siteConfig.name)}</p>
    <p style="margin:0">${escapeHtml(text)}</p>
    ${details?.html ?? ''}
    ${button}
    <p style="margin:36px 0 0;font-size:13px;color:#8a8172">${escapeHtml(footer)}</p>
  </div>
</body></html>`;
  return {
    to,
    subject,
    text: [text, details?.text, link && `${cta}: ${link}`, footer].filter(Boolean).join('\n\n'),
    html,
  };
}
