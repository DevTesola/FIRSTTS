// reward-calculator-tests.js
// TESOLA 토큰 보상 계산기 테스트

const {
    REWARD_RATES,
    getInitialBonus,
    getLongTermBonus,
    calculateEstimatedRewards,
    calculateEarnedRewards,
    calculateUnstakingPenalty
  } = require('./reward-calculator');
  
  // 테스트 유틸리티 함수
  function runTest(testName, actual, expected) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
    
    if (!passed) {
      console.log('  Expected:', expected);
      console.log('  Actual:', actual);
    }
    
    return passed;
  }
  
  // 초기 보너스 테스트
  console.log('🔍 초기 스파이크 보너스 테스트:');
  runTest('첫 7일 동안 2배 보너스', getInitialBonus(1), 2.0);
  runTest('첫 7일 동안 2배 보너스', getInitialBonus(7), 2.0);
  runTest('8-14일 동안 1.75배 보너스', getInitialBonus(8), 1.75);
  runTest('8-14일 동안 1.75배 보너스', getInitialBonus(14), 1.75);
  runTest('15-30일 동안 1.5배 보너스', getInitialBonus(15), 1.5);
  runTest('15-30일 동안 1.5배 보너스', getInitialBonus(30), 1.5);
  runTest('31일 이후 보너스 없음', getInitialBonus(31), 1.0);
  
  // 장기 스테이킹 보너스 테스트
  console.log('\n🔍 장기 스테이킹 보너스 테스트:');
  runTest('30일 미만 보너스 없음', getLongTermBonus(29), 1.0);
  runTest('30일 이상 20% 보너스', getLongTermBonus(30), 1.2);
  runTest('90일 이상 40% 보너스', getLongTermBonus(90), 1.4);
  runTest('180일 이상 70% 보너스', getLongTermBonus(180), 1.7);
  runTest('365일 이상 100% 보너스', getLongTermBonus(365), 2.0);
  
  // 예상 리워드 계산 테스트
  console.log('\n🔍 예상 리워드 계산 테스트:');
  
  // 30일 스테이킹에 대한 리워드 계산 테스트 (등급별)
  const legendaryRewards30 = calculateEstimatedRewards('LEGENDARY', 30);
  const epicRewards30 = calculateEstimatedRewards('EPIC', 30);
  const rareRewards30 = calculateEstimatedRewards('RARE', 30);
  const commonRewards30 = calculateEstimatedRewards('COMMON', 30);
  
  console.log('📊 30일 스테이킹 시 총 리워드:');
  console.log(`  레전더리: ${legendaryRewards30.totalRewards.toFixed(2)} TESOLA`);
  console.log(`  에픽: ${epicRewards30.totalRewards.toFixed(2)} TESOLA`);
  console.log(`  레어: ${rareRewards30.totalRewards.toFixed(2)} TESOLA`);
  console.log(`  커먼: ${commonRewards30.totalRewards.toFixed(2)} TESOLA`);
  
  // 장기 스테이킹에 대한 보너스 효과 확인
  const legendary365 = calculateEstimatedRewards('LEGENDARY', 365);
  console.log('\n📊 1년(365일) 레전더리 스테이킹:');
  console.log(`  기본 보상률: ${legendary365.baseRate} TESOLA/일`);
  console.log(`  장기 스테이킹 보너스: ${legendary365.longTermBonus}배`);
  console.log(`  총 예상 리워드: ${legendary365.totalRewards.toFixed(2)} TESOLA`);
  console.log(`  평균 일일 리워드: ${legendary365.averageDailyReward.toFixed(2)} TESOLA`);
  
  // 리워드 계획 테이블과 비교 - 레전더리 NFT (초기 7일 스파이크 확인용)
  const legendary7 = calculateEstimatedRewards('LEGENDARY', 7);
  console.log('\n📊 레전더리 NFT 7일 스테이킹 (초기 스파이크 기간):');
  console.log(`  총 리워드: ${legendary7.totalRewards.toFixed(2)} TESOLA`);
  console.log(`  일평균: ${legendary7.totalRewards / 7} TESOLA (기대값: 일일 400 TESOLA)`);
  
  // 획득 리워드 계산 테스트
  console.log('\n🔍 획득 리워드 계산 테스트:');
  
  // 30일 스테이킹 중 15일 경과 시
  const today = new Date();
  const fifteenDaysAgo = new Date(today);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  
  const earned15of30 = calculateEarnedRewards('LEGENDARY', fifteenDaysAgo, today, 30);
  console.log('📊 레전더리 NFT 30일 스테이킹 중 15일 경과:');
  console.log(`  진행률: ${earned15of30.progressPercentage.toFixed(2)}%`);
  console.log(`  획득 리워드: ${earned15of30.earnedRewards.toFixed(2)} TESOLA`);
  console.log(`  남은 리워드: ${earned15of30.remainingRewards.toFixed(2)} TESOLA`);
  
  // 조기 언스테이킹 페널티 테스트
  console.log('\n🔍 조기 언스테이킹 페널티 테스트:');
  
  const penalty15of30 = calculateUnstakingPenalty('LEGENDARY', fifteenDaysAgo, today, 30);
  console.log('📊 레전더리 NFT 30일 스테이킹 중 15일 차에 언스테이킹:');
  console.log(`  획득 리워드: ${penalty15of30.earnedRewards.toFixed(2)} TESOLA`);
  console.log(`  페널티: ${penalty15of30.penaltyPercentage}% (${penalty15of30.penaltyAmount.toFixed(2)} TESOLA)`);
  console.log(`  최종 지급: ${penalty15of30.finalReward.toFixed(2)} TESOLA`);
  
  // 정상 언스테이킹 테스트
  const thirtyOneDaysAgo = new Date(today);
  thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
  const penalty31of30 = calculateUnstakingPenalty('LEGENDARY', thirtyOneDaysAgo, today, 30);
  
  console.log('\n📊 레전더리 NFT 30일 스테이킹 완료 후 언스테이킹:');
  console.log(`  조기 언스테이킹 여부: ${penalty31of30.isPremature ? '예' : '아니오'}`);
  console.log(`  획득 리워드: ${penalty31of30.earnedRewards.toFixed(2)} TESOLA`);
  console.log(`  페널티: ${penalty31of30.penaltyPercentage}% (${penalty31of30.penaltyAmount.toFixed(2)} TESOLA)`);
  console.log(`  최종 지급: ${penalty31of30.finalReward.toFixed(2)} TESOLA`);
  
  // 테스트 결과 요약
  console.log('\n====== 테스트 결과 요약 ======');
  console.log('초기 스파이크 보너스: 첫 7일 2배, 8-14일 1.75배, 15-30일 1.5배');
  console.log('장기 스테이킹 보너스: 30일+ 1.2배, 90일+ 1.4배, 180일+ 1.7배, 365일+ 2.0배');
  console.log('조기 언스테이킹 페널티: 진행률에 따라 5-50% 차등 적용');
  console.log('==============================');