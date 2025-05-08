import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for global web routes
 * 
 * This middleware runs on all server-rendered pages (not API routes or static assets)
 * and applies security headers. It's separate from API middleware.
 * 
 * @param {Object} request - Next.js request object
 * @returns {Object} Response with added headers
 */
export function middleware(request) {
  // Get a response object
  const response = NextResponse.next();

  // Define secure headers - keeping only essential ones for compatibility
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Simplified CSP to avoid conflicts
  response.headers.set(
    'Content-Security-Policy', 
    "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  return response;
}

// Configure matching paths - exclude API routes, static files and assets
// Updated matcher to be more precise and avoid conflicts with API middleware
export const config = {
  matcher: [
    // Apply middleware to all pages but not to API routes, static files, or assets
    '/((?!api/|_next/static|_next/image|_next/data|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.mp4$|.*\\.webm$|.*\\.webp$|.*\\.ico$).*)'
  ],
};