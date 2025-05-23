/**
 * NFT 언스테이킹 준비 API 엔드포인트 (통합 버전)
 * 기존 v1, v3 버전을 통합한 새 구현
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// 공통 모듈에서 필요한 유틸리티 가져오기
import {
  PROGRAM_ID,
  createSerializedTransaction,
  createTokenAccountInstruction,
  createUnstakeNftInstruction,
  findPoolStatePDA,
  findStakeInfoPDA,
  findEscrowAuthorityPDA,
  findUserStakingInfoPDA,
  getErrorMessage,
  createApiResponse
} from '../../../shared';

// 환경 변수 가져오기
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 경과 일수 계산 함수
 * 
 * @param {number} startTimestamp - 시작 타임스탬프 (초)
 * @param {number} endTimestamp - 종료 타임스탬프 (초)
 * @returns {number} 경과 일수
 */
function calculateDaysElapsed(startTimestamp, endTimestamp) {
  const secondsInDay = 24 * 60 * 60;
  return Math.floor((endTimestamp - startTimestamp) / secondsInDay);
}

/**
 * 스테이킹 기간 완료 여부 검사 함수
 * 
 * @param {Object} stakingInfo - 스테이킹 정보 객체
 * @returns {boolean} 스테이킹 기간 완료 여부
 */
function isStakingPeriodCompleted(stakingInfo) {
  const now = Math.floor(Date.now() / 1000);
  return now >= stakingInfo.release_date;
}

/**
 * 조기 언스테이킹 패널티 계산 함수
 * 
 * @param {Object} stakingInfo - 스테이킹 정보 객체
 * @returns {Object} 패널티 정보
 */
function calculateEarlyUnstakingPenalty(stakingInfo) {
  const now = Math.floor(Date.now() / 1000);
  
  // 스테이킹 기간이 완료된 경우 패널티 없음
  if (now >= stakingInfo.release_date) {
    return {
      isPremature: false,
      earnedRewards: stakingInfo.earned_so_far || 0,
      penaltyPercentage: 0,
      penaltyAmount: 0,
      finalReward: stakingInfo.earned_so_far || 0,
      daysRemaining: 0
    };
  }
  
  // 남은 일수 계산
  const daysRemaining = calculateDaysElapsed(now, stakingInfo.release_date);
  
  // 최대 패널티 비율은 50%
  // 패널티는 남은 일수에 비례하여 계산 (남은 기간이 길수록 패널티가 큼)
  const totalDays = stakingInfo.staking_period;
  const elapsedDays = calculateDaysElapsed(stakingInfo.staked_at, now);
  
  // 비율 계산 (최소 7일 스테이킹)
  const completionRatio = Math.min(1, Math.max(0, elapsedDays / totalDays));
  
  // 패널티 비율 계산: 완료율 50% 미만인 경우 50% 패널티, 그 이후 완료율에 따라 선형 감소
  let penaltyPercentage = 0;
  if (completionRatio < 0.5) {
    penaltyPercentage = 50; // 최대 50% 패널티
  } else {
    // 50%-100% 완료율 사이에서 선형 감소 (50% -> 0%)
    penaltyPercentage = Math.round(50 - (completionRatio - 0.5) * 100);
  }
  
  // 최소 7일 경과 보장
  if (elapsedDays < 7) {
    penaltyPercentage = 50; // 7일 미만 스테이킹은 최대 패널티
  }
  
  // 획득한 보상 계산
  const earnedRewards = stakingInfo.earned_so_far || 0;
  
  // 패널티 금액 계산
  const penaltyAmount = Math.floor(earnedRewards * (penaltyPercentage / 100));
  
  // 최종 보상 계산
  const finalReward = earnedRewards - penaltyAmount;
  
  return {
    isPremature: true,
    earnedRewards,
    penaltyPercentage,
    penaltyAmount,
    finalReward,
    daysRemaining
  };
}

/**
 * 언스테이킹 준비 API 핸들러
 */
