/**
 * Security utility functions for API requests and responses
 */

const crypto = require('crypto');

// List of sensitive fields that should never be logged or exposed
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'privateKey',
  'private_key',
  'seed',
  'mnemonic',
  'apiKey',
  'api_key',
  'secretKey',
  'secret_key',
  'jwt',
  'auth',
  'authorization'
];

/**
 * Remove or mask sensitive information from request body
 * 
 * @param {Object} body - Request body
 * @returns {Object} - Sanitized request body
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return {};
  
  const sanitized = { ...body };
  
  // Mask sensitive fields
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Partially mask wallet addresses for privacy while preserving identifiability
  if (sanitized.wallet || sanitized.walletAddress) {
    const address = sanitized.wallet || sanitized.walletAddress;
    if (typeof address === 'string' && address.length > 8) {
      const maskedAddress = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
      
      if (sanitized.wallet) sanitized.wallet = maskedAddress;
      if (sanitized.walletAddress) sanitized.walletAddress = maskedAddress;
    }
  }
  
  return sanitized;
}

/**
 * Generate a secure hash for identity verification
 * 
 * @param {string} data - Data to hash
 * @param {string} [salt] - Optional salt
 * @returns {string} - Secure hash
 */
function generateSecureHash(data, salt = process.env.API_SECRET_KEY) {
  if (!data) return '';
  
  const hashSalt = salt || crypto.randomBytes(16).toString('hex');
  return crypto.createHmac('sha256', hashSalt).update(data).digest('hex');
}

/**
 * Validate anti-CSRF token from request
 * 
 * @param {Object} req - Request object
 * @returns {boolean} - Whether token is valid
 */
function validateCsrfToken(req) {
  const token = req.headers['x-csrf-token'] || req.body?.csrf_token;
  
  if (!token) return false;
  
  // In a real implementation, you would validate against
  // a session-stored token or double-submit cookie pattern
  
  // This is a simplified example:
  const userSession = req.headers['x-session-id'] || req.cookies?.session_id;
  
  if (!userSession) return false;
  
  const expectedToken = generateSecureHash(userSession, process.env.API_SECRET_KEY);
  return crypto.timingSafeEqual(
    Buffer.from(expectedToken),
    Buffer.from(token)
  );
}

/**
 * Generate a secure random token
 * 
 * @param {number} [byteLength=32] - Length of token in bytes
 * @returns {string} - Random token in hex format
 */
function generateRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Create a secure nonce with expiration
 * 
 * @param {string} [context] - Optional context for the nonce
 * @param {number} [expiresInSeconds=300] - Nonce expiration time in seconds
 * @returns {Object} - Nonce object with value and expiration timestamp
 */
function createSecureNonce(context = '', expiresInSeconds = 300) {
  const expiresAt = Date.now() + (expiresInSeconds * 1000);
  const nonceData = `${context}|${expiresAt}`;
  const nonceValue = generateSecureHash(nonceData);
  
  return {
    value: nonceValue,
    expiresAt
  };
}

/**
 * Validate a secure nonce
 * 
 * @param {string} nonce - Nonce to validate
 * @param {string} expected - Expected nonce value
 * @param {number} [maxAgeSeconds=300] - Maximum age of nonce in seconds
 * @returns {boolean} - Whether nonce is valid
 */
function validateNonce(nonce, expected, maxAgeSeconds = 300) {
  if (!nonce || !expected) return false;
  
  // Split the expected nonce to get expiration time
  const parts = expected.split('|');
  if (parts.length !== 2) return false;
  
  const expiresAt = parseInt(parts[1], 10);
  const now = Date.now();
  
  // Check if nonce has expired
  if (now > expiresAt) return false;
  
  // Check if nonce is older than maxAgeSeconds
  if (now - (expiresAt - maxAgeSeconds * 1000) > maxAgeSeconds * 1000) return false;
  
  // Check if nonce matches expected value using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(nonce),
      Buffer.from(expected)
    );
  } catch (error) {
    return false;
  }
}

module.exports = {
  sanitizeRequestBody,
  generateSecureHash,
  validateCsrfToken,
  generateRandomToken,
  createSecureNonce,
  validateNonce
};