/**
 * 통합 NFT 스테이킹 모듈
 * 
 * 이 모듈은 NFT 스테이킹 과정에서 발생하는 두 가지 주요 오류를 해결합니다:
 * 1. IDL 파싱 오류: vec<pubkey> 타입이 JavaScript에서 제대로 처리되지 않는 문제
 * 2. 에스크로 계정 초기화 오류: 토큰 계정 생성 시 소유자 파라미터가 잘못 지정되는 문제
 * 
 * 통합된 하나의 스테이킹 흐름을 제공하여 사용자 혼란을 방지합니다.
 */

const { web3, BN, Program } = require('@project-serum/anchor');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } = web3;

// 로컬 유틸리티 가져오기
const { PROGRAM_ID } = require('../../constants/program-ids');
const { findPoolStatePDA, findStakeInfoPDA, findEscrowAuthorityPDA, findUserStakingInfoPDA } = require('../pda');
const { getErrorMessage } = require('../error-handler');
const { prepareIdlForAnchor, safeInitializeProgram } = require('../idl-helper');

/**
 * 스테이킹에 필요한 모든 PDA와 계정 주소를 계산하는 함수
 * 
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @returns {Object} 계산된 모든 주소
 */
async function deriveStakingAddresses(walletPubkey, mintPubkey) {
  const programId = new PublicKey(PROGRAM_ID);
  
  // 풀 상태 주소 계산
  const [poolStatePDA] = findPoolStatePDA();
  
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
    poolStateAddress: poolStatePDA,
    userStakingInfoPDA,
    stakeInfoPDA,
    escrowAuthority,
    userTokenAccount,
    escrowTokenAccount
  };
}

/**
 * 계정 상태를 확인하고 필요한 계정을 초기화하는 함수
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 지갑 공개키
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {Object} idl - Anchor IDL 객체
 * @returns {Object} 계정 상태 및 초기화 트랜잭션
 */
