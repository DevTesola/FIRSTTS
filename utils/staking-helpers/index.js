/**
 * NFT 스테이킹 유틸리티 모듈
 * 모든 스테이킹 관련 헬퍼 함수 및 상수를 내보냅니다.
 */

// 에러 핸들링 유틸리티
import { 
  getErrorMessage, 
  handleTransaction, 
  ERROR_CODES 
} from './error-handler.js';

// 거버넌스 유틸리티
import {
  calculateVotingPower,
  canUserVote,
  getProposalVotingStatus,
  getUserGovernanceSummary
} from './governance-helpers.js';

// 소셜 인증 유틸리티
import {
  getSocialActivityStatus,
  canClaimSocialReward,
  createSocialVerificationMessage,
  prepareSocialActivityInitData,
  SOCIAL_ACTIVITY_TYPES,
  SOCIAL_SEED
} from './social-verification-helpers.js';

// 상수
import {
  PROGRAM_ID,
  POOL_SEED,
  STAKE_SEED,
  ESCROW_SEED,
  USER_STAKING_SEED,
  PROOF_SEED,
  VOTE_SEED,
  NFT_TIERS,
  STAKING_PERIODS,
  DISCRIMINATORS,
  REWARD_MULTIPLIERS,
  STAKING_PERIOD_BONUS,
  GOVERNANCE_CONSTANTS,
  SOCIAL_CONSTANTS
} from './constants.js';

// 모든 유틸리티 및 상수 내보내기
export {
  // 에러 핸들링
  getErrorMessage,
  handleTransaction,
  ERROR_CODES,
  
  // 거버넌스
  calculateVotingPower,
  canUserVote,
  getProposalVotingStatus,
  getUserGovernanceSummary,
  
  // 소셜 인증
  getSocialActivityStatus,
  canClaimSocialReward,
  createSocialVerificationMessage,
  prepareSocialActivityInitData,
  SOCIAL_ACTIVITY_TYPES,
  
  // 상수
  PROGRAM_ID,
  POOL_SEED,
  STAKE_SEED,
  ESCROW_SEED,
  USER_STAKING_SEED,
  SOCIAL_SEED,
  PROOF_SEED,
  VOTE_SEED,
  NFT_TIERS,
  STAKING_PERIODS,
  DISCRIMINATORS,
  REWARD_MULTIPLIERS,
  STAKING_PERIOD_BONUS,
  GOVERNANCE_CONSTANTS,
  SOCIAL_CONSTANTS
};