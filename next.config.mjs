const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

// The one canonical host, as in siteConfig.url (src/config/site.js).
const CANONICAL_HOST = 'www.mattheosselections.com';

/** Sent with every page and API response (Vercel adds Strict-Transport-Security itself). */
const SECURITY_HEADERS = [
  // No other site may show these pages in a frame (clickjacking); the Kustom checkout frame is embedded by us, not in us.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // The proxy removes trailing slashes itself, in the same 301 as the redirects for old WordPress URLs.
  skipTrailingSlashRedirect: true,
  images: {
    // Next 16 requires an explicit allowlist. 85 is used for large hero imagery.
    qualities: [75, 85],
    // AVIF where the browser supports it (smaller than WebP), WebP otherwise.
    formats: ['image/avif', 'image/webp'],
    // Widest image generated: the default goes up to 3840px, far beyond what a full-width photo on a
    // high-density laptop screen needs. Also caps the widths CloudinaryImage asks Cloudinary for.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    // Optimized images may be cached by browsers for 31 days. The editorial photos in /public rarely change;
    // give a replaced photo a new file name so visitors get it at once.
    minimumCacheTTL: 2678400,
    // Product & category images uploaded from the admin panel are served by Cloudinary.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: cloudName ? `/${cloudName}/**` : '/**',
      },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // The same site answers on *.vercel.app deployment URLs; keep those copies out of search results
      // so Google never weighs them against the real host (duplicate / "Google chose different canonical").
      {
        source: '/:path*',
        missing: [{ type: 'host', value: CANONICAL_HOST }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
