// middleware/errorHandler.js
// This file provides consistent error handling and responses for all APIs

/**
 * Convert error to a safe message that can be exposed to users
 * Prevents leaking sensitive information
 * 
 * @param {Error} error - Original error object
 * @returns {string} - Safe error message for user exposure
 */
function getSafeErrorMessage(error) {
    // Map of error types to safe messages
    const errorTypeMap = {
      'ValidationError': 'Input data is invalid.',
      'AuthenticationError': 'Authentication required.',
      'AuthorizationError': 'You do not have permission to perform this action.',
      'NotFoundError': 'The requested resource was not found.',
      'RateLimitError': 'Too many requests. Please try again later.',
      'TransactionError': 'Blockchain transaction processing failed.',
      'DatabaseError': 'Error processing data.',
      'TimeoutError': 'Request timed out.',
      'BlockchainError': 'Error communicating with blockchain network.'
    };
    
    // Look up safe message by error name
    if (error.name && errorTypeMap[error.name]) {
      return errorTypeMap[error.name];
    }
    
    // Handle specific Solana errors
    if (error.message && error.message.includes('Transaction failed')) {
      return 'Blockchain transaction failed. Please check your balance.';
    }
    
    // Default message
    return 'An error occurred processing your request. Please try again later.';
  }
  
  /**
   * Log error with structured format
   * 
   * @param {Error} error - Error object
   * @param {Object} req - Request object
   */
  function logError(error, req) {
    // Collect error details
    const errorDetails = {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        // Mask sensitive headers
        'authorization': req.headers.authorization ? '[REDACTED]' : undefined,
        'cookie': req.headers.cookie ? '[REDACTED]' : undefined
      },
      query: req.query,
      body: sanitizeRequestBody(req.body),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // More detailed logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorDetails);
    } else {
      // Simplified logging in production
      console.error('API Error:', {
        path: errorDetails.path,
        method: errorDetails.method,
        error: `${error.name}: ${error.message}`,
        timestamp: errorDetails.timestamp
      });
      
      // External error logging service could be added here
      // Examples: Sentry, LogRocket, CloudWatch, etc.
    }
  }
  
  /**
   * Remove sensitive information from request body
   * 
   * @param {Object} body - Request body
   * @returns {Object} - Sanitized request body
   */
  function sanitizeRequestBody(body) {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'privateKey', 'private_key', 'seed', 'mnemonic'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Partially mask wallet addresses
    if (sanitized.wallet || sanitized.walletAddress) {
      const address = sanitized.wallet || sanitized.walletAddress;
      sanitized.wallet = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    }
    
    return sanitized;
  }
  
  /**
   * API error handling middleware
   * 
   * @param {Error} err - Error object
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  export function errorHandler(err, req, res, next) {
    // Log the error
    logError(err, req);
    
    // Check if response has already been sent
    if (res.headersSent) {
      return next(err);
    }
    
    // Determine HTTP status code
    let statusCode = err.statusCode || 500;
    
    // Map error types to status codes
    if (err.name === 'ValidationError') statusCode = 400;
    if (err.name === 'AuthenticationError') statusCode = 401;
    if (err.name === 'AuthorizationError') statusCode = 403;
    if (err.name === 'NotFoundError') statusCode = 404;
    if (err.name === 'RateLimitError') statusCode = 429;
    
    // Get safe error message
    const safeMessage = getSafeErrorMessage(err);
    
    // Create error response
    const errorResponse = {
      error: safeMessage,
      success: false
    };
    
    // Include debug info in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n')
      };
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
  }
  
  /**
   * Utility functions to create errors with appropriate status codes and names
   */
  export const AppError = {
    validation: (message) => {
      const error = new Error(message || 'Invalid input data');
      error.name = 'ValidationError';
      error.statusCode = 400;
      return error;
    },
    
    authentication: (message) => {
      const error = new Error(message || 'Authentication required');
      error.name = 'AuthenticationError';
      error.statusCode = 401;
      return error;
    },
    
    authorization: (message) => {
      const error = new Error(message || 'Access denied');
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      return error;
    },
    
    notFound: (message) => {
      const error = new Error(message || 'Resource not found');
      error.name = 'NotFoundError';
      error.statusCode = 404;
      return error;
    },
    
    rateLimit: (message) => {
      const error = new Error(message || 'Too many requests');
      error.name = 'RateLimitError';
      error.statusCode = 429;
      return error;
    },
    
    transaction: (message) => {
      const error = new Error(message || 'Transaction failed');
      error.name = 'TransactionError';
      error.statusCode = 400;
      return error;
    },
    
    server: (message) => {
      const error = new Error(message || 'Internal server error');
      error.name = 'ServerError';
      error.statusCode = 500;
      return error;
    }
  };