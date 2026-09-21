'use client';

import Image from 'next/image';

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Ask Cloudinary for the exact width next/image needs, in the best format and quality for the browser. */
function cloudinaryLoader({ src, width }) {
  const [, base, path] = src.match(CLOUDINARY_UPLOAD);
  return `${base}f_auto,q_auto,c_limit,w_${width}/${path}`;
}

/**
 * next/image that serves Cloudinary photos straight from Cloudinary's CDN instead of the Next.js optimizer.
 * Any other `src` (e.g. files in /public) renders exactly like a plain next/image.
 */
export default function CloudinaryImage({ src, alt, ...props }) {
  return <Image src={src} alt={alt} loader={CLOUDINARY_UPLOAD.test(src) ? cloudinaryLoader : undefined} {...props} />;
}
