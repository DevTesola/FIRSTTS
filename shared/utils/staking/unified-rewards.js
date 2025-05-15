/**
 * 통합 스테이킹 보상 계산 유틸리티
 * 
 * 이 모듈은 모든 스테이킹 보상 계산을 한 곳에서 처리합니다:
 * - 티어별 보상 비율
 * - 장기 스테이킹 보너스
 * - 자동 복리 보너스
 * - 콜렉션 보너스
 * 
 * 이 유틸리티는 모든 API와 컴포넌트가 일관된 보상 계산 로직을 사용하도록 합니다.
 */

// 티어별 일일 기본 보상률 (온체인 값과 일치)
const DAILY_REWARDS_BY_TIER = {
  0: 25,  // Common: 25 TESOLA per day (1x)
  1: 50,  // Rare: 50 TESOLA per day (2x)
  2: 100, // Epic: 100 TESOLA per day (4x)
  3: 200  // Legendary: 200 TESOLA per day (8x)
};

// 티어별 멀티플라이어 (온체인 값과 일치)
const TIER_MULTIPLIERS = {
  0: 1, // Common: 1x
  1: 2, // Rare: 2x
  2: 4, // Epic: 4x
  3: 8  // Legendary: 8x
};

// 티어 이름 매핑
const TIER_NAMES = {
  0: 'COMMON',
  1: 'RARE',
  2: 'EPIC',
  3: 'LEGENDARY'
};

// UI에 표시될 티어별 멀티플라이어 (UI 표시용)
const UI_TIER_MULTIPLIERS = {
  0: 1.0, // Common: 1.0x
  1: 1.5, // Rare: 1.5x
  2: 2.0, // Epic: 2.0x
  3: 3.0  // Legendary: 3.0x
};

// 장기 스테이킹 보너스 (일수별)
const LONG_STAKING_BONUSES = {
  7: 1.0,   // 첫 7일 동안 기본 (1x)
  30: 1.2,  // 30일 이상: 20% 보너스 (1.2x)
  90: 1.4,  // 90일 이상: 40% 보너스 (1.4x)
  180: 1.7, // 180일 이상: 70% 보너스 (1.7x)
  365: 2.0  // 365일 이상: 100% 보너스 (2x)
};

// 자동 복리 보너스 (10%)
const AUTO_COMPOUND_BONUS = 0.1;

// 콜렉션 보너스 계산 (보유 NFT 개수별)
function calculateCollectionBonus(nftCount) {
  if (nftCount >= 20) return 0.5;  // 20개 이상: 50% 보너스
  if (nftCount >= 10) return 0.3;  // 10개 이상: 30% 보너스
  if (nftCount >= 5) return 0.2;   // 5개 이상: 20% 보너스
  if (nftCount >= 3) return 0.1;   // 3개 이상: 10% 보너스
  return 0; // 기본값
}

/**
 * 티어 ID를 이름으로 변환
 * 
 * @param {number} tierId - 티어 ID (0-3)
 * @returns {string} 티어 이름
 */
function getTierName(tierId) {
  return TIER_NAMES[tierId] || TIER_NAMES[0]; // 기본값: COMMON
}

/**
 * 티어 ID에 대한 멀티플라이어 반환
 * 
 * @param {number} tierId - 티어 ID (0-3)
 * @returns {number} 티어 멀티플라이어
 */
function getTierMultiplier(tierId) {
  return TIER_MULTIPLIERS[tierId] || TIER_MULTIPLIERS[0]; // 기본값: 1x
}

/**
 * 티어 ID에 대한 UI 표시용 멀티플라이어 반환
 * 
 * @param {number} tierId - 티어 ID (0-3)
 * @returns {number} UI 표시용 멀티플라이어
 */
function getUiTierMultiplier(tierId) {
  return UI_TIER_MULTIPLIERS[tierId] || UI_TIER_MULTIPLIERS[0]; // 기본값: 1.0x
}

/**
 * 티어 ID에 대한 일일 보상률 반환
 * 
 * @param {number} tierId - 티어 ID (0-3)
 * @returns {number} 일일 보상률
 */
function getDailyRewardRate(tierId) {
  return DAILY_REWARDS_BY_TIER[tierId] || DAILY_REWARDS_BY_TIER[0]; // 기본값: 25
}

/**
 * 스테이킹 기간 보너스 계산
 * 
 * @param {number} days - 스테이킹한 일수
 * @returns {number} 보너스 멀티플라이어
 */
function getStakingDurationBonus(days) {
  if (days >= 365) return LONG_STAKING_BONUSES[365];
  if (days >= 180) return LONG_STAKING_BONUSES[180];
  if (days >= 90) return LONG_STAKING_BONUSES[90];
  if (days >= 30) return LONG_STAKING_BONUSES[30];
  return LONG_STAKING_BONUSES[7]; // 기본값
}

