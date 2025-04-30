// pages/api/_middleware.js
// Note: The implementation may vary depending on your Next.js version
// Next.js 12+ uses a slightly different middleware approach

import { rateLimiter } from '../../middleware/rateLimit';
import { applyApiSecurity } from '../../middleware/apiSecurity';

// Middleware chain configuration
export default function middleware(req, res, next) {
  // 1. Apply rate limiting
  rateLimiter(req, res, (err) => {
    if (err) return next(err);
    
    // 2. Apply API security middleware chain
    applyApiSecurity(req, res, next);
  });
}

// Middleware configuration
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};