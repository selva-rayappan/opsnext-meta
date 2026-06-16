import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  },
  // Transpile the shared workspace package so Next.js can handle its TypeScript
  transpilePackages: ['@opsnext/shared'],
};

export default nextConfig;
