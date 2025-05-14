/**
 * 향상된 NFT 스테이킹 모듈
 * 
 * 이 모듈은 다음 주요 오류를 해결합니다:
 * 1. 디스크리미네이터 계산 - Anchor의 global:<함수명> 방식 적용
 * 2. 계정 순서 - 온체인 프로그램 기대치와 정확히 일치
 * 3. 계정 유효성 검증 - MaxNftsExceeded 및 유효하지 않은 상태 확인
 * 
 * 통합된 하나의 스테이킹 흐름을 제공하여 사용자 혼란을 방지합니다.
 */

const { web3, BN, Program } = require('@project-serum/anchor');
const { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} = require('@solana/spl-token');
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } = web3;

// 로컬 유틸리티 가져오기
const { PROGRAM_ID } = require('../../constants/program-ids');
const { findPoolStatePDA, findStakeInfoPDA, findEscrowAuthorityPDA, findUserStakingInfoPDA } = require('../pda');
const { getErrorMessage } = require('../error-handler');
const { prepareIdlForAnchor, safeInitializeProgram } = require('../idl-helper');
const { 
  getInstructionDiscriminator, 
  bnToLeBuffer,
  INSTRUCTION_DISCRIMINATORS 
} = require('../anchor-helpers');

/**
 * 스테이킹에 필요한 모든 주소와 PDA 계산
 * 
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @returns {Object} 계정 주소 정보
 */
async function deriveEnhancedStakingAddresses(walletPubkey, mintPubkey) {
  const programId = new PublicKey(PROGRAM_ID);
  
  // 풀 상태 주소 계산
  const [poolStateAddress] = findPoolStatePDA();
  
  // 사용자 스테이킹 정보 PDA
  const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
  
  // 스테이크 정보 PDA
  const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
  
  // 에스크로 권한 PDA
  const [escrowAuthority] = findEscrowAuthorityPDA(mintPubkey);
  
  // 토큰 계정 주소
  const userTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    walletPubkey
  );
  
  const escrowTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    escrowAuthority,
    true // allowOwnerOffCurve - PDA에는 true 설정
  );
  
  return {
    programId,
    poolStateAddress,
    userStakingInfoPDA,
    stakeInfoPDA,
    escrowAuthority,
    userTokenAccount,
    escrowTokenAccount,
    mintPubkey
  };
}

/**
 * 사용자 스테이킹 정보 계정에서 현재 스테이킹된 NFT 수 확인
 * MaxNftsExceeded 오류를 미리 방지하기 위함
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {PublicKey} userStakingInfoPDA - 사용자 스테이킹 정보 PDA
 * @returns {Promise<Object>} 스테이킹 정보
 */
async function checkStakingLimit(connection, userStakingInfoPDA) {
  try {
    const userStakingInfo = await connection.getAccountInfo(userStakingInfoPDA);
    
    if (!userStakingInfo) {
      return { exists: false, stakedCount: 0, maxReached: false };
    }
    
    // 계정 데이터 파싱 - 스테이킹된 NFT 수는 오프셋 40 위치에 저장됨
    const stakedCount = userStakingInfo.data[40] || 0;
    const maxNfts = 5; // 프로그램에 정의된 최대 NFT 수
    
    return {
      exists: true,
      stakedCount,
      maxReached: stakedCount >= maxNfts,
      maxNfts
    };
  } catch (error) {
    console.error("스테이킹 한도 확인 오류:", error);
    // 오류 발생 시 기본값 반환 - 부정확할 수 있음
    return { exists: false, stakedCount: 0, maxReached: false, error };
  }
}

/**
 * 계정 상태를 확인하고 초기화 트랜잭션 준비
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소 
 * @param {Object} addresses - 계정 주소 정보
 * @returns {Promise<Object>} 계정 상태 및 초기화 트랜잭션
 */
