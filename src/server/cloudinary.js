import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

export const UPLOAD_TARGETS = ['products', 'categories'];
export const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif';

const rootFolder = () => (process.env.CLOUDINARY_FOLDER || 'mattheos').replace(/^\/+|\/+$/g, '');

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Parameters for a signed, direct browser → Cloudinary upload.
 * The browser never sees the API secret; the signature pins the folder and formats.
 */
export function createUploadSignature(target) {
  const client = configure();
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: `${rootFolder()}/${target}`,
    allowed_formats: ALLOWED_FORMATS,
  };
  const signature = client.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

/** Delete assets we own. Anything outside the configured folder is ignored for safety. */
export async function destroyImages(publicIds = []) {
  const ours = [...new Set(publicIds)].filter((id) => id && id.startsWith(`${rootFolder()}/`));
  if (!ours.length || !isCloudinaryConfigured()) return;
  const client = configure();
  await Promise.allSettled(ours.map((id) => client.uploader.destroy(id, { invalidate: true })));
}
