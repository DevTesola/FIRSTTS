// pages/api/completeStaking.js - 최종 개선 버전
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
// 보상 계산기 모듈 import
import { calculateEstimatedRewards, standardizeTier } from './reward-calculator';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, txSignature, stakingPeriod, nftTier, rawTierValue, nftName } = req.body;
    
    console.log('Complete staking request received:', { 
      wallet, 
      mintAddress, 
      txSignature, 
      stakingPeriod,
      nftTier,
      rawTierValue,
      nftName
    });
    
    if (!wallet || !mintAddress || !txSignature || !stakingPeriod) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, transaction signature, and staking period are required' 
      });
    }
    
    // 지갑 주소 형식 검증
    try {
      new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // 민트 주소 형식 검증
    try {
      new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid NFT mint address format' });
    }
    
    // 트랜잭션 확인 (블록체인에서 검증)
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
      
      // 트랜잭션 발신자가 지갑 주소와 일치하는지 확인
      const txSender = txInfo.transaction.message.accountKeys[0].toString();
      if (txSender !== wallet) {
        return res.status(403).json({
          error: 'Transaction sender does not match provided wallet address',
          expected: wallet,
          found: txSender
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
    
    // NFT 소유권 확인
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(wallet),
        { mint: new PublicKey(mintAddress) }
      );
      
      if (tokenAccounts.value.length === 0) {
        return res.status(403).json({
          error: 'NFT not owned by this wallet',
          details: 'The provided mint address is not owned by the wallet'
        });
      }
      
      // 토큰 양이 1인지 확인 (NFT)
      const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      if (!tokenAmount.uiAmount || tokenAmount.uiAmount !== 1) {
        return res.status(400).json({
          error: 'Invalid token amount',
          details: 'Token does not appear to be an NFT (amount should be 1)'
        });
      }
      
      console.log('NFT ownership verified for wallet:', wallet);
    } catch (ownershipError) {
      console.error('Error verifying NFT ownership:', ownershipError);
      // 소유권 확인 오류는 보조 검증이므로 실패해도 계속 진행
      console.log('Continuing despite ownership verification error');
    }
    
    // 중복 스테이킹 방지를 위해 기존 기록 확인
    try {
      const { data: existingStake, error: existingError } = await supabase
        .from('nft_staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
      
      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116은 "결과 없음" 오류로, 예상된 결과
        console.error('Error checking existing stake:', existingError);
        throw new Error(`Database query error: ${existingError.message}`);
      }
      
      if (existingStake) {
        console.log('Duplicate staking attempt detected:', { 
          stakingId: existingStake.id,
          existingTx: existingStake.tx_signature,
          newTx: txSignature
        });
        
        // 같은 트랜잭션 서명이면 기존 기록으로 성공 응답
        if (existingStake.tx_signature === txSignature) {
          return res.status(200).json({
            success: true,
            message: 'NFT already staked with this transaction',
            stakingInfo: {
              ...existingStake,
              progress_percentage: calculateProgress(existingStake),
              earned_so_far: calculateEarnedSoFar(existingStake)
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
    
    // NFT 등급 및 메타데이터 조회 또는 요청에서 가져오기
    let finalNftTier = "COMMON"; // 기본 등급
    let finalNftName = nftName || "";
    
    // 클라이언트에서 전달받은 NFT 등급이 있으면 사용
    if (nftTier) {
      finalNftTier = standardizeTier(nftTier);
      console.log('클라이언트에서 받은 NFT 등급:', nftTier, '-> 표준화:', finalNftTier);
    } else {
      // 클라이언트에서 등급을 전달받지 못한 경우 데이터베이스에서 조회
      try {
        console.log('데이터베이스에서 NFT 메타데이터 조회 중...');
        const { data: nftData } = await supabase
          .from('minted_nfts')
          .select('metadata, name')
          .eq('mint_address', mintAddress)
          .maybeSingle();
        
        if (nftData) {
          finalNftName = nftData.name || `SOLARA NFT #${Date.now().toString().slice(-4)}`;
          
          if (nftData.metadata) {
            let metadata;
            
            try {
              metadata = typeof nftData.metadata === 'string' 
                ? JSON.parse(nftData.metadata) 
                : nftData.metadata;
                
              console.log('데이터베이스에서 가져온 NFT 메타데이터:', metadata);
              
              const tierAttr = metadata.attributes?.find(attr => 
                (attr.trait_type?.toLowerCase() || '').includes("tier") || 
                (attr.trait_type?.toLowerCase() || '').includes("rarity")
              );
              
              if (tierAttr && tierAttr.value) {
                finalNftTier = standardizeTier(tierAttr.value);
                console.log('데이터베이스에서 찾은 NFT 등급:', tierAttr.value, '-> 표준화:', finalNftTier);
              }
            } catch (parseError) {
              console.error('메타데이터 파싱 오류:', parseError);
            }
          }
        }
      } catch (tierError) {
        console.error('데이터베이스에서 NFT 정보 조회 오류:', tierError);
      }
    }
    
    // 원본 등급 값도 저장 (디버깅용)
    const originalTierValue = rawTierValue || nftTier || finalNftTier;
    console.log('저장할 최종 NFT 정보:', {
      tier: finalNftTier,
      originalValue: originalTierValue,
      name: finalNftName
    });
    
    // 업데이트된 보상 계산기 사용
    const stakingPeriodDays = parseInt(stakingPeriod, 10);
    const rewardCalculation = calculateEstimatedRewards(finalNftTier, stakingPeriodDays);
    
    // 스테이킹 시작 및 종료 날짜 계산
    const stakingStartDate = new Date();
    const releaseDate = new Date(stakingStartDate);
    releaseDate.setDate(releaseDate.getDate() + stakingPeriodDays);
    
    console.log('Creating staking record with:', {
      wallet,
      mintAddress,
      stakingPeriod: stakingPeriodDays,
      totalRewards: rewardCalculation.totalRewards,
      releaseDate: releaseDate.toISOString(),
      nftTier: finalNftTier,
      originalTierValue
    });
    
    // 재시도 메커니즘이 있는 데이터베이스에 스테이킹 기록 생성
    const MAX_RETRIES = 3;
    let stakingData = null;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES && !stakingData) {
      try {
        const { data, error } = await supabase
          .from('nft_staking')
          .insert([
            {
              wallet_address: wallet,
              mint_address: mintAddress,
              nft_name: finalNftName,
              staking_period: stakingPeriodDays,
              staked_at: stakingStartDate.toISOString(),
              release_date: releaseDate.toISOString(),
              total_rewards: rewardCalculation.totalRewards,
              daily_reward_rate: rewardCalculation.baseRate,
              tx_signature: txSignature,
              status: 'staked',
              nft_tier: finalNftTier,
              original_tier_value: originalTierValue,
              
              // 새로운 필드 추가: 보상 계산기에서 얻은 값
              base_reward_rate: rewardCalculation.baseRate,
              long_term_bonus_rate: rewardCalculation.longTermBonus,
              estimated_rewards_json: JSON.stringify({
                dailyRewards: rewardCalculation.dailyRewards,
                averageDailyReward: rewardCalculation.averageDailyReward
              })
            }
          ])
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        stakingData = data;
        console.log('Staking record created successfully:', stakingData.id);
      } catch (dbError) {
        retryCount++;
        console.error(`Database error during staking (attempt ${retryCount}/${MAX_RETRIES}):`, dbError);
        
        if (retryCount >= MAX_RETRIES) {
          return res.status(500).json({ 
            error: 'Database error during staking operation after multiple attempts',
            details: dbError.message
          });
        }
        
        // 재시도 전 대기 (지수 백오프)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // UI용 계산 필드 추가
    const stakingInfo = {
      ...stakingData,
      progress_percentage: 0, // 방금 시작함
      earned_so_far: 0        // 방금 시작함
    };
    
    // 성공 응답 반환
    return res.status(200).json({
      success: true,
      message: 'NFT staked successfully',
      stakingInfo,
      // 더 많은 세부 정보 제공
      rewardDetails: {
        nftTier: finalNftTier,
        originalValue: originalTierValue,
        baseRate: rewardCalculation.baseRate,
        totalRewards: rewardCalculation.totalRewards,
        averageDailyReward: rewardCalculation.averageDailyReward
      }
    });
  } catch (error) {
    console.error('Error in completeStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to complete staking process',
      details: error.message 
    });
  }
}

// 스테이킹 진행률 백분율 계산 헬퍼 함수
function calculateProgress(stakingRecord) {
  if (!stakingRecord) return 0;
  
  const stakingStartDate = new Date(stakingRecord.staked_at);
  const releaseDate = new Date(stakingRecord.release_date);
  const currentDate = new Date();
  
  // 총 스테이킹 기간 (밀리초)
  const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
  
  // 경과 기간 (총 기간을 초과하지 않도록 제한)
  const elapsedDuration = Math.min(
    currentDate.getTime() - stakingStartDate.getTime(),
    totalStakingDuration
  );
  
  // 진행률 백분율 계산
  return (elapsedDuration / totalStakingDuration) * 100;
}

// 지금까지 획득한 보상 계산 헬퍼 함수
function calculateEarnedSoFar(stakingRecord) {
  if (!stakingRecord) return 0;
  
  const progressPercentage = calculateProgress(stakingRecord);
  const earnedRewards = (stakingRecord.total_rewards * progressPercentage) / 100;
  
  // 소수점 2자리로 형식화
  return parseFloat(earnedRewards.toFixed(2));
}