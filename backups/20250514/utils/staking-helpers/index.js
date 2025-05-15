/**
 * NFT 스테이킹 유틸리티 모듈
 * 모든 스테이킹 관련 헬퍼 함수 및 상수를 내보냅니다.
 */

// 에러 핸들링 유틸리티
const {
  getErrorMessage,
  handleTransaction,
  ERROR_CODES
} = require('./error-handler');

// 향상된 스테이킹 특화 에러 핸들링
const {
  getStakingErrorMessage,
  handleStakingTransaction,
  STAKING_ERROR_CODES,
  COMBINED_ERROR_CODES
} = require('./staking-error-handler');

// 통합 스테이킹 유틸리티
const {
  prepareIdlForAnchor,
  createAnchorProgram,
  deriveStakingAddresses,
  setupStakingAccounts,
  stakeNftUnified
} = require('./unified-staking');

// 거버넌스 유틸리티
const {
  calculateVotingPower,
  canUserVote,
  getProposalVotingStatus,
  getUserGovernanceSummary
} = require('./governance-helpers');

// 소셜 인증 유틸리티
const {
  getSocialActivityStatus,
  canClaimSocialReward,
  createSocialVerificationMessage,
  prepareSocialActivityInitData
} = require('./social-verification-helpers');

// 상수
const {
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
  SOCIAL_ACTIVITY_TYPES,
  DISCRIMINATORS,
  REWARD_MULTIPLIERS,
  STAKING_PERIOD_BONUS,
  GOVERNANCE_CONSTANTS,
  SOCIAL_CONSTANTS
} = require('./constants');

// 모든 유틸리티 및 상수 내보내기
module.exports = {
  // 기본 에러 핸들링
  getErrorMessage,
  handleTransaction,
  ERROR_CODES,

  // 향상된 스테이킹 특화 에러 핸들링
  getStakingErrorMessage,
  handleStakingTransaction,
  STAKING_ERROR_CODES,
  COMBINED_ERROR_CODES,

  // 통합 스테이킹 유틸리티
  prepareIdlForAnchor,
  createAnchorProgram,
  deriveStakingAddresses,
  setupStakingAccounts,
  stakeNftUnified,

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
  SOCIAL_ACTIVITY_TYPES,
  DISCRIMINATORS,
  REWARD_MULTIPLIERS,
  STAKING_PERIOD_BONUS,
  GOVERNANCE_CONSTANTS,
  SOCIAL_CONSTANTS
};