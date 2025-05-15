/**
 * 온체인 리워드 스테이킹 모듈
 * 
 * 이 모듈은 완전 온체인 방식의 보상 지급 시스템을 지원합니다:
 * 1. 보상 계산을 온체인에서 직접 수행
 * 2. 보상 토큰을 온체인에서 직접 전송
 * 3. 데이터베이스와 별도로 온체인 상태만 확인 가능
 */

const { web3, BN, Program } = require('@project-serum/anchor');
const { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress
} = require('@solana/spl-token');
const { PublicKey, Transaction } = web3;

// 로컬 유틸리티 가져오기
const { PROGRAM_ID } = require('../../constants/program-ids');
const { findPoolStatePDA, findStakeInfoPDA, findRewardVaultAuthorityPDA } = require('../pda');
const { getErrorMessage } = require('../error-handler');
const { prepareIdlForAnchor, safeInitializeProgram } = require('../idl-helper');
const { INSTRUCTION_DISCRIMINATORS } = require('../anchor-helpers');

/**
 * 보상 청구에 필요한 모든 주소와 PDA 계산
 * 
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @returns {Promise<Object>} 계정 주소 정보
 */
async function deriveRewardClaimAddresses(walletPubkey, mintPubkey) {
  const programId = new PublicKey(PROGRAM_ID);
  
  // 풀 상태 주소 계산
  const [poolStateAddress] = findPoolStatePDA();
  
  // 스테이크 정보 PDA
  const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
  
  // 리워드 볼트 권한 PDA
  const [rewardVaultAuthority] = findRewardVaultAuthorityPDA();
  
  return {
    programId,
    poolStateAddress,
    stakeInfoPDA,
    rewardVaultAuthority
  };
}

/**
 * 리워드 토큰 계정 주소 및 상태 확인
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} rewardMint - 리워드 토큰 민트 주소
 * @returns {Promise<Object>} 토큰 계정 정보 및 상태
 */
async function verifyRewardTokenAccount(connection, walletPubkey, rewardMint) {
  try {
    // 사용자 리워드 토큰 계정 주소 계산
    const userTokenAccount = await getAssociatedTokenAddress(
      rewardMint,
      walletPubkey
    );
    
    // 계정 상태 확인
    let accountExists = false;
    let balance = 0;
    
    try {
      const accountInfo = await connection.getAccountInfo(userTokenAccount);
      accountExists = accountInfo !== null;
      
      if (accountExists) {
        const balanceInfo = await connection.getTokenAccountBalance(userTokenAccount);
        balance = Number(balanceInfo.value.uiAmount);
      }
    } catch (err) {
      console.log("토큰 계정 확인 중 오류:", err.message);
    }
    
    return {
      address: userTokenAccount,
      exists: accountExists,
      balance
    };
  } catch (err) {
    console.error("리워드 토큰 계정 확인 오류:", err);
    throw err;
  }
}

/**
 * 온체인에서 직접 리워드 청구 트랜잭션 생성
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {PublicKey} userTokenAccount - 사용자 리워드 토큰 계정
 * @returns {Promise<Object>} 트랜잭션 및 계정 정보
 */
