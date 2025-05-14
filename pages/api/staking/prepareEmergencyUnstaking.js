/**
 * 비상 언스테이킹 트랜잭션 준비 API 엔드포인트
 *
 * 이 API는 NFT의 비상 언스테이킹을 위한 트랜잭션을 준비합니다.
 * 패널티가 적용된 일부 보상만 제공하며 기간 완료 전에 NFT를 되찾을 수 있습니다.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createApiResponse, PROGRAM_ID, createSerializedTransaction } from '../../../shared';
import { createEmergencyUnstakeNftInstructionData } from '../../../utils/staking-helpers/instruction-utils';
import supabase from '../../../utils/supabase';

// 환경 변수 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * 비상 언스테이킹 준비 핸들러
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
    const { wallet, mintAddress } = req.body;

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

    console.log('비상 언스테이킹 요청 받음:', { wallet, mintAddress });

    // Solana 연결 설정
    console.log('Solana RPC에 연결 중:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // 스테이킹 상태 확인
    console.log('스테이킹 상태 확인 중...');
    const { data: stakingRecord, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();

    if (stakingError) {
      console.error('스테이킹 상태 확인 중 오류:', stakingError);
      return res.status(500).json(
        createApiResponse(false, '스테이킹 상태 확인 실패', null, stakingError)
      );
    }

    if (!stakingRecord) {
      return res.status(400).json(
        createApiResponse(false, '이 NFT는 현재 스테이킹되어 있지 않습니다', null, 'NotStaked')
      );
    }

    // PDA 찾기 (shared 모듈에서 함수 import)
    const { findPoolStatePDA, findStakeInfoPDA, findEscrowAuthorityPDA, findUserStakingInfoPDA } = require('../../../shared');

    // PDA 주소 생성
    const [poolStatePDA] = findPoolStatePDA();
    const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
    const [escrowAuthorityPDA] = findEscrowAuthorityPDA(mintPubkey);
    const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);

    console.log('Pool State PDA:', poolStatePDA.toString());
    console.log('Stake Info PDA:', stakeInfoPDA.toString());
    console.log('Escrow Authority PDA:', escrowAuthorityPDA.toString());
    console.log('User Staking Info PDA:', userStakingInfoPDA.toString());

    // 사용자 토큰 계정 확인
    console.log('사용자 토큰 계정 확인 중...');
    const userTokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
      programId: TOKEN_PROGRAM_ID
    });

    // 이스크로 NFT 계정 (스테이킹된 NFT가 있는 계정)
    const escrowNftAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true
    );

    console.log('Escrow NFT 계정:', escrowNftAccount.toString());

    // 지갑에 있는 이 토큰 계정 중 하나를 선택
    let userTokenAccount = null;
    for (const account of userTokenAccounts.value) {
      try {
        const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
        if (accountInfo.value &&
            accountInfo.value.data.parsed.info.mint === mintAddress) {
          userTokenAccount = account.pubkey;
          break;
        }
      } catch (e) {
        console.warn('토큰 계정 분석 중 오류:', e);
        continue;
      }
    }

    // 사용자 토큰 계정이 없으면 ATA 생성
    if (!userTokenAccount) {
      console.log('사용자 토큰 계정을 찾을 수 없음, ATA 사용');
      userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey
      );
    }

    console.log('사용자 토큰 계정:', userTokenAccount.toString());

    // 스테이킹 기간 정보
    const stakingStartTime = new Date(stakingRecord.staked_at).getTime();
    const stakingEndTime = new Date(stakingRecord.release_date).getTime();
    const currentTime = Date.now();
    const totalStakingTime = stakingEndTime - stakingStartTime;
    const elapsedTime = currentTime - stakingStartTime;

    // 스테이킹 완료율 계산 (0에서 1 사이의 값)
    const completionRatio = Math.min(1, Math.max(0, elapsedTime / totalStakingTime));

    // 기본 페널티 비율 (풀 설정에 따라 다를 수 있음)
    const basePenalty = 10; // 10%

    // 완료율에 따른 페널티 계산 (진행률이 높을수록 페널티가 낮아짐)
    // 예: 50% 진행 시 페널티는 기본 페널티의 50%
    const penaltyPercentage = basePenalty * (1 - completionRatio);

    // 예상 총 보상 (실제로는 온체인에서 계산)
    const projectedTotalRewards = stakingRecord.projected_rewards || 1000;

    // 페널티 적용 전 부분 보상 (진행률에 비례)
    const partialRewards = Math.floor(projectedTotalRewards * completionRatio);

    // 페널티 금액
    const penaltyAmount = Math.floor(partialRewards * (penaltyPercentage / 100));

    // 최종 보상 (페널티 적용 후)
    const finalRewards = Math.max(0, partialRewards - penaltyAmount);
    
    // Emergency Unstake 명령어 데이터 생성
    const instructionData = createEmergencyUnstakeNftInstructionData();

    // 필요한 계정 목록
    const keys = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },
      { pubkey: mintPubkey, isSigner: false, isWritable: false },
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },
      { pubkey: escrowNftAccount, isSigner: false, isWritable: true },
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },
      { pubkey: poolStatePDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    // 트랜잭션 인스트럭션 생성
    const transaction = new TransactionInstruction({
      keys: keys,
      programId: PROGRAM_ID,
      data: instructionData
    });

    // 최근 블록해시 가져오기
    console.log('최근 블록해시 가져오는 중...');
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;

    // 트랜잭션 생성 및 직렬화
    const serializedTx = createSerializedTransaction(
      [transaction],
      walletPubkey,
      blockhash,
      lastValidBlockHeight
    );

    console.log('트랜잭션 생성 성공', { blockhash, lastValidBlockHeight });

    // 응답 객체 구성
    const response = {
      wallet,
      mintAddress,
      transactionBase64: serializedTx,
      userTokenAccount: userTokenAccount.toString(),
      escrowNftAccount: escrowNftAccount.toString(),
      stakeInfo: stakeInfoPDA.toString(),
      emergencyFee: {
        percent: penaltyPercentage,
        amount: penaltyAmount,
        description: `조기 언스테이킹으로 인해 ${penaltyPercentage.toFixed(2)}%의 패널티가 적용됩니다.`
      },
      rewards: {
        projected: projectedTotalRewards,
        partial: partialRewards,
        final: finalRewards,
        completionRatio
      },
      stakingPeriod: {
        start: stakingStartTime,
        end: stakingEndTime,
        elapsed: elapsedTime,
        total: totalStakingTime,
        completionPercent: Math.floor(completionRatio * 100)
      },
      expiresAt: new Date(Date.now() + 120000).toISOString(),
      expiryHeight: lastValidBlockHeight
    };

    // 응답 반환
    return res.status(200).json(
      createApiResponse(true, '비상 언스테이킹 트랜잭션이 준비되었습니다', response)
    );
    
  } catch (error) {
    console.error('비상 언스테이킹 트랜잭션 준비 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '비상 언스테이킹 트랜잭션 준비 실패', null, error)
    );
  }
}