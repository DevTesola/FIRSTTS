/**
 * NFT 스테이킹 프로그램의 상수 정의
 */

// Program ID
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

// Seeds for PDAs
const POOL_SEED = Buffer.from([112, 111, 111, 108]); // "pool"
const STAKE_SEED = Buffer.from([115, 116, 97, 107, 101]); // "stake"
const ESCROW_SEED = Buffer.from([101, 115, 99, 114, 111, 119]); // "escrow"
const USER_STAKING_SEED = Buffer.from([117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103]); // "user_staking"
const SOCIAL_SEED = Buffer.from([115, 111, 99, 105, 97, 108]); // "social"
const PROOF_SEED = Buffer.from([112, 114, 111, 111, 102]); // "proof"
const VOTE_SEED = Buffer.from([118, 111, 116, 101]); // "vote"

// NFT Tiers
const NFT_TIERS = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3
};

// Staking Periods (days)
const STAKING_PERIODS = {
  SHORT: 7,
  MEDIUM: 30,
  LONG: 60,
  EXTENDED: 90
};

// Social Activity Types
const SOCIAL_ACTIVITY_TYPES = {
  TWITTER: 0,
  TELEGRAM: 1,
  DISCORD: 2
};

// Discriminators (first 8 bytes of SHA256 hash of the instruction name)
// These are used to identify the account type when parsing account data
const DISCRIMINATORS = {
  POOL_STATE: Buffer.from([4, 146, 216, 218, 165, 66, 244, 30]),
  STAKE_INFO: Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]),
  USER_STAKING_INFO: Buffer.from([200, 93, 190, 77, 226, 132, 111, 181]),
  PROPOSAL: Buffer.from([28, 110, 127, 144, 48, 40, 151, 174]),
  VOTE: Buffer.from([213, 157, 193, 142, 228, 56, 248, 150]),
  GOVERNANCE_SETTINGS: Buffer.from([10, 231, 7, 225, 242, 111, 48, 79]),
  SOCIAL_VERIFIER: Buffer.from([175, 119, 64, 163, 18, 112, 201, 161]),
  USER_SOCIAL_ACTIVITY: Buffer.from([198, 23, 155, 219, 173, 188, 238, 173]),
  SOCIAL_ACTIVITY_PROOF: Buffer.from([211, 16, 96, 201, 152, 47, 97, 219]),
  MEME_ACCOUNT: Buffer.from([120, 82, 76, 134, 93, 115, 244, 62]),
  MEME_VOTE: Buffer.from([49, 132, 89, 223, 111, 47, 218, 156])
};

// Reward multipliers and bonuses
const REWARD_MULTIPLIERS = {
  COMMON: 100,       // 1.0x
  RARE: 200,         // 2.0x
  EPIC: 400,         // 4.0x
  LEGENDARY: 800     // 8.0x
};

const STAKING_PERIOD_BONUS = 20; // 20% bonus for staking period >= 30 days

// Governance constants
const GOVERNANCE_CONSTANTS = {
  DEFAULT_VOTING_DELAY: 86400,      // 1 day in seconds
  DEFAULT_VOTING_PERIOD: 604800,    // 7 days in seconds
  DEFAULT_PROPOSAL_THRESHOLD: 10,   // Minimum voting power to create a proposal
  DEFAULT_QUORUM: 100,              // Minimum votes for a proposal to be valid
  DEFAULT_APPROVE_THRESHOLD: 51,    // Minimum "for" percentage to pass (51%)
  DEFAULT_TIMELOCK_DELAY: 86400     // 1 day timelock after approval
};

// Social activity constants
const SOCIAL_CONSTANTS = {
  DEFAULT_TWITTER_REWARD: 5,      // Tokens rewarded for Twitter activity
  DEFAULT_TELEGRAM_REWARD: 3,     // Tokens rewarded for Telegram activity
  DEFAULT_DISCORD_REWARD: 4,      // Tokens rewarded for Discord activity
  DEFAULT_COOLDOWN_PERIOD: 86400, // 24 hours cooldown between rewards
  DEFAULT_MAX_REWARDS_PER_DAY: 3  // Maximum rewards claimable per day
};

// For CommonJS compatibility
export {
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