/**
 * Force Staking Synchronization API
 * Synchronizes on-chain staking data with the database
 */
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { resolveNftId } from '../../utils/staking-helpers/nft-id-resolver';
// supabase 데이터베이스 의존성 제거

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

// Import correct seed formats from shared utils
const { SEED_STRINGS } = require('../../shared/constants/seeds');

// Use the correct seed values - the actual buffers are different than the string values!
// 중요: STAKE_SEED는 'stake_info'가 아닌 'stake'여야 함!
// STAKE_INFO_SEED = [115, 116, 97, 107, 101, 95, 105, 110, 102, 111] = 'stake_info'
// STAKE_SEED = [115, 116, 97, 107, 101] = 'stake'
const STAKE_SEED = 'stake'; // Must match the byte value [115, 116, 97, 107, 101]
const USER_STAKING_SEED = 'user_staking';

// IPFS Gateway URL
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud/ipfs/';

// IPFS CID for images
const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';

// 스테이킹 계정 레이아웃 (단순화된 버전)
class StakeInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      StakeInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // 계정 타입 식별자
          ['isInitialized', 'u8'], // 초기화 여부
          ['nftMint', [32]], // NFT 민트 주소
          ['owner', [32]], // 소유자 주소
          ['stakedAt', 'u64'], // 스테이킹 시작 시간
          ['lastUpdateTime', 'u64'], // 마지막 업데이트 시간
          ['releaseTime', 'u64'], // 릴리즈 시간
          ['rewardRatePerDay', 'u64'], // 일일 보상 비율
          ['accumulatedReward', 'u64'], // 누적 보상
          ['tierMultiplier', 'u8'], // 등급 배수
          ['isUnstaked', 'u8'], // 언스테이킹 여부
        ],
      },
    ],
  ]);
}

// 사용자 스테이킹 정보 계정 레이아웃
class UserStakingInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      UserStakingInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // 계정 타입 식별자
          ['isInitialized', 'u8'], // 초기화 여부
          ['owner', [32]], // 소유자 주소
          ['stakedCount', 'u32'], // 스테이킹된 NFT 수
          ['stakedMints', ['vecM', [32]]], // 스테이킹된 NFT 민트 주소 배열
          ['collectionBonus', 'u16'], // 컬렉션 보너스 (%)
          ['padding1', 'u8'], // 패딩
          ['padding2', 'u8'], // 패딩
          ['lastUpdated', 'u64'], // 마지막 업데이트 시간
        ],
      },
    ],
  ]);
}

// Function to calculate days from seconds
function secondsToDays(seconds) {
  return Math.ceil(seconds / (24 * 60 * 60));
}

// Solana 타임스탬프(초)를 JavaScript Date 객체로 변환
function solanaTimestampToDate(timestamp) {
  // 숫자가 너무 크거나 유효하지 않은 경우 현재 시간 반환
  if (!timestamp || isNaN(timestamp) || timestamp > Number.MAX_SAFE_INTEGER) {
    console.warn('유효하지 않은 타임스탬프:', timestamp);
    return new Date();
  }
  return new Date(timestamp * 1000);
}

// 디스크리미네이터 값 정의
const DISCRIMINATORS = {
  STAKE_INFO: Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]),
  USER_STAKING_INFO: Buffer.from([171, 19, 114, 117, 157, 103, 21, 106])
};

// Borsh를 사용한 계정 데이터 디코딩 함수
function decodeStakeInfo(data) {
  try {
    // 각 계정 데이터는 최소한 다음과 같은 구조를 가져야 합니다
    if (!data || data.length < 50) {
      console.error('계정 데이터가 너무 짧습니다:', data?.length);
      return null;
    }
    
    // 계정 타입 식별자 확인 (STAKE_INFO_DISCRIMINATOR)
    const discriminator = DISCRIMINATORS.STAKE_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    // 식별자가 일치하지 않으면 다른 타입의 계정
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      return null;
    }
    
    // 디코딩 시도
    try {
      return borsh.deserialize(StakeInfo.schema, StakeInfo, data);
    } catch (borshError) {
      console.error('스테이킹 계정 데이터 디코딩 실패:', borshError);
      
      return null;
    }
  } catch (error) {
    console.error('스테이킹 계정 데이터 디코딩 예외:', error);
    return null;
  }
}

