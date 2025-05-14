/**
 * Middleware Integration Module
 * Integrates all middleware components and manages their application order
 */

// Import specific functions from middleware files
const { applyApiSecurity } = require('./apiSecurity');
const { rateLimiter: rateLimit } = require('./rateLimit');
const { errorHandler } = require('./errorHandler');
const apiCache = require('./apiCache');
const securityUtils = require('./securityUtils');
const optimizedRateLimit = require('./optimizedRateLimit');

/**
 * Apply basic security and optimization middleware to API routes
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function applyApiMiddleware(req, res, next) {
  // Apply middleware chain in sequence
  // 1. API security (CORS, headers, etc.)
  // 2. Rate limiting
  // 3. Caching (for GET requests)
  // 4. Error handling

  // Apply API security
  applyApiSecurity(req, res, (err) => {
    if (err) return errorHandler(err, req, res, next);
    
    // Apply rate limiting
    optimizedRateLimit(req, res, (err) => {
      if (err) return errorHandler(err, req, res, next);
      
      // Apply caching only for GET requests
      if (req.method === 'GET') {
        const cacheFn = apiCache.withCache();
        cacheFn(req, res, (err) => {
          if (err) return errorHandler(err, req, res, next);
          next();
        });
      } else {
        next();
      }
    });
  });
}

/**
 * Create middleware wrapper function
 * Function that wraps Next.js API route handlers with middleware
 * 
 * @param {Function} handler - API handler function
 * @returns {Function} - Handler function with middleware applied
 */
function withMiddleware(handler) {
  return function(req, res) {
    applyApiMiddleware(req, res, () => handler(req, res));
  };
}

/**
 * Create middleware wrapper function with caching
 * 
 * @param {Object} options - Caching options
 * @returns {Function} - Function that returns a handler function with middleware applied
 */
function withCache(options = {}) {
  return function(handler) {
    return function(req, res) {
      applyApiSecurity(req, res, (err) => {
        if (err) return errorHandler(err, req, res);
        
        optimizedRateLimit(req, res, (err) => {
          if (err) return errorHandler(err, req, res);
          
          // Apply caching only for GET requests
          if (req.method === 'GET') {
            const customCache = function(req, res, next) {
              // Call apiCache with custom options
              apiCache(req, res, next, options);
            };
            
            customCache(req, res, (err) => {
              if (err) return errorHandler(err, req, res);
              handler(req, res);
            });
          } else {
            handler(req, res);
          }
        });
      });
    };
  };
}

/**
 * Middleware wrapper function - creates standard middleware chain
 */
const createMiddleware = (handler) => {
  return (req, res, next) => {
    applyApiSecurity(req, res, (err) => {
      if (err) return errorHandler(err, req, res);
      
      rateLimit(req, res, (err) => {
        if (err) return errorHandler(err, req, res);
        
        handler(req, res, next);
      });
    });
  };
};

/**
 * Middleware wrapper function - creates middleware chain for read-only APIs (with caching)
 */
const createReadOnlyMiddleware = (handler) => {
  return (req, res, next) => {
    applyApiSecurity(req, res, (err) => {
      if (err) return errorHandler(err, req, res);
      
      rateLimit(req, res, (err) => {
        if (err) return errorHandler(err, req, res);
        
        // Apply caching only for GET requests
        if (req.method === 'GET') {
          const cacheFn = apiCache.withCache();
          cacheFn(handler)(req, res, next);
        } else {
          handler(req, res, next);
        }
      });
    });
  };
};

// Standard middleware array (functions only)
const apiMiddleware = [
  applyApiSecurity,
  rateLimit,
  errorHandler
];

// Middleware array for read-only APIs (functions only)
const readOnlyApiMiddleware = [
  applyApiSecurity,
  rateLimit,
  apiCache.withCache(),
  errorHandler
];

// Export all middleware
module.exports = {
  apiSecurity: applyApiSecurity,
  applyApiSecurity,
  rateLimit,
  optimizedRateLimit,
  errorHandler,
  apiCache,
  securityUtils,
  applyApiMiddleware,
  withMiddleware,
  withCache,
  apiMiddleware,
  readOnlyApiMiddleware
};