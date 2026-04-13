/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  distDir: isDevelopment ? '.next-dev' : '.next',
  // Standalone output bundles only the node_modules actually used,
  // reducing the production image from ~1 GB to ~150–200 MB.
  output: isDevelopment ? undefined : 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
