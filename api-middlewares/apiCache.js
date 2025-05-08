// middleware/apiCache.js
// Optimized API response caching middleware for Next.js

/**
 * In-memory cache with TTL (Time To Live)
 * Optimized with LRU eviction
 */
class MemoryCache {
  constructor(maxSize = 100, defaultTTL = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
    this.keyTimestamps = new Map(); // For LRU tracking
  }

  /**
   * Set value in cache with TTL
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  set(key, value, ttl) {
    const ttlMs = (ttl || this.defaultTTL) * 1000;
    const expires = Date.now() + ttlMs;
    
    // Enforce capacity limits with LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    // Store value with expiration
    this.cache.set(key, {
      value,
      expires
    });
    
    // Update access timestamp for LRU
    this.keyTimestamps.set(key, Date.now());
  }

  /**
   * Get value from cache
   * 
   * @param {string} key - Cache key 
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    // Not found
    if (!item) {
      return null;
    }
    
    // Expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.keyTimestamps.delete(key);
      return null;
    }
    
    // Update access timestamp for LRU
    this.keyTimestamps.set(key, Date.now());
    
    return item.value;
  }

  /**
   * Clear entire cache or specific key
   * 
   * @param {string} key - Optional key to clear
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
      this.keyTimestamps.delete(key);
    } else {
      this.cache.clear();
      this.keyTimestamps.clear();
    }
  }

  /**
   * Evict the oldest (least recently used) item
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    // Find oldest key based on access timestamp
    for (const [key, timestamp] of this.keyTimestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    // Remove oldest item
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.keyTimestamps.delete(oldestKey);
    }
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        this.keyTimestamps.delete(key);
      }
    }
  }
}

// Global cache instance for all API endpoints
const globalCache = new MemoryCache(500, 60); // 500 items, 60s default TTL

// Start periodic cleanup to prevent memory leaks
setInterval(() => {
  globalCache.cleanup();
}, 60000); // Cleanup every minute

/**
 * Generate cache key from request
 * 
 * @param {Object} req - Request object
 * @returns {string} Cache key
 */
function generateCacheKey(req) {
  const url = req.url || req.parsedUrl?.pathname || '';
  const params = JSON.stringify(req.query || {});
  const user = req.headers['x-user-id'] || 'anonymous';
  
  return `${url}:${params}:${user}`;
}

/**
 * Cache middleware for API responses
 * 
 * @param {Object} options - Cache options
 * @returns {Function} Middleware function
 */
function withCache(options = {}) {
  const {
    ttl = 60, // Default TTL: 60 seconds
    methods = ['GET'], // Only cache GET by default
    keyGenerator = generateCacheKey,
    skip = () => false, // Function to determine if cache should be skipped
    debug = false // Debug mode
  } = options;
  
  return async function(req, res, next) {
    // Skip caching for non-cacheable methods
    if (!methods.includes(req.method) || skip(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cachedResponse = globalCache.get(cacheKey);
    if (cachedResponse) {
      if (debug) {
        console.log(`Cache hit: ${cacheKey}`);
      }
      
      // Add cache header
      res.setHeader('X-Cache', 'HIT');
      
      // Return cached response
      return res.status(cachedResponse.status)
        .setHeader('Content-Type', cachedResponse.contentType)
        .send(cachedResponse.data);
    }
    
    if (debug) {
      console.log(`Cache miss: ${cacheKey}`);
    }
    
    // Add cache header
    res.setHeader('X-Cache', 'MISS');
    
    // Intercept the response to cache it
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Only cache successful responses
        const contentType = res.getHeader('content-type') || 'application/json';
        
        globalCache.set(cacheKey, {
          data,
          status: res.statusCode,
          contentType
        }, ttl);
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Apply stale-while-revalidate caching strategy
 * Returns cached data immediately while refreshing in background
 * 
 * @param {Object} options - Cache options 
 * @returns {Function} Middleware function
 */
function withSWR(options = {}) {
  const {
    ttl = 60, // Cache TTL: 60 seconds
    staleWhileRevalidateTtl = 600, // How long to serve stale content: 10 minutes
    keyGenerator = generateCacheKey,
    methods = ['GET'],
    skip = () => false,
    debug = false
  } = options;
  
  return async function(req, res, next) {
    // Skip caching for non-cacheable methods
    if (!methods.includes(req.method) || skip(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cachedResponse = globalCache.get(cacheKey);
    
    // Flag to track if we need to revalidate
    let needsRevalidation = false;
    
    if (cachedResponse) {
      if (debug) {
        console.log(`Cache: ${cacheKey} - age: ${(Date.now() - cachedResponse.timestamp) / 1000}s`);
      }
      
      // Check if cache is stale
      const cacheAge = Date.now() - cachedResponse.timestamp;
      if (cacheAge > ttl * 1000) {
        // Cache is stale but still within stale-while-revalidate window
        if (cacheAge < staleWhileRevalidateTtl * 1000) {
          needsRevalidation = true;
          res.setHeader('X-Cache', 'STALE');
        } else {
          // Cache is too old, don't use it
          if (debug) {
            console.log(`Cache expired: ${cacheKey}`);
          }
          res.setHeader('X-Cache', 'EXPIRED');
        }
      } else {
        // Cache is fresh
        res.setHeader('X-Cache', 'HIT');
      }
      
      // Use cached response if available (even if stale)
      if (cachedResponse) {
        res.status(cachedResponse.status)
          .setHeader('Content-Type', cachedResponse.contentType)
          .send(cachedResponse.data);
        
        // If cache is stale, revalidate in background
        if (needsRevalidation) {
          // Clone the request for background processing
          const reqClone = { ...req, headers: { ...req.headers } };
          
          // Execute handler in background
          setTimeout(() => {
            if (debug) {
              console.log(`Background revalidation: ${cacheKey}`);
            }
            
            // This will update the cache without affecting the already sent response
            next();
          }, 10); // Small delay to prioritize main thread
        }
        
        return;
      }
    }
    
    // Cache miss or expired
    res.setHeader('X-Cache', 'MISS');
    
    // Intercept the response to cache it
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Only cache successful responses
        const contentType = res.getHeader('content-type') || 'application/json';
        
        globalCache.set(cacheKey, {
          data,
          status: res.statusCode,
          contentType,
          timestamp: Date.now()
        }, staleWhileRevalidateTtl); // Use the longer TTL
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Clear the cache for specific routes
 * 
 * @param {string|RegExp} pattern - Optional URL pattern to match
 */
function clearCache(pattern) {
  if (!pattern) {
    // Clear entire cache
    globalCache.clear();
    return;
  }
  
  // Clear specific keys matching pattern
  for (const [key] of globalCache.cache.entries()) {
    const [url] = key.split(':');
    
    if (
      (typeof pattern === 'string' && url.includes(pattern)) ||
      (pattern instanceof RegExp && pattern.test(url))
    ) {
      globalCache.clear(key);
    }
  }
}

module.exports = {
  withCache,
  withSWR,
  clearCache,
  MemoryCache
};