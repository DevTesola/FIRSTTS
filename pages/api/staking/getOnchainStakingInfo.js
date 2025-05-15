/**
 * 온체인 스테이킹 정보 직접 조회 API
 * 데이터베이스를 거치지 않고 온체인에서 직접 스테이킹 정보를 가져옵니다.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';

// 상수 정의
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

// Import correct seed formats from shared utils
const { SEED_STRINGS } = require('../../../shared/constants/seeds');

// Use the correct seed values - the actual buffers are different than the string values!
const STAKE_SEED = 'stake'; // Must match the byte value [115, 116, 97, 107, 101]
const USER_STAKING_SEED = 'user_staking';

// IPFS Gateway URL
const IPFS_GATEWAY = 'https://tesola.mypinata.cloud/ipfs/';

// IPFS CID - 이미지용
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

// 릴리즈 날짜까지 남은 일수 계산
function calculateDaysLeft(releaseDate) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// 진행 백분율 계산
function calculateProgress(stakedAt, releaseDate) {
  const start = new Date(stakedAt).getTime();
  const end = new Date(releaseDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

// Solana 타임스탬프(초)를 JavaScript Date 객체로 변환
function solanaTimestampToDate(timestamp) {
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
    if (!data || data.length < 50) {
      console.error('계정 데이터가 너무 짧습니다:', data?.length);
      return null;
    }
    
    const discriminator = DISCRIMINATORS.STAKE_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      return null;
    }
    
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
    if (!data || data.length < 50) {
      console.error('UserStakingInfo 계정 데이터가 너무 짧습니다:', data?.length);
      return null;
    }
    
    console.log('UserStakingInfo 파싱 시작', { 
      dataLength: data.length,
      discriminatorProvided: true
    });
    
    const discriminator = DISCRIMINATORS.USER_STAKING_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    console.log('UserStakingInfo 디스크리미네이터 비교:', {
      expected: Array.from(discriminator),
      actual: Array.from(accountDiscriminator),
      expectedHex: discriminator.toString('hex'),
      actualHex: Buffer.from(accountDiscriminator).toString('hex'),
      matches: Buffer.from(accountDiscriminator).equals(discriminator)
    });
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('UserStakingInfo 디스크리미네이터 불일치');
      return null;
    }
    
    try {
      const decoded = borsh.deserialize(UserStakingInfo.schema, UserStakingInfo, data);
      
      if (!decoded) {
        console.error('UserStakingInfo 디코딩 결과가 null입니다.');
        return null;
      }
      
      const owner = new PublicKey(decoded.owner);
      console.log('UserStakingInfo 파싱 중: 소유자=' + owner.toString() + ', 스테이킹 수=' + decoded.stakedCount);
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
function createImageUrl(nftId) {
  try {
    // ID가 숫자가 아니면 변환
    let numericId = parseInt(String(nftId).replace(/\D/g, ''));
    if (isNaN(numericId)) {
      // 해시 기반 숫자 생성
      numericId = Math.floor(Math.random() * 999) + 1;
    }
    
    // 4자리 숫자로 포맷팅
    const formattedId = String(numericId).padStart(4, '0');
    
    // 두 가지 형태의 URL 생성
    const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
    const gatewayUrl = `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${formattedId}.png`;
    
    return {
      ipfs_url: ipfsUrl,     // ipfs:// 프로토콜 URL
      gateway_url: gatewayUrl, // 게이트웨이 URL
      nft_image: gatewayUrl,   // 기존 호환성을 위한 필드
      ipfs_hash: IMAGES_IPFS_HASH  // IPFS CID 저장
    };
  } catch (err) {
    console.error('이미지 URL 생성 오류:', err);
    return null;
  }
}

// 민트 주소에서 NFT ID 생성 (대부분 번호를 모르므로 해시 기반 생성)
function generateNftId(mintAddress) {
  if (!mintAddress) return '0001';
  
  let hash = 0;
  for (let i = 0; i < mintAddress.length; i++) {
    hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  const id = (Math.abs(hash) % 999) + 1;
  return String(id).padStart(4, '0');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }
    
    console.log(`지갑 ${wallet}의 온체인 스테이킹 정보를 직접 조회합니다...`);
    
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
      return res.status(200).json({ 
        success: true,
        message: '스테이킹 정보가 없습니다',
        stats: {
          activeStakes: [],
          stats: {
            projectedRewards: 0,
            earnedToDate: 0,
            collectionBonus: 0
          }
        }
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
    
    // 스테이킹된 민트 주소 가져오기
    const stakedMints = userStakingInfo.stakedMints.map(mint => new PublicKey(mint).toString());
    console.log(`${stakedMints.length}개의 민트 주소를 조회합니다`);
    
    // 컬렉션 보너스
    const collectionBonus = userStakingInfo.collectionBonus;
    
    // 각 민트 주소에 대한 스테이킹 정보 가져오기
    const activeStakes = [];
    let totalEarnedSoFar = 0;
    let totalProjectedRewards = 0;
    
    for (const mintAddress of stakedMints) {
      try {
        // 스테이킹 계정 PDA 계산
        const [stakePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(STAKE_SEED), new PublicKey(mintAddress).toBuffer()],
          programId
        );
        
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
        
        // NFT ID 생성 (민트 주소 기반)
        const nftId = generateNftId(mintAddress);
        
        // NFT 티어 계산
        let nftTier = 'COMMON';
        if (stakeInfo.tierMultiplier >= 8) nftTier = 'LEGENDARY';
        else if (stakeInfo.tierMultiplier >= 4) nftTier = 'EPIC';
        else if (stakeInfo.tierMultiplier >= 2) nftTier = 'RARE';
        
        // 이미지 URL 생성
        const imageUrls = createImageUrl(nftId);
        
        // 시간 정보 계산
        const stakedAt = solanaTimestampToDate(Number(stakeInfo.stakedAt));
        const releaseTime = solanaTimestampToDate(Number(stakeInfo.releaseTime));
        const lastUpdateTime = solanaTimestampToDate(Number(stakeInfo.lastUpdateTime));
        
        // 스테이킹 기간 계산
        const stakingPeriod = secondsToDays(Number(stakeInfo.releaseTime) - Number(stakeInfo.stakedAt));
        
        // 보상 계산
        const dailyRewardRate = Number(stakeInfo.rewardRatePerDay);
        const totalRewards = stakingPeriod * dailyRewardRate;
        
        // 현재까지 획득한 보상 계산
        const currentTime = Math.floor(Date.now() / 1000);
        const stakedTime = Math.min(currentTime - Number(stakeInfo.stakedAt), Number(stakeInfo.releaseTime) - Number(stakeInfo.stakedAt));
        const earnedSoFar = Math.floor((stakedTime / 86400) * dailyRewardRate);
        
        totalEarnedSoFar += earnedSoFar;
        totalProjectedRewards += totalRewards;
        
        // 스테이킹 정보 객체 생성
        const stakeData = {
          id: mintAddress.slice(0, 8),
          staked_nft_id: nftId,
          nft_id: nftId,
          mint_address: mintAddress,
          wallet_address: wallet,
          nft_name: `SOLARA #${nftId}`,
          nft_tier: nftTier,
          staked_at: stakedAt.toISOString(),
          release_date: releaseTime.toISOString(),
          last_update: lastUpdateTime.toISOString(),
          staking_period: stakingPeriod,
          daily_reward_rate: dailyRewardRate,
          total_rewards: totalRewards,
          earned_so_far: earnedSoFar,
          claimed_rewards: 0,
          status: 'staked',
          progress_percentage: calculateProgress(stakedAt, releaseTime),
          days_left: calculateDaysLeft(releaseTime),
          is_unlocked: calculateDaysLeft(releaseTime) === 0,
          // 이미지 및 메타데이터 정보
          image: imageUrls.ipfs_url,
          image_url: imageUrls.ipfs_url,
          nft_image: imageUrls.gateway_url,
          ipfs_hash: imageUrls.ipfs_hash,
          // 온체인 관련 정보
          stake_pda: stakePDA.toString(),
          tier_multiplier: stakeInfo.tierMultiplier
        };
        
        activeStakes.push(stakeData);
      } catch (err) {
        console.error(`민트 주소 ${mintAddress} 처리 중 오류:`, err);
      }
    }
    
    // 최종 응답 데이터 구성
    const responseData = {
      success: true,
      message: `${activeStakes.length}개의 스테이킹된 NFT를 찾았습니다`,
      stats: {
        activeStakes,
        stats: {
          projectedRewards: totalProjectedRewards,
          earnedToDate: totalEarnedSoFar,
          collectionBonus
        }
      }
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('온체인 스테이킹 정보 조회 오류:', error);
    return res.status(500).json({
      error: '온체인 스테이킹 정보 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
}