import 'server-only';
import mongoose from 'mongoose';

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (value) => mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(String(value));

export const toId = (value) => (value ? String(value) : null);

export const toIso = (value) => (value ? new Date(value).toISOString() : null);

export function pageParams({ page = 1, pageSize = 20 } = {}) {
  const current = Math.max(1, Number.parseInt(page, 10) || 1);
  return { page: current, pageSize, skip: (current - 1) * pageSize };
}

export function pageResult(items, total, { page, pageSize }) {
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Plain `{ en, sv, el }` from a (possibly partial) sub-document. */
export const plainLocalized = (value) => ({ en: value?.en ?? '', sv: value?.sv ?? '', el: value?.el ?? '' });

/** Mongo duplicate-key errors → friendly field errors. */
export function duplicateKeyField(error) {
  if (error?.code !== 11000) return null;
  return Object.keys(error.keyPattern ?? error.keyValue ?? {})[0] ?? 'field';
}
