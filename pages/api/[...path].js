// pages/api/[...path].js
/**
 * Enhanced API route handler with performance optimizations
 * 
 * This route handles all API requests including IPFS proxy functionality
 * Implements advanced caching, performance optimizations, and error handling
 */

// Fix import path to use correct middleware location
import { withCache, optimizedRateLimiter, errorHandler } from '../../lib/api-middleware';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

// IPFS gateway configuration with fallbacks
const IPFS_GATEWAYS = [
  process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || "https://tesola.mypinata.cloud",
  "https://cloudflare-ipfs.com",
  "https://ipfs.io"
];

// In-memory cache for IPFS requests with automatic cleanup
// Simple cache used for duplicate requests in short timeframes
const IPFS_CACHE = new Map();
const CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes

// Clean cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, {timestamp}] of IPFS_CACHE.entries()) {
    if (now - timestamp > CACHE_MAX_AGE) {
      IPFS_CACHE.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Main API request handler
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handler(req, res) {
  // Apply rate limiting
  optimizedRateLimiter(req, res, async (error) => {
    if (error) return errorHandler(error, req, res);
    
    // Set default security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // CORS headers - configured for optimal security
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache CORS preflight requests for 24 hours
    
    // Handle OPTIONS requests efficiently
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    // Only allow GET requests for this handler
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed', allowed: ['GET'] });
    }
    
    try {
      // Extract path from URL
      const { path } = req.query;
      
      // Determine if this is an IPFS request
      if (path[0] === 'ipfs') {
        await handleIpfsRequest(req, res, path.slice(1));
      } else {
        // Return 404 for unknown paths
        res.status(404).json({ error: 'API endpoint not found' });
      }
    } catch (error) {
      // Use the error handler middleware
      errorHandler(error, req, res);
    }
  });
}

/**
 * Handle IPFS proxy requests with optimized performance
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Array} pathParts - Path components after /ipfs/
 */
async function handleIpfsRequest(req, res, pathParts) {
  // Combine path parts to form IPFS path
  const ipfsPath = pathParts.join('/');
  
  // Generate cache key
  const cacheKey = `ipfs:${ipfsPath}`;
  
  // Check cache first
  const cachedData = IPFS_CACHE.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_MAX_AGE)) {
    res.setHeader('Content-Type', cachedData.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Cache', 'HIT');
    res.status(200).send(cachedData.data);
    return;
  }
  
  // Not in cache, fetch from IPFS gateway with fallback mechanism
  let fetchError = null;
  
  for (const gateway of IPFS_GATEWAYS) {
    try {
      // Construct full URL
      const fullUrl = `${gateway}/ipfs/${ipfsPath}`;
      
      // Fetch with timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const ipfsResponse = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          'Accept': req.headers['accept'] || '*/*',
          'User-Agent': 'TesolaIPFSProxy/2.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!ipfsResponse.ok) {
        fetchError = new Error(`Gateway ${gateway} returned status ${ipfsResponse.status}`);
        continue; // Try next gateway
      }
      
      // Determine content type
      const contentType = ipfsResponse.headers.get('content-type') || 'application/octet-stream';
      
      // Set response headers for optimal caching
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Cache', 'MISS');
      
      // Get response data
      const buffer = Buffer.from(await ipfsResponse.arrayBuffer());
      
      // Only cache if size is reasonable (< 10MB)
      if (buffer.length < 10 * 1024 * 1024) {
        IPFS_CACHE.set(cacheKey, {
          data: buffer,
          contentType,
          timestamp: Date.now()
        });
      }
      
      // Send response
      res.status(200).send(buffer);
      return;
    } catch (error) {
      fetchError = error;
      // Try next gateway
    }
  }
  
  // All gateways failed
  console.error('All IPFS gateways failed:', fetchError);
  res.status(502).json({ 
    error: 'Failed to fetch IPFS resource',
    details: fetchError?.message
  });
}

// Apply cache middleware to the handler for improved performance
// This adds a caching layer at the API route level
export default withCache({
  ttl: 3600, // 1 hour TTL
  methods: ['GET'],
  skip: (req) => {
    // Skip caching for very large files to prevent memory issues
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    return contentLength > 10 * 1024 * 1024; // Skip for files over 10MB
  }
})(handler);