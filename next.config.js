/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
  api: { bodyParser: false },
};
module.exports = nextConfig;
