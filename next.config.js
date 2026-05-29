/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      // Backend uploads served from ECommerce.API in dev
      { protocol: 'http', hostname: 'localhost', port: '5080' },
      { protocol: 'https', hostname: 'localhost', port: '7080' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5080' },
      // Production — uploads served through Nginx on the public domain
      { protocol: 'https', hostname: 'code994.az' },
      { protocol: 'https', hostname: 'www.code994.az' },
    ],
  },
};

module.exports = nextConfig;
