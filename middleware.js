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

  // Define secure headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'same-origin');
  
  // Enhanced CSP - stricter policy
  response.headers.set(
    'Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.supabase.co; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co https://*.helius-rpc.com wss://*.solana.com https://api.coingecko.com; " +
    "frame-src 'self' https://phantom.app https://solflare.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );

  return response;
}

// Configure matching paths
export const config = {
  matcher: [
    // Apply middleware to all pages
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.mp4$|.*\\.webm$|.*\\.webp$|.*\\.ico$).*)'
  ],
};