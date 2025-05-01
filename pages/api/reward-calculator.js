// reward-calculator.js - ES 모듈 형식으로 변환
// TESOLA 토큰 보상 계산기 - 등급별 보상 로직 구현

/**
 * NFT 등급에 따른 일일 기본 보상률
 */
export const REWARD_RATES = {
  LEGENDARY: 200, // 일일 200 TESOLA
  EPIC: 100,      // 일일 100 TESOLA
  RARE: 50,       // 일일 50 TESOLA
  COMMON: 25      // 일일 25 TESOLA
};

/**
 * 초기 스파이크 보상 계산 (첫 30일)
 * @param {number} stakingDays - 스테이킹 진행 일수
 * @returns {number} 보너스 배율
 */
export function getInitialBonus(stakingDays) {
  if (stakingDays <= 7) return 2.0;      // 첫 7일: 2배
  if (stakingDays <= 14) return 1.75;    // 8-14일: 1.75배
  if (stakingDays <= 30) return 1.5;     // 15-30일: 1.5배
  return 1.0;                            // 기본값
}

/**
 * 장기 스테이킹 보너스 계산
 * @param {number} stakingDays - 스테이킹 총 기간(일)
 * @returns {number} 보너스 배율
 */
export function getLongTermBonus(stakingDays) {
  if (stakingDays >= 365) return 2.0;    // 1년 이상: 2배 (100% 보너스)
  if (stakingDays >= 180) return 1.7;    // 6개월 이상: 1.7배 (70% 보너스)
  if (stakingDays >= 90) return 1.4;     // 3개월 이상: 1.4배 (40% 보너스)
  if (stakingDays >= 30) return 1.2;     // 1개월 이상: 1.2배 (20% 보너스)
  return 1.0;                            // 기본값
}

/**
 * NFT 등급을 표준화하는 함수
 * @param {string} tierValue - NFT 등급 값
 * @returns {string} 표준화된 등급
 */
export function standardizeTier(tierValue) {
  if (!tierValue) return 'COMMON';
  
  // 문자열로 변환하고 앞뒤 공백 제거 후 대문자로 변환
  const normalized = String(tierValue).trim().toUpperCase();
  console.log('[standardizeTier] Original value:', tierValue, 'Normalized:', normalized);
  
  // 정확한 일치 확인
  if (["LEGENDARY", "EPIC", "RARE", "COMMON"].includes(normalized)) {
    return normalized;
  }
  
  // 부분 일치 확인
  if (normalized.includes("LEGEND") || normalized.includes("LEGENDARY")) {
    return "LEGENDARY";
  } else if (normalized.includes("EPIC")) {
    return "EPIC";
  } else if (normalized.includes("RARE")) {
    return "RARE";
  }
  
  // 기본값
  return "COMMON";
}

/**
 * 특정 기간 동안의 예상 리워드 계산
 * @param {string} nftTier - NFT 등급 (LEGENDARY, EPIC, RARE, COMMON)
 * @param {number} stakingPeriod - 스테이킹 총 기간(일)
 * @returns {object} 보상 계산 정보
 */
export function calculateEstimatedRewards(nftTier, stakingPeriod) {
  // 대소문자 처리, 유효하지 않은 등급은 COMMON으로 기본 설정
  const tier = standardizeTier(nftTier);
  console.log('[calculateEstimatedRewards] Using tier:', tier, 'Original:', nftTier);
  
  const baseRate = REWARD_RATES[tier] || REWARD_RATES.COMMON;
  
  // 장기 스테이킹 보너스 적용
  const longTermBonus = getLongTermBonus(stakingPeriod);
  
  // 일별 보상 배열 계산
  const dailyRewards = [];
  let totalRewards = 0;
  
  for (let day = 1; day <= stakingPeriod; day++) {
    // 현재 일자의 초기 스파이크 보너스
    const initialBonus = getInitialBonus(day);
    
    // 초기 스파이크 보너스와 장기 스테이킹 보너스 중 더 큰 값 적용
    const appliedBonus = Math.max(initialBonus, longTermBonus);
    
    // 해당 일의 보상 계산
    const dailyReward = baseRate * appliedBonus;
    dailyRewards.push(dailyReward);
    
    // 총 보상에 추가
    totalRewards += dailyReward;
  }
  
  return {
    nftTier: tier,
    baseRate,
    stakingPeriod,
    longTermBonus,
    dailyRewards,
    totalRewards,
    averageDailyReward: totalRewards / stakingPeriod
  };
}

/**
 * 현재까지 획득한 리워드 계산
 * @param {string} nftTier - NFT 등급 (LEGENDARY, EPIC, RARE, COMMON)
 * @param {Date|string} stakingStartDate - 스테이킹 시작 날짜
 * @param {Date|string} currentDate - 현재 날짜 (기본값: 현재 시간)
 * @param {number} stakingPeriod - 스테이킹 총 기간(일)
 * @returns {object} 현재까지 획득한 리워드 정보
 */
