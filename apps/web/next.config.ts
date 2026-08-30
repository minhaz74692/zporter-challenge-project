import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @zporter/shared is a workspace package published as raw .ts — let Next compile it.
  transpilePackages: ['@zporter/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
};

export default nextConfig;
