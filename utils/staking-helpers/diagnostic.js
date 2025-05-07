// utils/staking-helpers/diagnostic.js
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, STAKE_SEED, ESCROW_SEED, USER_STAKING_SEED, DISCRIMINATORS } from './constants';

/**
 * 스테이킹 진단 유틸리티
 * 온체인 계정 상태를 확인하고 문제를 진단합니다.
 */

/**
 * PDA 계정 정보를 가져와 진단합니다.
 * @param {Connection} connection - Solana 연결 객체
 * @param {string} mintAddress - NFT 민트 주소
 * @param {string} walletAddress - 지갑 주소
 * @returns {Promise<Object>} 진단 결과
 */
export async function diagnoseStakingAccount(connection, mintAddress, walletAddress) {
  try {
    let mintPubkey;
    let walletPubkey;
    
    try {
      mintPubkey = new PublicKey(mintAddress);
      walletPubkey = new PublicKey(walletAddress);
    } catch (err) {
      return {
        success: false,
        error: '유효하지 않은 주소 형식',
        details: err.message
      };
    }
    
    const programId = new PublicKey(PROGRAM_ID);
    
    // 1. stake_info PDA
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    // 2. escrow_authority PDA
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    // 3. user_staking_info PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    // 계정 정보 가져오기
    const [stakeInfoAccount, userStakingInfoAccount] = await Promise.all([
      connection.getAccountInfo(stakeInfoPDA),
      connection.getAccountInfo(userStakingInfoPDA)
    ]);
    
    // 계정 상태 확인
    const stakeInfoStatus = {
      exists: !!stakeInfoAccount,
      address: stakeInfoPDA.toString(),
      isOwnedByProgram: stakeInfoAccount ? stakeInfoAccount.owner.equals(programId) : false,
      data: stakeInfoAccount ? {
        size: stakeInfoAccount.data.length,
        discriminator: Array.from(stakeInfoAccount.data.slice(0, 8)),
        isCorrectDiscriminator: Buffer.from(stakeInfoAccount.data.slice(0, 8)).equals(DISCRIMINATORS.STAKE_INFO)
      } : null
    };
    
    const userStakingInfoStatus = {
      exists: !!userStakingInfoAccount,
      address: userStakingInfoPDA.toString(),
      isOwnedByProgram: userStakingInfoAccount ? userStakingInfoAccount.owner.equals(programId) : false,
      data: userStakingInfoAccount ? {
        size: userStakingInfoAccount.data.length,
        discriminator: Array.from(userStakingInfoAccount.data.slice(0, 8)),
        isCorrectDiscriminator: Buffer.from(userStakingInfoAccount.data.slice(0, 8)).equals(DISCRIMINATORS.USER_STAKING_INFO)
      } : null
    };
    
    // 문제 진단
    const issues = [];
    
    if (!stakeInfoStatus.exists) {
      issues.push({
        type: 'error',
        account: 'stake_info',
        message: 'stake_info 계정이 존재하지 않습니다. NFT가 스테이킹되지 않았거나 트랜잭션이 실패했을 수 있습니다.'
      });
    } else if (!stakeInfoStatus.isOwnedByProgram) {
      issues.push({
        type: 'error',
        account: 'stake_info',
        message: 'stake_info 계정이 잘못된 프로그램에 의해 소유되었습니다.',
        details: {
          owner: stakeInfoAccount.owner.toString(),
          expected: programId.toString()
        }
      });
    } else if (stakeInfoStatus.data && !stakeInfoStatus.data.isCorrectDiscriminator) {
      issues.push({
        type: 'error',
        account: 'stake_info',
        message: 'stake_info 계정의 식별자가 올바르지 않습니다. 잘못된 계정이 사용되었을 수 있습니다.',
        details: {
          actual: stakeInfoStatus.data.discriminator,
          expected: Array.from(DISCRIMINATORS.STAKE_INFO)
        }
      });
    }
    
    if (!userStakingInfoStatus.exists) {
      issues.push({
        type: 'error',
        account: 'user_staking_info',
        message: 'user_staking_info 계정이 존재하지 않습니다. 사용자 계정이 초기화되지 않았을 수 있습니다.'
      });
    } else if (!userStakingInfoStatus.isOwnedByProgram) {
      issues.push({
        type: 'error',
        account: 'user_staking_info',
        message: 'user_staking_info 계정이 잘못된 프로그램에 의해 소유되었습니다.',
        details: {
          owner: userStakingInfoAccount.owner.toString(),
          expected: programId.toString()
        }
      });
    } else if (userStakingInfoStatus.data && !userStakingInfoStatus.data.isCorrectDiscriminator) {
      issues.push({
        type: 'error',
        account: 'user_staking_info',
        message: 'user_staking_info 계정의 식별자가 올바르지 않습니다.',
        details: {
          actual: userStakingInfoStatus.data.discriminator,
          expected: Array.from(DISCRIMINATORS.USER_STAKING_INFO)
        }
      });
    }
    
    // 해결 방법 제안
    let solution = '';
    
    if (issues.length > 0) {
      if (issues.some(i => i.account === 'stake_info' && !stakeInfoStatus.exists)) {
        solution += '- NFT를 다시 스테이킹해 보세요.\n';
      }
      
      if (issues.some(i => i.account === 'user_staking_info' && !userStakingInfoStatus.exists)) {
        solution += '- 스테이킹 전에 사용자 계정을 초기화해야 합니다.\n';
      }
      
      if (issues.some(i => i.account === 'stake_info' && stakeInfoStatus.exists && !stakeInfoStatus.isOwnedByProgram)) {
        solution += '- 관리자에게 문의하세요. 계정 소유권 문제가 있습니다.\n';
      }
    }
    
    return {
      success: true,
      stakeInfo: stakeInfoStatus,
      userStakingInfo: userStakingInfoStatus,
      escrowAuthority: escrowAuthorityPDA.toString(),
      programId: programId.toString(),
      issues,
      solution: solution || '모든 계정이 올바르게 설정되었습니다.',
      canUnstake: stakeInfoStatus.exists && stakeInfoStatus.isOwnedByProgram && stakeInfoStatus.data.isCorrectDiscriminator,
      recommendedAction: issues.length > 0 ? 'fix' : 'proceed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 프로그램 계정의 총 수와 상태를 검사합니다.
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<Object>} 계정 통계
 */
export async function getStakingProgramStats(connection) {
  try {
    const programId = new PublicKey(PROGRAM_ID);
    
    // 프로그램이 소유한 모든 계정 가져오기
    const accounts = await connection.getProgramAccounts(programId);
    
    // 계정 유형별 분류
    const stakeInfoAccounts = [];
    const userStakingInfoAccounts = [];
    const poolStateAccounts = [];
    const otherAccounts = [];
    
    for (const { pubkey, account } of accounts) {
      if (account.data.length >= 8) {
        const discriminator = account.data.slice(0, 8);
        
        if (Buffer.from(discriminator).equals(DISCRIMINATORS.STAKE_INFO)) {
          stakeInfoAccounts.push(pubkey.toString());
        } else if (Buffer.from(discriminator).equals(DISCRIMINATORS.USER_STAKING_INFO)) {
          userStakingInfoAccounts.push(pubkey.toString());
        } else if (Buffer.from(discriminator).equals(DISCRIMINATORS.POOL_STATE)) {
          poolStateAccounts.push(pubkey.toString());
        } else {
          otherAccounts.push(pubkey.toString());
        }
      } else {
        otherAccounts.push(pubkey.toString());
      }
    }
    
    return {
      success: true,
      totalAccounts: accounts.length,
      stakeInfoCount: stakeInfoAccounts.length,
      userStakingInfoCount: userStakingInfoAccounts.length,
      poolStateCount: poolStateAccounts.length,
      otherAccountsCount: otherAccounts.length,
      poolStateAccounts,
      programSize: accounts.reduce((sum, { account }) => sum + account.data.length, 0)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 풀 상태 계정을 확인합니다.
 * @param {Connection} connection - Solana 연결 객체
 * @param {string} poolStateAddress - 풀 상태 계정 주소
 * @returns {Promise<Object>} 풀 상태 진단 결과
 */
export async function diagnosePoolState(connection, poolStateAddress = 'YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu') {
  try {
    const poolPubkey = new PublicKey(poolStateAddress);
    const programId = new PublicKey(PROGRAM_ID);
    
    const poolAccount = await connection.getAccountInfo(poolPubkey);
    
    if (!poolAccount) {
      return {
        success: true,
        exists: false,
        message: '풀 상태 계정이 존재하지 않습니다. 관리자가 초기화해야 합니다.'
      };
    }
    
    const isOwnedByProgram = poolAccount.owner.equals(programId);
    const discriminator = poolAccount.data.slice(0, 8);
    const isCorrectDiscriminator = Buffer.from(discriminator).equals(DISCRIMINATORS.POOL_STATE);
    
    return {
      success: true,
      exists: true,
      address: poolPubkey.toString(),
      isOwnedByProgram,
      data: {
        size: poolAccount.data.length,
        discriminator: Array.from(discriminator),
        isCorrectDiscriminator
      },
      status: isOwnedByProgram && isCorrectDiscriminator ? 'valid' : 'invalid',
      message: isOwnedByProgram && isCorrectDiscriminator 
        ? '풀 상태 계정이 올바르게 초기화되었습니다.'
        : '풀 상태 계정에 문제가 있습니다. 관리자가 다시 초기화해야 합니다.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}