export function calculateEarnedRewards(nftTier, stakingStartDate, currentDate = new Date(), stakingPeriod) {
  // 날짜 객체로 변환
  const startDate = new Date(stakingStartDate);
  const now = new Date(currentDate);
  
  // 경과 일수 계산 (소수점 포함)
  const elapsedMilliseconds = now - startDate;
  const elapsedDays = elapsedMilliseconds / (1000 * 60 * 60 * 24);
  
  // 스테이킹 기간보다 많이 경과하지 않도록 제한
  const cappedElapsedDays = Math.min(elapsedDays, stakingPeriod);
  
  // 대소문자 처리, 유효하지 않은 등급은 COMMON으로 기본 설정
  const tier = standardizeTier(nftTier);
  const baseRate = REWARD_RATES[tier] || REWARD_RATES.COMMON;
  
  // 장기 스테이킹 보너스 적용
  const longTermBonus = getLongTermBonus(stakingPeriod);
  
  // 일별 보상 계산
  let earnedRewards = 0;
  const fullDaysElapsed = Math.floor(cappedElapsedDays);
  
  // 전체 일수에 대한 보상 계산
  for (let day = 1; day <= fullDaysElapsed; day++) {
    // 현재 일자의 초기 스파이크 보너스
    const initialBonus = getInitialBonus(day);
    
    // 초기 스파이크 보너스와 장기 스테이킹 보너스 중 더 큰 값 적용
    const appliedBonus = Math.max(initialBonus, longTermBonus);
    
    // 해당 일의 보상 계산
    const dailyReward = baseRate * appliedBonus;
    earnedRewards += dailyReward;
  }
  
  // 부분 날짜에 대한 보상 계산 (마지막 날의 부분)
  const partialDay = cappedElapsedDays - fullDaysElapsed;
  if (partialDay > 0) {
    const day = fullDaysElapsed + 1;
    const initialBonus = getInitialBonus(day);
    const appliedBonus = Math.max(initialBonus, longTermBonus);
    const dailyReward = baseRate * appliedBonus;
    earnedRewards += dailyReward * partialDay;
  }
  
  // 진행률 계산
  const progressPercentage = (cappedElapsedDays / stakingPeriod) * 100;
  
  return {
    nftTier: tier,
    baseRate,
    stakingPeriod,
    elapsedDays: cappedElapsedDays,
    progressPercentage,
    earnedRewards,
    remainingRewards: calculateEstimatedRewards(tier, stakingPeriod).totalRewards - earnedRewards
  };
}

/**
 * 언스테이킹 시 페널티 계산
 * @param {string} nftTier - NFT 등급
 * @param {Date|string} stakingStartDate - 스테이킹 시작 날짜
 * @param {Date|string} unstakingDate - 언스테이킹 요청 날짜
 * @param {number} stakingPeriod - 원래 스테이킹 계약 기간(일)
 * @returns {object} 언스테이킹 페널티 정보
 */
export function calculateUnstakingPenalty(nftTier, stakingStartDate, unstakingDate = new Date(), stakingPeriod) {
  // 날짜 객체로 변환
  const startDate = new Date(stakingStartDate);
  const releaseDate = new Date(startDate);
  releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
  const unstakeDate = new Date(unstakingDate);
  
  // 계약 종료일 이후 언스테이킹 시 페널티 없음
  if (unstakeDate >= releaseDate) {
    return {
      isPremature: false,
      earnedRewards: calculateEarnedRewards(nftTier, stakingStartDate, unstakeDate, stakingPeriod).earnedRewards,
      penaltyAmount: 0,
      penaltyPercentage: 0,
      finalReward: calculateEarnedRewards(nftTier, stakingStartDate, unstakeDate, stakingPeriod).earnedRewards
    };
  }
  
  // 조기 언스테이킹으로 판단
  // 현재까지 획득한 리워드 계산
  const earned = calculateEarnedRewards(nftTier, stakingStartDate, unstakeDate, stakingPeriod);
  
  // 페널티 계산 - 경과 시간에 따라 차등 적용
  let penaltyPercentage = 0;
  const progressPercentage = earned.progressPercentage;
  
  if (progressPercentage < 30) {
    // 30% 미만 진행 시 50% 페널티
    penaltyPercentage = 50;
  } else if (progressPercentage < 60) {
    // 30-60% 진행 시 30% 페널티
    penaltyPercentage = 30;
  } else if (progressPercentage < 90) {
    // 60-90% 진행 시 15% 페널티
    penaltyPercentage = 15;
  } else {
    // 90% 이상 진행 시 5% 페널티
    penaltyPercentage = 5;
  }
  
  const penaltyAmount = (earned.earnedRewards * penaltyPercentage) / 100;
  const finalReward = earned.earnedRewards - penaltyAmount;
  
  return {
    isPremature: true,
    earnedRewards: earned.earnedRewards,
    penaltyAmount,
    penaltyPercentage,
    finalReward
  };
}