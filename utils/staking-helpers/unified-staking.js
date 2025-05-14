/**
 * 통합 NFT 스테이킹 라이브러리
 * 
 * 이 모듈은 NFT 스테이킹 과정에서 발생하는 두 가지 주요 오류를 해결합니다:
 * 1. IDL 파싱 오류: vec<pubkey> 타입이 JavaScript에서 제대로 처리되지 않는 문제
 * 2. 에스크로 계정 초기화 오류: 토큰 계정 생성 시 소유자 파라미터가 잘못 지정되는 문제
 * 
 * 통합된 하나의 스테이킹 흐름을 제공하여 사용자 혼란을 방지합니다.
 */

const { web3, BN, Program, Wallet, AnchorProvider } = require('@coral-xyz/anchor');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } = web3;

// 로컬 유틸리티 가져오기
const { PROGRAM_ID, STAKE_SEED, ESCROW_SEED, USER_STAKING_SEED, NFT_TIERS, STAKING_PERIODS } = require('./constants');
const { getErrorMessage, handleTransaction } = require('./error-handler');

/**
 * IDL의 vec<pubkey> 타입을 클라이언트에서 사용 가능하도록 변환하는 함수
 * 
 * @param {Object} idlObj - 원본 Anchor IDL 객체
 * @returns {Object} 클라이언트용으로 수정된 IDL 객체
 */
function prepareIdlForAnchor(idlObj) {
  // 원본 IDL을 변경하지 않기 위해 깊은 복사 수행
  const fixedIdl = JSON.parse(JSON.stringify(idlObj));
  
  // 계정 타입 처리
  if (fixedIdl.accounts) {
    fixedIdl.accounts.forEach(account => {
      if (account.type && account.type.fields) {
        account.type.fields.forEach(field => {
          // vec<pubkey>를 bytes[]로 변환
          if (field.type && typeof field.type === 'object' && field.type.vec === 'pubkey') {
            console.log(`vec<pubkey>를 bytes[]로 변환: ${account.name}, 필드: ${field.name}`);
            field.type = "bytes";
            field.isArray = true;
          }
        });
      }
    });
  }
  
  // 일반 타입 처리
  if (fixedIdl.types) {
    fixedIdl.types.forEach(typeObj => {
      if (typeObj.type && typeObj.type.fields) {
        typeObj.type.fields.forEach(field => {
          // vec<pubkey>를 bytes[]로 변환
          if (field.type && typeof field.type === 'object' && field.type.vec === 'pubkey') {
            console.log(`vec<pubkey>를 bytes[]로 변환: ${typeObj.name}, 필드: ${field.name}`);
            field.type = "bytes";
            field.isArray = true;
          }
        });
      }
    });
  }
  
  // 명령어 인자 처리
  if (fixedIdl.instructions) {
    fixedIdl.instructions.forEach(ix => {
      if (ix.args) {
        ix.args.forEach(arg => {
          if (arg.type && typeof arg.type === 'object' && arg.type.vec === 'pubkey') {
            console.log(`vec<pubkey>를 bytes[]로 변환: ${ix.name}, 인자: ${arg.name}`);
            arg.type = "bytes";
            arg.isArray = true;
          }
        });
      }
    });
  }
  
  return fixedIdl;
}

/**
 * Anchor 프로그램 인스턴스를 생성하는 함수
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Keypair} wallet - 지갑 키페어
 * @param {Object} idl - Anchor IDL 객체
 * @returns {Program} 수정된 IDL로 생성된 Anchor 프로그램 인스턴스
 */
function createAnchorProgram(connection, wallet, idl) {
  // AnchorProvider 생성
  const provider = new AnchorProvider(
    connection,
    new Wallet(wallet),
    { commitment: "confirmed" }
  );
  
  // IDL 수정
  const fixedIdl = prepareIdlForAnchor(idl);
  
  // 프로그램 ID 생성
  const programId = new PublicKey(PROGRAM_ID);
  
  // 수정된 IDL로 프로그램 생성
  const program = new Program(fixedIdl, programId, provider);
  return program;
}

