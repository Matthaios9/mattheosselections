const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // The proxy removes trailing slashes itself, in the same 301 as the redirects for old WordPress URLs.
  skipTrailingSlashRedirect: true,
  images: {
    // Next 16 requires an explicit allowlist. 85 is used for large hero imagery.
    qualities: [75, 85],
    // Product & category images uploaded from the admin panel are served by Cloudinary.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: cloudName ? `/${cloudName}/**` : '/**',
      },
    ],
  },
};

export default nextConfig;
