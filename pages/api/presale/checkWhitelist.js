import { createClient } from '@supabase/supabase-js';
import { validateSolanaAddress } from '../../../middleware/apiSecurity';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Default tier information for public participants
const DEFAULT_PUBLIC_TIER = {
  tier_id: 'PUBLIC',
  tier_name: 'Public',
  max_sol: 0.5,
  discount_percentage: 0,
  exchange_rate: 200000
};

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
    
    // Get presale tier information
    const { data: tierData, error: tierError } = await supabase
      .from('presale_tiers')
      .select('*');
      
    if (tierError) {
      console.error('Error fetching tier data:', tierError);
      // Continue with default tiers if we can't get the table data
    }
    
    // Create a lookup map of tier data
    const tiers = {};
    if (tierData && tierData.length > 0) {
      tierData.forEach(tier => {
        tiers[tier.tier_id] = tier;
      });
    } else {
      // Default tier data if no database entries exist
      tiers['PUBLIC'] = DEFAULT_PUBLIC_TIER;
      tiers['COMMON'] = {
        tier_id: 'COMMON',
        tier_name: 'Common',
        max_sol: 1,
        discount_percentage: 10,
        exchange_rate: 222000
      };
      tiers['RARE'] = {
        tier_id: 'RARE',
        tier_name: 'Rare',
        max_sol: 3,
        discount_percentage: 20,
        exchange_rate: 250000
      };
      tiers['EPIC'] = {
        tier_id: 'EPIC',
        tier_name: 'Epic',
        max_sol: 5,
        discount_percentage: 25,
        exchange_rate: 267000
      };
      tiers['LEGENDARY'] = {
        tier_id: 'LEGENDARY',
        tier_name: 'Legendary',
        max_sol: 10,
        discount_percentage: 33,
        exchange_rate: 300000
      };
    }
    
    // If whitelist is not required, everyone is considered "whitelisted" with public tier
    if (!presaleSettings.whitelist_only) {
      return res.status(200).json({ 
        isWhitelisted: true, 
        message: 'Presale is open to public',
        tier: tiers['PUBLIC'],
        maxTokens: Math.floor(tiers['PUBLIC'].max_sol * tiers['PUBLIC'].exchange_rate)
      });
    }
    
    // Check if wallet is in the whitelist and get NFT tier info
    const { data, error } = await supabase
      .from('presale_whitelist')
      .select('*, tier_id')
      .eq('wallet_address', wallet)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking whitelist:', error);
      return res.status(500).json({ error: 'Error checking whitelist status' });
    }
    
    // Return result
    if (data) {
      // Get the tier information for this wallet
      const walletTierId = data.tier_id || 'PUBLIC';
      const walletTier = tiers[walletTierId] || tiers['PUBLIC'];
      
      // Calculate max tokens based on tier
      const maxTokens = Math.floor(walletTier.max_sol * walletTier.exchange_rate);
      
      return res.status(200).json({ 
        isWhitelisted: true,
        message: `Wallet is whitelisted with ${walletTier.tier_name} tier`,
        tier: walletTier,
        maxTokens: maxTokens,
        maxSol: walletTier.max_sol
      });
    } else {
      // Not whitelisted - return public tier info
      return res.status(200).json({ 
        isWhitelisted: false,
        message: 'Wallet is not on the whitelist',
        tier: tiers['PUBLIC'],
        maxTokens: Math.floor(tiers['PUBLIC'].max_sol * tiers['PUBLIC'].exchange_rate),
        maxSol: tiers['PUBLIC'].max_sol
      });
    }
  } catch (err) {
    console.error('Check whitelist API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}