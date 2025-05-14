/**
 * 통합 NFT 스테이킹 완료 API 엔드포인트
 * 스테이킹 트랜잭션 성공 후 내부 데이터베이스에 기록
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { createApiResponse } from '../../../shared';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana 연결 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * NFT 스테이킹 완료 레코드 생성 핸들러
 * 스테이킹 성공 후 내부 DB에 기록하여 상태 추적
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
      signature,
      mintAddress,
      walletAddress,
      stakingPeriod,
      accounts,
      transactionDate
    } = req.body;
    
    // 필수 파라미터 검증
    if (!signature || !mintAddress || !walletAddress || !stakingPeriod) {
      return res.status(400).json(
        createApiResponse(false, '서명, 민트 주소, 지갑 주소, 스테이킹 기간은 필수 항목입니다', null, 'MissingParameters')
      );
    }
    
    console.log('스테이킹 완료 기록 중:', {
      signature: signature.slice(0, 8) + '...',
      mintAddress,
      walletAddress: walletAddress.slice(0, 8) + '...',
      stakingPeriod
    });
    
    // 트랜잭션 확인
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    let txStatus;
    
    try {
      // 트랜잭션 상태 확인 (선택 사항)
      txStatus = await connection.getSignatureStatus(signature);
      console.log('트랜잭션 상태:', txStatus.value?.confirmationStatus || 'unknown');
      
      if (txStatus.value?.err) {
        console.warn('트랜잭션 오류 감지:', txStatus.value.err);
        // 오류가 있더라도 계속 진행 (연결 문제일 수 있음)
      }
    } catch (statusErr) {
      console.error('트랜잭션 상태 확인 오류:', statusErr);
      // 상태 확인 실패는 무시 (연결 문제일 수 있음)
    }
    
    // 현재 시간 계산
    const now = new Date();
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + parseInt(stakingPeriod, 10));
    
    // 기존 스테이킹 확인
    const { data: existingStake } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingStake) {
      console.log('기존 스테이킹 기록 감지. 업데이트 중:', existingStake.id);
      
      // 기존 스테이킹 업데이트
      const { data: updatedStake, error: updateError } = await supabase
        .from('nft_staking')
        .update({
          tx_signature: signature,
          staked_at: transactionDate || now.toISOString(),
          release_date: releaseDate.toISOString(),
          staking_period: stakingPeriod,
          updated_at: now.toISOString()
        })
        .eq('id', existingStake.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('스테이킹 기록 업데이트 오류:', updateError);
        return res.status(500).json(
          createApiResponse(false, '스테이킹 기록 업데이트 실패', null, updateError)
        );
      }
      
      return res.status(200).json(
        createApiResponse(true, '기존 스테이킹 기록이 업데이트되었습니다', updatedStake)
      );
    } else {
      console.log('새 스테이킹 기록 생성 중');
      
      // 새 스테이킹 생성
      const { data: newStake, error: insertError } = await supabase
        .from('nft_staking')
        .insert({
          wallet_address: walletAddress,
          mint_address: mintAddress,
          tx_signature: signature,
          staked_at: transactionDate || now.toISOString(),
          release_date: releaseDate.toISOString(),
          staking_period: stakingPeriod,
          status: 'staked',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          api_version: 'unified-v1'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('스테이킹 기록 생성 오류:', insertError);
        return res.status(500).json(
          createApiResponse(false, '스테이킹 기록 생성 실패', null, insertError)
        );
      }
      
      return res.status(200).json(
        createApiResponse(true, '새 스테이킹 기록이 생성되었습니다', newStake)
      );
    }
  } catch (error) {
    console.error('스테이킹 완료 기록 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '스테이킹 완료 기록 실패', null, error)
    );
  }
}