async function verifyAndPrepareAccounts(connection, walletPubkey, addresses) {
  try {
    console.log("계정 상태 확인 및 초기화 준비...");
    
    // 1. 최대 NFT 수 확인
    const stakingLimitInfo = await checkStakingLimit(connection, addresses.userStakingInfoPDA);
    if (stakingLimitInfo.maxReached) {
      throw new Error(`MaxNftsExceeded: 이미 최대 NFT 수(${stakingLimitInfo.maxNfts})에 도달했습니다. 새 NFT를 스테이킹하기 전에 하나를 언스테이킹하세요.`);
    }
    
    // 2. 계정 상태 확인
    const accountStatus = {
      userTokenAccountExists: false,
      escrowAccountExists: false,
      userStakingInfoExists: stakingLimitInfo.exists,
      stakedCount: stakingLimitInfo.stakedCount,
      userTokenBalance: 0,
      setupTransactionNeeded: false,
      setupTransaction: null
    };
    
    // 3. 사용자 토큰 계정 확인
    try {
      const userTokenInfo = await connection.getAccountInfo(addresses.userTokenAccount);
      accountStatus.userTokenAccountExists = userTokenInfo !== null;
      
      if (accountStatus.userTokenAccountExists) {
        // 잔액 확인 시도
        try {
          const balanceInfo = await connection.getTokenAccountBalance(addresses.userTokenAccount);
          accountStatus.userTokenBalance = Number(balanceInfo.value.amount);
        } catch (err) {
          console.log("토큰 잔액 확인 중 오류:", err.message);
        }
      }
    } catch (err) {
      accountStatus.userTokenAccountExists = false;
    }
    
    // 4. 에스크로 토큰 계정 확인
    try {
      const escrowInfo = await connection.getAccountInfo(addresses.escrowTokenAccount);
      accountStatus.escrowAccountExists = escrowInfo !== null;
    } catch (err) {
      accountStatus.escrowAccountExists = false;
    }
    
    // 5. 필요한 계정 생성 트랜잭션 준비
    const setupTx = new Transaction();
    let setupInstructionsAdded = false;
    
    // 5.1. 사용자 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.userTokenAccountExists) {
      const createUserTokenIx = createAssociatedTokenAccountInstruction(
        walletPubkey,
        addresses.userTokenAccount,
        walletPubkey,
        addresses.mintPubkey
      );
      setupTx.add(createUserTokenIx);
      setupInstructionsAdded = true;
    }
    
    // 5.2. 에스크로 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.escrowAccountExists) {
      // 에스크로 토큰 계정 생성 시 주의:
      // 온체인 프로그램은 후속 stake_nft 명령에서 escrow_nft_account가 서명자일 것으로 예상합니다.
      // 그러나 실제로는 이 계정은 PDA로, 사용자가 아닌 프로그램이 그것에 대해 서명합니다.
      // 여기서는 일반적인 ATA 생성 명령만 사용합니다.

      // 주의: escrow_nft_account는 온체인 프로그램에서 서명자로 요청되지만
      // 클라이언트에서는 이 계정에 서명할 수 없습니다. ATA 생성 명령을 사용하여
      // 계정을 만들고, 프로그램이 PDA 메커니즘을 통해 서명권한을 가지게 됩니다.
      const createEscrowIx = createAssociatedTokenAccountInstruction(
        walletPubkey,                 // payer (트랜잭션 비용 지불자)
        addresses.escrowTokenAccount, // newAccountPubkey (생성할 ATA 계정)
        addresses.escrowAuthority,    // owner (토큰 계정의 소유자 - PDA)
        addresses.mintPubkey          // mint (토큰 민트 주소)
      );
      setupTx.add(createEscrowIx);
      setupInstructionsAdded = true;
    }
    
    // 5.3. 사용자 스테이킹 정보 초기화 (필요한 경우)
    if (!accountStatus.userStakingInfoExists) {
      // init_user_staking_info 명령어 디스크리미네이터
      const initUserStakingIx = new web3.TransactionInstruction({
        programId: addresses.programId,
        keys: [
          { pubkey: walletPubkey, isSigner: true, isWritable: true },
          { pubkey: addresses.userStakingInfoPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        data: INSTRUCTION_DISCRIMINATORS.INIT_USER_STAKING_INFO
      });
      
      setupTx.add(initUserStakingIx);
      setupInstructionsAdded = true;
    }
    
    // 6. 설정 트랜잭션이 필요한지 확인
    accountStatus.setupTransactionNeeded = setupInstructionsAdded;
    
    if (setupInstructionsAdded) {
      // 블록해시 설정
      const recentBlockhash = await connection.getLatestBlockhash('confirmed');
      setupTx.recentBlockhash = recentBlockhash.blockhash;
      setupTx.feePayer = walletPubkey;
      
      // base64로 직렬화
      accountStatus.setupTransaction = setupTx.serialize({ requireAllSignatures: false }).toString('base64');
    }
    
    // 7. 주소 정보 추가
    accountStatus.addresses = addresses;
    
    return accountStatus;
  } catch (err) {
    console.error("계정 확인 오류:", err);
    throw err;
  }
}

