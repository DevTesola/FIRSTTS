/**
 * Middleware utility for API security
 * Provides CSRF protection, rate limiting, and other security features
 */

const { PublicKey } = require('@solana/web3.js');

// Map for request rate limiting
const requestsMap = new Map();
const REQUEST_LIMIT = 30; // Default limit (maximum requests per 30 seconds)
const WINDOW_MS = 30000; // Limitation period (30 seconds)

/**
 * Request rate limiting middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to call next middleware
 * @param {Object} options - Options
 * @returns {void}
 */
function rateLimiter(req, res, next, options = {}) {
  // Get IP address or other identifier
  const identifier = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    'unknown';
  
  // Current time
  const now = Date.now();
  
  // Options merged with defaults
  const { 
    limit = REQUEST_LIMIT, 
    windowMs = WINDOW_MS 
  } = options;
  
  // Get or create request record
  const requestRecord = requestsMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs
  };
  
  // Reset count if reset time has passed
  if (now > requestRecord.resetTime) {
    requestRecord.count = 0;
    requestRecord.resetTime = now + windowMs;
  }
  
  // Increment request count
  requestRecord.count += 1;
  
  // Update map
  requestsMap.set(identifier, requestRecord);
  
  // Response if limit exceeded
  if (requestRecord.count > limit) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }
  
  // Add limit information to headers
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecord.resetTime / 1000));
  
  // Move to next middleware
  next();
}

/**
 * Request data validation middleware
 * 
 * @param {function} validationFn - Validation function
 * @returns {function} - Middleware function
 */
function validateRequest(validationFn) {
  return (req, res, next) => {
    try {
      const result = validationFn(req);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      next();
    } catch (err) {
      console.error('Validation error:', err);
      return res.status(400).json({ error: err.message });
    }
  };
}

/**
 * Solana wallet address validation
 * 
 * @param {string} address - Wallet address to validate
 * @returns {Object} - Validation result
 */
function validateSolanaAddress(address) {
  if (!address) {
    return { error: 'Wallet address is required' };
  }
  
  try {
    // Attempt to create PublicKey object
    new PublicKey(address);
    return { valid: true };
  } catch (err) {
    return { error: 'Invalid Solana wallet address format' };
  }
}

/**
 * API request logging middleware
 * Outputs detailed logs only in development environment
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to call next middleware
 */
function apiLogger(req, res, next) {
  const start = Date.now();
  
  // Response completion event listener
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Include request body only in development environment (excluding sensitive information)
    if (process.env.NODE_ENV === 'development') {
      const safeBody = { ...req.body };
      
      // Mask sensitive information
      if (safeBody.wallet) {
        safeBody.wallet = `${safeBody.wallet.substring(0, 4)}...${safeBody.wallet.substring(safeBody.wallet.length - 4)}`;
      }
      
      log.body = safeBody;
    }
    
    // Log error status codes as warnings or errors
    if (res.statusCode >= 500) {
      console.error('API Error:', log);
    } else if (res.statusCode >= 400) {
      console.warn('API Warning:', log);
    } else {
      console.log('API Request:', log);
    }
  });
  
  next();
}

/**
 * CSRF protection middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to call next middleware
 */
function csrfProtection(req, res, next) {
  // Check only POST, PUT, DELETE, PATCH requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    
    // List of allowed origins for API paths
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://tesola.xyz'
    ];
    
    // Additional allowances in development environment
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    // Check Origin header
    const isAllowedOrigin = allowedOrigins.some(allowed => 
      origin === allowed || referer.startsWith(allowed)
    );
    
    if (!isAllowedOrigin) {
      console.warn('CSRF protection: Invalid origin', { origin, referer });
      return res.status(403).json({ error: 'Forbidden - CSRF protection' });
    }
  }
  
  next();
}

/**
 * Integrate all security middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to call next middleware
 */
function applyApiSecurity(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Apply CSRF protection
  csrfProtection(req, res, (err) => {
    if (err) return next(err);
    
    // Request logging
    apiLogger(req, res, (err) => {
      if (err) return next(err);
      
      // Apply rate limiting
      rateLimiter(req, res, next);
    });
  });
}

module.exports = {
  rateLimiter,
  validateRequest,
  validateSolanaAddress,
  apiLogger,
  csrfProtection,
  applyApiSecurity
};