/**
 * Centralized security configuration settings for the TESOLA project
 * This file contains all security-related settings used throughout the application
 */

/**
 * Content Security Policy (CSP) configuration
 * Defines allowed sources for various resource types
 */
export const cspConfig = {
  // API routes - strict CSP
  api: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"]
  },
  
  // Frontend routes - more permissive CSP
  frontend: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://cdn.solana.com"],
    'connect-src': [
      "'self'",
      "https://*.solana.com",
      "wss://*.solana.com",
      "https://ipfs.io",
      "https://*.supabase.co"
    ],
    'img-src': ["'self'", "data:", "https://*.pinata.cloud", "https://ipfs.io"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'frame-ancestors': ["'none'"],
    'font-src': ["'self'", "https://fonts.gstatic.com"]
  }
};

/**
 * CORS Configuration
 * Defines allowed origins, methods, and headers for Cross-Origin Resource Sharing
 */
export const corsConfig = {
  // Allowed origins for CORS requests
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://tesola.xyz',
    'https://phantom.app',
    'https://solflare.com',
    'https://www.backpack.exchange',
    'https://chrome-extension://',
    'moz-extension://'
  ],
  
  // Add localhost in development mode
  developmentOrigins: [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000'
  ],
  
  // Allowed methods
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  // Credentials allowed
  allowCredentials: true,
  
  // Max age for preflight requests (in seconds)
  maxAge: 86400 // 24 hours
};

/**
 * Rate Limiting Configuration
 * Defines limits for various API endpoints
 */
export const rateLimitConfig = {
  // Default limit for all API endpoints
  default: {
    limit: 30,       // 30 requests per window
    windowMs: 30000  // 30 seconds window
  },
  
  // Endpoint-specific limits
  endpoints: {
    // Admin routes - higher limits
    admin: {
      limit: 60,
      windowMs: 60000 // 1 minute
    },
    
    // NFT minting - stricter limits
    purchaseNFT: {
      limit: 10,
      windowMs: 60000 // 1 minute
    },
    completeMinting: {
      limit: 10,
      windowMs: 60000 // 1 minute
    },
    
    // Staking routes
    prepareStaking: {
      limit: 20,
      windowMs: 30000 // 30 seconds
    },
    completeStaking: {
      limit: 20,
      windowMs: 30000 // 30 seconds
    },
    
    // Rewards routes
    claimRewards: {
      limit: 5,
      windowMs: 60000 // 1 minute
    },
    recordTweetReward: {
      limit: 15,
      windowMs: 60000 // 1 minute
    }
  }
};

/**
 * Authentication Configuration
 */
export const authConfig = {
  // JWT settings (if used)
  jwt: {
    expiresIn: '24h',
    algorithm: 'HS256'
  },
  
  // Session settings
  session: {
    maxAge: 86400, // 24 hours in seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  
  // CSRF token settings
  csrf: {
    cookieName: 'csrf_token',
    headerName: 'X-CSRF-Token',
    expiresIn: 3600 // 1 hour in seconds
  },
  
  // Password hashing settings (if needed)
  password: {
    saltRounds: 12,
    minLength: 8
  }
};

/**
 * Security Headers Configuration
 * Common security headers applied to all responses
 */
export const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  },
  {
    // Only apply in production
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];

/**
 * Build CSP header string from configuration object
 * 
 * @param {string} type - Configuration type ('api' or 'frontend')
 * @returns {string} - CSP header value
 */
export function buildCspHeader(type = 'frontend') {
  const config = type === 'api' ? cspConfig.api : cspConfig.frontend;
  
  return Object.entries(config)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')};`)
    .join(' ');
}

/**
 * Get allowed CORS origins based on environment
 * 
 * @returns {Array<string>} - Allowed origins
 */
export function getAllowedOrigins() {
  const origins = [...corsConfig.allowedOrigins];
  
  // Add development origins in development environment
  if (process.env.NODE_ENV === 'development') {
    origins.push(...corsConfig.developmentOrigins);
  }
  
  return origins;
}

/**
 * Check if origin is allowed for CORS
 * 
 * @param {string} origin - Request origin
 * @returns {boolean} - Whether origin is allowed
 */
export function isOriginAllowed(origin) {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}