/**
 * API 엔드포인트: 온체인 스테이킹 리워드 조회 및 청구
 * 완전한 온체인 방식으로 리워드를 처리합니다.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { 
  verifyRewardTokenAccount,
  prepareOnChainRewardClaimTransaction,
  calculateOnChainRewards,
  getAllOnChainStakedNFTs
} from '../../../shared/utils/staking/on-chain-rewards';
import { getAnchorProvider } from '../../../shared/utils/anchor-helpers';
import { safeParsePublicKey } from '../../../shared/utils/transaction-utils';
import { getNodeEndpoint } from '../../../utils/cluster';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: '지원되지 않는 메서드' });
    }

    const { action, wallet, mintAddress, userTokenAccount } = req.body;

    // 기본 파라미터 검증
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }

    // 지갑 주소 생성
    const walletPubkey = safeParsePublicKey(wallet);
    if (!walletPubkey) {
      return res.status(400).json({ error: '유효하지 않은 지갑 주소입니다' });
    }

    // Solana 연결 객체 생성
    const connection = new Connection(getNodeEndpoint(), 'confirmed');
    
    // Anchor 프로바이더 설정
    const provider = getAnchorProvider(connection, walletPubkey);

    // 액션에 따라 다른 함수 호출
    if (action === 'getAllStakedNFTs') {
      // 모든 스테이킹된 NFT 정보 조회
      const stakedNFTs = await getAllOnChainStakedNFTs(
        connection,
        provider,
        walletPubkey
      );
      
      return res.status(200).json(stakedNFTs);
    } 
    else if (action === 'calculateRewards') {
      // 특정 NFT의 리워드 계산
      if (!mintAddress) {
        return res.status(400).json({ error: 'NFT 민트 주소가 필요합니다' });
      }
      
      const mintPubkey = safeParsePublicKey(mintAddress);
      if (!mintPubkey) {
        return res.status(400).json({ error: '유효하지 않은 민트 주소입니다' });
      }
      
      const rewardInfo = await calculateOnChainRewards(
        connection,
        provider,
        walletPubkey,
        mintPubkey
      );
      
      return res.status(200).json(rewardInfo);
    }
    else if (action === 'prepareClaimRewards') {
      // 리워드 청구 트랜잭션 준비
      if (!mintAddress) {
        return res.status(400).json({ error: 'NFT 민트 주소가 필요합니다' });
      }
      
      const mintPubkey = safeParsePublicKey(mintAddress);
      if (!mintPubkey) {
        return res.status(400).json({ error: '유효하지 않은 민트 주소입니다' });
      }
      
      // 풀 데이터 가져오기 (리워드 민트 주소 필요)
      const { findPoolStatePDA } = require('../../../shared/utils/pda');
      const [poolStatePDA] = findPoolStatePDA();
      
      const idl = await require('../../../shared/utils/idl-helper').prepareIdlForAnchor();
      const program = require('../../../shared/utils/program-initializer').safeInitializeProgram(idl, provider);
      
      const poolState = await program.account.poolState.fetch(poolStatePDA);
      const rewardMint = poolState.rewardMint;
      
      // 사용자 토큰 계정 검증
      let userTokenAccountPubkey;
      
      if (userTokenAccount) {
        userTokenAccountPubkey = safeParsePublicKey(userTokenAccount);
        if (!userTokenAccountPubkey) {
          return res.status(400).json({ error: '유효하지 않은 토큰 계정 주소입니다' });
        }
      } else {
        // 사용자 토큰 계정 주소 확인 및 생성 필요 여부 확인
        const tokenAccountInfo = await verifyRewardTokenAccount(
          connection,
          walletPubkey,
          rewardMint
        );
        
        userTokenAccountPubkey = tokenAccountInfo.address;
        
        // 토큰 계정이 존재하지 않는 경우 생성 안내
        if (!tokenAccountInfo.exists) {
          return res.status(200).json({
            success: false,
            needsTokenAccount: true,
            rewardMint: rewardMint.toString(),
            message: '리워드 토큰 계정을 먼저 생성해야 합니다'
          });
        }
      }
      
      // 리워드 청구 트랜잭션 준비
      const txInfo = await prepareOnChainRewardClaimTransaction(
        connection,
        provider,
        walletPubkey,
        mintPubkey,
        userTokenAccountPubkey
      );
      
      return res.status(200).json(txInfo);
    }
    else {
      return res.status(400).json({ error: '유효하지 않은 액션입니다' });
    }
  } catch (error) {
    console.error('온체인 리워드 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}