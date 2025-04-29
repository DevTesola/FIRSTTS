// pages/api/completeUnstaking.js
import { createClient } from '@supabase/supabase-js';
import { Connection } from '@solana/web3.js';

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
    const { wallet, mintAddress, txSignature, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !txSignature || !stakingId) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, transaction signature, and staking ID are required' 
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
    
    // Get staking record from database
    const { data: stakingData, error: fetchError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('id', stakingId)
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (fetchError) {
      console.error('Error fetching staking record:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch staking record' });
    }
    
    if (!stakingData) {
      return res.status(404).json({ error: 'Staking record not found' });
    }
    
    // Calculate earned rewards
    const stakingStartDate = new Date(stakingData.staked_at);
    const releaseDate = new Date(stakingData.release_date);
    const currentDate = new Date();
    
    // Calculate total staking duration in milliseconds
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    
    // Calculate elapsed duration (capped at total duration)
    const elapsedDuration = Math.min(
      currentDate.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    
    // Calculate progress percentage
    const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
    
    // Calculate earned rewards
    let earnedRewards = (stakingData.total_rewards * progressPercentage) / 100;
    
    // Apply early unstaking penalty if applicable
    let penalty = 0;
    if (currentDate < releaseDate) {
      // Calculate remaining time
      const remainingTime = releaseDate.getTime() - currentDate.getTime();
      const remainingPercentage = remainingTime / totalStakingDuration;
      
      // Penalty is 50% of rewards for remaining time
      penalty = stakingData.total_rewards * remainingPercentage * 0.5;
      
      // Apply penalty
      earnedRewards = Math.max(0, earnedRewards - penalty);
    }
    
    // Format earned rewards to 2 decimal places
    earnedRewards = parseFloat(earnedRewards.toFixed(2));
    
    // Update staking record
    const { data: updatedStaking, error: updateError } = await supabase
      .from('nft_staking')
      .update({
        status: 'unstaked',
        unstaked_at: new Date().toISOString(),
        unstake_tx_signature: txSignature,
        earned_rewards: earnedRewards,
        early_unstake_penalty: parseFloat(penalty.toFixed(2)),
        updated_at: new Date().toISOString()
      })
      .eq('id', stakingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating staking record:', updateError);
      return res.status(500).json({ error: 'Failed to update staking record' });
    }
    
    // Add rewards to user's balance
    if (earnedRewards > 0) {
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert([
          {
            wallet_address: wallet,
            amount: earnedRewards,
            reward_type: 'staking_reward',
            reference_id: `staking_${stakingId}`,
            description: `Staking rewards for NFT ${mintAddress}`,
            claimed: false
          }
        ]);
      
      if (rewardError) {
        console.error('Error creating reward record:', rewardError);
        // Continue despite error, but log it
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'NFT unstaked successfully',
      earnedRewards,
      penalty: parseFloat(penalty.toFixed(2))
    });
  } catch (error) {
    console.error('Error in completeUnstaking API:', error);
    return res.status(500).json({ error: 'Failed to complete unstaking process' });
  }
}