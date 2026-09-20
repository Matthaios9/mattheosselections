import 'server-only';
import { siteConfig } from '@/config/site';
import { interpolate } from '@/i18n/translate';
import { connectToDatabase } from '@/server/db';
import { renderEmail } from '@/server/email';
import { isMailConfigured, sendMail } from '@/server/mailer';
import { Product, STOCK_ALERT_STATUSES, StockAlert } from '@/server/models';
import { escapeRegex, isObjectId, pageParams, pageResult, toId, toIso } from '@/server/utils';
import { pickLocalized } from '@/utils/localize';

/**
 * Back-in-stock notifications ("Notify me when available"), like the WooCommerce shop's
 * Back In Stock Notifier: a customer leaves their email for a sold-out size, gets a short
 * confirmation, and one email when that size is back in stock. Restocks are picked up when a
 * product is saved in the admin or a cancelled order returns items to stock.
 */

const EMAILS = {
  en: {
    confirmSubject: 'We will let you know when {product} is back',
    confirmText:
      'Thank you for your interest in {product} ({size}). It is sold out right now, and we will send you an email as soon as it is back in stock.',
    restockSubject: '{product} is back in stock',
    restockText: 'Good news! {product} ({size}) is back in stock at Mattheos Selections. Quantities are limited, so order soon.',
    cta: 'Shop now',
    footer: 'You receive this email because you asked to be told when this product is back in stock. We only send it once.',
  },
  sv: {
    confirmSubject: 'Vi hör av oss när {product} finns igen',
    confirmText:
      'Tack för ditt intresse för {product} ({size}). Den är slutsåld just nu, och vi mejlar dig så snart den finns i lager igen.',
    restockSubject: '{product} finns i lager igen',
    restockText: 'Goda nyheter! {product} ({size}) finns i lager igen hos Mattheos Selections. Antalet är begränsat, så beställ snart.',
    cta: 'Handla nu',
    footer: 'Du får det här mejlet eftersom du bad oss meddela dig när produkten finns i lager igen. Vi skickar det bara en gång.',
  },
  el: {
    confirmSubject: 'Θα σας ενημερώσουμε όταν το {product} είναι ξανά διαθέσιμο',
    confirmText:
      'Ευχαριστούμε για το ενδιαφέρον σας για το {product} ({size}). Αυτή τη στιγμή έχει εξαντληθεί και θα σας στείλουμε email μόλις είναι ξανά διαθέσιμο.',
    restockSubject: 'Το {product} είναι ξανά διαθέσιμο',
    restockText:
      'Καλά νέα! Το {product} ({size}) είναι ξανά διαθέσιμο στη Mattheos Selections. Οι ποσότητες είναι περιορισμένες, γι’ αυτό παραγγείλτε σύντομα.',
    cta: 'Αγοράστε τώρα',
    footer: 'Λαμβάνετε αυτό το email επειδή ζητήσατε να ενημερωθείτε όταν το προϊόν είναι ξανά διαθέσιμο. Το στέλνουμε μόνο μία φορά.',
  },
};

/** Product name and size label in the customer's language, for one alert. */
function describe(product, variantKey, locale) {
  const variant = product.variants.find((item) => item.key === variantKey);
  return {
    variant,
    values: { product: pickLocalized(product.name, locale), size: variant ? pickLocalized(variant.label, locale) : variantKey },
  };
}

const shopLink = (origin, locale, productName) =>
  `${origin || siteConfig.url}/${locale}/shop?q=${encodeURIComponent(productName)}`;

/**
 * Storefront: ask to be emailed when one size of a sold-out product is back.
 * Returns { ok: true, created, alertId } or { ok: false, reason: 'not-found' | 'in-stock' }.
 */
export async function createStockAlert({ productId, variantKey, email, locale }) {
  if (!isObjectId(productId)) return { ok: false, reason: 'not-found' };
  await connectToDatabase();
  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  const variant = product?.variants.find((item) => item.key === variantKey);
  if (!variant) return { ok: false, reason: 'not-found' };
  if (variant.stock > 0) return { ok: false, reason: 'in-stock' };

  try {
    const result = await StockAlert.updateOne(
      { product: product._id, variantKey, email, status: 'waiting' },
      { $set: { locale } },
      { upsert: true }
    );
    return { ok: true, created: result.upsertedCount === 1, alertId: toId(result.upsertedId) };
  } catch (error) {
    // Two identical requests at the same moment: the other one saved it.
    if (error.code === 11000) return { ok: true, created: false, alertId: null };
    throw error;
  }
}

