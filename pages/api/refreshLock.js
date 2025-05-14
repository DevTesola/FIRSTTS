import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const requestId = `req_refresh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    // Extract parameters from request body
    const { wallet, mintIndex, lockId } = req.body;
    
    // Validate required parameters
    if (!wallet || mintIndex === undefined || !lockId) {
      return res.status(400).json({ 
        error: 'Missing required parameters. wallet, mintIndex, and lockId are all required.' 
      });
    }
    
    console.log(`[${requestId}] Refreshing lock for mint_index: ${mintIndex}, wallet: ${wallet.slice(0, 8)}...`);
    
    // First, verify the lock exists and belongs to this user
    const { data: lockData, error: lockCheckError } = await supabase
      .from('minted_nfts')
      .select('status, lock_id, wallet, updated_at')
      .eq('mint_index', mintIndex)
      .single();
      
    if (lockCheckError) {
      console.error(`[${requestId}] Lock check failed:`, lockCheckError);
      return res.status(404).json({ error: 'Lock not found' });
    }
    
    if (lockData.status !== 'pending') {
      console.error(`[${requestId}] Invalid lock state: ${lockData?.status || 'missing'}`);
      return res.status(400).json({ error: `Invalid lock state: ${lockData?.status}` });
    }
    
    if (lockData.lock_id !== lockId) {
      console.error(`[${requestId}] Lock ID mismatch. Expected: ${lockId}, Found: ${lockData.lock_id}`);
      return res.status(400).json({ error: 'Lock ID mismatch' });
    }
    
    if (lockData.wallet !== wallet) {
      console.error(`[${requestId}] Wallet mismatch. Expected: ${wallet}, Found: ${lockData.wallet}`);
      return res.status(403).json({ error: 'Wallet mismatch' });
    }
    
    // Update the lock timestamp
    const { error: updateError } = await supabase
      .from('minted_nfts')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('mint_index', mintIndex)
      .eq('lock_id', lockId)
      .eq('wallet', wallet);
    
    if (updateError) {
      console.error(`[${requestId}] Lock refresh failed:`, updateError);
      return res.status(500).json({ error: 'Failed to refresh lock' });
    }
    
    console.log(`[${requestId}] Lock refreshed successfully for mint_index: ${mintIndex}`);
    res.status(200).json({ 
      success: true, 
      message: 'Lock refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[${requestId}] Refresh lock error:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}