/**
 * 통합 보상 계산 함수
 * 
 * @param {Object} params - 보상 계산 매개변수
 * @param {number} params.tierId - 티어 ID (0: Common, 1: Rare, 2: Epic, 3: Legendary)
 * @param {number} params.stakingPeriod - 스테이킹 기간(일수)
 * @param {number} params.stakedDays - 현재까지 스테이킹한 일수
 * @param {boolean} params.autoCompound - 자동 복리 여부
 * @param {number} params.nftCount - 보유 중인 스테이킹된 NFT 개수 (콜렉션 보너스용)
 * @returns {Object} 계산된 보상 정보
 */
function calculateRewards({
  tierId = 0,
  stakingPeriod = 30,
  stakedDays = 0,
  autoCompound = false,
  nftCount = 1
}) {
  // 1. 티어 멀티플라이어 적용
  const tierMultiplier = getTierMultiplier(tierId);
  const tierName = getTierName(tierId);
  
  // 2. 기본 일일 보상률
  const baseRewardRate = getDailyRewardRate(tierId);
  
  // 3. 스테이킹 기간 보너스
  const durationBonus = getStakingDurationBonus(stakingPeriod);
  
  // 4. 자동 복리 보너스
  const compoundBonus = autoCompound ? AUTO_COMPOUND_BONUS : 0;
  
  // 5. 콜렉션 보너스
  const collectionBonus = calculateCollectionBonus(nftCount);
  
  // 6. 총 보너스 멀티플라이어 계산
  const totalBonusMultiplier = 1 + collectionBonus + compoundBonus;
  
  // 7. 해당 시점의 적용 보너스 (현재까지 스테이킹한 기간 기준)
  const currentDurationBonus = getStakingDurationBonus(stakedDays);
  
  // 8. 일일 보상률 계산 (모든 보너스 적용)
  const dailyRewardRate = baseRewardRate * currentDurationBonus * totalBonusMultiplier;
  
  // 9. 현재까지 획득한 보상 계산 (최소 1일 보장)
  const safeStakedDays = Math.max(1, stakedDays); // 최소 1일을 보장하여 0 리워드 문제 해결
  const earnedSoFar = Math.floor(baseRewardRate * safeStakedDays * currentDurationBonus * totalBonusMultiplier);
  console.log(`보상 계산 (최소 1일 보장): 기본율=${baseRewardRate}, 일수=${safeStakedDays}, 기간보너스=${currentDurationBonus}, 총보너스=${totalBonusMultiplier}, 획득=${earnedSoFar}`);
  
  // 10. 총 예상 보상 계산 (전체 스테이킹 기간 동안)
  const totalProjectedRewards = Math.floor(baseRewardRate * stakingPeriod * durationBonus * totalBonusMultiplier);
  
  // 결과 반환
  return {
    tierName,
    tierMultiplier,
    uiTierMultiplier: getUiTierMultiplier(tierId),
    baseRewardRate,
    dailyRewardRate,
    durationBonus,
    currentDurationBonus,
    compoundBonus,
    collectionBonus,
    totalBonusMultiplier,
    earnedSoFar,
    totalProjectedRewards,
    // 추가 정보
    stakingPeriod,
    stakedDays,
    autoCompound,
    nftCount
  };
}

/**
 * 스테이킹 정보로부터 티어 id 추출
 * 
 * @param {Object} stakeInfo - 스테이킹 정보 객체
 * @returns {number} 티어 ID (0-3)
 */
function extractTierId(stakeInfo) {
  if (!stakeInfo) return 0;
  
  // 온체인 tier 값이 있으면 직접 사용 (가장 신뢰할 수 있음)
  if (stakeInfo.tier !== undefined && stakeInfo.tier !== null) {
    return Number(stakeInfo.tier);
  }
  
  // tier_multiplier 값이 있으면 역으로 티어 ID 추론
  if (stakeInfo.tier_multiplier) {
    const multiplier = Number(stakeInfo.tier_multiplier);
    if (multiplier >= 8) return 3; // Legendary
    if (multiplier >= 4) return 2; // Epic
    if (multiplier >= 2) return 1; // Rare
    return 0; // Common
  }
  
  // nft_tier 이름이 있으면 이름으로 티어 ID 추론
  if (stakeInfo.nft_tier) {
    const tier = String(stakeInfo.nft_tier).toUpperCase();
    if (tier.includes('LEGEND')) return 3;
    if (tier.includes('EPIC')) return 2;
    if (tier.includes('RARE')) return 1;
    return 0;
  }
  
  // 기본값
  return 0;
}

// 모든 함수 내보내기
module.exports = {
  // 상수
  DAILY_REWARDS_BY_TIER,
  TIER_MULTIPLIERS,
  TIER_NAMES,
  UI_TIER_MULTIPLIERS,
  LONG_STAKING_BONUSES,
  AUTO_COMPOUND_BONUS,
  
  // 유틸리티 함수
  getTierName,
  getTierMultiplier,
  getUiTierMultiplier,
  getDailyRewardRate,
  getStakingDurationBonus,
  calculateCollectionBonus,
  
  // 주요 계산 함수
  calculateRewards,
  extractTierId
};