import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for development to fix the 'older ui' issue
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['192.168.56.1'],
};

export default nextConfig;
