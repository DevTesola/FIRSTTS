// Root middleware.js (Next.js 12+ middleware configuration)
import { NextResponse } from 'next/server';
import { rateLimiter } from './middleware/rateLimit';
import { applyApiSecurity } from './middleware/apiSecurity';

// Middleware function for Next.js 12+
export function middleware(request) {
  // Only apply middleware to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Return the result of the middleware chain
    // Since newer Next.js middleware works differently, we adapt our existing middleware
    
    // Apply basic security headers to all API responses
    const response = NextResponse.next();
    
    // Apply security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Note: Rate limiting needs more complex implementation with NextJS 12+ middleware
    // We're just adding basic headers here as a placeholder
    
    return response;
  }
}

// Configuration for which routes this middleware applies to
export const config = {
  matcher: '/api/:path*', // Apply middleware only to API routes
};