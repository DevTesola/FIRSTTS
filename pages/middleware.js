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

  // Add security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *.solana.com unpkg.com *.arweave.net *.arweave.dev; img-src 'self' data: blob: ipfs.io cloudflare-ipfs.com gateway.pinata.cloud; connect-src 'self' wss://*.solana.com swr.solana.com *.solscan.io *.arweave.net *.arweave.dev;"
  };

  // Set cache-control header for assets that should be cached
  if (
    request.nextUrl.pathname.includes('/_next/') || 
    request.nextUrl.pathname.includes('/static/') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|mp4|webm)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add font preload for performance (use Google Fonts Orbitron)
  response.headers.set(
    'Link', 
    '<https://fonts.googleapis.com>; rel=preconnect, ' +
    '<https://fonts.gstatic.com>; rel=preconnect; crossorigin, ' +
    '<https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap>; rel=preload; as=style'
  );

  return response;
}

// Configure matching paths - exclude API routes, static files and assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.mp4$).*)'
  ],
};