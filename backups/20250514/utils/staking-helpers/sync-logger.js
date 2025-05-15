/**
 * Staking synchronization logging utilities
 * Provides functions for logging staking sync operations
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Log a synchronization operation
 * @param {Object} params - Operation parameters
 * @returns {Promise<Object>} Log result
 */
export async function logSyncOperation(params) {
  const {
    operation,
    mintAddress,
    walletAddress,
    status,
    details,
    duration,
    changes
  } = params;
  
  try {
    // Create a log entry
    const { data, error } = await supabase
      .from('sync_logs')
      .insert({
        operation,
        mint_address: mintAddress,
        wallet_address: walletAddress,
        status,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        duration_ms: duration,
        changes: typeof changes === 'object' ? JSON.stringify(changes) : changes,
        timestamp: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Failed to save log:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception during logging:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Log a synchronization error
 * @param {Object} params - Error parameters
 * @returns {Promise<Object>} Log result
 */
export async function logSyncError(params) {
  const {
    operation,
    mintAddress,
    walletAddress,
    error,
    context
  } = params;
  
  try {
    // Create an error log entry
    const { data, error: dbError } = await supabase
      .from('sync_error_logs')
      .insert({
        operation,
        mint_address: mintAddress,
        wallet_address: walletAddress,
        error_message: error.message,
        error_stack: error.stack,
        context: typeof context === 'object' ? JSON.stringify(context) : context,
        timestamp: new Date().toISOString()
      })
      .select();
    
    if (dbError) {
      console.error('Failed to save error log:', dbError);
      return { success: false, error: dbError };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception during error logging:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get recent synchronization logs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Recent logs
 */
export async function getRecentSyncLogs(options = {}) {
  const {
    limit = 100,
    operation = null,
    status = null,
    mintAddress = null,
    walletAddress = null
  } = options;
  
  try {
    // Build query
    let query = supabase
      .from('sync_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    // Apply filters
    if (operation) {
      query = query.eq('operation', operation);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (mintAddress) {
      query = query.eq('mint_address', mintAddress);
    }
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to query logs:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get recent logs:', error);
    throw error;
  }
}

/**
 * Get recent synchronization errors
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Recent error logs
 */
export async function getRecentSyncErrors(options = {}) {
  const {
    limit = 100,
    operation = null,
    mintAddress = null,
    walletAddress = null,
    resolved = null
  } = options;
  
  try {
    // Build query
    let query = supabase
      .from('sync_error_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    // Apply filters
    if (operation) {
      query = query.eq('operation', operation);
    }
    
    if (mintAddress) {
      query = query.eq('mint_address', mintAddress);
    }
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }
    
    if (resolved !== null) {
      query = query.eq('resolved', resolved);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to query error logs:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get recent error logs:', error);
    throw error;
  }
}

/**
 * Get statistics about synchronization operations
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Sync statistics
 */
export async function getSyncStats(options = {}) {
  const {
    days = 7,
    operation = null
  } = options;
  
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Build query for logs
    let logsQuery = supabase
      .from('sync_logs')
      .select('id, operation, status, duration_ms, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());
    
    // Apply operation filter if specified
    if (operation) {
      logsQuery = logsQuery.eq('operation', operation);
    }
    
    // Build query for errors
    let errorsQuery = supabase
      .from('sync_error_logs')
      .select('id, operation, timestamp, resolved')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());
    
    // Apply operation filter if specified
    if (operation) {
      errorsQuery = errorsQuery.eq('operation', operation);
    }
    
    // Execute queries
    const [logsResult, errorsResult] = await Promise.all([
      logsQuery,
      errorsQuery
    ]);
    
    if (logsResult.error) {
      console.error('Failed to query sync logs:', logsResult.error);
      throw logsResult.error;
    }
    
    if (errorsResult.error) {
      console.error('Failed to query error logs:', errorsResult.error);
      throw errorsResult.error;
    }
    
    const logs = logsResult.data || [];
    const errors = errorsResult.data || [];
    
    // Calculate statistics
    const stats = {
      total: logs.length,
      success: logs.filter(log => log.status === 'success').length,
      failed: logs.filter(log => log.status === 'error').length,
      partial: logs.filter(log => log.status === 'partial').length,
      errors: errors.length,
      resolvedErrors: errors.filter(err => err.resolved).length,
      averageDuration: logs.reduce((acc, log) => acc + (log.duration_ms || 0), 0) / (logs.length || 1),
      operations: {}
    };
    
    // Group by operation
    const operations = [...new Set(logs.map(log => log.operation))];
    for (const op of operations) {
      const opLogs = logs.filter(log => log.operation === op);
      const opErrors = errors.filter(err => err.operation === op);
      
      stats.operations[op] = {
        total: opLogs.length,
        success: opLogs.filter(log => log.status === 'success').length,
        failed: opLogs.filter(log => log.status === 'error').length,
        partial: opLogs.filter(log => log.status === 'partial').length,
        errors: opErrors.length,
        averageDuration: opLogs.reduce((acc, log) => acc + (log.duration_ms || 0), 0) / (opLogs.length || 1)
      };
    }
    
    // Calculate daily stats
    stats.daily = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toISOString().split('T')[0] === dateStr;
      });
      
      const dayErrors = errors.filter(err => {
        const errDate = new Date(err.timestamp);
        return errDate.toISOString().split('T')[0] === dateStr;
      });
      
      stats.daily[dateStr] = {
        total: dayLogs.length,
        success: dayLogs.filter(log => log.status === 'success').length,
        failed: dayLogs.filter(log => log.status === 'error').length,
        errors: dayErrors.length
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get sync stats:', error);
    throw error;
  }
}

/**
 * Mark an error as resolved
 * @param {number} errorId - Error ID
 * @returns {Promise<Object>} Update result
 */
export async function markErrorResolved(errorId) {
  try {
    const { data, error } = await supabase
      .from('sync_error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', errorId)
      .select();
    
    if (error) {
      console.error('Failed to mark error as resolved:', error);
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to mark error as resolved:', error);
    throw error;
  }
}