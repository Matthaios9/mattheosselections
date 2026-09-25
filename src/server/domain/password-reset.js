import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from '@/server/auth/password';
import { connectToDatabase } from '@/server/db';
import { PasswordReset, User } from '@/server/models';

/**
 * "Forgot password" links: issue one, then spend it once.
 *
 * The link carries a 256-bit random token; only its SHA-256 reaches the database, and the row
 * is deleted the moment it is used, so a link works exactly once and stops working after
 * TOKEN_TTL_MINUTES.
 */

export const TOKEN_TTL_MINUTES = 60;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/**
 * Start a reset for `email`. Returns `{ ok: true, user, token }` when a link should be sent,
 * or `{ ok: false, reason: 'not-found' | 'disabled' }`.
 */
export async function createPasswordReset(email) {
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return { ok: false, reason: 'not-found' };
  if (user.status !== 'active') return { ok: false, reason: 'disabled' };

  const token = randomBytes(32).toString('base64url');
  // One live link per account: asking again makes the previous email useless.
  await PasswordReset.deleteMany({ user: user._id });
  await PasswordReset.create({
    _id: hashToken(token),
    user: user._id,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000),
  });
  return { ok: true, user, token };
}

/**
 * Spend a reset link and set the new password.
 * Returns `{ ok: true, user }` or `{ ok: false, reason: 'invalid' | 'disabled' }`.
 */
export async function resetPasswordWithToken(token, password) {
  await connectToDatabase();
  // Deleting as we read keeps the link single-use even if two requests arrive together.
  const link = await PasswordReset.findByIdAndDelete(hashToken(token)).lean();
  if (!link || link.expiresAt <= new Date()) return { ok: false, reason: 'invalid' };

  const user = await User.findById(link.user).lean(); // passwordHash is select:false, so never in `user`
  if (!user) return { ok: false, reason: 'invalid' };
  if (user.status !== 'active') return { ok: false, reason: 'disabled' };

  await User.updateOne({ _id: user._id }, { passwordHash: await hashPassword(password) });
  return { ok: true, user };
}
