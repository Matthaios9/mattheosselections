import 'server-only';
import { connectToDatabase } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { Order, User } from '@/server/models';
import { escapeRegex, isObjectId, pageParams, pageResult, toId, toIso } from '@/server/utils';

function serializeUser(doc, stats) {
  return {
    id: toId(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    status: doc.status,
    phone: doc.phone ?? '',
    lastLoginAt: toIso(doc.lastLoginAt),
    createdAt: toIso(doc.createdAt),
    orderCount: stats?.orderCount ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
  };
}

async function statsFor(userIds) {
  const rows = await Order.aggregate([
    { $match: { user: { $in: userIds }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
  ]);
  return new Map(rows.map((row) => [toId(row._id), row]));
}

export async function countAdmins() {
  await connectToDatabase();
  return User.countDocuments({ role: 'admin' });
}

// A hash of a random password: checked when the email is unknown, so every failed login takes equally long
// and the response time doesn't reveal which emails have an account.
const UNKNOWN_USER_HASH = '$2b$12$Q81B0JndLzNjA.RlGv.aZuPgKIiHH99oCslm.A6rO6ckz5/XFU/z6';

/** Verify credentials. Returns the user document (without hash) or a reason. */
export async function authenticate(email, password) {
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const valid = await verifyPassword(password, user?.passwordHash ?? UNKNOWN_USER_HASH);
  if (!user || !valid) return { ok: false, reason: 'invalid' };
  if (user.status !== 'active') return { ok: false, reason: 'disabled' };
  user.lastLoginAt = new Date();
  await user.save();
  const plain = user.toObject();
  delete plain.passwordHash;
  return { ok: true, user: plain };
}

/**
 * Admin sign-in with an email already verified by Google. The email must belong to an
 * active admin account in the database.
 * Returns { ok, user } or { ok: false, reason: 'not-associated' | 'disabled' }.
 */
export async function authenticateGoogleAdmin(email) {
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.role !== 'admin') return { ok: false, reason: 'not-associated' };
  if (user.status !== 'active') return { ok: false, reason: 'disabled' };
  user.lastLoginAt = new Date();
  await user.save();
  return { ok: true, user: user.toObject() };
}

/** Returns { ok, user } or { ok: false, reason: 'email-taken' }. */
export async function createUser({ name, email, password, role = 'customer' }) {
  await connectToDatabase();
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) return { ok: false, reason: 'email-taken' };
  const doc = await User.create({ name, email, role, passwordHash: await hashPassword(password) });
  const plain = doc.toObject();
  delete plain.passwordHash;
  return { ok: true, user: plain };
}

export async function listUsers({ q = '', role = '', status = '', page, pageSize = 20 } = {}) {
  await connectToDatabase();
  const filter = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (['customer', 'admin'].includes(role)) filter.role = role;
  if (['active', 'disabled'].includes(status)) filter.status = status;
  const paging = pageParams({ page, pageSize });
  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.pageSize).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await statsFor(docs.map((doc) => doc._id));
  return pageResult(
    docs.map((doc) => serializeUser(doc, stats.get(toId(doc._id)))),
    total,
    paging
  );
}

export async function getUser(id) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await User.findById(id).lean();
  if (!doc) return null;
  const stats = await statsFor([doc._id]);
  return serializeUser(doc, stats.get(toId(doc._id)));
}

export async function updateUser(id, fields) {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await User.findByIdAndUpdate(id, fields, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? serializeUser(doc) : null;
}

export async function deleteUser(id) {
  if (!isObjectId(id)) return false;
  await connectToDatabase();
  const doc = await User.findByIdAndDelete(id).lean();
  return Boolean(doc);
}

/**
 * Guards for role/status changes and deletes made by an admin: never lock
 * yourself out or remove the last admin. Returns an error message or null.
 */
export async function userChangeProblem(targetId, admin, { removesAdmin }) {
  if (targetId === admin.id) return 'You cannot change or remove your own account here.';
  if (removesAdmin) {
    const target = await getUser(targetId);
    if (target?.role === 'admin' && (await countAdmins()) <= 1) return 'At least one admin account is required.';
  }
  return null;
}
