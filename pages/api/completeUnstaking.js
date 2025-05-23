// pages/api/completeUnstaking.js - 업데이트된 버전
import { createClient } from '@supabase/supabase-js';
import { Connection } from '@solana/web3.js';
// 향상된 보상 계산기 import
import { calculateUnstakingPenalty } from './reward-calculator';

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
    
    // 향상된 계산기 사용 - 언스테이킹 페널티 계산
    const currentDate = new Date();
    const stakingStartDate = new Date(stakingData.staked_at);
    const releaseDate = new Date(stakingData.release_date);
    const nftTier = stakingData.nft_tier || 'COMMON';
    const stakingPeriod = stakingData.staking_period;
    
    // 조기 언스테이킹인지 확인
    const isPremature = currentDate < releaseDate;
    const stakingDays = Math.ceil((currentDate - stakingStartDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = isPremature ? 
      Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    
    console.log('Unstaking analysis:', {
      isPremature,
      stakingDays,
      daysRemaining,
      nftTier,
      stakingPeriod
    });
    
    // 계산기 사용하여 정확한 페널티와 최종 보상 계산
    let penaltyInfo;
    
    try {
      // 기존 계산기 시도
      penaltyInfo = calculateUnstakingPenalty(
        nftTier,
        stakingStartDate,
        currentDate,
        stakingPeriod
      );
    } catch (calcError) {
      console.error('기존 계산기 오류, 백업 계산 사용:', calcError);
      
      // 수동 계산 (기존 계산기가 실패할 경우)
      // 보상 계산 - 등급에 따른 기본 보상률
      const baseRatePerDay = {
        'COMMON': 10,
        'RARE': 20,
        'EPIC': 35,
        'LEGENDARY': 50
      }[nftTier.toUpperCase()] || 10;
      
      // 장기 스테이킹 보너스
      const longTermBonus = stakingPeriod >= 30 ? 1.1 : 1.0;
      
      // 획득한 보상
      const earnedRewards = Math.round(baseRatePerDay * stakingDays * longTermBonus);
      
      // 페널티 계산 (조기 언스테이킹)
      let penaltyPercentage = 0;
      let penaltyAmount = 0;
      
      if (isPremature) {
        // 남은 기간에 비례한 페널티 (최대 50%)
        const remainingPercent = daysRemaining / stakingPeriod;
        penaltyPercentage = Math.min(Math.round(remainingPercent * 50), 50);
        penaltyAmount = Math.round(earnedRewards * (penaltyPercentage / 100));
      }
      
      // 최종 보상
      const finalReward = earnedRewards - penaltyAmount;
      
      penaltyInfo = {
        isPremature,
        earnedRewards,
        penaltyAmount,
        penaltyPercentage,
        finalReward
      };
    }
    
    console.log('최종 계산된 보상 정보:', penaltyInfo);
    
    console.log('Unstaking penalty calculation:', {
      earnedRewards: penaltyInfo.earnedRewards,
      isPremature: penaltyInfo.isPremature,
      penaltyAmount: penaltyInfo.penaltyAmount,
      penaltyPercentage: penaltyInfo.penaltyPercentage,
      finalReward: penaltyInfo.finalReward
    });
    
    // Update staking record - 기존 필드 이름 유지
    const { data: updatedStaking, error: updateError } = await supabase
      .from('nft_staking')
      .update({
        status: 'unstaked',
        unstaked_at: currentDate.toISOString(),
        unstake_tx_signature: txSignature, // 기존 필드 이름 사용
        earned_rewards: penaltyInfo.earnedRewards,
        early_unstake_penalty: penaltyInfo.penaltyAmount, // 기존 필드 이름 사용
        unstake_penalty_percentage: penaltyInfo.penaltyPercentage, // 새 필드 추가(있으면)
        final_reward: penaltyInfo.finalReward, // 새 필드 추가(있으면)
        updated_at: currentDate.toISOString()
      })
      .eq('id', stakingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating staking record:', updateError);
      return res.status(500).json({ error: 'Failed to update staking record' });
    }
    
    // Add rewards to user's balance - 기존 방식 유지
    if (penaltyInfo.finalReward > 0) {
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert([
          {
            wallet_address: wallet,
            amount: penaltyInfo.finalReward,
            reward_type: 'staking_reward',
            reference_id: `staking_${stakingId}`, // 기존 필드 이름 사용
            description: penaltyInfo.isPremature 
              ? `Staking rewards for NFT ${mintAddress.slice(0, 8)}... (Early unstake with ${penaltyInfo.penaltyPercentage}% penalty)`
              : `Staking rewards for NFT ${mintAddress.slice(0, 8)}... (Complete staking period)`,
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
      message: penaltyInfo.isPremature
        ? `NFT unstaked early with a ${penaltyInfo.penaltyPercentage}% penalty.`
        : 'NFT unstaked successfully after completing the staking period.',
      earnedRewards: penaltyInfo.earnedRewards,
      penalty: penaltyInfo.penaltyAmount, // 기존 응답 필드 이름 유지
      finalReward: penaltyInfo.finalReward
    });
  } catch (error) {
    console.error('Error in completeUnstaking API:', error);
    return res.status(500).json({ error: 'Failed to complete unstaking process' });
  }
}