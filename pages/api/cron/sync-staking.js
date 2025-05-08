/**
 * Cron API for staking synchronization
 * This API is meant to be called by a cron job scheduler
 * to perform regular synchronization of staking data
 */

import { runSyncCheck } from '../../../utils/staking-helpers/sync-utilities';
import { logSyncOperation } from '../../../utils/staking-helpers/sync-logger';

export default async function handler(req, res) {
  // Verify request comes from authorized source
  const authHeader = req.headers['x-cron-secret'];
  if (authHeader !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get sync options from request body
  const {
    limit = 50,
    fixMissingRecords = true,
    updateMetadata = true,
    walletAddress = null
  } = req.body;

  const startTime = Date.now();
  
  try {
    // Run sync check
    console.log('Starting staking synchronization...');
    
    const result = await runSyncCheck({
      limit,
      fixMissingRecords,
      updateMetadata,
      walletAddress
    });
    
    const elapsedMs = Date.now() - startTime;
    
    // Log the sync operation
    await logSyncOperation({
      operation: walletAddress ? 'cron_sync_wallet' : 'cron_sync_all',
      status: result.success ? 'success' : 'error',
      details: result,
      duration: elapsedMs,
      walletAddress
    });
    
    // Add execution time to response
    const response = {
      ...result,
      executionTimeMs: elapsedMs
    };
    
    return res.status(200).json(response);
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error('Error in staking synchronization cron job:', error);
    
    // Log the error
    await logSyncOperation({
      operation: walletAddress ? 'cron_sync_wallet' : 'cron_sync_all',
      status: 'error',
      details: {
        error: error.message,
        stack: error.stack
      },
      duration: elapsedMs,
      walletAddress
    });
    
    return res.status(500).json({
      success: false,
      error: error.message,
      executionTimeMs: elapsedMs
    });
  }
}