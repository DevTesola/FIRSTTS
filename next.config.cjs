// next.config.js
const nextConfig = {
  reactStrictMode: false,
  
  // Disable font optimization - prevents automatic Google Font preloading
  optimizeFonts: false,
  
  // Exclude specific files from the build process
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
  poweredByHeader: false,
  
  // SSR settings - optimize behaviors related to getInitialProps
  swcMinify: true,
  compiler: {
    // Prevent event handler errors during server rendering
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Runtime settings for Vercel compatibility
  // Removed experimental settings to fix binding error
  
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.devnet.solana.com https://api.mainnet-beta.solana.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';",
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
      'tesola.mypinata.cloud',
      'img.youtube.com'
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

  // Optimize file watching settings - solve issues occurring in WSL environment
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: [
        '**/node_modules',
        '**/.git',
        '**/*.Zone.Identifier'
      ],
      followSymlinks: false,
      poll: 1000, // Use polling, check every 1 second
      aggregateTimeout: 800 // Delay time before rebuild after changes
    };
    
    // Settings for SSR optimization and error prevention
    if (isServer) {
      // Resolve window/document object reference issues during server-side rendering
      const originalEntry = config.entry;
      
      config.entry = async () => {
        const entries = await originalEntry();
        
        if (entries['main.js'] && !entries['main.js'].includes('./utils/clientSideUtils')) {
          entries['main.js'].unshift('./utils/clientSideUtils');
        }
        
        return entries;
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;