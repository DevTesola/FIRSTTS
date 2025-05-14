/**
 * Solana 프로그램 파생 주소(PDA) 생성 유틸리티
 * PDA 파생에 필요한 오류 처리 및 검증 기능을 포함합니다.
 */

const { PublicKey } = require('@solana/web3.js');
const { PROGRAM_ID } = require('../constants/program-ids');
const {
  POOL_SEED,
  STAKE_SEED,
  ESCROW_SEED,
  USER_STAKING_SEED,
  SOCIAL_SEED,
  PROOF_SEED,
  VOTE_SEED,
  REWARD_VAULT_AUTHORITY_SEED
} = require('../constants/seeds');

/**
 * PDA 생성 시 오류를 처리하는 헬퍼 함수
 *
 * @param {Function} pdaFunction - PDA를 생성하는 함수
 * @param {Array} args - PDA 함수에 전달할 인자
 * @param {string} pdaType - 생성할 PDA 유형 (에러 메시지용)
 * @returns {[PublicKey, number]} PDA 주소와 범프 값
 * @throws {Error} PDA 생성 실패 시 자세한 오류 정보가 포함된 예외
 */
function safelyFindPda(pdaFunction, args, pdaType) {
  try {
    if (!pdaFunction || typeof pdaFunction !== 'function') {
      throw new Error(`Invalid PDA function for ${pdaType}`);
    }

    return pdaFunction(...args);
  } catch (error) {
    // 더 자세한 오류 메시지 생성
    const argsStr = args.map(arg => {
      if (arg instanceof PublicKey) return arg.toString();
      if (arg instanceof Buffer) return `Buffer(${arg.length})`;
      return String(arg);
    }).join(', ');

    const enhancedError = new Error(
      `Failed to derive ${pdaType} PDA: ${error.message}. ` +
      `Args: [${argsStr}]`
    );

    // 원본 오류의 스택 추적 보존
    enhancedError.stack = error.stack;
    enhancedError.cause = error;
    enhancedError.code = 'PDA_DERIVATION_ERROR';
    enhancedError.pdaType = pdaType;

    throw enhancedError;
  }
}

/**
 * 풀 상태 PDA 생성
 *
 * @returns {[PublicKey, number]} 풀 상태 PDA 및 범프 값
 */
function findPoolStatePDA() {
  return safelyFindPda(
    () => PublicKey.findProgramAddressSync(
      [POOL_SEED],
      new PublicKey(PROGRAM_ID)
    ),
    [],
    'Pool State'
  );
}

/**
 * 스테이크 정보 PDA 생성
 *
 * @param {PublicKey|string} nftMint - NFT 민트 주소
 * @returns {[PublicKey, number]} 스테이크 정보 PDA 및 범프 값
 */