/**
 * 스테이킹에 필요한 모든 PDA와 계정 주소를 계산하는 함수
 * 
 * @param {PublicKey} walletPubkey - 사용자 지갑 주소
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @returns {Object} 계산된 모든 주소
 */
async function deriveStakingAddresses(walletPubkey, mintPubkey) {
  const programId = new PublicKey(PROGRAM_ID);
  
  // 풀 상태 주소 (이미 배포됨)
  const poolStateAddress = new PublicKey("8cQViUpNWGhw2enYUNyp2WRWXAwdQbZokiATBr1Xc5uP");
  
  // 사용자 스테이킹 정보 PDA
  const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
    programId
  );
  
  // 스테이크 정보 PDA
  const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
    programId
  );
  
  // 에스크로 권한 PDA
  const [escrowAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
    programId
  );
  
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
    escrowTokenAccount
  };
}

/**
 * 계정 상태를 확인하고 필요한 계정을 생성하는 함수
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Program} program - Anchor 프로그램 인스턴스
 * @param {Keypair} wallet - 지갑 키페어
 * @param {Object} addresses - 계정 주소 객체
 * @returns {Object} 생성된 트랜잭션 및 계정 상태
 */
async function setupStakingAccounts(connection, program, wallet, addresses) {
  // 계정 상태 초기화
  const accountStatus = {
    userTokenAccountExists: false,
    escrowAccountExists: false,
    userStakingInfoExists: false,
    stakeInfoExists: false,
    userTokenBalance: 0,
    setupTransactionNeeded: false,
    setupTransaction: null
  };
  
  try {
    // 사용자 토큰 계정 확인
    try {
      const userTokenInfo = await connection.getTokenAccountBalance(addresses.userTokenAccount);
      accountStatus.userTokenAccountExists = true;
      accountStatus.userTokenBalance = Number(userTokenInfo.value.amount);
    } catch (err) {
      accountStatus.userTokenAccountExists = false;
    }
    
    // 에스크로 토큰 계정 확인
    try {
      const escrowInfo = await connection.getAccountInfo(addresses.escrowTokenAccount);
      accountStatus.escrowAccountExists = escrowInfo !== null;
    } catch (err) {
      accountStatus.escrowAccountExists = false;
    }
    
    // 스테이크 정보 계정 확인
    try {
      const stakeInfo = await connection.getAccountInfo(addresses.stakeInfoPDA);
      accountStatus.stakeInfoExists = stakeInfo !== null;
    } catch (err) {
      accountStatus.stakeInfoExists = false;
    }
    
    // 사용자 스테이킹 정보 계정 확인
    try {
      const userStakingInfo = await connection.getAccountInfo(addresses.userStakingInfoPDA);
      accountStatus.userStakingInfoExists = userStakingInfo !== null;
    } catch (err) {
      accountStatus.userStakingInfoExists = false;
    }
    
    // 필요한 계정 생성 트랜잭션 준비
    const setupTx = new Transaction();
    
    // 사용자 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.userTokenAccountExists) {
      const createUserTokenIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        addresses.userTokenAccount,
        wallet.publicKey,
        addresses.mintPubkey
      );
      setupTx.add(createUserTokenIx);
    }
    
    // 에스크로 토큰 계정 생성 (필요한 경우)
    if (!accountStatus.escrowAccountExists) {
      // 이 부분이 중요: 올바른 순서로 매개변수를 지정해야 함
      const createEscrowIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,         // 지불자
        addresses.escrowTokenAccount,  // 생성할 연결 토큰 계정
        addresses.escrowAuthority,     // 소유자 (PDA)
        addresses.mintPubkey            // 민트
      );
      setupTx.add(createEscrowIx);
    }
    
    // 사용자 스테이킹 정보 초기화 (필요한 경우)
    if (!accountStatus.userStakingInfoExists) {
      const initUserStakingIx = await program.methods
        .initUserStakingInfo()
        .accounts({
          user: wallet.publicKey,
          userStakingInfo: addresses.userStakingInfoPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      setupTx.add(initUserStakingIx);
    }
    
    // 설정 트랜잭션이 필요한지 확인
    accountStatus.setupTransactionNeeded = 
      !accountStatus.userTokenAccountExists || 
      !accountStatus.escrowAccountExists || 
      !accountStatus.userStakingInfoExists;
    
    if (accountStatus.setupTransactionNeeded) {
      accountStatus.setupTransaction = setupTx;
    }
    
    return accountStatus;
  } catch (err) {
    console.error("계정 확인 오류:", err);
    throw err;
  }
}

