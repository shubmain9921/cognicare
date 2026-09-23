/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Windows / OneDrive file lock and symlink conflicts on dev cache
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
