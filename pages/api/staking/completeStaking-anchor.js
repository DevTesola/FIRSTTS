/**
 * NFT 스테이킹 완료 처리 API (Anchor 통합 버전)
 * 스테이킹 트랜잭션이 완료된 후 DB에 기록하는 엔드포인트
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { createApiResponse } from '../../../shared';

// 환경 변수 가져오기
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 스테이킹 완료 처리 API 핸들러
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
    const { signature, mintAddress, stakingPeriod, accounts, walletAddress } = req.body;
    
    // 필수 파라미터 검증
    if (!signature || !mintAddress) {
      return res.status(400).json(
        createApiResponse(false, '트랜잭션 서명과 민트 주소는 필수 항목입니다', null, 'MissingParameters')
      );
    }
    
    console.log('스테이킹 완료 요청 받음:', { signature, mintAddress, stakingPeriod });
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 트랜잭션 확인
    console.log('트랜잭션 확인 중:', signature);
    try {
      // 먼저 트랜잭션 상태 확인 (좀 더 가벼운 호출)
      const txStatus = await connection.getSignatureStatus(signature);
      console.log('트랜잭션 상태:', JSON.stringify(txStatus));

      if (!txStatus.value) {
        return res.status(404).json(
          createApiResponse(false, '트랜잭션을 찾을 수 없습니다', null, 'TransactionNotFound')
        );
      }

      if (txStatus.value.err) {
        console.error('트랜잭션 오류:', txStatus.value.err);
        return res.status(400).json(
          createApiResponse(false, '트랜잭션이 실패했습니다', null, txStatus.value.err)
        );
      }

      // 완전한 트랜잭션 정보 가져오기 (확인된 경우에만)
      if (txStatus.value.confirmationStatus === 'confirmed' || txStatus.value.confirmationStatus === 'finalized') {
        console.log('트랜잭션이 확인됨, 상세 정보 가져오는 중...');
        const tx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });

        if (tx && tx.meta.err) {
          console.error('트랜잭션 메타데이터 오류:', tx.meta.err);
          return res.status(400).json(
            createApiResponse(false, '트랜잭션이 실패했습니다', null, tx.meta.err)
          );
        }

        console.log('트랜잭션 상세 정보 확인됨:', tx ? tx.transaction.signatures[0] : 'N/A');
      } else {
        console.log('트랜잭션이 아직 완전히 확인되지 않았지만, 처리는 계속합니다:', txStatus.value.confirmationStatus);
      }
    } catch (txError) {
      console.error('트랜잭션 확인 중 오류:', txError);
      // 트랜잭션 조회 오류가 발생해도 DB 기록은 시도합니다 (나중에 동기화 가능)
      console.log('트랜잭션 조회 오류가 발생했지만, DB 기록은 계속 진행합니다');
    }
    
    // 스테이킹 정보 계산
    const now = new Date();
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + parseInt(stakingPeriod));
    
    const walletPublicKey = walletAddress || (accounts?.owner) || 'Unknown';
    
    // DB에 스테이킹 기록 생성
    console.log('스테이킹 정보를 DB에 기록 중...');
    const { data: stakingRecord, error: insertError } = await supabase
      .from('nft_staking')
      .insert({
        wallet_address: walletPublicKey,
        mint_address: mintAddress,
        staked_at: now.toISOString(),
        release_date: releaseDate.toISOString(),
        staking_period: parseInt(stakingPeriod),
        status: 'staked',
        tx_signature: signature,
        stake_info_account: accounts?.stakeInfo || '',
        escrow_token_account: accounts?.escrowTokenAccount || '',
        user_token_account: accounts?.userTokenAccount || '',
        is_anchor_transaction: true  // Anchor 사용 여부 표시
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('DB 기록 중 오류:', insertError);
      return res.status(500).json(
        createApiResponse(false, 'DB 기록 실패', null, insertError)
      );
    }
    
    // 응답 반환
    return res.status(200).json(
      createApiResponse(true, '스테이킹 완료 처리가 성공했습니다', {
        stakingRecord,
        signature,
        mintAddress,
        releaseDate: releaseDate.toISOString()
      })
    );
  } catch (error) {
    console.error('스테이킹 완료 처리 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '스테이킹 완료 처리 실패', null, error)
    );
  }
}