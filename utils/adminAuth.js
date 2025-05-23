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
    
    // Log error if no admin wallets are configured
    if (adminWallets.length === 0) {
      console.error('Error: ADMIN_WALLET_ADDRESSES environment variable is not set. Admin access will be denied.');
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
    
    const adminWallets = getAdminWallets();
    
    // Deny admin access if the list is empty
    if (adminWallets.length === 0) {
      console.warn('Admin list is empty. Admin access denied.');
      return false;
    }
    
    // Do not allow wildcards
    const validAdminWallets = adminWallets.filter(wallet => 
      wallet !== '*' && wallet.length > 0
    );
    
    // Compare without case sensitivity
    const normalizedWallet = walletAddress.toLowerCase();
    const isAdmin = validAdminWallets.some(admin => 
      admin.toLowerCase() === normalizedWallet
    );
    
    // Only allow explicit admins even in development
    if (process.env.NODE_ENV !== 'production' && isAdmin) {
      console.log('Development environment - Authenticated admin:', walletAddress);
    }
    
    return isAdmin;
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