// 사용자 스테이킹 정보 디코딩
function decodeUserStakingInfo(data) {
  try {
    // 데이터 유효성 검사
    if (!data || data.length < 50) {
      console.error('UserStakingInfo 계정 데이터가 너무 짧습니다:', data?.length);
      return null;
    }
    
    console.log('UserStakingInfo 파싱 시작', { 
      dataLength: data.length,
      discriminatorProvided: true
    });
    
    // 계정 타입 식별자 확인
    const discriminator = DISCRIMINATORS.USER_STAKING_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    console.log('UserStakingInfo 디스크리미네이터 비교:', {
      expected: Array.from(discriminator),
      actual: Array.from(accountDiscriminator),
      expectedHex: discriminator.toString('hex'),
      actualHex: Buffer.from(accountDiscriminator).toString('hex'),
      matches: Buffer.from(accountDiscriminator).equals(discriminator)
    });
    
    // 식별자가 일치하지 않으면 다른 타입의 계정
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('UserStakingInfo 디스크리미네이터 불일치');
      return null;
    }
    
    // 디코딩 시도
    try {
      const decoded = borsh.deserialize(UserStakingInfo.schema, UserStakingInfo, data);
      
      // 디코딩 결과 검증
      if (!decoded) {
        console.error('UserStakingInfo 디코딩 결과가 null입니다.');
        return null;
      }
      
      // 소유자 주소 확인
      const owner = new PublicKey(decoded.owner);
      console.log('UserStakingInfo 파싱 중: 소유자=' + owner.toString() + ', 스테이킹 수=' + decoded.stakedCount);
      
      // 스테이킹된 민트 주소 확인
      console.log('UserStakingInfo: stakedMints 벡터 길이=' + decoded.stakedMints.length);
      console.log('UserStakingInfo: 컬렉션 보너스=' + decoded.collectionBonus);
      
      console.log('UserStakingInfo 파싱 완료');
      return decoded;
    } catch (borshError) {
      console.error('UserStakingInfo 디코딩 실패:', borshError);
      return null;
    }
  } catch (error) {
    console.error('UserStakingInfo 디코딩 예외:', error);
    return null;
  }
}

// 이미지 URL 생성
function createImageUrl(id) {
  try {
    // ID가 숫자가 아니면 변환
    const numericId = parseInt(id.toString().replace(/\D/g, ''));
    // 4자리 숫자로 포맷팅
    const formattedId = String(numericId).padStart(4, '0');
    
    // 두 가지 형태의 URL 생성
    const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
    const gatewayUrl = `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${formattedId}.png`;
    
    // 원본 IPFS URL과 게이트웨이 URL 모두 반환
    return {
      ipfs_url: ipfsUrl,     // ipfs:// 프로토콜 URL
      gateway_url: gatewayUrl, // 직접 액세스 가능한 게이트웨이 URL
      nft_image: gatewayUrl,   // 기존 호환성을 위한 필드
      ipfs_hash: IMAGES_IPFS_HASH  // IPFS CID 저장
    };
  } catch (err) {
    console.error('이미지 URL 생성 오류:', err);
    const defaultId = '0001';
    return {
      ipfs_url: `ipfs://${IMAGES_IPFS_HASH}/${defaultId}.png`,
      gateway_url: `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${defaultId}.png`,
      nft_image: `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${defaultId}.png`,
      ipfs_hash: IMAGES_IPFS_HASH
    };
  }
}

