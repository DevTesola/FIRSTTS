/**
 * /api/staking/getStakingInfo.js - NFT 스테이킹 정보 조회 API 엔드포인트 (Primary Endpoint)
 * 
 * IMPORTANT: This is the main canonical endpoint for staking information.
 * The legacy endpoint at /api/getStakingInfo.js forwards requests here.
 * All new code should use this endpoint directly.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import idl from '../../../idl/nft_staking.json';

// 공통 모듈에서 필요한 유틸리티 가져오기
import {
  PROGRAM_ID,
  findStakeInfoPDA,
  findUserStakingInfoPDA,
  createApiResponse,
  prepareIdlForAnchor
} from '../../../shared';

// 환경 변수 가져오기
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 스테이킹 진행도 계산 함수
 * 
 * @param {Object} stakingInfo - 스테이킹 정보 객체
 * @returns {number} 진행 백분율 (0-100)
 */
function calculateStakingProgress(stakingInfo) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stakingInfo.staked_at;
  const endTime = stakingInfo.release_date;
  
  // 스테이킹 기간이 완료된 경우 100% 반환
  if (now >= endTime) {
    return 100;
  }
  
  // 진행도 계산 (시작 시간부터 종료 시간까지)
  const totalDuration = endTime - startTime;
  const elapsedDuration = now - startTime;
  
  return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
}

/**
 * 획득 보상 계산 함수
 * 
 * @param {Object} stakingInfo - 스테이킹 정보 객체
 * @returns {number} 획득한 보상
 */
function calculateEarnedRewards(stakingInfo) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = stakingInfo.staked_at;
  const dailyRate = stakingInfo.daily_reward_rate || 0;
  
  // 최대 현재 시간까지만 계산
  const endTime = Math.min(now, stakingInfo.release_date);
  
  // 경과 일 수 계산
  const daysElapsed = (endTime - startTime) / (24 * 60 * 60);
  
  // 총 보상 계산
  const totalRewards = dailyRate * daysElapsed;
  
  return Math.floor(totalRewards);
}

/**
 * 스테이킹 정보 조회 API 핸들러
 */
