import { jwtVerify, SignJWT } from 'jose';

/**
 * Stateless session tokens (HS256 JWT in an httpOnly cookie).
 * Kept dependency-free of the database so the proxy can use it for optimistic checks.
 */
export const SESSION_COOKIE = 'ms_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days

function getKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) throw new Error('JWT_SECRET must be set (16+ characters).');
  return new TextEncoder().encode(secret);
}

/** `admin: true` only for sessions started by the Google admin sign-in (see /api/admin/auth/google). */
export async function encodeSession({ userId, role, admin = false }, maxAge = SESSION_MAX_AGE) {
  return new SignJWT({ role, admin })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(getKey());
}

/** Returns `{ userId, role, admin }` or null for missing/expired/tampered tokens. */
export async function decodeSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });
    return { userId: payload.sub, role: payload.role, admin: payload.admin === true };
  } catch {
    return null;
  }
}