/** The "we will let you know" email after signing up. Failures are logged, never shown to the customer. */
export async function sendStockAlertConfirmation(alertId, { origin } = {}) {
  if (!alertId || !isMailConfigured()) return;
  try {
    await connectToDatabase();
    const alert = await StockAlert.findById(alertId).lean();
    const product = alert && (await Product.findById(alert.product).lean());
    if (!product) return;
    const copy = EMAILS[alert.locale] ?? EMAILS.en;
    const { values } = describe(product, alert.variantKey, alert.locale);
    await sendMail(
      renderEmail({
        to: alert.email,
        subject: interpolate(copy.confirmSubject, values),
        text: interpolate(copy.confirmText, values),
        link: shopLink(origin, alert.locale, values.product),
        cta: copy.cta,
        footer: copy.footer,
      })
    );
  } catch (error) {
    console.error('[stock-alerts] Confirmation email failed:', error.message);
  }
}

/**
 * Email every waiting customer whose size is back in stock (optionally only for some products).
 * Each alert is claimed before sending, so overlapping runs never email anyone twice; a failed
 * email puts the alert back in the queue. Returns { sent, failed, due, configured }.
 */
export async function sendBackInStockEmails({ productIds, origin } = {}) {
  await connectToDatabase();
  const filter = { status: 'waiting' };
  if (productIds) filter.product = { $in: productIds.filter(isObjectId) };
  const alerts = await StockAlert.find(filter).lean();
  if (!alerts.length) return { sent: 0, failed: 0, due: 0, configured: isMailConfigured() };

  const products = await Product.find({ _id: { $in: [...new Set(alerts.map((alert) => String(alert.product)))] }, status: 'active' }).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  const due = alerts.filter((alert) => {
    const product = byId.get(String(alert.product));
    return product?.variants.some((variant) => variant.key === alert.variantKey && variant.stock > 0);
  });

  if (!due.length || !isMailConfigured()) {
    if (due.length) console.warn(`[stock-alerts] ${due.length} back-in-stock email(s) waiting: email (SMTP) is not configured.`);
    return { sent: 0, failed: 0, due: due.length, configured: isMailConfigured() };
  }

  let sent = 0;
  let failed = 0;
  for (const alert of due) {
    const claimed = await StockAlert.findOneAndUpdate(
      { _id: alert._id, status: 'waiting' },
      { $set: { status: 'notified', notifiedAt: new Date() } }
    );
    if (!claimed) continue;

    const product = byId.get(String(alert.product));
    const copy = EMAILS[alert.locale] ?? EMAILS.en;
    const { values } = describe(product, alert.variantKey, alert.locale);
    try {
      await sendMail(
        renderEmail({
          to: alert.email,
          subject: interpolate(copy.restockSubject, values),
          text: interpolate(copy.restockText, values),
          link: shopLink(origin, alert.locale, values.product),
          cta: copy.cta,
          footer: copy.footer,
        })
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[stock-alerts] Email to ${alert.email} failed:`, error.message);
      await StockAlert.updateOne({ _id: alert._id }, { $set: { status: 'waiting', notifiedAt: null } }).catch(() =>
        // The customer signed up again meanwhile; that newer request stays in the queue.
        StockAlert.deleteOne({ _id: alert._id })
      );
    }
  }
  return { sent, failed, due: due.length, configured: true };
}

/* Admin ------------------------------------------------------------------------ */

function serializeStockAlert(doc) {
  const product = doc.product && typeof doc.product === 'object' && doc.product._id ? doc.product : null;
  const variant = product?.variants?.find((item) => item.key === doc.variantKey);
  return {
    id: toId(doc._id),
    email: doc.email,
    locale: doc.locale,
    status: doc.status,
    product: product
      ? { id: toId(product._id), name: product.name?.en ?? '', image: product.images?.[0]?.url ?? '', status: product.status }
      : null,
    variantKey: doc.variantKey,
    sizeLabel: variant?.label?.en ?? doc.variantKey,
    inStock: (variant?.stock ?? 0) > 0,
    createdAt: toIso(doc.createdAt),
    notifiedAt: toIso(doc.notifiedAt),
  };
}

/** Paginated list for the admin, newest first. Query: status ('waiting' | 'notified'), q (email), product. */
export async function listStockAlerts({ status = '', q = '', product = '', page, pageSize = 20 } = {}) {
  await connectToDatabase();
  const filter = {};
  if (STOCK_ALERT_STATUSES.includes(status)) filter.status = status;
  if (q) filter.email = new RegExp(escapeRegex(q.trim()), 'i');
  if (isObjectId(product)) filter.product = product;

  const paging = pageParams({ page, pageSize });
  const [docs, total, waiting] = await Promise.all([
    StockAlert.find(filter)
      .populate('product', 'name images variants status')
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.pageSize)
      .lean(),
    StockAlert.countDocuments(filter),
    StockAlert.countDocuments({ status: 'waiting' }),
  ]);
  return { ...pageResult(docs.map(serializeStockAlert), total, paging), waiting, emailConfigured: isMailConfigured() };
}

export async function deleteStockAlert(id) {
  if (!isObjectId(id)) return false;
  await connectToDatabase();
  const { deletedCount } = await StockAlert.deleteOne({ _id: id });
  return deletedCount === 1;
}
