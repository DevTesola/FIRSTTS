/**
 * 향상된 NFT 스테이킹 API 엔드포인트
 * 
 * 이 엔드포인트는 고정된 스테이킹 로직을 사용하여 다음 문제를 해결합니다:
 * 1. 디스크리미네이터 계산 - Anchor의 global:<함수명> 해시 방식 사용
 * 2. 계정 순서 - 온체인 프로그램 기대치와 정확히 일치하도록 구성
 * 3. 계정 검증 - 스테이킹 한도 등 적격성 검사 강화
 * 4. 오류 처리 - 계정 역직렬화 오류 등 전용 오류 처리
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// 유틸리티 가져오기
import { prepareEnhancedStakingTransaction } from '../../../shared/utils/staking/enhanced-staking';
import { getInstructionDiscriminatorFormats } from '../../../shared/utils/anchor-helpers';
import { getEnhancedErrorMessage } from '../../../shared/utils/enhanced-error-handler';
import { standardizeTier, calculateEstimatedRewards } from '../../../shared/utils/reward-calculator';
import { createApiResponse } from '../../../shared';

// 환경 변수 가져오기
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 향상된 NFT 스테이킹 API 핸들러
 * 고정된 스테이킹 로직으로 트랜잭션 준비
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
      stakingPeriod, 
      nftTier: requestedTier, 
      rawTierValue, 
      nftName,
      autoCompound = false
    } = req.body;
    
    // 필수 파라미터 검증
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json(
        createApiResponse(false, '지갑 주소, 민트 주소, 스테이킹 기간은 필수 항목입니다', null, 'MissingParameters')
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
    
    // 스테이킹 기간 검증
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    if (isNaN(stakingPeriodNum) || stakingPeriodNum < 7 || stakingPeriodNum > 365) {
      return res.status(400).json(
        createApiResponse(false, '스테이킹 기간은 7일에서 365일 사이여야 합니다', null, 'InvalidStakingPeriod')
      );
    }
    
    console.log('향상된 스테이킹 요청 받음:', { wallet, mintAddress, stakingPeriod: stakingPeriodNum });
    
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
      return res.status(400).json(
        createApiResponse(
          false, 
          `이 NFT는 이미 ${new Date(existingStake.release_date).toLocaleDateString()}까지 스테이킹되어 있습니다`, 
          null, 
          { errorCode: 'AlreadyStaked', existingStake }
        )
      );
    }
    
    // Solana 연결 설정
    console.log('Solana RPC에 연결 중:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // NFT 소유권 확인
    console.log('NFT 소유권 확인 중...');
    try {
      // 토큰 계정을 통한 NFT 소유권 확인
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        return res.status(400).json(
          createApiResponse(false, '이 NFT를 소유하고 있지 않습니다', null, 'NotOwner')
        );
      }
      
      console.log('토큰 계정을 통해 NFT 소유권 확인됨');
    } catch (err) {
      console.error('NFT 소유권 확인 중 오류:', err);
      return res.status(500).json(
        createApiResponse(false, 'NFT 소유권 확인 실패', null, err)
      );
    }
    
    // NFT 등급 결정 (요청에서 제공된 등급 또는 DB에서 조회)
    let nftTier = requestedTier || "COMMON";
    
    // 등급 정보가 없으면, 데이터베이스에서 조회
    if (!nftTier || nftTier === "COMMON") {
      try {
        console.log('NFT 메타데이터 가져오는 중:', mintAddress);
        const { data: nftData } = await supabase
          .from('minted_nfts')
          .select('metadata, name')
          .eq('mint_address', mintAddress)
          .maybeSingle();
        
        if (nftData && nftData.metadata) {
          let metadata;
          
          try {
            metadata = typeof nftData.metadata === 'string' 
              ? JSON.parse(nftData.metadata) 
              : nftData.metadata;
              
            const tierAttr = metadata.attributes?.find(attr => 
              attr.trait_type?.toLowerCase() === "tier"
            );
            
            if (tierAttr && tierAttr.value) {
              nftTier = standardizeTier(tierAttr.value);
              console.log('NFT 등급 찾음:', nftTier, '원본 값:', tierAttr.value);
            }
          } catch (parseError) {
            console.error('메타데이터 파싱 오류:', parseError);
          }
        }
      } catch (tierError) {
        console.error('NFT 등급 조회 오류:', tierError);
      }
    }
    
    // NFT 등급 -> 인덱스 변환
    const nftTierIndex = {
      'COMMON': 0,
      'RARE': 1,
      'EPIC': 2,
      'LEGENDARY': 3
    }[nftTier] || 0;
    
    // Anchor 프로바이더 및 프로그램 설정
    const dummyWallet = {
      publicKey: walletPubkey,
      signTransaction: () => Promise.reject("시뮬레이션용 지갑은 서명할 수 없습니다"),
      signAllTransactions: () => Promise.reject("시뮬레이션용 지갑은 서명할 수 없습니다"),
    };
    
    // 향상된 스테이킹 트랜잭션 준비
    console.log('향상된 스테이킹 트랜잭션 준비 중...');
    const stakingResult = await prepareEnhancedStakingTransaction(
      connection,
      dummyWallet,
      walletPubkey,
      mintPubkey,
      stakingPeriodNum,
      nftTierIndex,
      autoCompound
    );
    
    if (!stakingResult.success) {
      return res.status(500).json(
        createApiResponse(false, getEnhancedErrorMessage(stakingResult.rawError), null, stakingResult)
      );
    }
    
    // 디스크리미네이터 디버깅 정보
    const discriminators = {
      stakeNft: getInstructionDiscriminatorFormats('stake_nft'),
      unstakeNft: getInstructionDiscriminatorFormats('unstake_nft'),
      initUserStaking: getInstructionDiscriminatorFormats('init_user_staking_info')
    };
    
    // 보상 계산
    const rewardCalculation = calculateEstimatedRewards(nftTier, stakingPeriodNum);
    
    // 응답 객체 구성
    const response = {
      // 지갑 및 NFT 정보
      wallet,
      mintAddress,
      nftName: nftName || `NFT #${mintAddress.slice(0, 6)}`,
      
      // 스테이킹 정보
      stakingPeriod: stakingPeriodNum,
      nftTier,
      nftTierIndex,
      autoCompound,
      
      // 계정 초기화 상태
      accountInitialization: stakingResult.accountInitialization,
      
      // 트랜잭션 데이터
      transactions: stakingResult.transactions,
      
      // 필요한 단계 정보
      requiredPhases: stakingResult.requiredPhases,
      
      // 계정 주소
      accounts: stakingResult.accounts,
      
      // 보상 정보
      rewardDetails: {
        ...rewardCalculation,
        nftTier,
        rawTierValue
      },
      
      // 디버깅 정보
      debug: {
        discriminators,
        simulation: stakingResult.simulation
      },
      
      // 트랜잭션 만료 정보
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      
      // API 버전
      apiVersion: 'enhanced-staking-v1'
    };
    
    // 응답 반환
    return res.status(200).json(
      createApiResponse(true, '향상된 스테이킹 방식으로 트랜잭션이 준비되었습니다', response)
    );
  } catch (error) {
    console.error('향상된 스테이킹 준비 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, getEnhancedErrorMessage(error), null, error)
    );
  }
}