import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vision.olevel.ai',
        pathname: '/up/**',
      },
      {
        protocol: 'https',
        hostname: 'n8n.olevel.ai',
      },
      {
        protocol: 'https',
        hostname: '**.olevel.ai',
      },
    ],
  },
};

export default nextConfig;
