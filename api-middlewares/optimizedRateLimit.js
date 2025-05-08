// middleware/optimizedRateLimit.js
// Performance-optimized rate limiting middleware for API endpoints

/**
 * LRU Cache implementation for rate limiting
 * Limits memory usage by removing oldest entries when capacity is reached
 */
class LRUCache {
  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = {};
    this.tail = {};
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Add/update a key in the cache
  put(key, value) {
    // Remove if exists
    this.remove(key);
    
    // Create new node
    const node = { key, value, next: null, prev: null };
    
    // Add to front
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    
    // Store in cache
    this.cache.set(key, node);
    
    // Evict if over capacity
    if (this.cache.size > this.capacity) {
      // Get last node
      const lastNode = this.tail.prev;
      this.remove(lastNode.key);
    }
  }

  // Get a value from cache
  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to front (most recently used)
    const node = this.cache.get(key);
    this.remove(key);
    this.put(key, node.value);
    
    return node.value;
  }

  // Remove item from cache
  remove(key) {
    if (!this.cache.has(key)) return;
    
    const node = this.cache.get(key);
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.cache.delete(key);
  }

  // Get all entries
  entries() {
    return Array.from(this.cache.entries());
  }
}

// Request tracking using LRU cache
const requestsCache = new LRUCache(2000); // Store max 2000 IPs

// Default settings
const DEFAULT_LIMIT = 30; // Default limit (30 requests per 30 seconds)
const DEFAULT_WINDOW_MS = 30000; // Default window (30 seconds)

/**
 * Path-specific rate limit settings with more granular control
 */
const PATH_SPECIFIC_LIMITS = {
  // Admin APIs have higher limits
  'admin': {
    limit: 60,
    windowMs: 60000, // 1 minute
    weight: 1 // Request weight multiplier
  },
  // Minting APIs have stricter limits
  'purchaseNFT': {
    limit: 10,
    windowMs: 60000, // 1 minute
    weight: 2 // Higher weight - more expensive operation
  },
  'completeMinting': {
    limit: 10,
    windowMs: 60000, // 1 minute
    weight: 2
  },
  // Staking APIs
  'prepareStaking': {
    limit: 20,
    windowMs: 30000,
    weight: 1.5
  },
  'completeStaking': {
    limit: 20, 
    windowMs: 30000,
    weight: 1.5
  },
  // Reward APIs
  'claimRewards': {
    limit: 5,
    windowMs: 60000, // 1 minute
    weight: 3 // Very high weight - very expensive operation
  },
  'recordTweetReward': {
    limit: 15,
    windowMs: 60000, // 1 minute
    weight: 1
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
    windowMs: DEFAULT_WINDOW_MS,
    weight: 1
  };
}

/**
 * Get client identifier with fallbacks
 * 
 * @param {Object} req - Request object
 * @returns {string} Client identifier
 */
function getClientIdentifier(req) {
  return (
    req.headers['x-forwarded-for'] || 
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress || 
    'unknown'
  );
}

/**
 * Optimized rate limiting middleware
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
function optimizedRateLimiter(req, res, next) {
  // Skip rate limiting for non-API routes for better performance
  if (!req.url.startsWith('/api/')) {
    return next();
  }
  
  // Get client identifier
  const identifier = getClientIdentifier(req);
  
  // Get path-specific limits
  const pathKey = req.url.split('/').slice(1, 3).join('/'); // e.g. api/purchaseNFT
  const { limit, windowMs, weight } = getLimitForPath(req.url);
  
  // Current time
  const now = Date.now();
  
  // Get or create request record
  let requestRecord = requestsCache.get(identifier);
  if (!requestRecord) {
    requestRecord = {
      count: 0,
      resetTime: now + windowMs,
      limits: {}, // Object to store path-specific counters
      firstRequest: now
    };
  }
  
  // Reset count if reset time has passed
  if (now > requestRecord.resetTime) {
    requestRecord.count = 0;
    requestRecord.limits = {};
    requestRecord.resetTime = now + windowMs;
  }
  
  // Increment request count with weight
  requestRecord.count += weight;
  
  // Increment path-specific counter
  requestRecord.limits[pathKey] = (requestRecord.limits[pathKey] || 0) + weight;
  
  // Suspicious activity detection (many requests in short time)
  const timeSinceFirst = now - requestRecord.firstRequest;
  const requestRate = requestRecord.count / (timeSinceFirst / 1000);
  
  // Update cache
  requestsCache.put(identifier, requestRecord);
  
  // Enhanced abuse detection - if rate is extremely high, block immediately
  if (requestRate > 10 && requestRecord.count > 15) {
    // Log potential abuse
    console.warn(`Potential API abuse detected: ${identifier}, rate: ${requestRate.toFixed(2)} req/sec`);
    
    return res.status(429).json({
      error: 'Rate limit exceeded. Unusual activity detected.',
      retry_after: 60 // 1 minute penalty for suspicious activity
    });
  }
  
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

// Last cleaned timestamp to track cleaning schedule
let lastCleaned = Date.now();

/**
 * Middleware factory for rate limiting
 * Allows configuration and setup for different endpoints
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Configured middleware function
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    limit = DEFAULT_LIMIT,
    keyGenerator = getClientIdentifier,
    skip = () => false,
    weight = 1
  } = options;
  
  return function(req, res, next) {
    // Skip if specified
    if (skip(req)) {
      return next();
    }
    
    // Clean up expired records every 10 minutes
    const now = Date.now();
    if (now - lastCleaned > 600000) {
      cleanupExpiredRecords();
      lastCleaned = now;
    }
    
    // Get client identifier
    const identifier = keyGenerator(req);
    
    // Get or create request record
    let requestRecord = requestsCache.get(identifier);
    if (!requestRecord) {
      requestRecord = {
        count: 0,
        resetTime: now + windowMs,
        limits: {},
        firstRequest: now
      };
    }
    
    // Reset count if reset time has passed
    if (now > requestRecord.resetTime) {
      requestRecord.count = 0;
      requestRecord.limits = {};
      requestRecord.resetTime = now + windowMs;
    }
    
    // Increment request count
    requestRecord.count += weight;
    
    // Update cache
    requestsCache.put(identifier, requestRecord);
    
    // Check limit
    if (requestRecord.count > limit) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retry_after: Math.ceil((requestRecord.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit info to headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestRecord.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecord.resetTime / 1000));
    
    next();
  };
}

/**
 * Clean up expired request records
 * Uses more efficient cleanup approach
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  const entries = requestsCache.entries();
  
  for (const [key, record] of entries) {
    if (now > record.resetTime) {
      requestsCache.remove(key);
    }
  }
}

// Export middleware and factory
module.exports = {
  rateLimiter: optimizedRateLimiter,
  createRateLimiter
};