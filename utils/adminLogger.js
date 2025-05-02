// utils/adminLogger.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Log an admin action to the audit log
 * 
 * @param {Object} params - Parameters for the log entry
 * @param {string} params.adminWallet - Admin wallet address
 * @param {string} params.action - Action performed (e.g., 'approve_claim', 'reject_claim')
 * @param {string} params.targetId - ID of the affected resource (e.g., claim ID)
 * @param {Object} params.metadata - Additional information about the action
 * @param {string} params.ipAddress - IP address of the admin
 * @returns {Promise<Object>} - The created log entry or error
 */
export async function logAdminAction({
  adminWallet,
  action,
  targetId,
  metadata = {},
  ipAddress
}) {
  if (!adminWallet || !action) {
    console.error('Admin logging error: Missing required parameters');
    return { error: 'Missing required parameters' };
  }
  
  try {
    // Insert log entry
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .insert([{
        admin_wallet: adminWallet,
        action,
        target_id: targetId?.toString(),
        metadata,
        ip_address: ipAddress
      }])
      .select()
      .single();
    
    if (error) {
      // Log error but don't block the main operation
      console.error('Failed to create admin log:', error);
      return { error: error.message };
    }
    
    return { data };
  } catch (err) {
    console.error('Admin logging exception:', err);
    return { error: err.message };
  }
}

/**
 * Get admin action types for filtering
 * 
 * @returns {Array<string>} - List of possible admin action types
 */
export function getAdminActionTypes() {
  return [
    'approve_claim',
    'reject_claim',
    'process_refund',
    'deny_refund',
    'verify_collection',
    'update_nft_metadata',
    'admin_login',
    'admin_logout',
    'system_config_change'
  ];
}

/**
 * Detect suspicious admin activity
 * 
 * @param {Object} params - Parameters for detection
 * @param {number} params.timeWindowMinutes - Time window in minutes to check
 * @param {number} params.actionThreshold - Number of actions that triggers an alert
 * @returns {Promise<Object>} - Detection results
 */
export async function detectSuspiciousActivity({
  timeWindowMinutes = 60,
  actionThreshold = 50
}) {
  try {
    // Calculate time window
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
    
    // Query to count actions per admin within time window
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('admin_wallet, count(*)')
      .gt('created_at', timeWindow.toISOString())
      .group('admin_wallet');
    
    if (error) {
      console.error('Error checking admin activity:', error);
      return { error: error.message };
    }
    
    // Find admins over the threshold
    const suspiciousAdmins = data.filter(item => parseInt(item.count) > actionThreshold);
    
    return {
      suspicious: suspiciousAdmins.length > 0,
      admins: suspiciousAdmins,
      timeWindow: {
        minutes: timeWindowMinutes,
        start: timeWindow.toISOString()
      },
      threshold: actionThreshold
    };
  } catch (err) {
    console.error('Error in suspicious activity detection:', err);
    return { error: err.message };
  }
}