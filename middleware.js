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
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 매우 완화된 CSP 설정 - 모든 리소스 허용하는 방식으로 설정
  response.headers.set(
    'Content-Security-Policy', 
    "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "img-src * 'self' data: blob:; " +
    "connect-src * 'self' wss:; " +
    "style-src * 'self' 'unsafe-inline'; " +
    "font-src * 'self' data:; " + 
    "script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:;"
  );

  // Set cache-control header for assets that should be cached
  if (
    request.nextUrl.pathname.includes('/_next/') || 
    request.nextUrl.pathname.includes('/static/') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|mp4|webm)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add font preload for performance (use Google Fonts Orbitron)
  response.headers.set(
    'Link', 
    '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin, <https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap>; rel=preload; as=style'
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