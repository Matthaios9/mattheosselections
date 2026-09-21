import 'server-only';
import { siteConfig } from '@/config/site';
import { interpolate } from '@/i18n/translate';
import { escapeHtml, renderEmail } from '@/server/email';
import { isMailConfigured, sendMail } from '@/server/mailer';
import { firstName, formatPrice, plural } from '@/utils/format';

/**
 * Order emails to the customer, in the language they shopped in: one when the order
 * is placed and one on every later status change (see ORDER_STATUSES). The shop gets
 * its own notice of every new order at ADMIN_EMAIL.
 *
 * Sending never blocks or fails the order itself — the routes call these from `after()`
 * and every failure is logged, not thrown. Without SMTP configured nothing is sent.
 */

const EMAILS = {
  en: {
    confirmed: {
      subject: 'Order {number} is confirmed',
      text: 'Thank you for your order, {name}. We have received order {number} and will start preparing it.',
    },
    pending: {
      subject: 'Order {number} is open again',
      text: 'Hi {name}, order {number} is open again and we are preparing it.',
    },
    processing: {
      subject: 'Order {number} is being prepared',
      text: 'Hi {name}, we are picking and packing order {number} right now. We will let you know when it is on its way.',
    },
    shipped: {
      subject: 'Order {number} is on its way',
      text: 'Good news, {name} — order {number} has left us and is on its way to you.',
    },
    delivered: {
      subject: 'Order {number} has been delivered',
      text: 'Hi {name}, order {number} has been delivered. We hope you enjoy it!',
    },
    cancelled: {
      subject: 'Order {number} has been cancelled',
      text: 'Hi {name}, order {number} has been cancelled and any payment reserved for it has been released. Get in touch if this was not expected.',
    },
    summary: { subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', total: 'Total', address: 'Delivery address' },
    cta: 'Visit the shop',
    footer: 'You receive this email because you placed an order at Mattheos Selections. Questions? Just reply to this email.',
  },
  sv: {
    confirmed: {
      subject: 'Order {number} är bekräftad',
      text: 'Tack för din beställning, {name}. Vi har tagit emot order {number} och börjar förbereda den.',
    },
    pending: {
      subject: 'Order {number} är aktiv igen',
      text: 'Hej {name}, order {number} är aktiv igen och vi förbereder den.',
    },
    processing: {
      subject: 'Order {number} förbereds',
      text: 'Hej {name}, vi plockar och packar order {number} just nu. Vi hör av oss när den är på väg.',
    },
    shipped: {
      subject: 'Order {number} är på väg',
      text: 'Goda nyheter, {name} — order {number} har lämnat oss och är på väg till dig.',
    },
    delivered: {
      subject: 'Order {number} har levererats',
      text: 'Hej {name}, order {number} har levererats. Vi hoppas att du blir nöjd!',
    },
    cancelled: {
      subject: 'Order {number} har annullerats',
      text: 'Hej {name}, order {number} har annullerats och en eventuell reserverad betalning har frisläppts. Hör av dig om det här inte var väntat.',
    },
    summary: { subtotal: 'Delsumma', shipping: 'Frakt', free: 'Fri frakt', total: 'Totalt', address: 'Leveransadress' },
    cta: 'Till butiken',
    footer: 'Du får det här mejlet eftersom du har lagt en beställning hos Mattheos Selections. Frågor? Svara bara på det här mejlet.',
  },
  el: {
    confirmed: {
      subject: 'Η παραγγελία {number} επιβεβαιώθηκε',
      text: 'Ευχαριστούμε για την παραγγελία σας, {name}. Λάβαμε την παραγγελία {number} και ξεκινάμε την προετοιμασία της.',
    },
    pending: {
      subject: 'Η παραγγελία {number} είναι ξανά ενεργή',
      text: 'Γεια σας {name}, η παραγγελία {number} είναι ξανά ενεργή και την προετοιμάζουμε.',
    },
    processing: {
      subject: 'Η παραγγελία {number} προετοιμάζεται',
      text: 'Γεια σας {name}, ετοιμάζουμε αυτή τη στιγμή την παραγγελία {number}. Θα σας ενημερώσουμε μόλις ξεκινήσει.',
    },
    shipped: {
      subject: 'Η παραγγελία {number} βρίσκεται καθ’ οδόν',
      text: 'Καλά νέα, {name} — η παραγγελία {number} έφυγε από εμάς και έρχεται σε εσάς.',
    },
    delivered: {
      subject: 'Η παραγγελία {number} παραδόθηκε',
      text: 'Γεια σας {name}, η παραγγελία {number} παραδόθηκε. Ελπίζουμε να την απολαύσετε!',
    },
    cancelled: {
      subject: 'Η παραγγελία {number} ακυρώθηκε',
      text: 'Γεια σας {name}, η παραγγελία {number} ακυρώθηκε και τυχόν δεσμευμένη πληρωμή αποδεσμεύτηκε. Επικοινωνήστε μαζί μας αν δεν το περιμένατε.',
    },
    summary: { subtotal: 'Υποσύνολο', shipping: 'Αποστολή', free: 'Δωρεάν', total: 'Σύνολο', address: 'Διεύθυνση παράδοσης' },
    cta: 'Στο κατάστημα',
    footer: 'Λαμβάνετε αυτό το email επειδή κάνατε μια παραγγελία στη Mattheos Selections. Απορίες; Απαντήστε απλώς σε αυτό το email.',
  },
};

/** Country name in the customer's language ("SE" → "Sverige"), falling back to the code. */
function countryIn(code, locale) {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

/** The items, totals and delivery address, as an HTML block and its plain-text twin. */
function renderSummary(order, copy, locale) {
  const price = (amount) => formatPrice(amount ?? 0, locale);
  const line = (item) =>
    `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} × ${item.quantity}`;
  const shipping = order.shippingFee > 0 ? price(order.shippingFee) : copy.summary.free;
  const address = [
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    `${order.shippingAddress.postalCode} ${order.shippingAddress.city}`,
    countryIn(order.shippingAddress.country, locale),
  ].filter(Boolean);

  const cell = 'padding:10px 0;border-bottom:1px solid #eee5d8';
  const totalRow = (label, value, strong) =>
    `<tr><td style="padding:8px 0;${strong ? 'font-weight:700' : 'color:#8a8172'}">${escapeHtml(label)}</td>
      <td style="padding:8px 0;text-align:right;white-space:nowrap;${strong ? 'font-weight:700' : 'color:#8a8172'}">${escapeHtml(value)}</td></tr>`;

  const html = `
    <table role="presentation" width="100%" style="margin:28px 0 0;border-collapse:collapse;font-size:15px">
      <tbody>
        ${order.items
          .map(
            (item) =>
              `<tr><td style="${cell}">${escapeHtml(line(item))}</td>
                <td style="${cell};text-align:right;white-space:nowrap">${escapeHtml(price(item.lineTotal))}</td></tr>`
          )
          .join('')}
        ${totalRow(copy.summary.subtotal, price(order.subtotal))}
        ${totalRow(copy.summary.shipping, shipping)}
        ${totalRow(copy.summary.total, price(order.total), true)}
      </tbody>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#8a8172">
      ${escapeHtml(copy.summary.address)}<br>${address.map(escapeHtml).join('<br>')}
    </p>`;

  const text = [
    ...order.items.map((item) => `- ${line(item)} — ${price(item.lineTotal)}`),
    `${copy.summary.subtotal}: ${price(order.subtotal)}`,
    `${copy.summary.shipping}: ${shipping}`,
    `${copy.summary.total}: ${price(order.total)}`,
    '',
    `${copy.summary.address}: ${address.join(', ')}`,
  ].join('\n');

  return { html, text };
}

/** Who ordered — contact details, language and their note — for the admin notice. */
function renderCustomer(order) {
  const { customer } = order;
  const rows = [
    ['Customer', customer.name],
    ['Company', customer.company],
    ['Org. number', customer.organizationNumber],
    ['Email', customer.email],
    ['Phone', customer.phone],
    ['Language', order.locale?.toUpperCase()],
    ['Note', order.customerNote],
  ].filter(([, value]) => value);

  const html = `
    <table role="presentation" width="100%" style="margin:28px 0 0;border-collapse:collapse;font-size:15px">
      <tbody>
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#8a8172;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
                <td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>`;
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

  return { html, text };
}

/**
 * Tell the shop about a newly placed order: customer, items, totals and address, with a link
 * to it in the admin panel. Goes to ADMIN_EMAIL (comma-separated for several), in English like
 * the panel; replying reaches the customer. Returns whether an email went out; never throws.
 */
export async function sendAdminOrderNotice(order, { origin } = {}) {
  const to = process.env.ADMIN_EMAIL;
  if (!isMailConfigured() || !to || !order) return false;

  try {
    const total = formatPrice(order.total ?? 0, 'en');
    // Sold out while the customer was paying: the order was created cancelled (see payments.js).
    const soldOut = order.status === 'cancelled';
    const customer = renderCustomer(order);
    const summary = renderSummary(order, EMAILS.en, 'en');
    await sendMail({
      ...renderEmail({
        to,
        subject: soldOut ? `Order ${order.number} was cancelled — sold out` : `New order ${order.number} — ${total}`,
        text: soldOut
          ? [`Order ${order.number} from ${order.customer.name} was cancelled automatically.`, order.history.at(-1)?.note]
              .filter(Boolean)
              .join(' ')
          : `${order.customer.name} placed order ${order.number}: ${plural(order.itemCount, 'item')}, ${total} in total.`,
        details: { html: customer.html + summary.html, text: `${customer.text}\n\n${summary.text}` },
        link: `${origin || siteConfig.url}/admin/orders/${order.id}`,
        cta: 'Open the order',
        footer: `Sent to ADMIN_EMAIL for every new order at ${siteConfig.name}. Reply to this email to answer the customer.`,
      }),
      replyTo: order.customer.email || undefined,
    });
    return true;
  } catch (error) {
    console.error(`[order-emails] admin notice for ${order.number} failed:`, error.message);
    return false;
  }
}

/**
 * Email the customer about one order (a serialized order, as the domain returns it).
 * `kind` is a status name, or 'confirmed' for a newly placed order.
 * Returns whether an email went out; never throws.
 */
export async function sendOrderEmail(order, kind, { origin } = {}) {
  if (!isMailConfigured() || !order?.customer?.email) return false;
  const copy = EMAILS[order.locale] ?? EMAILS.en;
  const message = copy[kind];
  if (!message) return false;

  try {
    const locale = EMAILS[order.locale] ? order.locale : 'en';
    const values = { number: order.number, name: firstName(order.customer.name) || order.customer.name };
    await sendMail(
      renderEmail({
        to: order.customer.email,
        subject: interpolate(message.subject, values),
        text: interpolate(message.text, values),
        details: renderSummary(order, copy, locale),
        link: `${origin || siteConfig.url}/${locale}/shop`,
        cta: copy.cta,
        footer: copy.footer,
      })
    );
    return true;
  } catch (error) {
    console.error(`[order-emails] ${kind} email for ${order.number} failed:`, error.message);
    return false;
  }
}

/** A newly placed order: confirmation, or the cancellation notice when it sold out while paying. */
export const sendOrderConfirmation = (order, options) =>
  sendOrderEmail(order, order.status === 'cancelled' ? 'cancelled' : 'confirmed', options);

/** An order whose status an admin just changed. */
export const sendOrderStatusEmail = (order, options) => sendOrderEmail(order, order.status, options);
