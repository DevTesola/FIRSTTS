/**
 * NFT 스테이킹 완료 API 엔드포인트 (통합 버전)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// 공통 모듈에서 필요한 유틸리티 가져오기
import {
  PROGRAM_ID,
  createApiResponse
} from '../../../shared';

// 환경 변수 가져오기
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * NFT 등급 값을 표준화하는 헬퍼 함수
 * 
 * @param {string} tierValue - 원시 티어 값
 * @returns {string} 표준화된 티어 값
 */
function standardizeTier(tierValue) {
  if (!tierValue) return 'COMMON';
  
  const tier = tierValue.trim().toUpperCase();
  if (tier.includes('LEGEND')) return 'LEGENDARY';
  if (tier.includes('EPIC')) return 'EPIC';
  if (tier.includes('RARE')) return 'RARE';
  return 'COMMON';
}

/**
 * 예상 보상 계산 함수
 * 
 * @param {string} nftTier - NFT 등급
 * @param {number} stakingPeriod - 스테이킹 기간(일)
 * @returns {Object} 보상 관련 정보
 */
function calculateEstimatedRewards(nftTier, stakingPeriod) {
  // 티어별 일일 기본 보상률
  const dailyRewardsByTier = {
    'LEGENDARY': 200,  // 200 TESOLA per day
    'EPIC': 100,       // 100 TESOLA per day
    'RARE': 50,        // 50 TESOLA per day
    'COMMON': 25       // 25 TESOLA per day
  };
  
  // 일일 기본 보상률 계산
  const baseRate = dailyRewardsByTier[nftTier] || dailyRewardsByTier.COMMON;
  
  // 장기 스테이킹 승수 계산
  let multiplier = 1.0;
  
  // 장기 스테이킹 보너스
  if (stakingPeriod >= 365) multiplier = 2.0;      // 365+ days: 2x
  else if (stakingPeriod >= 180) multiplier = 1.7; // 180+ days: 1.7x
  else if (stakingPeriod >= 90) multiplier = 1.4;  // 90+ days: 1.4x
  else if (stakingPeriod >= 30) multiplier = 1.2;  // 30+ days: 1.2x
  
  // 총 예상 보상 계산
  const totalRewards = Math.floor(baseRate * stakingPeriod * multiplier);
  
  // 일별 보상 배열 생성 (최대 7일까지만)
  const dailyRewards = [];
  for (let day = 0; day < Math.min(stakingPeriod, 7); day++) {
    dailyRewards.push(Math.floor(baseRate * multiplier));
  }
  
  // 평균 일일 보상 계산
  const averageDailyReward = totalRewards / stakingPeriod;
  
  // 장기 보너스 백분율
  const longTermBonus = Math.floor((multiplier - 1.0) * 100);
  
  return {
    baseRate,
    totalRewards,
    dailyRewards,
    averageDailyReward,
    longTermBonus
  };
}

/**
 * 스테이킹 완료 API 핸들러
 */