/**
 * NFT를 스테이킹하는 통합 함수
 * 
 * @param {Object} connection - Solana 연결 객체
 * @param {Keypair} wallet - 지갑 키페어
 * @param {PublicKey} mintPubkey - NFT 민트 주소
 * @param {Object} idl - Anchor IDL 객체
 * @param {Object} options - 스테이킹 옵션
 * @returns {Promise<Object>} 트랜잭션 결과
 */
async function stakeNftUnified(connection, wallet, mintPubkey, idl, options = {}) {
  try {
    console.log("통합 NFT 스테이킹 시작...");
    
    // 기본 옵션 설정
    const stakingOptions = {
      stakingPeriod: options.stakingPeriod || STAKING_PERIODS.MEDIUM, // 기본값 30일
      nftTier: options.nftTier !== undefined ? options.nftTier : NFT_TIERS.COMMON,
      autoCompound: options.autoCompound || false,
      simulateTransaction: options.simulateTransaction || true
    };
    
    console.log("스테이킹 옵션:", {
      stakingPeriod: stakingOptions.stakingPeriod,
      nftTier: stakingOptions.nftTier,
      autoCompound: stakingOptions.autoCompound,
      simulateTransaction: stakingOptions.simulateTransaction
    });
    
    // 1. Anchor 프로그램 생성 (IDL 수정 적용)
    const program = createAnchorProgram(connection, wallet, idl);
    console.log("Anchor 프로그램 생성 완료");
    
    // 2. 필요한 모든 주소 계산
    const addresses = await deriveStakingAddresses(wallet.publicKey, mintPubkey);
    console.log("스테이킹 주소 계산 완료:", {
      userStakingInfoPDA: addresses.userStakingInfoPDA.toBase58(),
      stakeInfoPDA: addresses.stakeInfoPDA.toBase58(),
      escrowAuthority: addresses.escrowAuthority.toBase58(),
      userTokenAccount: addresses.userTokenAccount.toBase58(),
      escrowTokenAccount: addresses.escrowTokenAccount.toBase58()
    });
    
    // 3. 계정 상태 확인 및 설정
    const accountStatus = await setupStakingAccounts(connection, program, wallet, addresses);
    console.log("계정 상태 확인 완료:", {
      userTokenAccountExists: accountStatus.userTokenAccountExists,
      escrowAccountExists: accountStatus.escrowAccountExists,
      userStakingInfoExists: accountStatus.userStakingInfoExists,
      userTokenBalance: accountStatus.userTokenBalance,
      setupTransactionNeeded: accountStatus.setupTransactionNeeded
    });
    
    // 4. 필요한 계정 생성 (설정 트랜잭션이 필요한 경우)
    if (accountStatus.setupTransactionNeeded) {
      console.log("계정 설정 트랜잭션 실행...");
      
      // 설정 트랜잭션에 서명자로 지갑 추가
      accountStatus.setupTransaction.feePayer = wallet.publicKey;
      const recentBlockhash = await connection.getLatestBlockhash();
      accountStatus.setupTransaction.recentBlockhash = recentBlockhash.blockhash;
      
      // 설정 트랜잭션 실행
      const setupSignature = await web3.sendAndConfirmTransaction(
        connection,
        accountStatus.setupTransaction,
        [wallet]
      );
      console.log("계정 설정 완료:", setupSignature);
      
      // 설정이 적용될 시간 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 5. 토큰 잔액 확인
    if (accountStatus.userTokenBalance === 0) {
      throw new Error("사용자 토큰 계정에 NFT가 없습니다. 먼저 NFT를 가져오세요.");
    }
    
    // 6. 스테이킹 트랜잭션 생성
    console.log("스테이킹 트랜잭션 생성...");
    const stakingPeriodBN = new BN(stakingOptions.stakingPeriod);
    
    // Anchor를 통해 스테이킹 트랜잭션 생성
    const stakingTx = await program.methods
      .stakeNft(stakingPeriodBN, stakingOptions.nftTier, stakingOptions.autoCompound)
      .accounts({
        owner: wallet.publicKey,
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
      .transaction();
    
    // 7. 트랜잭션 시뮬레이션 (옵션에 따라)
    if (stakingOptions.simulateTransaction) {
      console.log("트랜잭션 시뮬레이션 실행...");
      stakingTx.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      stakingTx.recentBlockhash = blockhash;
      
      try {
        const simResult = await connection.simulateTransaction(stakingTx);
        if (simResult.value.err) {
          console.error("시뮬레이션 오류:", simResult.value.err);
          throw new Error(`트랜잭션 시뮬레이션 실패: ${simResult.value.err}`);
        }
        console.log("시뮬레이션 성공!");
      } catch (simError) {
        console.error("시뮬레이션 예외:", simError);
        throw simError;
      }
    }
    
    // 8. 트랜잭션 전송 및 확인
    console.log("스테이킹 트랜잭션 전송...");
    stakingTx.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    stakingTx.recentBlockhash = blockhash;
    
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      stakingTx,
      [wallet]
    );
    
    console.log("스테이킹 완료! 트랜잭션 서명:", signature);
    
    // 9. 스테이킹 결과 확인
    console.log("스테이킹 결과 확인...");
    try {
      const stakeInfo = await program.account.stakeInfo.fetch(addresses.stakeInfoPDA);
      const userStakingInfo = await program.account.userStakingInfo.fetch(addresses.userStakingInfoPDA);
      
      return {
        success: true,
        signature,
        stakeInfo: {
          owner: stakeInfo.owner.toBase58(),
          mint: stakeInfo.mint.toBase58(),
          stakedAt: new Date(stakeInfo.stakedAt * 1000).toISOString(),
          releaseDate: new Date(stakeInfo.releaseDate * 1000).toISOString(),
          isStaked: stakeInfo.isStaked,
          tier: stakeInfo.tier,
          stakingPeriod: stakeInfo.stakingPeriod.toNumber(),
          autoCompound: stakeInfo.autoCompound
        },
        userStakingInfo: {
          owner: userStakingInfo.owner.toBase58(),
          stakedCount: userStakingInfo.stakedCount,
          stakedMints: userStakingInfo.stakedMints.map(pk => pk.toBase58())
        }
      };
    } catch (err) {
      console.error("스테이킹 결과 확인 오류:", err);
      // 트랜잭션은 성공했지만 결과 확인 중 오류 발생
      return {
        success: true,
        signature,
        error: `결과 확인 오류: ${err.message}`
      };
    }
  } catch (error) {
    console.error("스테이킹 오류:", error);
    return {
      success: false,
      error: getErrorMessage(error),
      rawError: error
    };
  }
}

module.exports = {
  prepareIdlForAnchor,
  createAnchorProgram,
  deriveStakingAddresses,
  setupStakingAccounts,
  stakeNftUnified
};