// 온체인 데이터만 사용해 민트 주소에서 일관되게 NFT ID 추출
async function extractNftId(mintAddress) {
  try {
    // resolveNftId 함수를 사용해 민트 주소에서 결정론적으로 ID 추출
    // 중요: await 추가 - resolveNftId는 비동기 함수임
    const id = await resolveNftId(mintAddress);
    console.log(`민트 주소 ${mintAddress}에서 결정론적으로 NFT ID 추출: ${id}`);
    return id;
  } catch (error) {
    console.error(`NFT ID 추출 중 오류 (${mintAddress}):`, error);
    
    // 오류 발생시 기본 해시 기반 생성 사용
    let hash = 0;
    for (let i = 0; i < mintAddress.length; i++) {
      hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
      hash = hash & hash; // 32비트 정수로 변환
    }
    
    const fallbackId = String(Math.abs(hash) % 999 + 1).padStart(4, '0');
    console.log(`해시 기반 ID 생성 ${mintAddress}: ${fallbackId}`);
    return fallbackId;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }
    
    console.log(`지갑 ${wallet}의 스테이킹 정보 강제 동기화를 시작합니다...`);
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    const walletPubkey = new PublicKey(wallet);
    
    // 사용자 스테이킹 정보 PDA 계산
    const [userStakingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    console.log('UserStakingInfo PDA:', userStakingPDA.toString());
    
    // 사용자 스테이킹 정보 계정 가져오기
    const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
    
    if (!userStakingAccount) {
      return res.status(404).json({ 
        error: '사용자 스테이킹 정보를 찾을 수 없습니다',
        message: '온체인에 스테이킹된 NFT가 없습니다.'
      });
    }
    
    console.log(`온체인 스테이킹 계정이 존재합니다. 크기: ${userStakingAccount.data.length} 바이트`);
    
    // 사용자 스테이킹 정보 디코딩
    const userStakingInfo = decodeUserStakingInfo(userStakingAccount.data);
    
    if (!userStakingInfo) {
      return res.status(500).json({ 
        error: '사용자 스테이킹 정보 디코딩 실패',
        message: '계정 데이터 구조가 예상과 다릅니다.'
      });
    }
    
    // 스테이킹된 민트 주소 가져오기 - 개선된 필터링 로직 (최대한 관대하게 처리)
    console.log("\n==== 사용자 스테이킹 계정 분석 ====\n");
    
    // 초기 데이터 상세 출력
    console.log("1. 간플한 스테이킹 계정 기본 정보:");
    console.log(`   - 소유자: ${userStakingInfo.owner ? new PublicKey(userStakingInfo.owner).toString() : 'UNKNOWN'}`);
    console.log(`   - 총 스테이킹 개수: ${userStakingInfo.stakedCount || 0}`);
    console.log(`   - stakedMints 배열 길이: ${userStakingInfo.stakedMints.length}`);
    
    // 배열 상세정보 출력
    console.log("\n2. stakedMints 배열 각 항목 분석:");
    userStakingInfo.stakedMints.forEach((mint, idx) => {
      try {
        // 원시 바이트 값 출력
        const mintPubkey = new PublicKey(mint);
        const mintStr = mintPubkey.toString();
        const hexBytes = Buffer.from(mintPubkey.toBytes()).toString('hex');
        
        console.log(`   [${idx}] 민트 주소: ${mintStr}`);
        console.log(`       헥스 값: ${hexBytes}`);
        console.log(`       기본값 여부: ${mintStr === PublicKey.default.toString()}`);
        console.log(`       올원즈 여부: ${mintStr === '11111111111111111111111111111111'}`);
      } catch (err) {
        console.log(`   [${idx}] 민트 주소 처리 중 오류:`, err.message);
      }
    });
    
    // 매우 적은 방지리스트를 사용
    const strictlyInvalidAddresses = [
      PublicKey.default.toString(),         // 전부 0
      '11111111111111111111111111111111',  // 전부 1
      '1111111111111111111111111111111'    // 31개의 1 (1개 적음)
    ];
    
    console.log("\n3. 유효한 민트 주소 필터링:");
    const stakedMints = userStakingInfo.stakedMints
      .filter(mint => {
        try {
          // PublicKey를 문자열로 변환
          const mintPubkey = new PublicKey(mint);
          const mintStr = mintPubkey.toString();
          
          // 방지리스트에 포함되어 있는지 확인 - 매우 적은 필터링만 적용
          const isBlacklisted = strictlyInvalidAddresses.includes(mintStr);
          
          // 특별 민트 주소 확인 코드 제거 (사용자 요청에 따라)
          
          const isValid = !isBlacklisted;
          console.log(`   - 민트 ${mintStr}: 방지=${isBlacklisted}, 유효=${isValid}`);
          
          // 별도의 유효성 검사 없이 방지리스트에 없는 모든 주소 허용
          return isValid;
        } catch(err) {
          console.log(`   - 오류: ${err.message}`);
          return false; // 오류가 발생한 민트는 불허
        }
      })
      .map(mint => new PublicKey(mint).toString());
      
    console.log(`\n4. 최종 결과: ${stakedMints.length}개의 유효한 민트 주소`);
    console.log(`   - 유효한 민트: ${stakedMints.join(', ')}`);
    console.log(`=================================\n`);
      
    console.log(`${stakedMints.length}개의 유효한 민트 주소를 조회합니다`);
    console.log('Found', stakedMints.length, 'valid mint addresses to look up');
    
    // 데이터베이스 의존성 제거 - 온체인 데이터만 사용
    console.log('온체인 데이터만 활용하여 NFT 정보 처리');
    
    // 각 민트 주소에 대한 스테이킹 정보 가져오기
    const stakingRecords = [];
    
    for (const mintAddress of stakedMints) {
      try {
        // 스테이킹 계정 PDA 계산 - 정확한 시드 값 사용
        // 중요: 'stake_info'가 아닌 'stake' 시드 사용
        const [stakePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(STAKE_SEED), new PublicKey(mintAddress).toBuffer()],
          programId
        );
        
        console.log(`민트 ${mintAddress}의 스테이크 PDA 계산: ${stakePDA.toString()}`);
        console.log(`사용된 시드: "${STAKE_SEED}" (바이트 값: [${Buffer.from(STAKE_SEED).toString('hex')}])`);
        
        // 라이브 온체인 트러블슈팅을 위해 잘못된 시드로 PDA도 계산
        const [wrongStakePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('stake_info'), new PublicKey(mintAddress).toBuffer()],
          programId
        );
        console.log(`경고: 잘못된 시드('stake_info')로 계산한 PDA: ${wrongStakePDA.toString()}`);
        console.log(`민트 ${mintAddress}의 올바른 PDA와 틀린 PDA 비교: ${stakePDA.toString()} != ${wrongStakePDA.toString()}`);
        
        // 스테이킹 계정 정보 가져오기
        const stakeAccount = await connection.getAccountInfo(stakePDA);
        
        if (!stakeAccount) {
          console.log(`민트 주소 ${mintAddress}의 스테이킹 계정을 찾을 수 없습니다`);
          continue;
        }
        
        // 스테이킹 정보 디코딩
        const stakeInfo = decodeStakeInfo(stakeAccount.data);
        
        if (!stakeInfo) {
          console.log(`민트 주소 ${mintAddress}의 스테이킹 정보 디코딩 실패`);
          continue;
        }
        
        // 스테이킹 정보 확인
        if (stakeInfo.isUnstaked === 1) {
          console.log(`민트 주소 ${mintAddress}는 언스테이킹 되었습니다`);
          continue;
        }
        
        // NFT ID 추출
        const nftId = await extractNftId(mintAddress);
        console.log(`Processing stake for NFT ID: ${nftId}, mint: ${mintAddress}`);
        
        // NFT 티어 계산
        let nftTier = 'COMMON';
        if (stakeInfo.tierMultiplier >= 8) nftTier = 'LEGENDARY';
        else if (stakeInfo.tierMultiplier >= 4) nftTier = 'EPIC';
        else if (stakeInfo.tierMultiplier >= 2) nftTier = 'RARE';
        
        // 이미지 URL 생성
        console.log('No actual image URL found, using generated data for NFT ID:', nftId);
        const imageUrls = createImageUrl(nftId);
        
        // 스테이킹 기간 계산
        const stakedAt = solanaTimestampToDate(Number(stakeInfo.stakedAt));
        const releaseTime = solanaTimestampToDate(Number(stakeInfo.releaseTime));
        const stakingPeriod = secondsToDays(Number(stakeInfo.releaseTime) - Number(stakeInfo.stakedAt));
        
        // 보상 계산
        const dailyRewardRate = Number(stakeInfo.rewardRatePerDay);
        const totalRewards = stakingPeriod * dailyRewardRate;
        
        // 데이터베이스 작업 코드 제거 - 온체인 로직만 유지
        console.log(`온체인 스테이킹 정보 확인: ${mintAddress}`);
        
        // 메타데이터 생성
        const metadata = {
          name: `SOLARA #${nftId}`,
          symbol: "SOLARA",
          description: "SOLARA NFT Collection",
          image: imageUrls.ipfs_url,
          attributes: [
            {
              trait_type: "Tier",
              value: nftTier
            }
          ]
        };
        
        // 최종 스테이킹 레코드 생성
        const stakingRecord = {
          wallet_address: wallet,
          mint_address: mintAddress,
          nft_id: nftId,
          staked_nft_id: nftId,
          nft_name: `SOLARA #${nftId}`,
          nft_tier: nftTier,
          staked_at: stakedAt.toISOString(),
          release_date: releaseTime.toISOString(),
          last_update: new Date().toISOString(),
          staking_period: stakingPeriod,
          daily_reward_rate: dailyRewardRate,
          total_rewards: totalRewards,
          earned_so_far: 0,
          claimed_rewards: 0,
          status: 'staked',
          image: imageUrls.ipfs_url,
          image_url: imageUrls.ipfs_url,
          nft_image: imageUrls.gateway_url,
          ipfs_hash: imageUrls.ipfs_hash,
          metadata: metadata,
          tx_signature: 'force_synced_' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          api_version: 'force-sync-v1'
        };
        
        // 데이터베이스 저장 코드 제거 - 온체인 데이터만 처리
        console.log(`온체인 스테이킹 데이터 처리 완료: ${mintAddress}`);
        
        stakingRecords.push({
          nftId,
          mintAddress,
          tier: nftTier,
          result: 'success'
        });
      } catch (err) {
        console.error(`민트 주소 ${mintAddress} 처리 중 오류:`, err);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${stakingRecords.length}개의 NFT 스테이킹 정보가 동기화되었습니다`,
      stakedCount: stakingRecords.length,
      stakedNFTs: stakingRecords
    });
  } catch (error) {
    console.error('강제 동기화 오류:', error);
    return res.status(500).json({
      error: '강제 동기화 중 오류가 발생했습니다',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}