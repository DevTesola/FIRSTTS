// utils/adminAuth.js
// Utility functions for admin authentication and authorization

/**
 * Load admin wallet addresses from environment variables
 * @returns {Array<string>} - Array of admin wallet addresses
 */
export function getAdminWallets() {
    const adminWalletsStr = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES || '';
    
    // Convert comma-separated wallet addresses to array
    const adminWallets = adminWalletsStr.split(',')
      .map(address => address.trim())
      .filter(address => address.length > 0);
    
    // Log warning if no admin wallets are configured (development only)
    if (adminWallets.length === 0 && process.env.NODE_ENV === 'development') {
      console.warn('Warning: ADMIN_WALLET_ADDRESSES environment variable is not set.');
    }
    
    return adminWallets;
  }
  
  /**
   * Check if a wallet address has admin privileges
   * @param {string} walletAddress - Wallet address to check
   * @returns {boolean} - Whether the wallet has admin privileges
   */
  export function isAdminWallet(walletAddress) {
    if (!walletAddress) return false;
    
    // Restrict admin wallets even in development environment (security enhancement)
    // Check development-specific admin wallet list
    const devAdminWalletsStr = process.env.NEXT_PUBLIC_DEV_ADMIN_WALLETS || '';
    const devAdminWallets = devAdminWalletsStr.split(',')
      .map(address => address.trim())
      .filter(address => address.length > 0);
      
    // In development environment, use explicitly defined development admin list
    if (process.env.NODE_ENV === 'development') {
      // If development admin list is specified, use it
      if (devAdminWallets.length > 0) {
        return devAdminWallets.includes(walletAddress);
      }
      
      // If no development admin list specified, log security warning
      console.warn('SECURITY WARNING: No admin wallets specified in development environment. Set NEXT_PUBLIC_DEV_ADMIN_WALLETS environment variable for better security.');
      console.log('Temporarily allowing all wallets as admin in development:', walletAddress);
      return true;
    }
    
    const adminWallets = getAdminWallets();
    
    // If admin list is empty, consider the first connected wallet as admin
    if (adminWallets.length === 0) {
      console.log('Admin list is empty, accepting first connection as admin:', walletAddress);
      return true;
    }
    
    return adminWallets.includes(walletAddress);
  }
  
  /**
   * Middleware for verifying admin access to protected routes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  export function adminAuthMiddleware(req, res, next) {
    // Get wallet address from header or body
    const walletAddress = req.headers['x-wallet-address'] || req.body?.adminWallet;
    
    if (!walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!isAdminWallet(walletAddress)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Authentication successful, proceed to next middleware
    next();
  }