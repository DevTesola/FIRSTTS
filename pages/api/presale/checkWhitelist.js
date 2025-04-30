import { createClient } from '@supabase/supabase-js';
import { validateSolanaAddress } from '../../../middleware/apiSecurity';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''  // 수정: SUPABASE_SERVICE_ROLE_KEY로 변경
);

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract wallet address from request body
    const { wallet } = req.body;
    
    // Validate wallet address
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    if (typeof validateSolanaAddress === 'function') {
      const validation = validateSolanaAddress(wallet);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    // Check if presale is active and requires whitelist
    const { data: presaleSettings, error: settingsError } = await supabase
      .from('presale_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (settingsError) {
      console.error('Error fetching presale settings:', settingsError);
      return res.status(500).json({ error: 'Error checking presale settings' });
    }
    
    // If whitelist is not required, everyone is considered "whitelisted"
    if (!presaleSettings.whitelist_only) {
      return res.status(200).json({ 
        isWhitelisted: true, 
        message: 'Presale is open to public'
      });
    }
    
    // Check if wallet is in the whitelist
    const { data, error } = await supabase
      .from('presale_whitelist')
      .select('*')
      .eq('wallet_address', wallet)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking whitelist:', error);
      return res.status(500).json({ error: 'Error checking whitelist status' });
    }
    
    // Return result
    if (data) {
      return res.status(200).json({ 
        isWhitelisted: true,
        message: 'Wallet is whitelisted for presale'
      });
    } else {
      return res.status(200).json({ 
        isWhitelisted: false,
        message: 'Wallet is not on the whitelist'
      });
    }
  } catch (err) {
    console.error('Check whitelist API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}