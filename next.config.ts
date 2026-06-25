import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Set USE_AUTH_MOCKS=true in .env.local (or Vercel env) to bypass real Clerk.
// When false (production), Clerk is used normally — no code changes required.
const USE_AUTH_MOCKS = process.env.USE_AUTH_MOCKS === 'true';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'fondeo-dev.vercel.app', '*.vercel.app'],
    },
  },
  images: {
    remotePatterns: [],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (USE_AUTH_MOCKS) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@clerk/nextjs': path.join(process.cwd(), 'src/mocks/clerk-client.tsx'),
        '@clerk/nextjs/server': path.join(process.cwd(), 'src/mocks/clerk-server.ts'),
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
