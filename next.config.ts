/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  distDir: isDevelopment ? '.next-dev' : '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
