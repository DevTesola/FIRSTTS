// Enhanced API security middleware
import crypto from 'crypto';
import { isAdminWallet } from '../utils/adminAuth';

// Rate limiting with user-based tracking
const rateLimitMap = new Map();
const DEFAULT_RATE_LIMIT = 60;
const STRICT_RATE_LIMIT = 10;
const WINDOW_MS = 60000; // 1 minute

// CSRF token storage
const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour

/**
 * Generate CSRF token
 */
export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expiry: Date.now() + CSRF_TOKEN_EXPIRY
  });
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);
  if (!stored || stored.expiry < Date.now()) {
    return false;
  }
  return stored.token === token;
}

/**
 * Enhanced rate limiter with user tracking
 */
export function enhancedRateLimiter(options = {}) {
  return (req, res, next) => {
    const { 
      limit = DEFAULT_RATE_LIMIT,
      windowMs = WINDOW_MS,
      keyGenerator = (req) => req.ip || 'unknown',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now
      };
      rateLimitMap.set(key, record);
    }
    
    // Cleanup old entries
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetTime) {
          rateLimitMap.delete(k);
        }
      }
    }
    
    // Check if limit exceeded
    if (record.count >= limit) {
      res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }
    
    // Increment count
    record.count++;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    next();
  };
}

/**
 * Input validation middleware
 */
export function validateInput(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
}

/**
 * Enhanced CORS validation
 */
export function validateCORS(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  };
}

/**
 * Admin authentication middleware
 */
export function requireAdmin(req, res, next) {
  const walletAddress = req.headers['x-wallet-address'];
  
  if (!walletAddress || !isAdminWallet(walletAddress)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
}