export default async function handler(req, res) {
  // POST 메서드 확인
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    // 요청 파라미터 가져오기
    const { 
      wallet, 
      mintAddress, 
      txSignature, 
      stakingPeriod, 
      nftTier = 'COMMON', 
      rawTierValue, 
      nftName 
    } = req.body;
    
    // 필수 파라미터 검증
    if (!wallet || !mintAddress || !txSignature) {
      return res.status(400).json(
        createApiResponse(false, '지갑 주소, 민트 주소, 트랜잭션 서명은 필수 항목입니다', null, 'MissingParameters')
      );
    }
    
    // PublicKey 변환 및 검증
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, '유효하지 않은 지갑 주소 형식', null, err)
      );
    }
    
    console.log('스테이킹 완료 요청:', { wallet, mintAddress, txSignature, stakingPeriod, nftTier });
    
    // 이미 스테이킹되었는지 확인
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('기존 스테이킹 확인 중 오류:', existingError);
      return res.status(500).json(
        createApiResponse(false, '스테이킹 상태 확인 실패', null, existingError)
      );
    }
    
    if (existingStake) {
      console.log('NFT 이미 스테이킹됨:', existingStake);
      return res.status(400).json({
        success: false,
        error: `이 NFT는 이미 ${new Date(existingStake.release_date).toLocaleDateString()}까지 스테이킹되어 있습니다`,
        stakingInfo: existingStake
      });
    }
    
    // 트랜잭션 확인
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    try {
      const txInfo = await connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!txInfo) {
        console.log('트랜잭션을 찾을 수 없음:', txSignature);
        return res.status(404).json(
          createApiResponse(false, '트랜잭션을 찾을 수 없습니다', null, 'TransactionNotFound')
        );
      }
      
      // 트랜잭션 확인 (프로그램 ID와 성공 여부)
      const programIds = txInfo.transaction.message.programIds().map(id => id.toString());
      const foundProgram = programIds.includes(PROGRAM_ID);
      const isSuccess = txInfo.meta && txInfo.meta.err === null;
      
      if (!foundProgram) {
        console.log('트랜잭션에 스테이킹 프로그램이 포함되어 있지 않음:', programIds);
        return res.status(400).json(
          createApiResponse(false, '트랜잭션에 스테이킹 프로그램이 포함되어 있지 않습니다', null, 'InvalidProgram')
        );
      }
      
      if (!isSuccess) {
        console.log('트랜잭션이 실패함:', txInfo.meta?.err);
        return res.status(400).json(
          createApiResponse(false, '트랜잭션이 실패했습니다', null, txInfo.meta?.err)
        );
      }
      
      console.log('트랜잭션 확인 성공, 스테이킹 정보 저장 중...');
    } catch (txError) {
      console.error('트랜잭션 확인 중 오류:', txError);
      return res.status(500).json(
        createApiResponse(false, '트랜잭션 확인 실패', null, txError)
      );
    }
    
    // 표준화된 NFT 등급
    const standardizedTier = standardizeTier(nftTier || rawTierValue);
    
    // 보상 계산
    const stakingPeriodNum = parseInt(stakingPeriod, 10) || 30;
    const rewardCalc = calculateEstimatedRewards(standardizedTier, stakingPeriodNum);
    
    // 현재 시간
    const now = Math.floor(Date.now() / 1000);
    
    // 스테이킹 정보 저장 - 포괄적인 NFT ID 조회 방식 사용
    let realNftId = null;
    try {
      {
        // 2. 계속 진행 - DB에서 수정된 NFT 정보 조회
        try {
          console.log('물음표❶ DB에서 NFT 정보 조회 시도...');
          const { data: nftData } = await supabase
            .from('minted_nfts')
            .select('id, mint_index, name, metadata')
            .eq('mint_address', mintAddress)
            .maybeSingle();
          
          if (nftData) {
            // ID 변형을 처리하기 위한 상세 정보 제공
            console.log('물음표❶ DB에서 찾은 NFT 정보:', {
              id: nftData.id,
              mint_index: nftData.mint_index,
              name: nftData.name
            });
            
            // 우선순위: mint_index > id > 이름에서 추출 > 메타데이터
            if (nftData.mint_index && !isNaN(nftData.mint_index)) {
              realNftId = String(nftData.mint_index).padStart(4, '0');
              console.log(`\u2776-1 mint_index에서 NFT ID 설정: ${realNftId}`);
            } 
            else if (nftData.id && !isNaN(nftData.id)) {
              realNftId = String(nftData.id).padStart(4, '0');
              console.log(`\u2776-2 id 필드에서 NFT ID 설정: ${realNftId}`);
            }
            else if (nftData.name) {
              // 이름에서 추출: "SOLARA #123" 같은 형식
              const nameMatch = nftData.name.match(/#\s*(\d+)/);
              if (nameMatch && nameMatch[1]) {
                realNftId = String(nameMatch[1]).padStart(4, '0');
                console.log(`\u2776-3 이름에서 NFT ID 추출: ${realNftId}`);
              }
            }
            // 메타데이터 처리
            else if (nftData.metadata) {
              try {
                const metadata = typeof nftData.metadata === 'string' ? 
                  JSON.parse(nftData.metadata) : nftData.metadata;
                  
                if (metadata.name) {
                  const metaNameMatch = metadata.name.match(/#\s*(\d+)/);
                  if (metaNameMatch && metaNameMatch[1]) {
                    realNftId = String(metaNameMatch[1]).padStart(4, '0');
                    console.log(`\u2776-4 메타데이터 이름에서 NFT ID 추출: ${realNftId}`);
                  }
                }
              } catch (metaError) {
                console.warn('\u2776-4 메타데이터 처리 중 오류:', metaError.message);
              }
            }
          } else {
            console.log('물음표❶ DB에서 NFT 정보를 찾을 수 없음');
          }
        } catch (dbError) {
          console.warn('물음표❶ DB 조회 중 오류:', dbError.message);
        }
      }
      
      // 3. 여전히 ID가 없는 경우 - 민트 주소에서 해시 기반 ID 생성
      if (!realNftId) {
        console.log('물음표❷ 해시 기반 ID 생성 시도...');
        // 해시 기반 방식 - 맨 앉에 배치 (앞 6자리에서 1-999 사이 범위로 변환)
        let hash = 0;
        for (let i = 0; i < mintAddress.length; i++) {
          hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
          hash = hash & hash; // 32비트 정수로 유지
        }
        
        // 1-999 사이의 범위로 변환하고 0 패딩
        const hashBasedId = String(Math.abs(hash) % 999 + 1).padStart(4, '0');
        realNftId = hashBasedId;
        console.log(`\u2777 해시 기반 NFT ID 생성: ${realNftId}`);
      }
    } catch (nftError) {
      console.warn('전체 NFT ID 추출 과정 오류:', nftError.message);
      // 오류 발생시 기본값으로 추출
      realNftId = mintAddress.slice(0, 6);
      console.log(`오류 발생으로 민트 주소 앞부분을 ID로 사용: ${realNftId}`);
    }
    
    const stakingData = {
      wallet_address: wallet,
      mint_address: mintAddress,
      tx_signature: txSignature,
      status: 'staked',
      nft_name: nftName || `NFT #${mintAddress.slice(0, 6)}`,
      nft_tier: standardizedTier,
      original_tier_value: rawTierValue,
      staking_period: stakingPeriodNum,
      staked_at: now,
      release_date: now + (stakingPeriodNum * 24 * 60 * 60),
      daily_reward_rate: rewardCalc.baseRate,
      total_rewards: rewardCalc.totalRewards,
      claimed_rewards: 0,
      claimed_at: null,
      auto_compound: false,
      last_compound_at: null,
      last_updated: now,
      created_at: now,
      staking_status: 'active',
      staked_nft_id: realNftId // 실제 NFT ID 저장
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('nft_staking')
      .insert(stakingData)
      .select()
      .single();
    
    if (insertError) {
      console.error('스테이킹 정보 저장 중 오류:', insertError);
      return res.status(500).json(
        createApiResponse(false, '스테이킹 정보 저장 실패', null, insertError)
      );
    }
    
    console.log('스테이킹 정보 저장 성공:', insertedData.id);
    
    // 트랜잭션 이력 저장
    const txHistoryData = {
      wallet_address: wallet,
      mint_address: mintAddress,
      tx_signature: txSignature,
      tx_type: 'stake',
      tx_data: {
        stakingPeriod: stakingPeriodNum,
        nftTier: standardizedTier,
        rawTierValue,
        rewardCalc
      },
      status: 'completed',
      timestamp: now
    };
    
    const { error: txHistoryError } = await supabase
      .from('transactions')
      .insert(txHistoryData);
    
    if (txHistoryError) {
      console.warn('트랜잭션 이력 저장 중 오류:', txHistoryError);
      // 트랜잭션 이력 저장 실패는 중요한 오류가 아니므로 경고만 로깅
    }
    
    // 성공 응답
    return res.status(200).json(
      createApiResponse(true, 'NFT 스테이킹이 성공적으로 완료되었습니다', {
        stakingInfo: insertedData,
        expiryDate: new Date(insertedData.release_date * 1000).toISOString(),
        rewards: rewardCalc
      })
    );
  } catch (error) {
    console.error('스테이킹 완료 처리 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '스테이킹 완료 처리 실패', null, error)
    );
  }
}