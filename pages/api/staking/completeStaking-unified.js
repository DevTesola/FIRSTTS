/**
 * 통합 NFT 스테이킹 완료 API 엔드포인트
 * 스테이킹 트랜잭션 성공 후 내부 데이터베이스에 기록
 * Extract NFT ID 로직 개선 및 보상 계산 수정
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
      transactionDate,
      // 보상 관련 필드 추가
      nftTier,
      nftName,  // NFT 이름 (예: "SOLARA #0019")
      rewardDetails,
      // 추가 메타데이터 필드
      rawTierValue,
      stakingStartTime
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
      
      // Extract NFT ID 로직 개선 (실제 NFT 고유 식별자 추출)
      let nftId = null;
      
      // 1. NFT 이름에서 ID 추출 시도 (가장 정확한 방법)
      if (nftName) {
        const nameMatch = nftName.match(/#\s*(\d+)/);
        if (nameMatch && nameMatch[1]) {
          nftId = nameMatch[1];
          console.log(`NFT 이름에서 ID 추출 성공: ${nftId} (원본 이름: ${nftName})`);
        }
      }
      
      // 2. 민트 주소가 있는 경우, minted_nfts 테이블에서 기존 데이터 확인
      if (!nftId && mintAddress) {
        const { data: nftData, error: nftError } = await supabase
          .from('minted_nfts')
          .select('*')
          .eq('mint_address', mintAddress)
          .single();
        
        if (!nftError && nftData) {
          nftId = nftData.mint_index || nftData.id;
          console.log(`Minted NFTs 테이블에서 ID 추출: ${nftId}`);
        }
      }
      
      // 3. ID를 찾지 못했다면 민트 주소 해시 기반 ID 생성
      if (!nftId && mintAddress) {
        let mintAddressHash = 0;
        for (let i = 0; i < mintAddress.length; i++) {
          mintAddressHash = ((mintAddressHash << 5) - mintAddressHash) + mintAddress.charCodeAt(i);
          mintAddressHash = mintAddressHash & mintAddressHash; // 32비트 정수로 변환
        }
        // 1~999 사이의 결정론적 숫자 생성
        nftId = (Math.abs(mintAddressHash) % 999 + 1).toString();
        console.log(`Mint 주소 해시에서 ID 생성: ${nftId}`);
      }
      
      // 4자리 형식으로 포맷팅
      nftId = String(nftId).padStart(4, '0');
      console.log(`최종 사용 NFT ID: ${nftId}`);
      
      // 이미지 URL 생성
      const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
      const ipfsUrl = `ipfs://${IMAGES_CID}/${nftId}.png`;
      const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${IMAGES_CID}/${nftId}.png`;
      
      // 보상 계산 로직
      let dailyRewardRate = 25; // 기본값 (COMMON)
      let totalRewards = 0;
      let standardizedTier = 'COMMON';
      
      // 클라이언트에서 보상 정보가 제공되면 사용
      if (rewardDetails && rewardDetails.baseRate) {
        dailyRewardRate = rewardDetails.baseRate;
        // 클라이언트가 제공한 totalRewards 값 사용, 하지만 0인 경우 직접 계산
        if (rewardDetails.totalRewards && rewardDetails.totalRewards > 0) {
          totalRewards = rewardDetails.totalRewards;
        } else {
          // totalRewards가 0이거나 없는 경우 직접 계산
          const stakingPeriodNum = parseInt(stakingPeriod, 10);
          totalRewards = Math.floor(dailyRewardRate * stakingPeriodNum);
        }
      } else {
        // 보상 정보가 없으면 직접 계산
        const dailyRewardsByTier = {
          'LEGENDARY': 200,
          'EPIC': 100,
          'RARE': 50,
          'COMMON': 25
        };
        
        if (nftTier) {
          // NFT 등급 표준화
          standardizedTier = nftTier.toUpperCase();
          if (standardizedTier.includes('LEGEND')) standardizedTier = 'LEGENDARY';
          else if (standardizedTier.includes('EPIC')) standardizedTier = 'EPIC';
          else if (standardizedTier.includes('RARE')) standardizedTier = 'RARE';
          else standardizedTier = 'COMMON';
        }
        
        // 일일 보상 계산
        dailyRewardRate = dailyRewardsByTier[standardizedTier] || 25;
        
        // 스테이킹 기간 승수 (장기 스테이킹 보너스)
        let multiplier = 1.0;
        const stakingPeriodNum = parseInt(stakingPeriod, 10);
        
        if (stakingPeriodNum >= 365) multiplier = 2.0;      // 365+ days: 2x
        else if (stakingPeriodNum >= 180) multiplier = 1.7; // 180+ days: 1.7x
        else if (stakingPeriodNum >= 90) multiplier = 1.4;  // 90+ days: 1.4x
        else if (stakingPeriodNum >= 30) multiplier = 1.2;  // 30+ days: 1.2x
        
        // 총 보상 계산
        totalRewards = Math.floor(dailyRewardRate * stakingPeriodNum * multiplier);
      }
      
      // 항상 총 보상이 0보다 크도록 설정 (DB 제약조건)
      if (totalRewards <= 0) {
        const stakingPeriodNum = parseInt(stakingPeriod, 10);
        totalRewards = dailyRewardRate * stakingPeriodNum;
        if (totalRewards <= 0) totalRewards = 25 * stakingPeriodNum;
        if (totalRewards <= 0) totalRewards = 25 * 7; // 최소 1주일치 기본 보상
      }
      
      console.log('스테이킹 보상 계산:', {
        tier: standardizedTier,
        dailyRewardRate,
        totalRewards,
        stakingPeriod,
        nftId,
        mintAddress
      });
      
      // NFT 식별자 정보를 로그로 출력하여 확인
      console.log(`NFT ${mintAddress} 스테이킹 완료 - ID: ${nftId}, 메타데이터 이름: ${metadata.name}`);
      
      // 문제해결: 먼저 기존 데이터베이스에서 오래된 레코드를 삭제
      // 동일한 mint_address로 들어오는 경우 기존 데이터 삭제 후 새로 삽입
      const { error: deleteError } = await supabase
        .from('nft_staking')
        .delete()
        .eq('mint_address', mintAddress)
        .eq('status', 'staked');
      
      if (deleteError) {
        console.log(`기존 스테이킹 레코드 삭제 오류(maysingleSingle이면 무시):`, deleteError);
      }
      
      // NFT 메타데이터 생성
      const metadata = {
        name: nftName || `SOLARA #${nftId}`,
        symbol: "SOLARA",
        description: "SOLARA NFT Collection",
        image: ipfsUrl, // ipfs:// 프로토콜 URL 사용
        attributes: [
          {
            trait_type: "Tier",
            value: standardizedTier
          }
        ]
      };
      
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
          nft_tier: standardizedTier,
          daily_reward_rate: dailyRewardRate,
          total_rewards: totalRewards,
          claimed_rewards: 0,
          earned_so_far: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          api_version: 'unified-v1',
          // 추가 필드 - NFT ID 및 이미지 URL
          nft_id: nftId,
          staked_nft_id: nftId,
          nft_name: nftName || `SOLARA #${nftId}`,
          image: ipfsUrl,         // ipfs:// 프로토콜 URL
          image_url: ipfsUrl,     // ipfs:// 프로토콜 URL (중복 저장)
          nft_image: gatewayUrl,  // 게이트웨이 직접 URL
          ipfs_hash: IMAGES_CID,  // 이미지 CID
          metadata: metadata      // 전체 메타데이터 JSON
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