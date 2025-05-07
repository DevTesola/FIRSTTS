// pages/api/admin/processClaim.js
import { createClient } from '@supabase/supabase-js';
import { isAdminWallet } from '../../../utils/adminAuth';
import { logAdminAction } from '../../../utils/adminLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
  }
  
  try {
    const { claimId, action } = req.body;
    // Get wallet address from header
    const walletAddress = req.headers['x-wallet-address'];
    
    // Validate request data
    if (!claimId || !action) {
      return res.status(400).json({ error: 'Missing required fields: claimId and action are required' });
    }
    
    // Validate wallet address
    if (!walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check admin privileges
    if (!isAdminWallet(walletAddress)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Validate action
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action: Must be "approve" or "reject"' });
    }
    
    // Get current claim data for logging
    const { data: currentClaim, error: fetchError } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('id', claimId)
      .single();
      
    if (fetchError) {
      throw new Error(`Failed to fetch claim data: ${fetchError.message}`);
    }
    
    if (!currentClaim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Update claim status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { data: updatedClaim, error } = await supabase
      .from('reward_claims')
      .update({
        status: newStatus,
        processed_by: walletAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .eq('status', 'pending') // Only process pending claims
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update claim: ${error.message}`);
    }
    
    if (!updatedClaim) {
      return res.status(404).json({ error: 'Claim not found or already processed' });
    }
    
    // Log admin action to audit logs
    await logAdminAction({
      adminWallet: walletAddress,
      action: `${action}_claim`,
      targetId: claimId,
      metadata: {
        claim_amount: updatedClaim.amount,
        user_wallet: updatedClaim.wallet_address,
        previous_status: currentClaim.status,
        new_status: newStatus
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    
    return res.status(200).json({
      success: true,
      claim: updatedClaim
    });
  } catch (error) {
    console.error('Error in processClaim API:', error);
    return res.status(500).json({ error: 'Failed to process claim: ' + error.message });
  }
}