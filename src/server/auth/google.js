import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';

/** "Sign in with Google" needs GOOGLE_CLIENT_ID (OAuth 2.0 client of type "Web application"). */
export const isGoogleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID);

// Google's public signing keys (cached and rotated automatically by jose).
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

/**
 * Verify a Google ID token from the Sign in with Google button: signature, issuer,
 * audience (our client id) and expiry. Returns the verified email and profile, or
 * null when the token is invalid or the email isn't verified by Google.
 */
export async function verifyGoogleIdToken(credential) {
  try {
    const { payload } = await jwtVerify(credential, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    if (!payload.email || payload.email_verified !== true) return null;
    return { email: String(payload.email).toLowerCase(), name: payload.name ?? '', picture: payload.picture ?? '' };
  } catch {
    return null;
  }
}
