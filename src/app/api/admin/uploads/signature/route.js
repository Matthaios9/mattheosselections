import { createUploadSignature, isCloudinaryConfigured } from '@/server/cloudinary';
import { parseBody, unavailable, withApi } from '@/server/http';
import { uploadSignatureInput } from '@/server/validation';

/** POST /api/admin/uploads/signature — short-lived signature for a direct browser → Cloudinary upload. */
export const POST = withApi(
  async ({ request }) => {
    const { target } = await parseBody(request, uploadSignatureInput);
    if (!isCloudinaryConfigured()) throw unavailable('Cloudinary is not configured.');
    return createUploadSignature(target);
  },
  { auth: 'admin', requireDatabase: false }
);