/**
 * 스테이킹 트랜잭션 데이터 생성
 * 
 * @param {number} stakingPeriod - 스테이킹 기간 (일)
 * @param {number} nftTier - NFT 등급 (0-3)
 * @param {boolean} autoCompound - 자동 복리 여부
 * @returns {Buffer} 트랜잭션 데이터 버퍼
 */
function createStakeNftInstructionData(stakingPeriod, nftTier, autoCompound = false) {
  // 1. stake_nft 명령어 디스크리미네이터
  const discriminator = INSTRUCTION_DISCRIMINATORS.STAKE_NFT;
  
  // 2. 스테이킹 기간을 8바이트 리틀 엔디안으로 변환
  const stakingPeriodBuffer = bnToLeBuffer(stakingPeriod, 8);
  
  // 3. NFT 등급 및 자동 복리 플래그
  const nftTierBuffer = Buffer.from([nftTier]);
  const autoCompoundBuffer = Buffer.from([autoCompound ? 1 : 0]);
  
  // 4. 모든 버퍼 연결
  return Buffer.concat([
    discriminator,
    stakingPeriodBuffer,
    nftTierBuffer,
    autoCompoundBuffer
  ]);
}

/**
 * 스테이킹 트랜잭션 준비 (성공적인 온체인 스테이킹 로직 적용)
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {number} stakingPeriod - 스테이킹 기간 (일)
 * @param {number} nftTier - NFT 등급 (0-3)
 * @param {boolean} autoCompound - 자동 복리 여부
 * @returns {Promise<Object>} 트랜잭션 및 계정 정보
 */
async function prepareEnhancedStakingTransaction(
  connection, 
  provider, 
  walletPubkey, 
  mintPubkey, 
  stakingPeriod, 
  nftTier = 0, 
  autoCompound = false
) {
  try {
    console.log("향상된 NFT 스테이킹 트랜잭션 준비...");
    
    // 1. 필요한 모든 주소 계산
    const addresses = await deriveEnhancedStakingAddresses(walletPubkey, mintPubkey);
    
    // 2. 계정 상태 확인 및 초기화 트랜잭션 준비
    const accountStatus = await verifyAndPrepareAccounts(connection, walletPubkey, addresses);
    
    // 3. 스테이킹 트랜잭션 생성
    console.log("스테이킹 트랜잭션 생성...");
    
    // 3.1. 스테이킹 명령어 데이터 생성
    const instructionData = createStakeNftInstructionData(stakingPeriod, nftTier, autoCompound);
    
    // 3.2. 계정 메타 데이터 구성 - 정확한 순서가 중요
    const keys = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },                // owner
      { pubkey: mintPubkey, isSigner: false, isWritable: false },                // nft_mint
      { pubkey: addresses.stakeInfoPDA, isSigner: false, isWritable: true },     // stake_info
      { pubkey: addresses.escrowTokenAccount, isSigner: false, isWritable: true }, // escrow_nft_account - 서명자가 아님
      { pubkey: addresses.escrowAuthority, isSigner: false, isWritable: false }, // escrow_authority
      { pubkey: addresses.userTokenAccount, isSigner: false, isWritable: true }, // user_nft_account
      { pubkey: addresses.userStakingInfoPDA, isSigner: false, isWritable: true }, // user_staking_info
      { pubkey: addresses.poolStateAddress, isSigner: false, isWritable: true }, // pool_state
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },   // system_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },          // token_program
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },        // rent
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false } // associated_token_program
    ];
    
    // 3.3. 트랜잭션 명령어 생성
    // 사인 메타데이터 준비 - PDA 기반 사인 처리
    // 온체인 프로그램은 escrow_nft_account를 서명자로 예상하지만, 실제로는 PDA 방식으로 프로그램이 서명함
    // 클라이언트는 사인 메타데이터만 준비하고 실제 서명은 온체인에서 이루어짐
    const stakeInstruction = new web3.TransactionInstruction({
      programId: addresses.programId,
      keys: keys,
      data: instructionData
    });
    
    // 3.4. 트랜잭션 생성
    const stakeTx = new Transaction();
    stakeTx.add(stakeInstruction);
    
    // 3.5. 블록해시 설정
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    stakeTx.recentBlockhash = blockhash;
    stakeTx.feePayer = walletPubkey;
    
    // 3.6. 트랜잭션 시뮬레이션 (선택사항)
    let simulationSuccess = false;
    let simulationError = null;
    
    try {
      console.log("트랜잭션 시뮬레이션 실행...");
      const simulation = await connection.simulateTransaction(stakeTx);
      
      if (simulation.value.err) {
        console.error("시뮬레이션 오류:", simulation.value.err);
        simulationError = simulation.value.err;
      } else {
        console.log("트랜잭션 시뮬레이션 성공");
        simulationSuccess = true;
      }
    } catch (simErr) {
      console.error("시뮬레이션 예외:", simErr);
      simulationError = simErr;
    }
    
    // 3.7. 직렬화된 스테이킹 트랜잭션
    const serializedStakeTx = stakeTx.serialize({ requireAllSignatures: false }).toString('base64');
    
    // 4. 응답 구성
    return {
      success: true,
      accountInitialization: {
        userTokenAccount: accountStatus.userTokenAccountExists ? 'ready' : 'needs_init',
        escrowTokenAccount: accountStatus.escrowAccountExists ? 'ready' : 'needs_init',
        userStakingInfo: accountStatus.userStakingInfoExists ? 'ready' : 'needs_init',
        stakedCount: accountStatus.stakedCount,
        maxCount: 5,
        allReady: accountStatus.userTokenAccountExists && 
                 accountStatus.escrowAccountExists && 
                 accountStatus.userStakingInfoExists
      },
      requiredPhases: {
        phase1: accountStatus.setupTransactionNeeded,
        phase2: false, // 2단계는 항상 false (1단계와 통합)
        phase3: true   // 스테이킹은 항상 필요
      },
      transactions: {
        phase1: accountStatus.setupTransaction,
        phase2: null,  // 2단계는 더 이상 사용하지 않음
        phase3: serializedStakeTx
      },
      accounts: {
        poolState: addresses.poolStateAddress.toString(),
        stakeInfo: addresses.stakeInfoPDA.toString(),
        escrowAuthority: addresses.escrowAuthority.toString(),
        userStakingInfo: addresses.userStakingInfoPDA.toString(),
        escrowTokenAccount: addresses.escrowTokenAccount.toString(),
        userTokenAccount: addresses.userTokenAccount.toString()
      },
      simulation: {
        success: simulationSuccess,
        error: simulationError
      },
      stakingMetadata: {
        stakingPeriod,
        nftTier,
        autoCompound
      }
    };
  } catch (err) {
    console.error("스테이킹 트랜잭션 준비 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err),
      rawError: err
    };
  }
}

