/**
 * Middleware utility for API security
 * Provides CSRF protection, rate limiting, and other security features
 */

const { PublicKey } = require('@solana/web3.js');
const crypto = require('crypto');

// Map for request rate limiting
const requestsMap = new Map();
const userRequestsMap = new Map(); // 사용자별 요청 추적
const REQUEST_LIMIT = 30; // Default limit (maximum requests per 30 seconds)
const WINDOW_MS = 30000; // Limitation period (30 seconds)
const USER_REQUEST_LIMIT = 20; // 사용자별 요청 제한
const USER_WINDOW_MS = 30000; // 사용자별 제한 기간

/**
 * Request rate limiting middleware with user-based rate limiting
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
  
  // 사용자별 rate limiting (지갑 주소가 있는 경우)
  const walletAddress = req.body?.wallet || req.query?.wallet;
  if (walletAddress) {
    const userRecord = userRequestsMap.get(walletAddress) || {
      count: 0,
      resetTime: now + USER_WINDOW_MS
    };
    
    if (now > userRecord.resetTime) {
      userRecord.count = 0;
      userRecord.resetTime = now + USER_WINDOW_MS;
    }
    
    userRecord.count += 1;
    userRequestsMap.set(walletAddress, userRecord);
    
    if (userRecord.count > USER_REQUEST_LIMIT) {
      return res.status(429).json({
        error: 'Too many requests from this wallet. Please try again later.'
      });
    }
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
 * CSRF token generation
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF protection middleware with token validation
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
    
    // CSRF 토큰 검증 (향후 구현을 위한 준비)
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    if (process.env.ENABLE_CSRF_TOKENS === 'true' && !csrfToken) {
      return res.status(403).json({ error: 'CSRF token required' });
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

/**
 * Enhanced input validation to prevent injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous characters
  return input
    .replace(/[<>"']/g, '') // HTML/JS injection protection
    .replace(/[;()]/g, '') // SQL injection protection
    .replace(/[{}]/g, '') // NoSQL injection protection
    .trim();
}

/**
 * Validate transaction signatures
 */
function validateTransactionSignature(signature) {
  if (!signature || typeof signature !== 'string') {
    return { error: 'Transaction signature is required' };
  }
  
  // Solana signatures are base58 encoded and 88 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
  if (!base58Regex.test(signature)) {
    return { error: 'Invalid transaction signature format' };
  }
  
  return { valid: true };
}

/**
 * Enhanced security middleware application
 * 
 * @param {Object} options - Options for security middleware
 * @returns {Function} - Middleware function
 */
function createSecurityMiddleware(options = {}) {
  return (req, res, next) => {
    // Apply all security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Apply enhanced CSP
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );
    
    // Apply CSRF protection
    csrfProtection(req, res, (err) => {
      if (err) return next(err);
      
      // Request logging
      apiLogger(req, res, (err) => {
        if (err) return next(err);
        
        // Apply rate limiting with custom options
        rateLimiter(req, res, next, options.rateLimit || {});
      });
    });
  };
}

module.exports = {
  rateLimiter,
  validateRequest,
  validateSolanaAddress,
  validateTransactionSignature,
  apiLogger,
  csrfProtection,
  applyApiSecurity,
  createSecurityMiddleware,
  generateCsrfToken,
  sanitizeInput
};