function findStakeInfoPDA(nftMint) {
  if (!nftMint) {
    throw new Error('NFT mint address is required for stake info PDA');
  }

  return safelyFindPda(
    (mintKey) => {
      const mintPubkey = typeof mintKey === 'string' ? new PublicKey(mintKey) : mintKey;
      return PublicKey.findProgramAddressSync(
        [STAKE_SEED, mintPubkey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      );
    },
    [nftMint],
    'Stake Info'
  );
}

/**
 * 에스크로 권한 PDA 생성
 *
 * @param {PublicKey|string} nftMint - NFT 민트 주소
 * @returns {[PublicKey, number]} 에스크로 권한 PDA 및 범프 값
 */
function findEscrowAuthorityPDA(nftMint) {
  if (!nftMint) {
    throw new Error('NFT mint address is required for escrow authority PDA');
  }

  return safelyFindPda(
    (mintKey) => {
      const mintPubkey = typeof mintKey === 'string' ? new PublicKey(mintKey) : mintKey;
      return PublicKey.findProgramAddressSync(
        [ESCROW_SEED, mintPubkey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      );
    },
    [nftMint],
    'Escrow Authority'
  );
}

/**
 * 사용자 스테이킹 정보 PDA 생성
 *
 * @param {PublicKey|string} userWallet - 사용자 지갑 주소
 * @returns {[PublicKey, number]} 사용자 스테이킹 정보 PDA 및 범프 값
 */
function findUserStakingInfoPDA(userWallet) {
  if (!userWallet) {
    throw new Error('User wallet address is required for user staking info PDA');
  }

  return safelyFindPda(
    (walletKey) => {
      const walletPubkey = typeof walletKey === 'string' ? new PublicKey(walletKey) : walletKey;
      return PublicKey.findProgramAddressSync(
        [USER_STAKING_SEED, walletPubkey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      );
    },
    [userWallet],
    'User Staking Info'
  );
}

/**
 * 보상 볼트 권한 PDA 생성
 *
 * @returns {[PublicKey, number]} 보상 볼트 권한 PDA 및 범프 값
 */
function findRewardVaultAuthorityPDA() {
  return safelyFindPda(
    () => PublicKey.findProgramAddressSync(
      [REWARD_VAULT_AUTHORITY_SEED],
      new PublicKey(PROGRAM_ID)
    ),
    [],
    'Reward Vault Authority'
  );
}

/**
 * 소셜 활동 PDA 생성
 *
 * @param {PublicKey|string} userWallet - 사용자 지갑 주소
 * @returns {[PublicKey, number]} 소셜 활동 PDA 및 범프 값
 */
function findSocialActivityPDA(userWallet) {
  if (!userWallet) {
    throw new Error('User wallet address is required for social activity PDA');
  }

  return safelyFindPda(
    (walletKey) => {
      const walletPubkey = typeof walletKey === 'string' ? new PublicKey(walletKey) : walletKey;
      return PublicKey.findProgramAddressSync(
        [SOCIAL_SEED, walletPubkey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      );
    },
    [userWallet],
    'Social Activity'
  );
}

/**
 * 활동 증명 PDA 생성
 *
 * @param {PublicKey|string} userWallet - 사용자 지갑 주소
 * @param {string} activityId - 활동 ID
 * @returns {[PublicKey, number]} 활동 증명 PDA 및 범프 값
 */
function findActivityProofPDA(userWallet, activityId) {
  if (!userWallet) {
    throw new Error('User wallet address is required for activity proof PDA');
  }
  if (!activityId) {
    throw new Error('Activity ID is required for activity proof PDA');
  }

  return safelyFindPda(
    (walletKey, activity) => {
      const walletPubkey = typeof walletKey === 'string' ? new PublicKey(walletKey) : walletKey;
      return PublicKey.findProgramAddressSync(
        [PROOF_SEED, walletPubkey.toBuffer(), Buffer.from(activity)],
        new PublicKey(PROGRAM_ID)
      );
    },
    [userWallet, activityId],
    'Activity Proof'
  );
}

/**
 * 투표 PDA 생성
 *
 * @param {PublicKey|string} userWallet - 사용자 지갑 주소
 * @param {PublicKey|string} proposalKey - 제안 계정 주소
 * @returns {[PublicKey, number]} 투표 PDA 및 범프 값
 */
function findVotePDA(userWallet, proposalKey) {
  if (!userWallet) {
    throw new Error('User wallet address is required for vote PDA');
  }
  if (!proposalKey) {
    throw new Error('Proposal key is required for vote PDA');
  }

  return safelyFindPda(
    (walletKey, proposal) => {
      const walletPubkey = typeof walletKey === 'string' ? new PublicKey(walletKey) : walletKey;
      const proposalPubkey = typeof proposal === 'string' ? new PublicKey(proposal) : proposal;
      return PublicKey.findProgramAddressSync(
        [VOTE_SEED, walletPubkey.toBuffer(), proposalPubkey.toBuffer()],
        new PublicKey(PROGRAM_ID)
      );
    },
    [userWallet, proposalKey],
    'Vote'
  );
}

module.exports = {
  findPoolStatePDA,
  findStakeInfoPDA,
  findEscrowAuthorityPDA,
  findUserStakingInfoPDA,
  findRewardVaultAuthorityPDA,
  findSocialActivityPDA,
  findActivityProofPDA,
  findVotePDA
};