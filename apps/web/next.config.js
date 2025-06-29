/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'gang-gpt.com'],
  }, env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4828',
  },
  async rewrites() {
    return [
      {
        source: '/api/server/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:4828'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
