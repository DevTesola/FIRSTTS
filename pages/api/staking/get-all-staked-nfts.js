/**
 * 모든 스테이킹된 NFT를 가져오는 통합 API
 * 온체인 데이터를 우선하며 통합 보상 계산 시스템 사용
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder } from '@project-serum/anchor';
import { findStakeInfoPDA, findUserStakingInfoPDA } from '../../../shared/utils/pda';
import { PROGRAM_ID } from '../../../shared/constants/program-ids';
import { resolveNftId } from '../../../utils/staking-helpers/nft-id-resolver';
import { 
  calculateRewards, 
  extractTierId, 
  getTierName 
} from '../../../shared/utils/staking/unified-rewards';

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud/ipfs/';
const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';

// Utility function to create image URLs
function createImageUrl(nftId) {
  const formattedId = String(nftId).padStart(4, '0');
  const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
  const gatewayUrl = `${IPFS_GATEWAY}/${IMAGES_IPFS_HASH}/${formattedId}.png`;
  
  return {
    ipfs_url: ipfsUrl,
    gateway_url: gatewayUrl,
    nft_image: gatewayUrl,
    ipfs_hash: IMAGES_IPFS_HASH
  };
}

// Calculate days left
function calculateDaysLeft(releaseDate) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Calculate progress percentage
function calculateProgress(stakedAt, releaseDate) {
  const start = new Date(stakedAt).getTime();
  const end = new Date(releaseDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }
    
    console.log(`지갑 ${wallet}의 모든 온체인 스테이킹 정보 가져오기...`);
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const walletPubkey = new PublicKey(wallet);
    
    // 사용자 스테이킹 PDA 계산
    const [userStakingPDA] = findUserStakingInfoPDA(walletPubkey);
    console.log(`사용자 스테이킹 PDA: ${userStakingPDA.toString()}`);
    
    // 사용자 스테이킹 계정 가져오기
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
    
    console.log(`스테이킹 계정 존재함: ${userStakingAccount.data.length} 바이트`);
    
    // IDL 기반으로 계정 데이터 디코딩
    const idl = require('../../../idl/nft_staking.json');
    
    // Custom coder implementation for UserStakingInfo
    try {
      // Fix: Use a different approach to decode the account data
      // Anchor discriminator is always the first 8 bytes, so we skip it
      const ACCOUNT_DISCRIMINATOR_SIZE = 8;
      const data = userStakingAccount.data.slice(ACCOUNT_DISCRIMINATOR_SIZE);
      
      // 사용자 스테이킹 정보를 수동으로 파싱
      // UserStakingInfo 계정 구조의 레이아웃은 IDL의 정의와 일치해야 함
      // owner(PublicKey) + staked_count(u8) + vec<PublicKey> + collection_bonus(u64)
      
      // owner: 32 bytes (PublicKey)
      // staked_count: 1 byte (u8)
      // vec<PublicKey>: 4 bytes (length) + N * 32 bytes
      // collection_bonus: 8 bytes (u64)
      
      // 소유자 주소 읽기 (처음 32바이트)
      const owner = new PublicKey(data.slice(0, 32));
      
      // staked_count 읽기 (다음 1바이트)
      const stakedCount = data[32];
      
      // collection_bonus는 벡터 뒤에 있으므로 우선 벡터 길이를 읽어야 함
      // 벡터 길이는 u32로 저장됨 (4바이트)
      const vecLenBytes = data.slice(33, 37);
      const vecLen = vecLenBytes.readUInt32LE(0);
      
      // 벡터 항목 읽기 (각 항목은 PublicKey, 32바이트)
      const parsedStakedMints = [];
      let offset = 37; // 32 (owner) + 1 (stakedCount) + 4 (vecLen)
      
      for (let i = 0; i < vecLen; i++) {
        const mintBytes = data.slice(offset, offset + 32);
        parsedStakedMints.push(new PublicKey(mintBytes));
        offset += 32;
      }
      
      // collection_bonus 읽기 (다음 8바이트)
      const collectionBonusBytes = data.slice(offset, offset + 8);
      const collectionBonus = collectionBonusBytes.readBigUInt64LE(0);
      
      // 파싱한 데이터로 UserStakingInfo 객체 구성
      const userStakingInfo = {
        owner,
        stakedCount,
        stakedMints: parsedStakedMints,
        collectionBonus: Number(collectionBonus)
      };
      
      console.log(`수동 파싱 완료: 소유자=${owner.toString()}, 스테이킹된 NFT 개수=${stakedCount}, 벡터 길이=${vecLen}, 컬렉션 보너스=${collectionBonus}`);
      
      // 추가 검증 로그
      console.log(`스테이킹된 NFT 갯수: ${userStakingInfo.stakedMints.length}`);
      console.log(`컬렉션 보너스: ${userStakingInfo.collectionBonus}`);
      
      console.log(`스테이킹된 NFT 갯수: ${userStakingInfo.stakedMints.length}`);
      console.log(`컬렉션 보너스: ${userStakingInfo.collectionBonus}`);
      
      // 스테이킹된 민트 주소 필터링 - 정밀한 분석
      // 문제점: UserStakingInfo 계정의 stakedMints 배열에 민트 주소가 2개 있지만, 하나만 유효하다고 판단해서 1개만 표시됨
      // 모든 필터링 과정과 배열 값을 상세히 기록
      console.log("\n=== 민트 주소 필터링 간플한 디버깅 ===\n");
      console.log("* 임 스테이킹트 배열 로우 데이터:");
      userStakingInfo.stakedMints.forEach((mint, index) => {
        // 원시 바이트 배열 값 출력 (hex 형식으로)
        console.log(`[${index}] 값:`, mint ? mint.toString() : "undefined", 
                    "(바이트 값:", mint ? Buffer.from(mint.toBytes()).toString('hex') : "N/A", ")");
        
        // PublicKey 기본값과 비교
        if (mint) {
          try {
            const isDefault = mint.equals(PublicKey.default);
            const isAllZeros = mint.toString() === PublicKey.default.toString();
            const isAllOnes = mint.toString() === '11111111111111111111111111111111';
            
            console.log(`   - 특성: 기본값=${isDefault}, 전부 0=${isAllZeros}, 전부 1=${isAllOnes}`);
          } catch (e) {
            console.log("   - 비교 중 오류:", e.message);
          }
        }
      });
      
      // 특정 민트 주소만 방지리스트에 추가 - 최소한의 필터링만 적용
      const hardcodedInvalidAddresses = [
        PublicKey.default.toString(),
        '11111111111111111111111111111111',
        '1111111111111111111111111111111'  // 31개의 1 (1개 적음)
      ];
      
      // 개선된 스테이킹된 민트 주소 필터링 로직
      // 기존에 너무 엄격한 필터링으로 인해 일부 유효한 민트 주소가 필터링되는 문제가 있었음
      // 이제 모든 민트 주소를 포함하는 방식으로 변경
      const stakedMints = userStakingInfo.stakedMints
        .filter(mint => {
          // null 또는 undefined 값만 필터링
          if (!mint) {
            console.log(`민트 값이 null 또는 undefined임 - 필터링됨`);
            return false;
          }
          
          try {
            // PublicKey를 문자열로 변환
            const mintStr = mint.toString();
            
            // 방지리스트는 정말 확실한 무효 주소만 포함
            const isBlacklisted = [
              PublicKey.default.toString(), // 기본 공개키 (0 바이트)
              '11111111111111111111111111111111' // 시스템 프로그램 ID
            ].includes(mintStr);
            
            // 방지리스트에 없는 모든 민트 주소를 유효한 것으로 간주
            console.log(`🔍 민트 조회: ${mintStr} - 유효성: ${!isBlacklisted ? '✅' : '❌'}`);
            return !isBlacklisted;
          } catch(err) {
            console.error(`민트 주소 처리 중 오류:`, err.message);
            return false; // 오류가 발생한 민트는 건너뜀
          }
        })
        .map(mint => mint.toString());
      
      // 디버깅을 위한 추가 로그
      console.log(`===== 최종 필터링 결과 =====`);
      console.log(`유효한 스테이킹된 민트 ${stakedMints.length}개: ${stakedMints.join(', ')}`);
      console.log(`============================================`);
      
      // 처리된 스테이킹 NFT
      const activeStakes = [];
      let totalEarnedSoFar = 0;
      let totalProjectedRewards = 0;
      
      // 각 민트 주소의 스테이킹 정보 처리
      for (const mintAddress of stakedMints) {
        try {
          const mintPubkey = new PublicKey(mintAddress);
          
          // 스테이크 계정 PDA 계산
          const [stakePDA] = findStakeInfoPDA(mintPubkey);
          console.log(`스테이크 PDA: ${stakePDA.toString()} for 민트 ${mintAddress}`);
          
          // 스테이크 계정 가져오기
          const stakeAccount = await connection.getAccountInfo(stakePDA);
          
          if (!stakeAccount) {
            console.log(`민트 ${mintAddress}의 스테이크 계정을 찾을 수 없음`);
            continue;
          }
          
          console.log(`스테이크 계정 발견: ${stakeAccount.data.length} 바이트`);
          
          // 스테이크 정보 수동으로 파싱
          try {
            // Anchor discriminator is always the first 8 bytes, so we skip it
            const ACCOUNT_DISCRIMINATOR_SIZE = 8;
            const stakeAccountData = stakeAccount.data.slice(ACCOUNT_DISCRIMINATOR_SIZE);
            
            // StakeInfo 계정 구조의 레이아웃은 IDL의 정의와 일치해야 함:
            // owner(PublicKey) + mint(PublicKey) + staked_at(i64) + release_date(i64) + 
            // is_staked(bool) + tier(u8) + last_claim_time(i64) + staking_period(u64) + 
            // auto_compound(bool) + accumulated_compound(u64) + current_time_multiplier(u64) + 
            // last_multiplier_update(i64) + milestones_achieved(u8) + next_milestone_days(u64)
            
            // 소유자와 민트 주소 읽기
            const owner = new PublicKey(stakeAccountData.slice(0, 32));
            const mint = new PublicKey(stakeAccountData.slice(32, 64));
            
            // 타임스탬프와 상태 정보 읽기
            const stakedAtBytes = stakeAccountData.slice(64, 72);
            const releaseDateBytes = stakeAccountData.slice(72, 80);
            const isStakedByte = stakeAccountData[80]; // bool은 1바이트 
            const tierByte = stakeAccountData[81]; // u8은 1바이트
            const lastClaimTimeBytes = stakeAccountData.slice(82, 90);
            const stakingPeriodBytes = stakeAccountData.slice(90, 98);
            
            // 값 변환
            const stakedAt = Number(stakedAtBytes.readBigInt64LE(0));
            const releaseDate = Number(releaseDateBytes.readBigInt64LE(0));
            const isStaked = isStakedByte !== 0;
            const tier = tierByte;
            const lastClaimTime = Number(lastClaimTimeBytes.readBigInt64LE(0));
            const stakingPeriod = Number(stakingPeriodBytes.readBigUInt64LE(0));
            
            // 수동으로 파싱한 StakeInfo 객체 생성
            const stakeInfo = {
              owner,
              mint,
              stakingStartTime: { toNumber: () => stakedAt },
              releaseTime: { toNumber: () => releaseDate },
              isStaked,
              isUnstaked: isStaked ? 0 : 1, // isUnstaked 필드는 isStaked의 반대
              tier,
              lastClaimTime: { toNumber: () => lastClaimTime },
              stakingPeriod: { toNumber: () => stakingPeriod },
              // 다른 필드는 이 작업에 필요 없을 경우 기본값 설정
              autoCompound: false,
              accumulatedCompound: { toNumber: () => 0 },
              currentTimeMultiplier: { toNumber: () => 0 },
              lastMultiplierUpdate: { toNumber: () => 0 },
              milestonesAchieved: 0,
              nextMilestoneDays: { toNumber: () => 0 }
            };
            
            // 로깅 추가
            console.log(`스테이크 정보 수동 파싱 완료: 민트=${mint.toString()}, staked=${isStaked}, tier=${tier}, 기간=${stakingPeriod}`);
            
            // 스테이킹 여부 확인
            if (stakeInfo.isUnstaked === 1) {
              console.log(`민트 ${mintAddress}는 언스테이킹됨`);
              continue;
            }
            
            // NFT ID 해결 - 오직 온체인 데이터 사용
            // 민트 주소에서 직접 해시 기반 ID 생성
            // 비동기 함수이므로 await 키워드 추가
            let nftId = await resolveNftId(mintAddress);
            console.log(`온체인 데이터 전용: 민트 주소 ${mintAddress} -> NFT ID ${nftId}`);
            
            
            console.log(`민트 ${mintAddress}의 최종 NFT ID: ${nftId}`);
            
            // 온체인 데이터만을 사용해 이미지 URL 생성 (Use stable cache key)
            // 안정적인 캐시 키: 민트 주소 해시를 기반으로 하여 항상 같은 URL이 생성되도록 함
            const stableCacheKey = mintAddress.slice(0, 8); // 민트 주소의 첫 8자를 캐시 키로 사용
            
            const imageUrls = {
              ipfs_url: `ipfs://${IMAGES_IPFS_HASH}/${nftId}.png`,
              gateway_url: `https://tesola.mypinata.cloud/ipfs/${IMAGES_IPFS_HASH}/${nftId}.png?id=${stableCacheKey}`,
              ipfs_hash: IMAGES_IPFS_HASH
            };
            console.log(`온체인 기반 이미지 URL 생성: ${imageUrls.gateway_url} (안정적 캐시 키 사용)`);
            
            // 타임스탬프 변환
            const stakedAtDate = new Date(stakeInfo.stakingStartTime.toNumber() * 1000);
            const releaseTimeDate = new Date(stakeInfo.releaseTime.toNumber() * 1000);
            
            // 스테이킹 기간 계산
            const stakingPeriodDays = Math.ceil((stakeInfo.releaseTime.toNumber() - stakeInfo.stakingStartTime.toNumber()) / (24 * 60 * 60));
            
            // 온체인에서 가져온 tier 값 로깅
            console.log(`온체인 tier 값: ${tier} (민트: ${mintAddress})`);
            
            // 현재 시간과 스테이킹 시작/종료 시간 계산
            const currentTime = Math.floor(Date.now() / 1000);
            const stakingStartTime = stakeInfo.stakingStartTime.toNumber();
            const stakingEndTime = stakeInfo.releaseTime.toNumber();
            
            // 스테이킹 시간 계산 (일 단위) - 명시적 디버깅 및 강제 값 설정
            const timeDifference = Math.max(0, currentTime - stakingStartTime);
            const stakedDays = Math.max(1, Math.floor(timeDifference / 86400)); // 최소 1일로 설정하여 0으로 표시되는 문제 방지
            
            // 상세 시간 디버깅 로그
            console.log(`스테이킹 시간 계산 (상세): 
              현재 시간: ${new Date(currentTime * 1000).toISOString()}, 
              시작 시간: ${new Date(stakingStartTime * 1000).toISOString()}, 
              시간차이: ${timeDifference}초 (${timeDifference/86400}일), 
              계산된 일수: ${stakedDays}일`);
            
            // 프로그레스 계산 개선 - 현재 시간과 시작/종료 시간 직접 비교 방식
            // 이전 방식은 일수 기반으로 계산했으나, 실시간 진행 상황을 반영하지 못함
            const now = Math.floor(Date.now() / 1000); // 현재 시간(초)
            const start = stakeInfo.stakingStartTime.toNumber(); // 스테이킹 시작 시간(초)
            const end = stakeInfo.releaseTime.toNumber(); // 스테이킹 종료 시간(초)
            
            let stakingProgress = 0;
            if (now >= end) {
              stakingProgress = 100; // 종료 시간 이후면 100%
            } else if (now > start) {
              // 현재 시간이 시작과 종료 사이에 있을 때, 진행률 계산
              stakingProgress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
            }
            
            console.log(`프로그레스 계산(개선): 
              시작=${new Date(start * 1000).toISOString()}, 
              현재=${new Date(now * 1000).toISOString()}, 
              종료=${new Date(end * 1000).toISOString()}, 
              진행률=${stakingProgress.toFixed(2)}%`);
            
            // 통합 보상 계산 시스템 사용
            const rewardsInfo = calculateRewards({
              tierId: tier, // 온체인 tier 값 직접 사용
              stakingPeriod: stakingPeriodDays,
              stakedDays: stakedDays,
              // 향후 온체인에서 가져올 추가 정보
              autoCompound: false, // 현재는 false로 하드코딩, 향후 스테이크 계정에서 가져와야 함
              nftCount: 1 // 기본값, 실제로는 UserStakingInfo에서 stakedMints.length를 사용해야 함
            });
            
            // 계산된 보상 정보 로깅
            console.log(`통합 보상 계산: 민트=${mintAddress}, 시작=${new Date(stakingStartTime * 1000).toISOString()}, ` +
                      `기간=${stakedDays}일, 티어=${rewardsInfo.tierName}, 배율=${rewardsInfo.tierMultiplier}, ` +
                      `일당=${rewardsInfo.dailyRewardRate}, 획득=${rewardsInfo.earnedSoFar}, ` +
                      `보너스=${rewardsInfo.totalBonusMultiplier}x`);
            
            // 총계 업데이트
            totalEarnedSoFar += rewardsInfo.earnedSoFar;
            totalProjectedRewards += rewardsInfo.totalProjectedRewards;
            
            // 보상 계산 결과 저장
            const nftTier = rewardsInfo.tierName;
            const tierMultiplier = rewardsInfo.tierMultiplier;
            const dailyRewardRate = rewardsInfo.dailyRewardRate;
            const earnedSoFar = rewardsInfo.earnedSoFar;
            const totalRewards = rewardsInfo.totalProjectedRewards;
            
            // 온체인 데이터만 사용해 스테이킹 정보 객체 생성
            const stakeDataItem = {
              id: nftId,
              staked_nft_id: nftId,
              nft_id: nftId,
              mint_address: mintAddress,
              wallet_address: wallet,
              nft_name: `SOLARA #${nftId}`,
              nft_tier: nftTier,
              // 온체인 tier 값에서 계산된 배율 추가 (중요!)
              tier_multiplier: tierMultiplier,
              staked_at: stakedAtDate.toISOString(),
              release_date: releaseTimeDate.toISOString(),
              staking_period: stakingPeriodDays,
              daily_reward_rate: dailyRewardRate,
              total_rewards: totalRewards,
              earned_so_far: earnedSoFar,
              claimed_rewards: 0,
              status: 'staked',
              progress_percentage: stakingProgress, // 명시적으로 계산된 프로그레스 사용
              days_left: calculateDaysLeft(releaseTimeDate),
              is_unlocked: calculateDaysLeft(releaseTimeDate) === 0,
              
              // 온체인 기반으로 일관되게 생성된 이미지 URL
              image: imageUrls.ipfs_url,
              image_url: imageUrls.ipfs_url,
              nft_image: imageUrls.gateway_url,
              ipfs_hash: imageUrls.ipfs_hash,
              
              // 온체인 관련 정보
              stake_pda: stakePDA.toString(),
              
              // 디버그 정보
              _debug: {
                source: 'get-all-staked-nfts',
                onchain_mint: mintAddress,
                onchain_only: true,
                hash_based_id: true,
                idl_stake: 'stakeInfo'
              },
              
              // 온체인 데이터만 사용했음을 표시
              onchain_data: true,
              
              // 메타데이터
              metadata: {
                name: `SOLARA #${nftId}`,
                attributes: [
                  { trait_type: "Tier", value: nftTier }
                ],
                image: imageUrls.ipfs_url
              }
            };
            
            activeStakes.push(stakeDataItem);
            console.log(`민트 ${mintAddress}의 처리 완료`);
          } catch (parseError) {
            console.error(`스테이크 정보 파싱 오류:`, parseError);
            console.error(`스테이크 계정 데이터 길이: ${stakeAccount.data.length} 바이트`);
            console.error(`첫 16바이트 (hex): ${Buffer.from(stakeAccount.data.slice(0, 16)).toString('hex')}`);
          }
        } catch (err) {
          console.error(`민트 ${mintAddress} 처리 중 오류:`, err);
        }
      }
      
      // 응답 데이터 구성
      const responseData = {
        success: true,
        message: `${activeStakes.length}개의 스테이킹된 NFT를 찾았습니다`,
        debug_info: {
          stakedMintsCount: userStakingInfo.stakedMints.length,
          filteredMintsCount: stakedMints.length,
          processedCount: activeStakes.length,
          userStakingPDA: userStakingPDA.toString()
        },
        stats: {
          activeStakes,
          stats: {
            projectedRewards: totalProjectedRewards,
            earnedToDate: totalEarnedSoFar,
            collectionBonus: userStakingInfo.collectionBonus
          }
        }
      };
      
      return res.status(200).json(responseData);
    } catch (parseError) {
      console.error(`사용자 스테이킹 정보 파싱 오류:`, parseError);
      return res.status(500).json({
        error: '사용자 스테이킹 정보 파싱 실패',
        message: parseError.message,
        details: '온체인 데이터 구조가 예상과 다릅니다. 계정 구조를 확인하세요.'
      });
    }
  } catch (error) {
    console.error(`온체인 스테이킹 정보 조회 오류:`, error);
    return res.status(500).json({
      error: '온체인 스테이킹 정보 조회 중 오류가 발생했습니다',
      message: error.message
    });
  }
}