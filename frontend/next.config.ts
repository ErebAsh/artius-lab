import path from "path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Automatically load unified .env from the project root
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  // Server-side proxy: browser only calls relative /api/..., Next.js forwards to backend
  // This keeps all backend URLs and ports strictly on the server (no NEXT_PUBLIC_ exposure)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
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
