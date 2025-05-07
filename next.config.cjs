// next.config.js
const nextConfig = {
  reactStrictMode: false,
  
  // Disable font optimization - prevents automatic Google Font preloading
  optimizeFonts: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; media-src 'self' blob:; connect-src 'self'; img-src 'self' data: blob: *; font-src 'self' data: fonts.gstatic.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    // Allow Arweave and IPFS gateway domains
    domains: [
      'arweave.net', 
      'www.arweave.net',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'dweb.link',
      'gateway.pinata.cloud',
      'tesola.mypinata.cloud'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare-ipfs.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
        pathname: '/**',
      }
    ],
    // Enable caching for 1 day (86400 seconds) to balance freshness and performance
    minimumCacheTTL: 86400,
    // Cache images on the server (helps intermediate caching)
    cacheMaxAge: 86400,
    // Enable image resizing
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;