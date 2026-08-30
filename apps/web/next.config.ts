import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @zporter/shared is a workspace package published as raw .ts — let Next compile it.
  transpilePackages: ['@zporter/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Stock cover photos used by the dev seed challenges.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
