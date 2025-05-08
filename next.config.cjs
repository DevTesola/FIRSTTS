// next.config.js
const nextConfig = {
  reactStrictMode: false,
  
  // Disable font optimization - prevents automatic Google Font preloading
  optimizeFonts: false,
  
  // 빌드 프로세스에서 특정 파일 제외
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
  poweredByHeader: false,
  
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

  // 파일 감시 설정 최적화 - WSL 환경에서 발생하는 문제 해결
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: [
        '**/node_modules',
        '**/.git',
        '**/*.Zone.Identifier'
      ],
      followSymlinks: false,
      poll: 1000, // 폴링 사용, 1초마다 확인
      aggregateTimeout: 800 // 변경 후 리빌드 지연시간
    };
    return config;
  },
};

module.exports = nextConfig;