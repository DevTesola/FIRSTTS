/**
 * NFT 비상 언스테이킹 완료 API 엔드포인트
 *
 * 이 API는 사용자가 제출한 비상 언스테이킹 트랜잭션의 결과를 처리합니다.
 * 서명된 트랜잭션이 성공적으로 처리되었을 때 데이터베이스에 기록하고 성공 응답을 반환합니다.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createApiResponse } from '../../../shared';
import supabase from '../../../utils/supabase';

/**
 * 비상 언스테이킹 완료 요청 처리 함수
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
      signature,
      userTokenAccount,
      penaltyPercentage,
      finalRewards
    } = req.body;

    // 필수 파라미터 검증
    if (!wallet || !mintAddress || !signature) {
      return res.status(400).json(
        createApiResponse(false, '지갑 주소, 민트 주소, 트랜잭션 서명은 필수 항목입니다', null, 'MissingParameters')
      );
    }

    // Solana 연결 설정
    console.log('Solana RPC에 연결 중...');
    const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // 트랜잭션 상태 확인
    console.log('트랜잭션 상태 확인 중:', signature);
    const txStatus = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });

    if (!txStatus || !txStatus.value) {
      return res.status(400).json(
        createApiResponse(false, '트랜잭션을 찾을 수 없습니다', null, 'TransactionNotFound')
      );
    }

    // 트랜잭션이 성공적으로 처리되었는지 확인
    if (txStatus.value.err) {
      console.error('트랜잭션 오류:', txStatus.value.err);
      return res.status(400).json(
        createApiResponse(false, '트랜잭션이 실패했습니다', null, txStatus.value.err)
      );
    }

    // 확인 수(컨펌) 확인
    const confirmations = txStatus.value.confirmations;
    const isConfirmed = confirmations !== null && confirmations >= 1; // 최소 1번의 확인 필요

    if (!isConfirmed) {
      return res.status(202).json(
        createApiResponse(false, '트랜잭션이 아직 확인되지 않았습니다', {
          signature,
          confirmations: confirmations || 0
        }, 'TransactionPending')
      );
    }

    console.log('트랜잭션 확인됨, 확인 수:', confirmations);

    // Supabase에 비상 언스테이킹 기록 저장
    console.log('비상 언스테이킹 기록 저장 중...');
    const { data: stakingRecord, error: stakingError } = await supabase
      .from('nft_staking')
      .update({
        status: 'unstaked',
        unstaked_at: new Date().toISOString(),
        unstake_tx_signature: signature,
        unstake_penalty_percentage: penaltyPercentage || 0,
        unstake_final_reward: finalRewards || 0,
        unstaking_type: 'emergency',
        user_token_account: userTokenAccount
      })
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .select();

    if (stakingError) {
      console.error('데이터베이스 업데이트 오류:', stakingError);
      return res.status(500).json(
        createApiResponse(false, '비상 언스테이킹 기록 업데이트 실패', null, stakingError)
      );
    }

    if (!stakingRecord || stakingRecord.length === 0) {
      console.warn('업데이트할 스테이킹 기록을 찾을 수 없음');

      // 이미 unstaked 상태일 수 있으므로 응답은 성공으로 처리
      return res.status(200).json(
        createApiResponse(true, '비상 언스테이킹이 성공적으로 처리되었습니다', {
          signature,
          wallet,
          mintAddress,
          confirmations,
          warn: 'No staking record found to update'
        })
      );
    }

    console.log('비상 언스테이킹 완료 처리됨:', stakingRecord);

    // 성공 응답 반환
    return res.status(200).json(
      createApiResponse(true, '비상 언스테이킹이 성공적으로 처리되었습니다', {
        signature,
        wallet,
        mintAddress,
        confirmations,
        stakingRecord
      })
    );
    
  } catch (error) {
    console.error('비상 언스테이킹 완료 처리 중 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '비상 언스테이킹 완료 처리 실패', null, error)
    );
  }
}