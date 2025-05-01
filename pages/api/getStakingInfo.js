// pages/api/getStakingInfo.js - Integrated Version
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
// 향상된 보상 계산기 import
import { calculateEstimatedRewards } from './reward-calculator';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Solana 연결 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  try {
    const { wallet, mintAddress } = req.query;
    
    // 파라미터 검증
    if (!wallet || !mintAddress) {
      return res.status(400).json({ 
        error: 'Wallet address and mint address are required',
        success: false
      });
    }
    
    // 지갑 주소 형식 검증
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        success: false
      });
    }
    
    // 민트 주소 형식 검증
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid mint address format',
        success: false
      });
    }
    
    // Solana 연결
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // NFT 소유권 검증 - 토큰 계정 방식 먼저 시도 (더 신뢰할 수 있음)
    console.log('[getStakingInfo] Verifying NFT ownership...');
    let isOwner = false;
    
    try {
      // 토큰 계정으로 먼저 소유권 확인 시도
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length > 0) {
        console.log('[getStakingInfo] NFT ownership verified through token accounts for wallet:', wallet);
        isOwner = true;
      } else {
        console.log(`[getStakingInfo] Ownership verification failed: ${wallet} does not own ${mintAddress} (token accounts check)`);
        
        // 토큰 계정 확인이 실패하면 Metaplex 확인으로 대체
        try {
          const metaplex = new Metaplex(connection);
          const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey });
          
          // 다양한 경로로 소유권 확인
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
          // 데이터베이스 확인은 계속 진행
        }
      }
    } catch (ownershipError) {
      console.warn('[getStakingInfo] Ownership verification error:', ownershipError);
      // 데이터베이스 확인은 계속 진행, 오류만 로그
    }
    
    // 데이터베이스에서 스테이킹 정보 가져오기
    const { data, error } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116은 "반환된 행 없음" 오류, 다르게 처리
      console.error('[getStakingInfo] Database query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch staking info', 
        details: error.message,
        success: false 
      });
    }
    
    // 스테이킹 기록이 없는 경우
    if (!data) {
      return res.status(200).json({ 
        isStaked: false,
        isOwner,
        success: true
      });
    }
    
    // 현재 날짜와 필요한 날짜 설정
    const stakingStartDate = new Date(data.staked_at);
    const releaseDate = new Date(data.release_date);
    const currentDate = new Date();
    const stakingPeriod = data.staking_period;
    const nftTier = data.nft_tier || 'COMMON';
    
    // 향상된 보상 계산기를 사용한 리워드 정보 계산
    const rewardInfo = calculateEarnedRewards(
      nftTier, 
      stakingStartDate, 
      currentDate, 
      stakingPeriod
    );
    
    // 남은 일수 계산
    const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
    
    // 현재 적용 중인 보너스 배율 계산
    const currentBonusMultiplier = calculateCurrentBonusMultiplier(
      Math.floor(rewardInfo.elapsedDays), 
      stakingPeriod
    );
    
    // 계산된 필드를 추가한 스테이킹 정보
    const stakingInfo = {
      ...data,
      progress_percentage: rewardInfo.progressPercentage,
      earned_so_far: rewardInfo.earnedRewards,
      remaining_rewards: rewardInfo.remainingRewards,
      days_remaining: daysRemaining,
      is_unlocked: currentDate >= releaseDate,
      lockup_complete: currentDate >= releaseDate,
      elapsed_days: rewardInfo.elapsedDays,
      current_bonus_multiplier: currentBonusMultiplier,
      // 보너스 세부 정보 제공
      bonus_info: {
        baseRate: data.base_reward_rate || data.daily_reward_rate,
        currentMultiplier: currentBonusMultiplier,
        // 애플리케이션 표시용
        multiplierLabel: `${currentBonusMultiplier}x (${(currentBonusMultiplier - 1) * 100}% bonus)`
      }
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

/**
 * 현재 적용 중인 보너스 배율 계산
 * @param {number} elapsedDays - 경과 일수
 * @param {number} stakingPeriod - 스테이킹 총 기간(일)
 * @returns {number} 현재 적용되는 보너스 배율
 */
function calculateCurrentBonusMultiplier(elapsedDays, stakingPeriod) {
  // 초기 스파이크 보너스
  let initialBonus = 1.0;
  if (elapsedDays <= 7) initialBonus = 2.0;      // 첫 7일: 2배
  else if (elapsedDays <= 14) initialBonus = 1.75;    // 8-14일: 1.75배
  else if (elapsedDays <= 30) initialBonus = 1.5;     // 15-30일: 1.5배
  
  // 장기 스테이킹 보너스
  let longTermBonus = 1.0;
  if (stakingPeriod >= 365) longTermBonus = 2.0;    // 1년 이상: 2배 (100% 보너스)
  else if (stakingPeriod >= 180) longTermBonus = 1.7;    // 6개월 이상: 1.7배 (70% 보너스)
  else if (stakingPeriod >= 90) longTermBonus = 1.4;     // 3개월 이상: 1.4배 (40% 보너스)
  else if (stakingPeriod >= 30) longTermBonus = 1.2;     // 1개월 이상: 1.2배 (20% 보너스)
  
  // 더 큰 보너스 적용
  return Math.max(initialBonus, longTermBonus);
}