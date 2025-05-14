/**
 * Admin API for retrieving synchronization logs
 * Provides endpoints to get logs, errors, and statistics
 */

import { 
  getRecentSyncLogs, 
  getRecentSyncErrors, 
  getSyncStats,
  markErrorResolved 
} from '../../../utils/staking-helpers/sync-logger';

import { AdminRequestValidator, adminApiRateLimiter } from '../../../utils/staking-helpers/security-checker';

export default async function handler(req, res) {
  // Validate the request and check admin permissions
  if (!AdminRequestValidator.validate(req, res)) {
    return; // Response already sent by validator
  }
  
  // Apply rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (adminApiRateLimiter.isLimited(clientIp)) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  try {

    const { action, limit, operation, status, days, errorId, walletAddress, mintAddress } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Handle different actions
    switch (action) {
      case 'get_sync_logs': {
        const logs = await getRecentSyncLogs({
          limit: limit || 100,
          operation: operation || null,
          status: status || null,
          mintAddress: mintAddress || null,
          walletAddress: walletAddress || null
        });
        
        return res.status(200).json({
          success: true,
          logs
        });
      }

      case 'get_sync_errors': {
        const errors = await getRecentSyncErrors({
          limit: limit || 100,
          operation: operation || null,
          mintAddress: mintAddress || null,
          walletAddress: walletAddress || null,
          resolved: req.body.resolved !== undefined ? req.body.resolved : null
        });
        
        return res.status(200).json({
          success: true,
          errors
        });
      }

      case 'get_sync_stats': {
        const stats = await getSyncStats({
          days: days || 7,
          operation: operation || null
        });
        
        return res.status(200).json({
          success: true,
          stats
        });
      }

      case 'mark_error_resolved': {
        if (!errorId) {
          return res.status(400).json({ error: 'Error ID is required' });
        }
        
        const result = await markErrorResolved(errorId);
        
        return res.status(200).json({
          success: true,
          result
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in sync logs API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}