import 'server-only';
import { connectToDatabase } from '@/server/db';
import { CONTACT_MESSAGE_STATUSES, ContactMessage, NewsletterSubscriber } from '@/server/models';
import { duplicateKeyField, escapeRegex, isObjectId, pageParams, pageResult, toId, toIso } from '@/server/utils';

/** Newsletter sign-ups and contact form messages from the storefront, and their admin views. */

/**
 * Signing up again with the same address keeps the original sign-up.
 * Returns true when the address was added, false when it was already on the list.
 */
export async function subscribeToNewsletter({ email, locale }) {
  await connectToDatabase();
  try {
    const { upsertedCount } = await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { email, locale } },
      { upsert: true }
    );
    return upsertedCount === 1;
  } catch (error) {
    // Two sign-ups racing each other: the other one already saved it.
    if (!duplicateKeyField(error)) throw error;
    return false;
  }
}

export async function saveContactMessage({ name, email, subject, message, locale }) {
  await connectToDatabase();
  await ContactMessage.create({ name, email, subject, message, locale });
}

/* Admin ------------------------------------------------------------------------ */

const serializeSubscriber = (doc) => ({ id: toId(doc._id), email: doc.email, locale: doc.locale, createdAt: toIso(doc.createdAt) });

const serializeMessage = (doc) => ({
  id: toId(doc._id),
  name: doc.name,
  email: doc.email,
  subject: doc.subject,
  message: doc.message,
  locale: doc.locale,
  status: doc.status,
  createdAt: toIso(doc.createdAt),
});

/** Newest sign-ups first. Query: q (email). */
export async function listNewsletterSubscribers({ q = '', page, pageSize = 20 } = {}) {
  await connectToDatabase();
  const filter = q ? { email: new RegExp(escapeRegex(q.trim()), 'i') } : {};
  const paging = pageParams({ page, pageSize });
  const [docs, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.pageSize).lean(),
    NewsletterSubscriber.countDocuments(filter),
  ]);
  return pageResult(docs.map(serializeSubscriber), total, paging);
}

export async function deleteNewsletterSubscriber(id) {
  if (!isObjectId(id)) return false;
  await connectToDatabase();
  const { deletedCount } = await NewsletterSubscriber.deleteOne({ _id: id });
  return deletedCount === 1;
}

/** Newest messages first. Query: status ('new' | 'read'), q (name, email or subject). */
export async function listContactMessages({ status = '', q = '', page, pageSize = 20 } = {}) {
  await connectToDatabase();
  const filter = {};
  if (CONTACT_MESSAGE_STATUSES.includes(status)) filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }];
  }
  const paging = pageParams({ page, pageSize });
  const [docs, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.pageSize).lean(),
    ContactMessage.countDocuments(filter),
  ]);
  return pageResult(docs.map(serializeMessage), total, paging);
}

export async function setContactMessageStatus(id, status) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await ContactMessage.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeMessage(doc) : null;
}

export async function deleteContactMessage(id) {
  if (!isObjectId(id)) return false;
  await connectToDatabase();
  const { deletedCount } = await ContactMessage.deleteOne({ _id: id });
  return deletedCount === 1;
}

/** Totals for the admin tabs and the sidebar badge (unread messages). */
export async function getSubmissionCounts() {
  await connectToDatabase();
  const [subscribers, messages, unread] = await Promise.all([
    NewsletterSubscriber.estimatedDocumentCount(),
    ContactMessage.estimatedDocumentCount(),
    ContactMessage.countDocuments({ status: 'new' }),
  ]);
  return { subscribers, messages, unread };
}
