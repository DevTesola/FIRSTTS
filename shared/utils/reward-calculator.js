/**
 * NFT 스테이킹 보상 계산기
 * 스테이킹 보상 계산 관련 유틸리티 함수들
 */

/**
 * NFT 티어 값을 표준화하는 헬퍼 함수
 * 
 * @param {string} tierValue - 원시 티어 값
 * @returns {string} 표준화된 티어 값
 */
function standardizeTier(tierValue) {
  if (!tierValue) return 'COMMON';
  
  const tier = String(tierValue).trim().toUpperCase();
  if (tier.includes('LEGEND')) return 'LEGENDARY';
  if (tier.includes('EPIC')) return 'EPIC';
  if (tier.includes('RARE')) return 'RARE';
  return 'COMMON';
}

/**
 * 예상 보상 계산 함수
 * 
 * @param {string} nftTier - NFT 등급
 * @param {number} stakingPeriod - 스테이킹 기간(일)
 * @param {boolean} autoCompound - 자동 복리 여부
 * @returns {Object} 보상 관련 정보
 */
function calculateEstimatedRewards(nftTier, stakingPeriod, autoCompound = false) {
  // 티어별 일일 기본 보상률
  const dailyRewardsByTier = {
    'LEGENDARY': 200,  // 200 TESOLA per day
    'EPIC': 100,       // 100 TESOLA per day
    'RARE': 50,        // 50 TESOLA per day
    'COMMON': 25       // 25 TESOLA per day
  };
  
  // 일일 기본 보상률 계산
  const baseRate = dailyRewardsByTier[nftTier] || dailyRewardsByTier.COMMON;
  
  // 장기 스테이킹 승수 계산
  let multiplier = 1.0;
  
  // 장기 스테이킹 보너스
  if (stakingPeriod >= 365) multiplier = 2.0;      // 365+ days: 2x
  else if (stakingPeriod >= 180) multiplier = 1.7; // 180+ days: 1.7x
  else if (stakingPeriod >= 90) multiplier = 1.4;  // 90+ days: 1.4x
  else if (stakingPeriod >= 30) multiplier = 1.2;  // 30+ days: 1.2x
  
  // 자동 복리 보너스 (활성화된 경우)
  const autoCompoundBonus = autoCompound ? 0.1 : 0.0; // 10% 추가 보너스
  const totalMultiplier = multiplier * (1 + autoCompoundBonus);
  
  // 총 예상 보상 계산
  const totalRewards = Math.floor(baseRate * stakingPeriod * totalMultiplier);
  
  // 일별 보상 배열 생성 (최대 7일까지만)
  const dailyRewards = [];
  for (let day = 0; day < Math.min(stakingPeriod, 7); day++) {
    dailyRewards.push(Math.floor(baseRate * totalMultiplier));
  }
  
  // 평균 일일 보상 계산
  const averageDailyReward = totalRewards / stakingPeriod;
  
  // 장기 보너스 백분율
  const longTermBonus = Math.floor((multiplier - 1.0) * 100);
  
  // 자동 복리 보너스 퍼센트
  const autoCompoundBonusPercent = autoCompound ? 10 : 0;
  
  return {
    baseRate,
    totalRewards,
    dailyRewards,
    averageDailyReward,
    longTermBonus,
    autoCompoundBonus: autoCompoundBonusPercent,
    totalMultiplier: totalMultiplier,
    stakingPeriodDays: stakingPeriod,
    estimatedEndDate: new Date(Date.now() + (stakingPeriod * 24 * 60 * 60 * 1000)).toISOString()
  };
}

module.exports = {
  standardizeTier,
  calculateEstimatedRewards
};