/**
 * Security Checker for Staking Synchronization
 * Provides utilities for validating and securing API requests
 */

const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token to generate
 * @returns {string} Random token in hex format
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate admin API key
 * @param {string} providedKey - API key from the request
 * @param {string} correctKey - Correct API key from environment
 * @returns {boolean} Whether the key is valid
 */
function validateAdminKey(providedKey, correctKey) {
  if (!providedKey || !correctKey) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedKey, 'utf8'),
    Buffer.from(correctKey, 'utf8')
  );
}

/**
 * Validate cron job secret
 * @param {string} providedSecret - Secret from the request
 * @param {string} correctSecret - Correct secret from environment
 * @returns {boolean} Whether the secret is valid
 */
function validateCronSecret(providedSecret, correctSecret) {
  if (!providedSecret || !correctSecret) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedSecret, 'utf8'),
    Buffer.from(correctSecret, 'utf8')
  );
}

/**
 * Rate limiting utility
 * Simple in-memory rate limiting implementation
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = {};
  }
  
  /**
   * Check if a request should be limited
   * @param {string} ip - IP address or identifier
   * @returns {boolean} Whether the request should be limited
   */
  isLimited(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Initialize or clean up old requests
    if (!this.requests[ip]) {
      this.requests[ip] = [];
    }
    
    // Remove old requests outside the window
    this.requests[ip] = this.requests[ip].filter(time => time > windowStart);
    
    // Check if limit is exceeded
    if (this.requests[ip].length >= this.maxRequests) {
      return true;
    }
    
    // Add current request
    this.requests[ip].push(now);
    return false;
  }
  
  /**
   * Reset rate limiting for an IP
   * @param {string} ip - IP address or identifier to reset
   */
  reset(ip) {
    delete this.requests[ip];
  }
}

/**
 * Request validator for admin API
 */
class AdminRequestValidator {
  /**
   * Validate an admin API request
   * @param {Object} req - Express/Next.js request object
   * @param {Object} res - Express/Next.js response object
   * @returns {boolean} Whether the request is valid
   */
  static validate(req, res) {
    // Check method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return false;
    }
    
    // Check content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({ error: 'Invalid Content-Type, expected application/json' });
      return false;
    }
    
    // Check admin key
    const adminKey = req.headers['admin_key'] || req.headers['admin-key'];
    if (!adminKey || !validateAdminKey(adminKey, process.env.ADMIN_SECRET_KEY)) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
    
    // Check required fields in body
    if (!req.body || !req.body.action) {
      res.status(400).json({ error: 'Invalid request body, action is required' });
      return false;
    }
    
    return true;
  }
}

/**
 * Request validator for cron API
 */
class CronRequestValidator {
  /**
   * Validate a cron API request
   * @param {Object} req - Express/Next.js request object
   * @param {Object} res - Express/Next.js response object
   * @returns {boolean} Whether the request is valid
   */
  static validate(req, res) {
    // Check method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return false;
    }
    
    // Check cron secret
    const cronSecret = req.headers['x-cron-secret'];
    if (!cronSecret || !validateCronSecret(cronSecret, process.env.CRON_SECRET_KEY)) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
    
    return true;
  }
}

/**
 * Create a secure random cron secret
 * @returns {string} Generated cron secret
 */
function generateCronSecret() {
  const secret = generateSecureToken(32);
  console.log('Generated CRON_SECRET_KEY:', secret);
  console.log('Add this to your .env file: CRON_SECRET_KEY=', secret);
  return secret;
}

/**
 * Create a secure random admin key
 * @returns {string} Generated admin key
 */
function generateAdminKey() {
  const key = generateSecureToken(32);
  console.log('Generated ADMIN_SECRET_KEY:', key);
  console.log('Add this to your .env file: ADMIN_SECRET_KEY=', key);
  return key;
}

// Create rate limiter instance for admin API
const adminApiRateLimiter = new RateLimiter(60000, 30); // 30 requests per minute

module.exports = {
  validateAdminKey,
  validateCronSecret,
  generateSecureToken,
  generateCronSecret,
  generateAdminKey,
  RateLimiter,
  adminApiRateLimiter,
  AdminRequestValidator,
  CronRequestValidator
};