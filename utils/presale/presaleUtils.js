import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Get presale settings from database
 * @returns {Promise<Object>} Presale settings object
 */
export async function getPresaleSettings() {
  const { data, error } = await supabase
    .from('presale_settings')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Check if presale is currently active
 * @returns {Promise<boolean>} True if presale is active
 */
export async function isPresaleActive() {
  const settings = await getPresaleSettings();
  const now = new Date();
  
  return settings.is_active && 
         now >= new Date(settings.start_time) && 
         now <= new Date(settings.end_time);
}

/**
 * Check if wallet is in the whitelist
 * @param {string} walletAddress - Solana wallet address to check
 * @returns {Promise<boolean>} True if wallet is whitelisted
 */
export async function isWalletWhitelisted(walletAddress) {
  const { data, error } = await supabase
    .from('presale_whitelist')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
    
  if (error) return false;
  return !!data;
}

/**
 * Get total token amount purchased by a wallet in presale
 * @param {string} walletAddress - Solana wallet address to check
 * @returns {Promise<number>} Total token amount purchased
 */
export async function getWalletTokenAmount(walletAddress) {
  const { data, error } = await supabase
    .from('minted_nfts')
    .select('sum(token_amount)')
    .eq('wallet', walletAddress)
    .eq('is_presale', true)
    .or('status.eq.completed,status.eq.pending');
    
  if (error) return 0;
  return parseInt(data[0]?.sum || 0);
}

/**
 * Check if wallet can participate in presale
 * @param {string} walletAddress - Solana wallet address to check
 * @returns {Promise<Object>} Result object with allowed status and details
 */
export async function canParticipateInPresale(walletAddress) {
  // 1. Check if presale is active
  const settings = await getPresaleSettings();
  if (!settings.is_active) return { allowed: false, reason: "Presale not active" };
  
  // 2. Check if current time is within presale period
  const now = new Date();
  if (now < new Date(settings.start_time) || now > new Date(settings.end_time)) {
    return { allowed: false, reason: "Outside presale period" };
  }
  
  // 3. Check whitelist if required
  if (settings.whitelist_only) {
    const isWhitelisted = await isWalletWhitelisted(walletAddress);
    if (!isWhitelisted) {
      return { allowed: false, reason: "Wallet not whitelisted" };
    }
  }
  
  // 4. Check max per wallet limit
  if (settings.max_per_wallet > 0) {
    const tokenAmount = await getWalletTokenAmount(walletAddress);
    if (tokenAmount >= settings.max_per_wallet) {
      return { allowed: false, reason: "Max purchase limit reached" };
    }
  }
  
  return { 
    allowed: true, 
    price: settings.price_sol,
    remaining: settings.max_per_wallet > 0 ? settings.max_per_wallet - await getWalletTokenAmount(walletAddress) : null
  };
}

/**
 * Get presale stats for UI display
 * @returns {Promise<Object>} Stats object with presale information
 */
export async function getPresaleStats() {
  // Get presale settings
  const settings = await getPresaleSettings();
  
  // Get total sold amount
  const { data: soldData } = await supabase
    .from('minted_nfts')
    .select('sum(token_amount)')
    .eq('is_presale', true)
    .eq('status', 'completed');
  
  // Get total in pending state
  const { data: pendingData } = await supabase
    .from('minted_nfts')
    .select('sum(token_amount)')
    .eq('is_presale', true)
    .eq('status', 'pending');
  
  // Calculate amounts
  const soldAmount = parseInt(soldData[0]?.sum || 0);
  const pendingAmount = parseInt(pendingData[0]?.sum || 0);
  const totalAmount = settings.total_supply;
  const remainingAmount = Math.max(0, totalAmount - soldAmount - pendingAmount);
  
  return {
    isActive: settings.is_active,
    startTime: settings.start_time,
    endTime: settings.end_time,
    tokenPrice: settings.price_sol,
    totalSupply: totalAmount,
    soldAmount: soldAmount,
    pendingAmount: pendingAmount,
    remainingAmount: remainingAmount,
    whitelistOnly: settings.whitelist_only,
    maxPerWallet: settings.max_per_wallet,
    percentageSold: Math.min(100, Math.round(((soldAmount + pendingAmount) / totalAmount) * 100))
  };
}