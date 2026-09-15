import axios from 'axios';
import { GetApiData } from './api';

/** Short-lived signature from our API for a direct browser → Cloudinary upload (the secret never leaves the server). */
export const getUploadSignature = async (target) => {
  const { data } = await GetApiData('/admin/uploads/signature', 'POST', { target });
  return data;
};

/**
 * Upload an image to Cloudinary with progress (0–100). `target`: 'products' | 'categories'.
 * Resolves with `{ url, publicId, alt }`.
 */
export async function uploadImage(file, target, onProgress = () => {}) {
  const signature = await getUploadSignature(target);
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signature.apiKey);
  body.append('timestamp', signature.timestamp);
  body.append('signature', signature.signature);
  body.append('folder', signature.folder);
  body.append('allowed_formats', signature.allowed_formats);

  try {
    // Third-party endpoint, so plain axios rather than GetApiData (which targets our /api).
    const { data } = await axios.post(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, body, {
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return { url: data.secure_url, publicId: data.public_id, alt: '' };
  } catch (error) {
    throw new Error(error.response?.data?.error?.message ?? 'Upload failed.');
  }
}