async function prepareOnChainRewardClaimTransaction(
  connection, 
  provider, 
  walletPubkey, 
  mintPubkey, 
  userTokenAccount
) {
  try {
    console.log("온체인 리워드 청구 트랜잭션 준비...");
    
    // 1. 필요한 모든 주소 계산
    const addresses = await deriveRewardClaimAddresses(walletPubkey, mintPubkey);
    
    // 2. 풀 상태 가져오기 (리워드 볼트 주소 확인용)
    const idl = await prepareIdlForAnchor();
    const program = safeInitializeProgram(idl, provider);
    
    const poolState = await program.account.poolState.fetch(addresses.poolStateAddress);
    const rewardVault = poolState.rewardVault;
    
    // 3. claim_rewards 명령어 데이터 생성
    const instructionData = INSTRUCTION_DISCRIMINATORS.CLAIM_REWARDS;
    
    // 4. 계정 메타 데이터 구성 - 정확한 순서가 중요
    const keys = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },                 // user
      { pubkey: mintPubkey, isSigner: false, isWritable: false },                // nft_mint
      { pubkey: addresses.stakeInfoPDA, isSigner: false, isWritable: true },      // stake_info
      { pubkey: addresses.poolStateAddress, isSigner: false, isWritable: true },  // pool_state
      { pubkey: rewardVault, isSigner: false, isWritable: true },                 // reward_vault
      { pubkey: addresses.rewardVaultAuthority, isSigner: false, isWritable: false }, // reward_vault_authority
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },            // user_token_account
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }            // token_program
    ];
    
    // 5. 트랜잭션 명령어 생성
    const claimInstruction = new web3.TransactionInstruction({
      programId: addresses.programId,
      keys: keys,
      data: instructionData
    });
    
    // 6. 트랜잭션 생성
    const claimTx = new Transaction();
    claimTx.add(claimInstruction);
    
    // 7. 블록해시 설정
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    claimTx.recentBlockhash = blockhash;
    claimTx.feePayer = walletPubkey;
    
    // 8. 트랜잭션 시뮬레이션 (선택사항)
    let simulationSuccess = false;
    let simulationError = null;
    let estimatedRewards = null;
    
    try {
      console.log("리워드 청구 트랜잭션 시뮬레이션 실행...");
      const simulation = await connection.simulateTransaction(claimTx);
      
      if (simulation.value.err) {
        console.error("시뮬레이션 오류:", simulation.value.err);
        simulationError = simulation.value.err;
      } else {
        console.log("트랜잭션 시뮬레이션 성공");
        simulationSuccess = true;
        
        // 로그에서 리워드 금액 추출 시도
        try {
          const logMessages = simulation.value.logs;
          if (logMessages) {
            const rewardPattern = /claimed (\d+) reward tokens/;
            for (const log of logMessages) {
              const match = log.match(rewardPattern);
              if (match && match[1]) {
                estimatedRewards = parseInt(match[1], 10);
                break;
              }
            }
          }
        } catch (logErr) {
          console.error("리워드 금액 추출 오류:", logErr);
        }
      }
    } catch (simErr) {
      console.error("시뮬레이션 예외:", simErr);
      simulationError = simErr;
    }
    
    // 9. 직렬화된 청구 트랜잭션
    const serializedClaimTx = claimTx.serialize({ requireAllSignatures: false }).toString('base64');
    
    // 10. 응답 구성
    return {
      success: true,
      transaction: serializedClaimTx,
      accounts: {
        poolState: addresses.poolStateAddress.toString(),
        stakeInfo: addresses.stakeInfoPDA.toString(),
        rewardVaultAuthority: addresses.rewardVaultAuthority.toString(),
        rewardVault: rewardVault.toString(),
        userTokenAccount: userTokenAccount.toString()
      },
      simulation: {
        success: simulationSuccess,
        error: simulationError
      },
      estimatedRewards: estimatedRewards
    };
  } catch (err) {
    console.error("리워드 청구 트랜잭션 준비 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err),
      rawError: err
    };
  }
}

/**
 * 온체인에서 직접 특정 NFT의 예상 리워드 계산
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @returns {Promise<Object>} 계산된 리워드 정보
 */
async function calculateOnChainRewards(
  connection,
  provider,
  walletPubkey,
  mintPubkey
) {
  try {
    console.log("온체인 리워드 계산...");
    
    // 1. 필요한 모든 주소 계산
    const addresses = await deriveRewardClaimAddresses(walletPubkey, mintPubkey);
    
    // 2. 계정 데이터 가져오기
    const idl = await prepareIdlForAnchor();
    const program = safeInitializeProgram(idl, provider);
    
    const poolState = await program.account.poolState.fetch(addresses.poolStateAddress);
    const stakeInfo = await program.account.stakeInfo.fetch(addresses.stakeInfoPDA);
    
    // 3. 리워드 계산
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastClaim = now - stakeInfo.lastClaimTime;
    const secondsInDay = 24 * 60 * 60;
    const daysElapsed = Math.floor(timeSinceLastClaim / secondsInDay);
    
    // 3.1 스테이킹되어 있지 않거나 하루가 지나지 않은 경우
    if (!stakeInfo.isStaked || daysElapsed === 0) {
      return {
        success: true,
        rewards: 0,
        daysElapsed: 0,
        canClaim: false,
        lastClaimTime: stakeInfo.lastClaimTime,
        nextClaimTime: stakeInfo.lastClaimTime + secondsInDay,
        timeRemaining: Math.max(0, secondsInDay - timeSinceLastClaim)
      };
    }
    
    // 3.2 티어별 멀티플라이어 결정
    let tierMultiplier;
    switch (stakeInfo.tier) {
      case 0:
        tierMultiplier = poolState.commonMultiplier;
        break;
      case 1:
        tierMultiplier = poolState.rareMultiplier;
        break;
      case 2:
        tierMultiplier = poolState.epicMultiplier;
        break;
      case 3:
        tierMultiplier = poolState.legendaryMultiplier;
        break;
      default:
        tierMultiplier = poolState.commonMultiplier;
    }
    
    // 3.3 스테이킹 기간 보너스 적용
    const stakingPeriodBonus = stakeInfo.stakingPeriod >= 30 
      ? poolState.longStakingBonus 
      : 0;
    
    // 3.4 베이스 리워드 계산
    const bonusMultiplier = 100 + stakingPeriodBonus;
    const baseReward = poolState.rewardRate * tierMultiplier * daysElapsed * bonusMultiplier / 10000;
    
    // 3.5 복리 계산 (있는 경우)
    const compoundInterest = stakeInfo.accumulatedCompound > 0
      ? stakeInfo.accumulatedCompound * daysElapsed * 10 / 36500
      : 0;
    
    // 3.6 총 리워드 계산
    const totalReward = baseReward + compoundInterest;
    
    return {
      success: true,
      rewards: totalReward,
      daysElapsed,
      baseReward,
      compoundInterest,
      stakingPeriodBonus,
      tierMultiplier,
      stakingPeriod: stakeInfo.stakingPeriod,
      isAutoCompound: stakeInfo.autoCompound,
      accumulatedCompound: stakeInfo.accumulatedCompound,
      canClaim: daysElapsed > 0 && !stakeInfo.autoCompound,
      lastClaimTime: stakeInfo.lastClaimTime,
      nextClaimTime: stakeInfo.lastClaimTime + secondsInDay,
      timeRemaining: Math.max(0, secondsInDay - timeSinceLastClaim)
    };
  } catch (err) {
    console.error("온체인 리워드 계산 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err),
      rawError: err
    };
  }
}

