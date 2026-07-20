import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [{
      source: '/bni/drmhope.html',
      destination: '/drmhope.html',
    }];
  },
};

export default nextConfig;
