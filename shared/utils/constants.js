/**
 * 공통 상수 정의 파일
 * NFT 스테이킹 기능에 필요한 상수값들
 */

// 프로그램 ID
const PROGRAM_ID = "4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs";

// PDA 시드 
const STAKE_SEED = "stake_info_v2";
const ESCROW_SEED = "escrow_auth";
const USER_STAKING_SEED = "user_staking";

// NFT 등급에 대한 상수값
const NFT_TIERS = {
  "COMMON": 0,
  "RARE": 1,
  "EPIC": 2,
  "LEGENDARY": 3
};

// 스테이킹 기간에 대한 상수값
const STAKING_PERIODS = {
  "SHORT": 7,    // 7일
  "MEDIUM": 30,  // 30일
  "LONG": 90,    // 90일
  "EXTRA": 180,  // 180일
  "MAX": 365     // 365일
};

module.exports = {
  PROGRAM_ID,
  STAKE_SEED,
  ESCROW_SEED,
  USER_STAKING_SEED,
  NFT_TIERS,
  STAKING_PERIODS
};