/**
 * 사용자의 모든 스테이킹된 NFT와 리워드 가져오기
 * 
 * @param {Object} connection - Solana 연결 객체 
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @returns {Promise<Object>} 모든 스테이킹된 NFT 및 리워드 정보
 */
async function getAllOnChainStakedNFTs(
  connection,
  provider,
  walletPubkey
) {
  try {
    console.log("온체인에서 모든 스테이킹된 NFT 정보 가져오기...");
    
    // 1. 프로그램 초기화
    const idl = await prepareIdlForAnchor();
    const program = safeInitializeProgram(idl, provider);
    const programId = new PublicKey(PROGRAM_ID);
    
    // 2. 온체인에서 모든 StakeInfo 계정 가져오기
    // 2.1 필터 설정 - 소유자가 현재 사용자인 계정만 필터링
    const stakeInfoAccounts = await program.account.stakeInfo.all([
      {
        memcmp: {
          offset: 8, // 디스크리미네이터 이후 시작점
          bytes: walletPubkey.toBase58() // 소유자 필드 (첫 번째 필드는 소유자)
        }
      },
      {
        memcmp: {
          offset: 8 + 32 + 32 + 8 + 8 + 0, // is_staked 필드의 위치
          bytes: Buffer.from([1]).toString('base64') // is_staked가 true인 경우
        }
      }
    ]);
    
    console.log(`온체인에서 ${stakeInfoAccounts.length}개의 스테이킹된 NFT 찾음`);
    
    // 3. 각 NFT에 대한 리워드 계산
    const stakedNFTsWithRewards = await Promise.all(stakeInfoAccounts.map(async ({ account, publicKey }) => {
      const mintPubkey = account.mint;
      
      // 리워드 계산
      const rewardInfo = await calculateOnChainRewards(
        connection,
        provider,
        walletPubkey,
        mintPubkey
      );
      
      return {
        mint: mintPubkey.toString(),
        stakedAt: account.stakedAt,
        lastClaimTime: account.lastClaimTime,
        tier: account.tier,
        stakingPeriod: account.stakingPeriod,
        isAutoCompound: account.autoCompound,
        accumulatedCompound: account.accumulatedCompound,
        pendingRewards: rewardInfo.rewards,
        daysElapsed: rewardInfo.daysElapsed,
        canClaim: rewardInfo.canClaim,
        timeRemaining: rewardInfo.timeRemaining
      };
    }));
    
    return {
      success: true,
      stakedNFTs: stakedNFTsWithRewards,
      totalStakedCount: stakedNFTsWithRewards.length
    };
  } catch (err) {
    console.error("온체인 스테이킹 정보 조회 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err),
      rawError: err,
      stakedNFTs: []
    };
  }
}

module.exports = {
  deriveRewardClaimAddresses,
  verifyRewardTokenAccount,
  prepareOnChainRewardClaimTransaction,
  calculateOnChainRewards,
  getAllOnChainStakedNFTs
};