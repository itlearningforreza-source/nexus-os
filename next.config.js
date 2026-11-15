/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Exclude test files from the build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /.(test|spec).(ts|tsx)$/,
        use: 'ignore-loader',
      });
    }
    return config;
  },
  // Exclude test files from TypeScript compilation during build
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
