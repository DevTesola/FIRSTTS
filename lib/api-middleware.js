/**
 * Centralized API middleware exports
 * This file exports middleware functions for API routes
 */

// Import middleware components
import { errorHandler, AppError } from '../api-middlewares/errorHandler.js';
import { rateLimiter } from '../api-middlewares/rateLimit.js';
import { optimizedRateLimiter, createRateLimiter } from '../api-middlewares/optimizedRateLimit.js';
import { 
  applyApiSecurity,
  validateRequest,
  validateSolanaAddress,
  csrfProtection,
  apiLogger
} from '../api-middlewares/apiSecurity.js';

// Import caching middleware
import { withCache, withSWR, clearCache } from '../api-middlewares/apiCache.js';

// Import utility functions
import { sanitizeRequestBody } from '../api-middlewares/securityUtils.js';

/**
 * Apply common middleware to API routes
 * Performance optimized version
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export function applyCommonMiddleware(req, res, next) {
  // Apply security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  // Apply API security middleware - optimized chain
  optimizedRateLimiter(req, res, (err) => {
    if (err) return next(err);
    
    // Skip additional middleware for non-API routes
    if (!req.url.startsWith('/api/')) {
      return next();
    }
    
    apiLogger(req, res, (err) => {
      if (err) return next(err);
      
      csrfProtection(req, res, (err) => {
        if (err) return next(err);
        
        // Continue middleware chain
        next();
      });
    });
  });
}

/**
 * Apply combined middleware functions in sequence
 * 
 * @param {...Function} middlewares - Middleware functions to apply
 * @returns {Function} Combined middleware function
 */
export function applyMiddleware(...middlewares) {
  return (req, res, next) => {
    // Function to run each middleware in sequence
    const runMiddleware = (i) => {
      if (i >= middlewares.length) {
        return next();
      }
      
      // Call the current middleware with a callback to the next one
      middlewares[i](req, res, (err) => {
        if (err) return next(err);
        runMiddleware(i + 1);
      });
    };
    
    runMiddleware(0);
  };
}

/**
 * Apply caching middleware with optimized settings
 * 
 * @param {Object} options - Caching options
 * @returns {Function} Middleware function
 */
export function applyCaching(options = {}) {
  const { 
    ttl = 60, 
    staleWhileRevalidate = false,
    paths = [] 
  } = options;
  
  return (req, res, next) => {
    // Skip caching for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for paths not explicitly included (if paths provided)
    if (paths.length > 0) {
      const shouldCache = paths.some(pattern => {
        if (typeof pattern === 'string') {
          return req.url.includes(pattern);
        } else if (pattern instanceof RegExp) {
          return pattern.test(req.url);
        }
        return false;
      });
      
      if (!shouldCache) {
        return next();
      }
    }
    
    // Apply appropriate caching strategy
    if (staleWhileRevalidate) {
      withSWR({ ttl })(req, res, next);
    } else {
      withCache({ ttl })(req, res, next);
    }
  };
}

/**
 * Predefined middleware combinations for common use cases
 */
export const apiMiddleware = {
  // Basic API protection with optimized rate limiting and error handling
  basic: applyMiddleware(
    optimizedRateLimiter,
    errorHandler
  ),
  
  // Secured API endpoints with additional security measures
  secured: applyMiddleware(
    optimizedRateLimiter,
    csrfProtection,
    validateRequest,
    sanitizeRequestBody,
    errorHandler
  ),
  
  // Cached API endpoints for improved performance
  cached: (options = {}) => applyMiddleware(
    optimizedRateLimiter,
    applyCaching(options),
    errorHandler
  ),
  
  // Read-only data endpoints (highest performance)
  readOnly: (options = {}) => applyMiddleware(
    createRateLimiter({ limit: 60, windowMs: 60000 }), // Higher limits for read-only
    applyCaching({ 
      ttl: options.ttl || 300, // 5 minute default
      staleWhileRevalidate: true
    }),
    errorHandler
  ),
  
  // High-security endpoints with strict rate limiting
  highSecurity: applyMiddleware(
    createRateLimiter({ limit: 10, windowMs: 60000, weight: 2 }),
    csrfProtection,
    validateRequest,
    validateSolanaAddress,
    sanitizeRequestBody,
    errorHandler
  )
};

// Export all middleware and utilities
export {
  // Error handling
  errorHandler,
  AppError,
  
  // Rate limiting
  rateLimiter,
  optimizedRateLimiter,
  createRateLimiter,
  
  // API security
  applyApiSecurity,
  validateRequest,
  validateSolanaAddress,
  csrfProtection,
  apiLogger,
  
  // Caching
  withCache,
  withSWR,
  clearCache,
  
  // Security utilities
  sanitizeRequestBody
};