export default async function handler(req, res) {
  // POST 메서드 확인
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  // API 버전 파라미터 확인 (v1, v3 또는 기본값)
  const apiVersion = req.query.version || 'v3';
  console.log(`언스테이킹 준비 API 버전: ${apiVersion}`);

  try {
    // 요청 파라미터 가져오기
    const { wallet, mintAddress, stakingId } = req.body;
    
    // NFT ID 처리 - onchain_ 접두사 제거
    const processedStakingId = stakingId && typeof stakingId === 'string' && stakingId.startsWith('onchain_')
      ? stakingId.replace('onchain_', '')
      : stakingId;
    
    console.log('처리된 stakingId:', { original: stakingId, processed: processedStakingId });
    
    // 필수 파라미터 검증
    if (!wallet || !mintAddress) {
      return res.status(400).json(
        createApiResponse(false, '지갑 주소와 민트 주소는 필수 항목입니다', null, 'MissingParameters')
      );
    }
    
    // PublicKey 변환 및 검증
    let walletPubkey, mintPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, '유효하지 않은 주소 형식', null, err)
      );
    }
    
    console.log('언스테이킹 요청 받음:', { wallet, mintAddress, stakingId: processedStakingId });
    
    // 스테이킹 정보 확인
    let stakingQuery;

    // Check if stakingId is provided and if it uses onchain format
    if (stakingId && stakingId.toString().startsWith('onchain_')) {
      console.log('온체인 ID 형식 감지, 지갑과 민트 주소로만 쿼리');
      stakingQuery = supabase
        .from('nft_staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
    } else if (processedStakingId) {
      // If processed ID is provided
      console.log(`ID ${processedStakingId}로 스테이킹 정보 조회`);
      stakingQuery = supabase
        .from('nft_staking')
        .select('*')
        .eq('id', processedStakingId)
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
    } else {
      // If no ID is provided, query by wallet and mint address
      console.log('ID 없이 지갑과 민트 주소로 스테이킹 정보 조회');
      stakingQuery = supabase
        .from('nft_staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
    }

    const { data: stakingInfo, error: stakingError } = await stakingQuery;
    
    if (stakingError) {
      console.error('스테이킹 정보 조회 중 오류:', stakingError);
      console.log('쿼리 파라미터:', {
        wallet,
        mintAddress,
        stakingId,
        isOnchainFormat: stakingId && stakingId.toString().startsWith('onchain_')
      });
      return res.status(500).json(
        createApiResponse(false, '스테이킹 정보 조회 실패', null, stakingError)
      );
    }

    if (!stakingInfo) {
      console.log('스테이킹 정보를 찾을 수 없음:', {
        wallet,
        mintAddress,
        stakingId,
        isOnchainFormat: stakingId && stakingId.toString().startsWith('onchain_')
      });
      return res.status(404).json(
        createApiResponse(false, '이 NFT는 스테이킹되어 있지 않습니다', null, 'NotStaked')
      );
    }

    console.log('스테이킹 정보 찾음:', {
      id: stakingInfo.id,
      wallet: stakingInfo.wallet_address,
      mint: stakingInfo.mint_address,
      status: stakingInfo.status,
      staked_at: stakingInfo.staked_at
    });
    
    // 스테이킹 ID 확인 (제공된 경우) - processedStakingId 사용
    if (processedStakingId && stakingInfo.id !== processedStakingId && stakingInfo.id.toString() !== processedStakingId.toString()) {
      console.log('스테이킹 ID 불일치:', {
        requestedId: processedStakingId,
        actualId: stakingInfo.id,
        types: { requested: typeof processedStakingId, actual: typeof stakingInfo.id }
      });
      return res.status(400).json(
        createApiResponse(false, '스테이킹 ID가 일치하지 않습니다', null, 'InvalidStakingId')
      );
    }
    
    // Solana 연결 설정
    console.log('Solana RPC에 연결 중:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 스테이킹 기간 완료 여부 확인
    const stakingCompleted = isStakingPeriodCompleted(stakingInfo);
    console.log('스테이킹 기간 완료 여부:', stakingCompleted);
    
    // 조기 언스테이킹 패널티 계산
    const penaltyInfo = calculateEarlyUnstakingPenalty(stakingInfo);
    console.log('언스테이킹 패널티 정보:', penaltyInfo);
    
    // PDA 주소 생성
    const [poolStatePDA] = findPoolStatePDA();
    const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
    const [escrowAuthorityPDA] = findEscrowAuthorityPDA(mintPubkey);
    const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
    
    console.log('Pool State PDA:', poolStatePDA.toString());
    console.log('Stake Info PDA:', stakeInfoPDA.toString());
    console.log('Escrow Authority PDA:', escrowAuthorityPDA.toString());
    console.log('User Staking Info PDA:', userStakingInfoPDA.toString());
    
    // 명령어 배열 생성
    const instructions = [];
    
    // 1. 사용자 토큰 계정 확인 및 초기화
    console.log('사용자 토큰 계정 확인 중...');
    let userTokenInfo;
    let userTokenAccount;

    try {
      // 지갑 소유자의 모든 토큰 계정 가져오기
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID
      });
      
      // 이 NFT에 대한 기존 토큰 계정 찾기
      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
          const parsedInfo = accountInfo.value?.data?.parsed?.info;
          
          if (parsedInfo && parsedInfo.mint === mintAddress) {
            console.log('기존 토큰 계정 발견:', account.pubkey.toString());
            userTokenInfo = { pubkey: account.pubkey, data: parsedInfo };
            break;
          }
        } catch (err) {
          console.warn('토큰 계정 분석 오류:', err.message);
        }
      }
    } catch (err) {
      console.warn('토큰 계정 조회 오류:', err.message);
    }
    
    // 기존 토큰 계정이 없거나 초기화되지 않은 경우 ATA 초기화
    if (!userTokenInfo) {
      console.log('이 NFT에 대한 기존 토큰 계정 없음, ATA 생성 명령어 추가...');
      const createUserATAIx = await createTokenAccountInstruction(
        walletPubkey,
        mintPubkey
      );
      instructions.push(createUserATAIx);
      
      // 새로 생성될 ATA
      userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey
      );
      console.log('새 ATA 주소:', userTokenAccount.toString());
    } else {
      console.log('기존 토큰 계정 사용:', userTokenInfo.pubkey.toString());
      console.log('토큰 계정 소유자:', userTokenInfo.data.owner);
      console.log('토큰 계정 민트:', userTokenInfo.data.mint);
      
      // 기존 토큰 계정 사용
      userTokenAccount = userTokenInfo.pubkey;
    }
    
    // Escrow 토큰 계정 주소 가져오기
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true  // allow owner off curve
    );
    
    // 2. 언스테이킹 명령어 추가
    console.log('언스테이킹 명령어 추가...');
    
    // 실제 IDL 순서대로 수정
    const unstakeNftIx = createUnstakeNftInstruction(
      walletPubkey,
      mintPubkey,
      poolStatePDA,
      {
        // 프로그램의 실제 계정 순서대로 전달
        stakeInfo: stakeInfoPDA,               // stake_info
        escrowTokenAccount,                    // escrow_nft_account
        escrowAuthority: escrowAuthorityPDA,   // escrow_authority
        userTokenAccount,                      // user_nft_account
        userStakingInfo: userStakingInfoPDA    // user_staking_info
      }
    );

    // 명령어의 계정 순서와 개수 검증 로그
    console.log('생성된 명령어 계정 개수:', unstakeNftIx.keys.length);
    unstakeNftIx.keys.forEach((key, i) => {
      console.log(`${i}. ${key.pubkey.toString()} (isSigner: ${key.isSigner}, isWritable: ${key.isWritable})`);
    });

    instructions.push(unstakeNftIx);
    
    // 최근 블록해시 가져오기
    console.log('최근 블록해시 가져오는 중...');
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    
    // 트랜잭션 생성 및 직렬화
    const serializedTx = createSerializedTransaction(
      instructions,
      walletPubkey,
      blockhash,
      lastValidBlockHeight
    );
    
    // 응답 객체 구성
    const response = {
      // 지갑 및 NFT 정보
      wallet,
      mintAddress,
      stakingId: stakingInfo.id,
      
      // 트랜잭션 데이터
      transactionBase64: serializedTx,
      
      // 계정 주소
      accounts: {
        poolState: poolStatePDA.toString(),
        stakeInfo: stakeInfoPDA.toString(),
        escrowAuthority: escrowAuthorityPDA.toString(),
        userStakingInfo: userStakingInfoPDA.toString(),
        escrowTokenAccount: escrowTokenAccount.toString(),
        userTokenAccount: userTokenAccount.toString()
      },
      
      // 스테이킹 정보
      stakingInfo: {
        stakedAt: stakingInfo.staked_at,
        releaseDate: stakingInfo.release_date,
        stakingPeriod: stakingInfo.staking_period,
        earnedSoFar: stakingInfo.earned_so_far
      },
      
      // 패널티 정보
      unstakingDetails: penaltyInfo,
      
      // 스테이킹 기간 완료 여부 (조기 언스테이킹 경고)
      stakingCompleted,
      
      // 경고 메시지 (조기 언스테이킹의 경우)
      warning: !stakingCompleted ? 
        `조기 언스테이킹에 대한 패널티가 적용됩니다: ${penaltyInfo.penaltyPercentage}% (${penaltyInfo.penaltyAmount} TESOLA)` : 
        undefined,
      
      // 트랜잭션 만료 정보
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      expiryHeight: lastValidBlockHeight
    };
    
    // 응답 반환
    return res.status(200).json(
      createApiResponse(true, '언스테이킹 트랜잭션이 준비되었습니다', response)
    );
  } catch (error) {
    console.error('언스테이킹 트랜잭션 준비 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '언스테이킹 트랜잭션 준비 실패', null, error)
    );
  }
}