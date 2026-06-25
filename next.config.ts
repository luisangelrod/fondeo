import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [],
  },
  // TypeScript is checked separately via `tsc --noEmit`; skip in build for speed
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (process.env.DISABLE_AUTH === 'true') {
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
