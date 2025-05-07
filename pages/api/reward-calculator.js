// reward-calculator.js - 중앙화된 스테이킹 유틸리티로 리디렉션
import {
  standardizeTier,
  calculateEstimatedRewards,
  calculateEarnedRewards,
  calculateUnstakingPenalty
} from '../../utils/staking';

// 하위 호환성을 위해 기존 함수들 다시 내보내기
export {
  standardizeTier,
  calculateEstimatedRewards,
  calculateEarnedRewards,
  calculateUnstakingPenalty
};