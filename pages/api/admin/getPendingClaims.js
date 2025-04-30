// pages/api/admin/getPendingClaims.js
import { createClient } from '@supabase/supabase-js';
import { isAdminWallet } from '../../../utils/adminAuth'; // Import admin auth utility

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
    
    // Fetch pending claims
    const { data: claims, error } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch claims: ${error.message}`);
    }
    
    return res.status(200).json({ claims });
  } catch (error) {
    console.error('Error in getPendingClaims API:', error);
    return res.status(500).json({ error: 'Failed to fetch pending claims: ' + error.message });
  }
}