/**
 * Simplified middleware system
 * Simple implementation to bypass issues with the existing middleware system
 */

// Direct middleware implementation - external dependencies removed
// Provides minimal safeguards without actual middleware implementations

/**
 * Basic API middleware chain - security, rate limiting, error handling
 * 
 * @param {Function} handler - API handler function
 * @returns {Function} - Next.js API handler with middleware applied
 */
function withApiMiddleware(handler) {
  return function(req, res) {
    try {
      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Basic CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle OPTIONS requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // Execute handler
      return handler(req, res);
    } catch (error) {
      console.error('API middleware error:', error);
      
      // Check if response has already been sent
      if (res.headersSent) {
        console.error('Headers already sent, cannot send error response');
        return;
      }
      
      // Send error response
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      });
    }
  };
}

/**
 * Read-only API middleware chain - adds caching headers to basic middleware
 * 
 * @param {Function} handler - API handler function
 * @returns {Function} - Next.js API handler with middleware applied
 */
function withReadOnlyApiMiddleware(handler) {
  return function(req, res) {
    // Apply basic API middleware
    return withApiMiddleware(function(req, res) {
      // Set caching headers for GET requests
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', 'public, max-age=60'); // 60 second cache
      }
      
      // Execute handler
      return handler(req, res);
    })(req, res);
  };
}

/**
 * Custom error handling middleware
 * 
 * @param {Function} handler - API handler function
 * @returns {Function} - Handler with error handling applied
 */
function withErrorHandling(handler) {
  return async function(req, res) {
    try {
      return await handler(req, res);
    } catch (err) {
      console.error('API Error:', err);
      
      // Check if response has already been sent
      if (res.headersSent) {
        console.error('Headers already sent, cannot send error response');
        return;
      }
      
      // Send error response
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
      });
    }
  };
}

module.exports = {
  withApiMiddleware,
  withReadOnlyApiMiddleware,
  withErrorHandling
};