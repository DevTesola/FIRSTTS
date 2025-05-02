// pages/api/admin/logs.js
import { createClient } from '@supabase/supabase-js';
import { isAdminWallet } from '../../../utils/adminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', allowed: ['GET'] });
  }
  
  try {
    // Get wallet address from header
    const walletAddress = req.headers['x-wallet-address'];
    
    // Validate wallet address
    if (!walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check admin privileges
    if (!isAdminWallet(walletAddress)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Parse query parameters
    const { 
      limit = 50, 
      page = 1,
      admin = null,
      action = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (admin) {
      query = query.eq('admin_wallet', admin);
    }
    
    if (action) {
      query = query.eq('action', action);
    }
    
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    
    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }
    
    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);
    
    // Execute query
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
    
    // Return logs with pagination info
    return res.status(200).json({
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in admin logs API:', error);
    return res.status(500).json({ error: 'Failed to fetch admin logs: ' + error.message });
  }
}