/**
 * NFT 소유권을 확인하고 필요한 경우 NFT를 사용자 ATA로 이동
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} wallet - 지갑 객체
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {PublicKey} userTokenAccount - 사용자 토큰 계정
 * @returns {Promise<Object>} NFT 소유권 정보
 */
async function verifyNftOwnership(connection, wallet, mintPubkey, userTokenAccount) {
  try {
    // 1. 사용자 토큰 계정 잔액 확인
    let userHasNft = false;
    
    try {
      const userTokenInfo = await connection.getTokenAccountBalance(userTokenAccount);
      userHasNft = Number(userTokenInfo.value.amount) > 0;
    } catch (err) {
      console.log("토큰 계정 잔액 확인 중 오류:", err.message);
    }
    
    // 2. 사용자 토큰 계정에 NFT가 없으면 다른 계정에서 확인
    if (!userHasNft) {
      // 사용자의 모든 토큰 계정 가져오기
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      // 각 계정이 해당 NFT를 가지고 있는지 확인
      for (const { pubkey, account } of tokenAccounts.value) {
        const accountData = Buffer.from(account.data);
        
        // SPL 토큰 계정 데이터 디코딩
        const mint = new PublicKey(accountData.slice(0, 32));
        const amount = accountData.readBigUInt64LE(64);
        
        if (mint.equals(mintPubkey) && amount > 0n) {
          // NFT가 다른 계정에 있음
          return {
            hasNft: true,
            account: pubkey,
            needsTransfer: !pubkey.equals(userTokenAccount),
            amount: Number(amount)
          };
        }
      }
      
      // NFT를 찾지 못함
      return { hasNft: false };
    }
    
    // 사용자 토큰 계정에 NFT가 있음
    return {
      hasNft: true,
      account: userTokenAccount,
      needsTransfer: false,
      amount: 1
    };
  } catch (err) {
    console.error("NFT 소유권 확인 오류:", err);
    return { hasNft: false, error: err };
  }
}

module.exports = {
  deriveEnhancedStakingAddresses,
  checkStakingLimit,
  verifyAndPrepareAccounts,
  createStakeNftInstructionData,
  prepareEnhancedStakingTransaction,
  verifyNftOwnership
};