async function checkAndInitializeAccounts(connection, provider, walletPubkey, mintPubkey, idl) {
  try {
    console.log("계정 상태 확인 및 초기화 준비...");
    
    // 1. 모든 필요한 주소 계산
    const addresses = await deriveStakingAddresses(walletPubkey, mintPubkey);
    console.log("계정 주소 계산 완료:", {
      userTokenAccount: addresses.userTokenAccount.toString(),
      escrowTokenAccount: addresses.escrowTokenAccount.toString(),
      userStakingInfoPDA: addresses.userStakingInfoPDA.toString(),
      stakeInfoPDA: addresses.stakeInfoPDA.toString()
    });
    
    // 2. 각 계정의 상태 확인
    const accountStatus = {
      userTokenAccountExists: false,
      escrowAccountExists: false,
      userStakingInfoExists: false,
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
    
    // 5. 사용자 스테이킹 정보 계정 확인
    try {
      const userStakingInfo = await connection.getAccountInfo(addresses.userStakingInfoPDA);
      accountStatus.userStakingInfoExists = userStakingInfo !== null;
    } catch (err) {
      accountStatus.userStakingInfoExists = false;
    }
    
    // 6. 필요한 계정 생성 트랜잭션 준비
    const setupTx = new Transaction();
    let setupInstructionsAdded = false;
    
    // 6.1. 사용자 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.userTokenAccountExists) {
      const createUserTokenIx = createAssociatedTokenAccountInstruction(
        walletPubkey,
        addresses.userTokenAccount,
        walletPubkey,
        mintPubkey
      );
      setupTx.add(createUserTokenIx);
      setupInstructionsAdded = true;
    }
    
    // 6.2. 에스크로 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.escrowAccountExists) {
      // 핵심 수정: 올바른 순서로 매개변수를 지정
      const createEscrowIx = createAssociatedTokenAccountInstruction(
        walletPubkey,               // payer (트랜잭션 비용 지불자)
        addresses.escrowTokenAccount, // newAccountPubkey (생성할 ATA 계정)
        addresses.escrowAuthority,    // owner (토큰 계정의 소유자 - 반드시 PDA)
        mintPubkey                  // mint (토큰 민트 주소)
      );
      setupTx.add(createEscrowIx);
      setupInstructionsAdded = true;
    }
    
    // 6.3. 사용자 스테이킹 정보 초기화 (필요한 경우)
    if (!accountStatus.userStakingInfoExists) {
      try {
        // Anchor 프로그램 생성 (IDL에서 vec<pubkey> 수정 적용)
        const program = safeInitializeProgram(
          prepareIdlForAnchor(idl),
          new PublicKey(PROGRAM_ID),
          provider
        );
        
        if (program) {
          // Anchor 방식으로 명령어 생성
          const initUserStakingIx = await program.methods
            .initUserStakingInfo()
            .accounts({
              user: walletPubkey,
              userStakingInfo: addresses.userStakingInfoPDA,
              systemProgram: SystemProgram.programId
            })
            .instruction();
          
          setupTx.add(initUserStakingIx);
          setupInstructionsAdded = true;
        } else {
          console.warn("Anchor 프로그램 초기화 실패, 사용자 스테이킹 초기화는 스테이킹 트랜잭션에서 자동 처리됩니다");
        }
      } catch (err) {
        console.warn("사용자 스테이킹 정보 초기화 명령어 생성 중 오류:", err.message);
        // 오류가 발생해도 계속 진행 (스테이킹 트랜잭션에서 자동 처리)
      }
    }
    
    // 7. 설정 트랜잭션이 필요한지 확인
    accountStatus.setupTransactionNeeded = setupInstructionsAdded;
    
    if (setupInstructionsAdded) {
      // 블록해시 설정
      const recentBlockhash = await connection.getLatestBlockhash('confirmed');
      setupTx.recentBlockhash = recentBlockhash.blockhash;
      setupTx.feePayer = walletPubkey;
      
      // base64로 직렬화
      accountStatus.setupTransaction = setupTx.serialize({ requireAllSignatures: false }).toString('base64');
    }
    
    // 8. 주소 정보 추가
    accountStatus.addresses = addresses;
    
    return accountStatus;
  } catch (err) {
    console.error("계정 확인 오류:", err);
    throw err;
  }
}

/**
 * NFT 스테이킹 트랜잭션을 준비하는 통합 함수
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Object} provider - Anchor 프로바이더 객체
 * @param {PublicKey} walletPubkey - 지갑 공개키
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {number} stakingPeriod - 스테이킹 기간(일)
 * @param {number} nftTier - NFT 등급 인덱스
 * @param {Object} idl - Anchor IDL 객체
 * @returns {Promise<Object>} 트랜잭션 및 계정 정보
 */
