// pages/api/getStakingInfo.js - Optimized Version
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Initialize Solana connection
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  try {
    const { wallet, mintAddress } = req.query;
    
    // Parameter validation
    if (!wallet || !mintAddress) {
      return res.status(400).json({ 
        error: 'Wallet address and mint address are required',
        success: false
      });
    }
    
    // Validate wallet address format
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        success: false
      });
    }
    
    // Validate mint address format
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid mint address format',
        success: false
      });
    }
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Verify NFT ownership - Try token accounts method first (more reliable)
    console.log('[getStakingInfo] Verifying NFT ownership...');
    let isOwner = false;
    
    try {
      // Try to verify ownership using token accounts first
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length > 0) {
        console.log('[getStakingInfo] NFT ownership verified through token accounts for wallet:', wallet);
        isOwner = true;
      } else {
        console.log(`[getStakingInfo] Ownership verification failed: ${wallet} does not own ${mintAddress} (token accounts check)`);
        
        // Fall back to Metaplex check if token account check fails
        try {
          const metaplex = new Metaplex(connection);
          const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey });
          
          // Enhanced ownership check with multiple property paths
          const ownerAddress = nft.token?.ownerAddress?.toString() || 
                              nft.ownership?.owner?.toString() ||
                              nft.ownerAddress?.toString() ||
                              nft.updateAuthority?.toString();
          
          console.log('[getStakingInfo] Detected owner address from Metaplex:', ownerAddress);
          
          if (ownerAddress && ownerAddress === wallet) {
            console.log('[getStakingInfo] NFT ownership verified via Metaplex for wallet:', wallet);
            isOwner = true;
          } else {
            console.log(`[getStakingInfo] Ownership verification failed: ${wallet} does not own ${mintAddress} (Metaplex check)`);
          }
        } catch (metaplexError) {
          console.error('[getStakingInfo] Metaplex ownership check failed:', metaplexError);
          // Continue with database check anyway
        }
      }
    } catch (ownershipError) {
      console.warn('[getStakingInfo] Ownership verification error:', ownershipError);
      // Continue with database check anyway, but log the error
    }
    
    // Get staking info from database
    const { data, error } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error, we handle this differently
      console.error('[getStakingInfo] Database query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch staking info', 
        details: error.message,
        success: false 
      });
    }
    
    // If no staking record found
    if (!data) {
      return res.status(200).json({ 
        isStaked: false,
        isOwner,
        success: true
      });
    }
    
    // Calculate progress percentage and earned rewards so far
    const stakingStartDate = new Date(data.staked_at);
    const releaseDate = new Date(data.release_date);
    const currentDate = new Date();
    
    // Calculate total staking duration in milliseconds
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    
    // Calculate elapsed duration (capped at total duration)
    const elapsedDuration = Math.min(
      currentDate.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    
    // Calculate progress percentage (prevent division by zero)
    const progressPercentage = totalStakingDuration > 0 
      ? (elapsedDuration / totalStakingDuration) * 100
      : 0;
    
    // Calculate earned rewards so far (linear accrual)
    const earnedSoFar = (data.total_rewards * progressPercentage) / 100;
    
    // Calculate remaining days
    const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
    
    // Add calculated fields to the staking info
    const stakingInfo = {
      ...data,
      progress_percentage: parseFloat(progressPercentage.toFixed(2)),
      earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
      days_remaining: daysRemaining,
      is_unlocked: currentDate >= releaseDate,
      lockup_complete: currentDate >= releaseDate
    };
    
    return res.status(200).json({
      isStaked: true,
      stakingInfo,
      isOwner,
      success: true
    });
  } catch (error) {
    console.error('[getStakingInfo] Error in getStakingInfo API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      success: false
    });
  }
}