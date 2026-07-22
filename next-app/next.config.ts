import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/bni/drmhope.html',
        destination: '/drmhope.html',
      },
      {
        source: '/bni/pipeline.html',
        destination: '/pipeline.html',
      },
    ];
  },
};

export default nextConfig;