async function prepareStakingTransaction(connection, provider, walletPubkey, mintPubkey, stakingPeriod, nftTier, idl) {
  try {
    console.log("NFT 스테이킹 트랜잭션 준비...");
    
    // 1. 계정 상태 확인 및 초기화 트랜잭션 준비
    const accountStatus = await checkAndInitializeAccounts(connection, provider, walletPubkey, mintPubkey, idl);
    
    // 2. Anchor 프로그램 생성 (IDL에서 vec<pubkey> 수정 적용)
    const program = safeInitializeProgram(
      prepareIdlForAnchor(idl),
      new PublicKey(PROGRAM_ID),
      provider
    );
    
    // 3. 스테이킹 트랜잭션 생성
    console.log("스테이킹 트랜잭션 생성...");
    
    // 스테이킹 기간을 BN으로 변환
    const stakingPeriodBN = new BN(stakingPeriod);
    const addresses = accountStatus.addresses;
    
    // 3.1. 스테이킹 명령어 생성
    let stakeInstruction;
    
    if (program) {
      // Anchor 방식으로 명령어 생성
      stakeInstruction = await program.methods
        .stakeNft(stakingPeriodBN, nftTier, false) // autoCompound는 기본적으로 false
        .accounts({
          owner: walletPubkey,
          nftMint: mintPubkey,
          userNftAccount: addresses.userTokenAccount,
          escrowNftAccount: addresses.escrowTokenAccount,
          escrowAuthority: addresses.escrowAuthority,
          stakeInfo: addresses.stakeInfoPDA,
          poolState: addresses.poolStateAddress,
          userStakingInfo: addresses.userStakingInfoPDA,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY
        })
        .instruction();
    } else {
      // 프로그램 초기화 실패 시 수동 구현
      console.warn("Anchor 프로그램 초기화 실패, 수동으로 스테이킹 명령어 생성");
      
      // stakeNft 명령어 식별자 (해시 "global:stake_nft"의 처음 8바이트)
      const discriminator = [38, 27, 66, 46, 69, 65, 151, 219];

      // 트랜잭션 데이터 수동 구성
      const dataLayout = Buffer.from([
        ...discriminator, // 8바이트 식별자 추가
        ...stakingPeriodBN.toArray("le", 8), // 스테이킹 기간을 LE 8바이트로
        nftTier, // NFT 티어 인덱스
        0 // auto_compound: false
      ]);

      // 계정 메타 데이터 수동 구성 - 정확한 순서로 지정
      const keys = [
        { pubkey: walletPubkey, isSigner: true, isWritable: true },                // owner
        { pubkey: mintPubkey, isSigner: false, isWritable: false },                // nft_mint
        { pubkey: addresses.stakeInfoPDA, isSigner: false, isWritable: true },      // stake_info
        { pubkey: addresses.escrowTokenAccount, isSigner: false, isWritable: true }, // escrow_nft_account
        { pubkey: addresses.escrowAuthority, isSigner: false, isWritable: false },  // escrow_authority
        { pubkey: addresses.userTokenAccount, isSigner: false, isWritable: true },   // user_nft_account
        { pubkey: addresses.userStakingInfoPDA, isSigner: false, isWritable: true }, // user_staking_info
        { pubkey: addresses.poolStateAddress, isSigner: false, isWritable: true },   // pool_state
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },    // system_program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },          // token_program
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }          // rent
      ];
      
      // 수동으로 트랜잭션 명령어 생성
      stakeInstruction = new web3.TransactionInstruction({
        keys: keys,
        programId: new PublicKey(PROGRAM_ID),
        data: dataLayout
      });
    }
    
    // 3.2. 스테이킹 트랜잭션 생성
    const stakeTx = new Transaction();
    stakeTx.add(stakeInstruction);
    
    // 블록해시 설정
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    stakeTx.recentBlockhash = blockhash;
    stakeTx.feePayer = walletPubkey;
    
    // 3.3 트랜잭션 시뮬레이션 실행 (선택사항)
    try {
      console.log("트랜잭션 시뮬레이션 실행...");
      const simulation = await connection.simulateTransaction(stakeTx);
      
      if (simulation.value.err) {
        console.error("시뮬레이션 오류:", simulation.value.err);
        // 시뮬레이션 오류가 있어도 사용자가 결정할 수 있도록 트랜잭션 반환
      } else {
        console.log("트랜잭션 시뮬레이션 성공");
      }
    } catch (simErr) {
      console.error("시뮬레이션 예외:", simErr);
    }
    
    // 직렬화된 스테이킹 트랜잭션
    const serializedStakeTx = stakeTx.serialize({ requireAllSignatures: false }).toString('base64');
    
    // 4. 응답 구성
    return {
      success: true,
      threePhaseMode: true,
      accountInitialization: {
        userTokenAccount: accountStatus.userTokenAccountExists ? 'ready' : 'needs_init',
        escrowTokenAccount: accountStatus.escrowAccountExists ? 'ready' : 'needs_init',
        userStakingInfo: accountStatus.userStakingInfoExists ? 'ready' : 'needs_init',
        allReady: accountStatus.userTokenAccountExists && accountStatus.escrowAccountExists && accountStatus.userStakingInfoExists
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

module.exports = {
  deriveStakingAddresses,
  checkAndInitializeAccounts,
  prepareStakingTransaction
};