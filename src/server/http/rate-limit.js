import 'server-only';
import { connectToDatabase } from '@/server/db';
import { RateLimit } from '@/server/models';
import { ApiError } from './errors';

/** The client's IP as Vercel reports it (it sets these headers itself; a client can't choose them). */
const clientIp = (request) =>
  request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

/**
 * At most `limit` requests per IP to one route per `window` seconds, counted in MongoDB so the count holds
 * across serverless instances. Throws a 429 above the limit. If counting fails the request goes through:
 * a hiccup in the limiter must never stop a customer from ordering.
 */
export async function enforceRateLimit(request, { name, limit, window }) {
  const slot = Math.floor(Date.now() / (window * 1000));
  const id = `${name}:${clientIp(request)}:${slot}`;
  let count;
  try {
    await connectToDatabase();
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((slot + 1) * window * 1000) } };
    const increment = () => RateLimit.findOneAndUpdate({ _id: id }, update, { upsert: true, returnDocument: 'after' }).lean();
    // Two first requests at once: one upsert loses the race with a duplicate key and simply counts again.
    ({ count } = await increment().catch((error) => (error.code === 11000 ? increment() : Promise.reject(error))));
  } catch (error) {
    console.error('[rate-limit]', error.message);
    return;
  }
  if (count > limit) throw new ApiError(429, 'rate-limited', 'Too many requests. Please wait a few minutes and try again.');
}
