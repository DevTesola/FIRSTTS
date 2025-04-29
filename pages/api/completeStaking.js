// pages/api/completeStaking.js
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, txSignature, stakingPeriod } = req.body;
    
    if (!wallet || !mintAddress || !txSignature || !stakingPeriod) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, transaction signature, and staking period are required' 
      });
    }
    
    // Verify the transaction was confirmed
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const txInfo = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!txInfo || txInfo.meta.err) {
      return res.status(400).json({ 
        error: 'Transaction was not confirmed or failed' 
      });
    }
    
    // Calculate reward amount based on NFT tier and staking period
    // Get NFT tier from database or use default
    let nftTier = "Common"; // Default tier
    
    try {
      // Look up the NFT in our database to get its tier
      const { data: nftData } = await supabase
        .from('minted_nfts')
        .select('metadata')
        .eq('mint_address', mintAddress)
        .maybeSingle();
      
      if (nftData && nftData.metadata) {
        const metadata = typeof nftData.metadata === 'string' 
          ? JSON.parse(nftData.metadata) 
          : nftData.metadata;
        
        const tierAttr = metadata.attributes?.find(attr => 
          attr.trait_type === "Tier" || attr.trait_type === "tier"
        );
        
        if (tierAttr && tierAttr.value) {
          nftTier = tierAttr.value;
        }
      }
    } catch (tierError) {
      console.error('Error fetching NFT tier:', tierError);
      // Continue with default tier
    }
    
    // Reward rates per day by tier
    const dailyRewardsByTier = {
      "Legendary": 2.0,  // 2 TESOLA per day
      "Rare": 1.5,       // 1.5 TESOLA per day
      "Uncommon": 1.0,   // 1 TESOLA per day
      "Common": 0.5      // 0.5 TESOLA per day
    };
    
    // Calculate daily reward rate
    const dailyRate = dailyRewardsByTier[nftTier] || dailyRewardsByTier.Common;
    
    // Calculate total rewards
    const totalRewards = dailyRate * stakingPeriod;
    
    // Calculate release date
    const stakingStartDate = new Date();
    const releaseDate = new Date(stakingStartDate);
    releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
    
    // Create staking record in database
    const { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .insert([
        {
          wallet_address: wallet,
          mint_address: mintAddress,
          staking_period: stakingPeriod,
          staked_at: stakingStartDate.toISOString(),
          release_date: releaseDate.toISOString(),
          total_rewards: totalRewards,
          daily_reward_rate: dailyRate,
          tx_signature: txSignature,
          status: 'staked',
          nft_tier: nftTier
        }
      ])
      .select()
      .single();
    
    if (stakingError) {
      console.error('Error creating staking record:', stakingError);
      return res.status(500).json({ error: 'Failed to create staking record' });
    }
    
    // Add calculated fields
    const stakingInfo = {
      ...stakingData,
      progress_percentage: 0, // Just started
      earned_so_far: 0        // Just started
    };
    
    return res.status(200).json({
      success: true,
      message: 'NFT staked successfully',
      stakingInfo
    });
  } catch (error) {
    console.error('Error in completeStaking API:', error);
    return res.status(500).json({ error: 'Failed to complete staking process' });
  }
}