export default async function handler(req, res) {
  // 메서드 확인
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only GET and POST methods are allowed')
    );
  }

  try {
    // 요청 파라미터 가져오기
    const params = req.method === 'GET' ? req.query : req.body;
    const { wallet, mintAddress } = params;
    
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
    
    console.log('스테이킹 정보 조회 요청:', { wallet, mintAddress });
    
    // 온체인 상태 확인 (계정 존재 여부)
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 스테이크 정보 PDA 생성 - 올바른 시드 값('stake')을 사용하는 findStakeInfoPDA 함수 사용
    const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
    const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
    
    console.log('Stake Info PDA:', stakeInfoPDA.toString());
    console.log('User Staking Info PDA:', userStakingInfoPDA.toString());
    console.log('스테이크 정보 PDA 계산에 사용된 시드 확인: shared/utils/pda.js의 findStakeInfoPDA 함수 사용');
    
    // 계정 정보 확인
    const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
    const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);

    console.log('Stake Info 계정 존재 여부:', !!stakeInfoAccount);
    console.log('User Staking Info 계정 존재 여부:', !!userStakingInfoAccount);

    // Anchor를 사용한 더 자세한 계정 정보 파싱 시도
    let onChainStakingInfo = null;
    if (stakeInfoAccount && stakeInfoAccount.owner.equals(new PublicKey(PROGRAM_ID))) {
      try {
        // Anchor 프로그램 초기화를 위한 더미 지갑 생성
        const dummyWallet = {
          publicKey: new PublicKey('11111111111111111111111111111111'),
          signTransaction: () => Promise.resolve(null),
          signAllTransactions: () => Promise.resolve(null),
        };

        // Anchor 프로바이더 생성
        const provider = new AnchorProvider(
          connection,
          dummyWallet,
          { commitment: 'confirmed' }
        );

        // IDL에 size 속성 추가
        const preparedIdl = prepareIdlForAnchor(idl);

        // Anchor 프로그램 초기화
        const program = new Program(preparedIdl, new PublicKey(PROGRAM_ID), provider);

        // 스테이킹 정보 계정 파싱 시도
        try {
          if (program.account && program.account.stakeInfo) {
            onChainStakingInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
            console.log('Anchor를 통한 스테이킹 정보 파싱 성공:', onChainStakingInfo);
          }
        } catch (parseError) {
          console.warn('계정 파싱 오류:', parseError.message);
          // 파싱 실패시 오류 로깅만 하고 계속 진행
        }
      } catch (anchorError) {
        console.error('Anchor 초기화 오류:', anchorError.message);
        // Anchor 초기화 실패시 계속 진행
      }
    }
    
    // DB에서 스테이킹 정보 조회 (조인 쿼리 수정)
    const { data: stakingInfo, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();

    // Log details for debugging
    console.log(`스테이킹 정보 조회 결과: ${stakingInfo ? '찾음' : '없음'}, 오류: ${stakingError ? '있음' : '없음'}`);
    if (stakingInfo) {
      console.log('스테이킹 정보 ID 확인:', {
        id: stakingInfo.id,
        isOnchainId: stakingInfo.id && stakingInfo.id.toString().startsWith('onchain_')
      });
    }
    
    if (stakingError) {
      console.error('스테이킹 정보 조회 중 오류:', stakingError);
      return res.status(500).json(
        createApiResponse(false, '스테이킹 정보 조회 실패', null, stakingError)
      );
    }
    
    // 스테이킹 정보가 있는 경우 추가 정보 계산
    if (stakingInfo) {
      // 스테이킹 진행도 계산
      const progressPercentage = calculateStakingProgress(stakingInfo);

      // 획득 보상 계산
      const earnedSoFar = calculateEarnedRewards(stakingInfo);

      // 현재 시간
      const now = Math.floor(Date.now() / 1000);

      // 온체인 데이터 포맷팅
      let onChainData = null;
      if (onChainStakingInfo) {
        // 스테이킹 시작 시간 추출 (i64 형식의 BigInt 변환)
        const stakedAtTime = onChainStakingInfo.stakedAt ?
          (typeof onChainStakingInfo.stakedAt.toNumber === 'function' ?
            onChainStakingInfo.stakedAt.toNumber() :
            Number(onChainStakingInfo.stakedAt)) : null;

        // 스테이킹 해제 예정 시간 추출
        const releaseTime = onChainStakingInfo.releaseDate ?
          (typeof onChainStakingInfo.releaseDate.toNumber === 'function' ?
            onChainStakingInfo.releaseDate.toNumber() :
            Number(onChainStakingInfo.releaseDate)) : null;

        onChainData = {
          owner: onChainStakingInfo.owner?.toString() || null,
          mint: onChainStakingInfo.mint?.toString() || null,
          staked_at: stakedAtTime,
          release_date: releaseTime,
          is_staked: !!onChainStakingInfo.isStaked,
          tier: onChainStakingInfo.tier || 0,
          last_claim_time: onChainStakingInfo.lastClaimTime ?
            (typeof onChainStakingInfo.lastClaimTime.toNumber === 'function' ?
              onChainStakingInfo.lastClaimTime.toNumber() :
              Number(onChainStakingInfo.lastClaimTime)) : null
        };
      }

      // 민팅된 NFT 데이터에서 ID 추출 - 간소화된 방식으로 수정
      let realNftId = null;
      
      // 이미 DB에 저장된 staked_nft_id 필드 확인
      if (stakingInfo && stakingInfo.staked_nft_id) {
        realNftId = stakingInfo.staked_nft_id;
        console.log('기존 저장된 staked_nft_id 사용:', realNftId);
      }
      // 별도 조회 없이 직접 민트 주소에서 추출 시도
      else if (mintAddress) {
        try {
          // 민트 주소에서 간단한 ID 생성 (앞 6자리 추출)
          realNftId = mintAddress.slice(0, 6);
          console.log('민트 주소에서 ID 추출 결과:', realNftId);
        } catch (e) {
          console.warn("ID 추출 오류:", e);
        }
      }
      
      // 응답 객체 구성
      const response = {
        isStaked: true,
        isOnChainOnly: false,
        stakingInfo: {
          ...stakingInfo,
          // 명시적으로 실제 NFT ID 설정
          staked_nft_id: realNftId || stakingInfo.staked_nft_id || null,
          progress_percentage: progressPercentage,
          earned_so_far: earnedSoFar,
          is_unlocked: now >= stakingInfo.release_date,
          // 계정 정보
          stake_info_account_exists: !!stakeInfoAccount,
          user_staking_info_account_exists: !!userStakingInfoAccount,
          stake_info_pda: stakeInfoPDA.toString(),
          user_staking_info_pda: userStakingInfoPDA.toString(),
          // 온체인 데이터 추가 (있는 경우에만)
          onchain_data: onChainData
        }
      };

      return res.status(200).json(
        createApiResponse(true, '스테이킹 정보를 찾았습니다', response)
      );
    } else if (onChainStakingInfo) {
      // DB에는 없지만 온체인 데이터가 있는 경우 (데이터베이스 비동기 문제 또는 온체인 직접 스테이킹)
      // 스테이킹 시작 시간 추출 (i64 형식의 BigInt 변환)
      const stakedAtTime = onChainStakingInfo.stakedAt ?
        (typeof onChainStakingInfo.stakedAt.toNumber === 'function' ?
          onChainStakingInfo.stakedAt.toNumber() :
          Number(onChainStakingInfo.stakedAt)) : Math.floor(Date.now() / 1000 - 86400); // 기본값 24시간 전

      // 스테이킹 해제 예정 시간 추출
      const releaseTime = onChainStakingInfo.releaseDate ?
        (typeof onChainStakingInfo.releaseDate.toNumber === 'function' ?
          onChainStakingInfo.releaseDate.toNumber() :
          Number(onChainStakingInfo.releaseDate)) : Math.floor(Date.now() / 1000 + 30 * 86400); // 기본값 30일 후

      // 현재 시간
      const now = Math.floor(Date.now() / 1000);

      // 기본 보상 이율
      const dailyRewardRate = 10; // 기본 일 보상율

      // 진행도 계산
      const totalDuration = releaseTime - stakedAtTime;
      const elapsedDuration = now - stakedAtTime;
      const progressPercentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

      // 보상 계산
      const daysElapsed = elapsedDuration / (24 * 60 * 60);
      const earnedSoFar = Math.floor(dailyRewardRate * daysElapsed);

      // 온체인 데이터를 기반으로 외부 시스템용 표준 형식 구성
      const synthesizedStakingInfo = {
        wallet_address: onChainStakingInfo.owner?.toString() || wallet,
        mint_address: onChainStakingInfo.mint?.toString() || mintAddress,
        staked_at: stakedAtTime,
        release_date: releaseTime,
        status: 'staked',
        nft_tier: 'COMMON', // 기본값
        progress_percentage: progressPercentage,
        earned_so_far: earnedSoFar,
        daily_reward_rate: dailyRewardRate,
        is_unlocked: now >= releaseTime,
        stake_info_account_exists: true,
        user_staking_info_account_exists: !!userStakingInfoAccount,
        stake_info_pda: stakeInfoPDA.toString(),
        user_staking_info_pda: userStakingInfoPDA.toString(),
        onchain_data: {
          owner: onChainStakingInfo.owner?.toString() || wallet,
          mint: onChainStakingInfo.mint?.toString() || mintAddress,
          staked_at: stakedAtTime,
          release_date: releaseTime,
          is_staked: !!onChainStakingInfo.isStaked,
          tier: onChainStakingInfo.tier || 0
        }
      };

      // 온체인 기반 스테이킹 정보 응답
      return res.status(200).json(
        createApiResponse(true, '온체인에서 스테이킹 정보를 찾았습니다', {
          isStaked: true,
          isOnChainOnly: true,
          stakingInfo: synthesizedStakingInfo
        })
      );
    } else {
      // 스테이킹 정보가 없는 경우
      return res.status(200).json(
        createApiResponse(true, '스테이킹 정보가 없습니다', {
          isStaked: false,
          stake_info_account_exists: !!stakeInfoAccount,
          user_staking_info_account_exists: !!userStakingInfoAccount
        })
      );
    }
  } catch (error) {
    console.error('스테이킹 정보 조회 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '스테이킹 정보 조회 실패', null, error)
    );
  }
}