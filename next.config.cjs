// next.config.js
const nextConfig = {
    reactStrictMode: false,
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob: *",
            },
          ],
        },
      ];
    },
  };
  
  module.exports = nextConfig;
  