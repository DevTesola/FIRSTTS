// middleware/rateLimit.js
// Centralized rate limiting middleware for all API endpoints

// Request tracking map
const requestsMap = new Map();
// Default settings
const DEFAULT_LIMIT = 30; // Default limit (30 requests per 30 seconds)
const DEFAULT_WINDOW_MS = 30000; // Default window (30 seconds)

/**
 * Path-specific rate limit settings
 * More sensitive or resource-intensive APIs can have stricter limits
 */
const PATH_SPECIFIC_LIMITS = {
  // Admin APIs have higher limits
  'admin': {
    limit: 60,
    windowMs: 60000 // 1 minute
  },
  // Minting APIs have stricter limits
  'purchaseNFT': {
    limit: 10,
    windowMs: 60000 // 1 minute
  },
  'completeMinting': {
    limit: 10,
    windowMs: 60000 // 1 minute
  },
  // Staking APIs
  'prepareStaking': {
    limit: 20,
    windowMs: 30000
  },
  'completeStaking': {
    limit: 20, 
    windowMs: 30000
  },
  // Reward APIs
  'claimRewards': {
    limit: 5,
    windowMs: 60000 // 1 minute
  },
  'recordTweetReward': {
    limit: 15,
    windowMs: 60000 // 1 minute
  }
};

/**
 * Get appropriate rate limit settings for a path
 * 
 * @param {string} path - API path
 * @returns {Object} - Appropriate rate limit settings
 */
function getLimitForPath(path) {
  // Extract keyword from path
  for (const [keyword, settings] of Object.entries(PATH_SPECIFIC_LIMITS)) {
    if (path.includes(keyword)) {
      return settings;
    }
  }
  
  // Return default settings if no matching keyword
  return {
    limit: DEFAULT_LIMIT,
    windowMs: DEFAULT_WINDOW_MS
  };
}

/**
 * Rate limiting middleware
 * Applied to all API requests with path-specific limits
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
export function rateLimiter(req, res, next) {
  // Get IP address or other identifier
  const identifier = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    'unknown';
  
  // Get path-specific limits
  const { limit, windowMs } = getLimitForPath(req.url);
  
  // Current time
  const now = Date.now();
  
  // Get or create request record
  const requestRecord = requestsMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
    limits: {} // Object to store path-specific counters
  };
  
  // Reset count if reset time has passed
  if (now > requestRecord.resetTime) {
    requestRecord.count = 0;
    requestRecord.limits = {};
    requestRecord.resetTime = now + windowMs;
  }
  
  // Increment request count
  requestRecord.count += 1;
  
  // Increment path-specific counter
  const pathKey = req.url.split('/').slice(1, 3).join('/'); // e.g. api/purchaseNFT
  requestRecord.limits[pathKey] = (requestRecord.limits[pathKey] || 0) + 1;
  
  // Update map
  requestsMap.set(identifier, requestRecord);
  
  // Check overall limit
  if (requestRecord.count > limit) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retry_after: Math.ceil((requestRecord.resetTime - now) / 1000) // Retry after in seconds
    });
  }
  
  // Check path-specific limit
  if (requestRecord.limits[pathKey] > limit) {
    return res.status(429).json({
      error: `Too many requests to this endpoint. Please try again later.`,
      retry_after: Math.ceil((requestRecord.resetTime - now) / 1000)
    });
  }
  
  // Add rate limit info to headers
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecord.resetTime / 1000));
  
  // Proceed to next middleware
  next();
}

/**
 * Periodically clean up expired request records
 * Prevents memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [identifier, record] of requestsMap.entries()) {
    if (now > record.resetTime) {
      requestsMap.delete(identifier);
    }
  }
}, 60000); // Clean up every minute