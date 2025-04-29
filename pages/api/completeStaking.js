// pages/api/completeStaking.js - Fixed Version
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
    
    console.log('Complete staking request received:', { wallet, mintAddress, txSignature, stakingPeriod });
    
    if (!wallet || !mintAddress || !txSignature || !stakingPeriod) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, transaction signature, and staking period are required' 
      });
    }
    
    // Verify the transaction was confirmed
    let txInfo;
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      txInfo = await connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!txInfo) {
        console.log('Transaction not found:', txSignature);
        return res.status(400).json({ 
          error: 'Transaction was not found on the blockchain' 
        });
      }
      
      if (txInfo.meta.err) {
        console.log('Transaction failed:', txInfo.meta.err);
        return res.status(400).json({ 
          error: 'Transaction failed on the blockchain',
          details: JSON.stringify(txInfo.meta.err)
        });
      }
      
      console.log('Transaction verified on blockchain:', txSignature);
    } catch (txError) {
      console.error('Error verifying transaction:', txError);
      return res.status(500).json({ 
        error: 'Failed to verify transaction',
        details: txError.message 
      });
    }
    
    // Check for existing staking records to prevent duplicates
    try {
      const { data: existingStake, error: existingError } = await supabase
        .from('nft_staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
      
      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is expected
        console.error('Error checking existing stake:', existingError);
        throw new Error(`Database query error: ${existingError.message}`);
      }
      
      if (existingStake) {
        console.log('Duplicate staking attempt detected:', { 
          stakingId: existingStake.id,
          existingTx: existingStake.tx_signature,
          newTx: txSignature
        });
        
        // If the same transaction signature, return success
        if (existingStake.tx_signature === txSignature) {
          return res.status(200).json({
            success: true,
            message: 'NFT already staked with this transaction',
            stakingInfo: {
              ...existingStake,
              progress_percentage: 0,
              earned_so_far: 0
            }
          });
        }
        
        return res.status(400).json({ 
          error: 'This NFT is already staked',
          stakingInfo: existingStake 
        });
      }
    } catch (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return res.status(500).json({ error: checkError.message });
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
          console.log('Found NFT tier:', nftTier);
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
    releaseDate.setDate(releaseDate.getDate() + parseInt(stakingPeriod, 10));
    
    console.log('Creating staking record with:', {
      wallet,
      mintAddress,
      stakingPeriod,
      totalRewards,
      releaseDate: releaseDate.toISOString()
    });
    
    // Create staking record in database
    try {
      const { data: stakingData, error: stakingError } = await supabase
        .from('nft_staking')
        .insert([
          {
            wallet_address: wallet,
            mint_address: mintAddress,
            staking_period: parseInt(stakingPeriod, 10),
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
        return res.status(500).json({ 
          error: 'Failed to create staking record', 
          details: stakingError.message 
        });
      }
      
      console.log('Staking record created successfully:', stakingData.id);
      
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
    } catch (dbError) {
      console.error('Database error during staking:', dbError);
      return res.status(500).json({ 
        error: 'Database error during staking operation',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('Error in completeStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to complete staking process',
      details: error.message 
    });
  }
}