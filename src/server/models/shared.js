import mongoose from 'mongoose';

/** `{ en, sv, el }` text used for every translatable catalog field. English is required. */
export function localizedString({ required = false } = {}) {
  return new mongoose.Schema(
    {
      en: { type: String, trim: true, default: '', ...(required ? { required: true } : {}) },
      sv: { type: String, trim: true, default: '' },
      el: { type: String, trim: true, default: '' },
    },
    { _id: false }
  );
}

export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '' }, // Cloudinary asset id (empty for bundled /public images)
    alt: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/**
 * Compile a model once in production. In development the model is recompiled on
 * every hot reload so schema edits take effect without restarting the server.
 */
export function getModel(name, schema) {
  if (process.env.NODE_ENV !== 'production' && mongoose.models[name]) mongoose.deleteModel(name);
  return mongoose.models[name] || mongoose.model(name, schema);
}
