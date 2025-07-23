/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable server-side rendering for API routes
  experimental: {
    appDir: false,
  },
  
  // Optimize for production
  output: 'standalone',
  
  // Disable image optimization since this is an API-only app
  images: {
    unoptimized: true,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 