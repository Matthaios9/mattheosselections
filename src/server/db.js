import mongoose from 'mongoose';

/**
 * Mattheos data lives in its own database on the configured cluster
 * (default "mattheos"), so other databases on the same cluster are never touched.
 * Override with MONGODB_DB.
 */
export const DATABASE_NAME = process.env.MONGODB_DB || 'mattheos';

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

// Reuse one connection across hot reloads and serverless invocations.
const globalCache = globalThis.__mattheosMongoose ?? (globalThis.__mattheosMongoose = { conn: null, promise: null });

export async function connectToDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error('MONGODB_URI is not configured.');
  }
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: DATABASE_NAME,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        globalCache.promise = null;
        throw error;
      });
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
