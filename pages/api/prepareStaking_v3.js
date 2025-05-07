// pages/api/prepareStaking_v3.js
// 온체인 IDL을 기반으로 완전히 새롭게 구현한 스테이킹 준비 API
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

// 각 헬퍼 모듈 직접 임포트
// 에러 핸들러 직접 구현
function getErrorMessage(error) {
  if (error && typeof error === 'object') {
    // 일반적인 Solana 에러 코드 확인
    if (error.code === 4001) {
      return '사용자가 트랜잭션을 취소했습니다';
    }
    
    // Wallet 연결 에러
    if (error.code === 'WalletNotConnected') {
      return '지갑이 연결되지 않았습니다. 지갑을 연결하세요';
    }
    
    // 잔액 부족 에러
    if (error.message && error.message.includes('insufficient funds')) {
      return 'SOL 잔액이 부족합니다. 지갑에 SOL을 충전하세요';
    }
    
    // RPC 에러
    if (error.message && error.message.includes('failed to fetch')) {
      return 'Solana 네트워크 연결 실패. 네트워크 연결을 확인하세요';
    }
    
    // 블록 높이 에러
    if (error.message && error.message.includes('blockhash')) {
      return '트랜잭션 타임아웃. 다시 시도하세요';
    }
  }
  
  // 기본 에러 메시지
  return error.message || '알 수 없는 오류가 발생했습니다';
}

import { PROGRAM_ID, ESCROW_SEED, STAKE_SEED, USER_STAKING_SEED, POOL_SEED, NFT_TIERS } from '../../utils/staking-helpers/constants';

// 트랜잭션 명령어 식별자는 기존 상수 계속 사용
import { STAKE_NFT_DISCRIMINATOR } from '../../utils/staking';

// 기존 스테이킹 유틸리티에서 일부 함수만 가져오기
import { 
  standardizeTier,
  calculateEstimatedRewards 
} from '../../utils/staking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingPeriod } = req.body;
    
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking period are required' });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid mint address format' });
    }
    
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    if (isNaN(stakingPeriodNum) || stakingPeriodNum <= 0 || stakingPeriodNum > 365) {
      return res.status(400).json({ error: 'Staking period must be between 1 and 365 days' });
    }
    
    console.log('스테이킹 요청 받음:', { wallet, mintAddress, stakingPeriod: stakingPeriodNum });
    
    // 이미 스테이킹되었는지 확인
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('기존 스테이킹 확인 중 오류:', existingError);
      return res.status(500).json({ error: '스테이킹 상태 확인 실패: ' + existingError.message });
    }
    
    if (existingStake) {
      console.log('NFT 이미 스테이킹됨:', existingStake);
      return res.status(400).json({ 
        error: `이 NFT는 이미 ${new Date(existingStake.release_date).toLocaleDateString()}까지 스테이킹되어 있습니다`, 
        existingStake 
      });
    }
    
    console.log('Solana RPC에 연결 중:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // NFT 소유권 확인
    console.log('NFT 소유권 확인 중...');
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        console.log('NFT 소유권 확인 실패: 토큰 계정 없음');
        return res.status(403).json({ error: '이 NFT의 소유자가 아닙니다' });
      }
      
      console.log('토큰 계정을 통해 NFT 소유권 확인됨');
    } catch (tokenCheckError) {
      console.error('토큰 계정 확인 중 오류:', tokenCheckError);
      return res.status(500).json({ error: 'NFT 소유권 확인 실패: ' + tokenCheckError.message });
    }
    
    // NFT 등급 가져오기 (데이터베이스 또는 메타데이터 조회)
    let nftTier = "COMMON";
    let nftName = "";
    let rawTierValue = null;
    
    try {
      console.log('NFT 메타데이터 가져오는 중:', mintAddress);
      const { data: nftData } = await supabase
        .from('minted_nfts')
        .select('metadata, name')
        .eq('mint_address', mintAddress)
        .maybeSingle();
      
      if (nftData) {
        nftName = nftData.name || `SOLARA NFT #${Date.now().toString().slice(-4)}`;
        
        if (nftData.metadata) {
          let metadata;
          
          try {
            metadata = typeof nftData.metadata === 'string' 
              ? JSON.parse(nftData.metadata) 
              : nftData.metadata;
              
            console.log('NFT 메타데이터:', JSON.stringify(metadata, null, 2));
            
            const tierAttr = metadata.attributes?.find(attr => 
              attr.trait_type?.toLowerCase() === "tier"
            );
            
            if (tierAttr && tierAttr.value) {
              rawTierValue = tierAttr.value;
              nftTier = standardizeTier(tierAttr.value);
              console.log('NFT 등급 찾음:', nftTier, '원본 값:', tierAttr.value);
            } else {
              console.log('NFT 등급 속성을 찾을 수 없음, 기본값 사용:', nftTier);
            }
          } catch (parseError) {
            console.error('메타데이터 파싱 오류:', parseError);
          }
        }
      }
    } catch (tierError) {
      console.error('NFT 등급 조회 오류:', tierError);
    }
    
    // 프로그램 ID 설정
    const programId = new PublicKey(PROGRAM_ID);
    
    // 사용자 토큰 계정 가져오기
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    // PDA 생성 - IDL에서 정확한 시드 값 사용
    // 1. stakeInfo PDA - "stake" 시드 사용
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    console.log('Stake info PDA:', stakeInfoPDA.toString());
    
    // 2. escrow_authority PDA - "escrow" 시드 사용
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    console.log('Escrow authority PDA:', escrowAuthorityPDA.toString());
    
    // 3. 초기화된 pool_state 계정 주소
    // 관리자가 초기화한 키페어 계정 주소
    const poolStateAddress = new PublicKey('YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu');
    
    console.log('Pool state address:', poolStateAddress.toString());
    
    // pool_state 계정이 존재하는지 확인
    const poolStateAccount = await connection.getAccountInfo(poolStateAddress);
    
    // 계정이 있고 소유자가 프로그램 ID인지 확인
    if (poolStateAccount) {
      console.log('Pool state account exists, owner:', poolStateAccount.owner.toString());
      console.log('Expected owner (program ID):', programId.toString());
      console.log('Pool initialized correctly:', poolStateAccount.owner.equals(programId));
    } else {
      console.log('Pool state account does not exist');
    }
    
    // 4. escrow 토큰 계정 가져오기
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true  // Allow owner off curve
    );
    
    // 5. user_staking_info PDA 생성 - "user_staking" 시드 사용
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    console.log('Escrow token account:', escrowTokenAccount.toString());
    console.log('User staking info PDA:', userStakingInfoPDA.toString());
    console.log('스테이킹 트랜잭션 생성 중...');
    
    // 새 트랜잭션 생성
    const tx = new Transaction();
    
    // ⭐ 중요: escrow_nft_account를 초기화하는 명령어 추가
    // 이 명령어는 연결된 토큰 계정이 없을 경우 생성합니다.
    console.log('escrow_nft_account 초기화 명령 추가');
    const createATAIx = createAssociatedTokenAccountInstruction(
      walletPubkey,          // 지불자
      escrowTokenAccount,    // 생성할 계정
      escrowAuthorityPDA,    // 계정 소유자
      mintPubkey             // 토큰 민트
    );
    
    // 트랜잭션에 escrow 계정 생성 명령 추가
    tx.add(createATAIx);
    
    // stakingPeriod를 8바이트 버퍼로 변환 (u64, little-endian)
    const stakingPeriodBuf = Buffer.alloc(8);
    stakingPeriodBuf.writeBigUInt64LE(BigInt(stakingPeriodNum));
    
    // nftTier를 1바이트 버퍼로 변환 (u8)
    const nftTierValue = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'].indexOf(nftTier);
    const nftTierBuf = Buffer.from([nftTierValue === -1 ? 0 : nftTierValue]);
    
    // autoCompound를 1바이트 버퍼로 변환 (bool)
    const autoCompoundBuf = Buffer.from([false]); // 현재는 항상 false로 설정
    
    // 명령 데이터 구성: sighash + 인자
    // stake_nft 명령은 staking_period, nft_tier, auto_compound 인자가 필요함
    const instructionData = Buffer.concat([
      Buffer.from(STAKE_NFT_DISCRIMINATOR),  // 8바이트 명령어 식별자
      stakingPeriodBuf,                      // 8바이트 스테이킹 기간 (u64)
      nftTierBuf,                            // 1바이트 NFT 등급 (u8)
      autoCompoundBuf                        // 1바이트 자동 복리 여부 (bool)
    ]);
    
    // 초기화된 pool_state 계정 사용
    // 이전에 programId 자체를 pool_state로 사용하는 시도를 했으나 실패했습니다.
    // 올바른 접근법은, 관리자가 키페어로 초기화한 pool_state 계정을 사용하는 것입니다.
    
    console.log('초기화된 pool_state 계정 사용:', poolStateAddress.toString());
    
    // 1. 먼저 user_staking_info 계정을 초기화하는 명령어 생성
    // IDL에서 init_user_staking_info 명령어의 discriminator 가져오기
    const INIT_USER_STAKING_INFO_DISCRIMINATOR = [228, 148, 161, 162, 20, 86, 73, 202]; // IDL에서 "init_user_staking_info" 명령어 식별자
    
    // init_user_staking_info 명령 데이터 (추가 파라미터 없음)
    const initUserStakingInfoData = Buffer.from(INIT_USER_STAKING_INFO_DISCRIMINATOR);
    
    // init_user_staking_info 명령을 위한 계정 배열
    const initUserStakingInfoAccounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },         // user (payer)
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },  // user_staking_info
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ];
    
    // init_user_staking_info 명령어 생성
    const initUserStakingInfoIx = new TransactionInstruction({
      keys: initUserStakingInfoAccounts,
      programId: programId,
      data: initUserStakingInfoData
    });
    
    // 2. 스테이킹 명령을 위한 계정 배열
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },         // owner
      { pubkey: mintPubkey, isSigner: false, isWritable: false },         // nft_mint
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },    // user_nft_account
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },  // escrow_nft_account
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false }, // escrow_authority
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },        // stake_info
      { pubkey: poolStateAddress, isSigner: false, isWritable: true },    // pool_state - 초기화된 계정 사용
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },  // user_staking_info (이미 초기화된 상태)
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // token_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false } // rent
    ];
    
    // 계정 목록 로깅
    console.log('계정 구조:');
    const accountNames = ["owner", "nft_mint", "user_nft_account", "escrow_nft_account", "escrow_authority", "stake_info", "pool_state", "user_staking_info", "system_program", "token_program", "associated_token_program", "rent"];
    accounts.forEach((acc, idx) => {
      console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
    });
    
    // 트랜잭션 명령 생성
    const stakeNftIx = new TransactionInstruction({
      keys: accounts,
      programId: programId,
      data: instructionData
    });
    
    // user_staking_info 계정이 이미 존재하는지 확인
    let userStakingInfoExists = false;
    try {
      const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
      if (userStakingInfoAccount) {
        console.log('user_staking_info 계정이 이미 존재합니다:', userStakingInfoPDA.toString());
        userStakingInfoExists = true;
      }
    } catch (error) {
      console.log('user_staking_info 계정 확인 중 오류:', error.message);
    }
    
    // 계정이 존재하지 않는 경우에만 초기화 명령 추가
    if (!userStakingInfoExists) {
      console.log('user_staking_info 초기화 명령 추가...');
      tx.add(initUserStakingInfoIx);
    } else {
      console.log('user_staking_info 계정이 이미 존재하므로 초기화 건너뜀');
    }
    
    // 트랜잭션에 stakeNft 명령 추가
    tx.add(stakeNftIx);
    
    console.log('트랜잭션 명령 생성 성공');
    
    // 트랜잭션 시뮬레이션을 통한 검증
    try {
      console.log('트랜잭션 시뮬레이션 중...');
      console.log('계정 정보:');
      accounts.forEach((acc, idx) => {
        console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
      });
      
      tx.feePayer = walletPubkey; // 시뮬레이션을 위해 임시 설정
      
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      
      const simulation = await connection.simulateTransaction(tx);
      
      if (simulation.value.err) {
        console.warn('시뮬레이션 오류:', simulation.value.err);
        console.log('시뮬레이션 로그:', simulation.value.logs);
        
        // 오류에서 풀 초기화 관련 메시지 확인
        const logs = simulation.value.logs || [];
        if (logs.some(log => log.includes('AccountNotInitialized') || log.includes('AccountOwnedByWrongProgram'))) {
          console.log('풀 초기화 관련 오류 감지됨. 스테이킹을 시도하지만 실패할 가능성 높음');
          // 여기서 프로그램 개발자에게 문의하도록 안내 메시지를 추가할 수 있음
        }
      } else {
        console.log('시뮬레이션 성공!');
      }
    } catch (simError) {
      console.warn('시뮬레이션 실행 오류:', simError);
      // 시뮬레이션 오류도 무시하고 계속 진행 - 실제 트랜잭션은 여전히 시도
    }
    
    // 최근 블록해시 가져오기
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 트랜잭션 속성 설정
    tx.feePayer = walletPubkey;
    tx.recentBlockhash = blockhash;
    
    // 트랜잭션 직렬화
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('트랜잭션 생성 성공', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // 보상 계산
    const rewardCalculation = calculateEstimatedRewards(nftTier, stakingPeriodNum);
    
    // 프론트엔드용 스테이킹 메타데이터 생성
    const stakingMetadata = {
      walletAddress: wallet,
      mintAddress: mintAddress,
      nftName: nftName,
      stakingPeriod: stakingPeriodNum,
      requestTimestamp: Date.now(),
      nftTier: nftTier,
      rawTierValue: rawTierValue,
      baseRate: rewardCalculation.baseRate,
      longTermBonus: rewardCalculation.longTermBonus,
      totalEstimatedRewards: rewardCalculation.totalRewards,
      averageDailyReward: rewardCalculation.averageDailyReward,
      transactionExpiry: lastValidBlockHeight + 150
    };
    
    // 트랜잭션 시뮬레이션에서 오류가 감지되었지만 계속 진행하는 경우 경고 메시지 추가
    const response = {
      transactionBase64: serializedTransaction.toString('base64'),
      stakingMetadata,
      rewardDetails: {
        nftTier: nftTier,
        rawTierValue: rawTierValue,
        baseRate: rewardCalculation.baseRate,
        longTermBonus: rewardCalculation.longTermBonus,
        totalRewards: rewardCalculation.totalRewards,
        sampleDailyRewards: {
          day1: rewardCalculation.dailyRewards[0],
          day7: rewardCalculation.dailyRewards[6],
          day15: rewardCalculation.dailyRewards.length > 14 ? rewardCalculation.dailyRewards[14] : null,
          day30: rewardCalculation.dailyRewards.length > 29 ? rewardCalculation.dailyRewards[29] : null
        }
      },
      expiresAt: new Date(Date.now() + 120000).toISOString()
    };
    
    // 개발 환경이나 디버깅 목적으로만 추가 정보 제공
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        warning: "pool_state 계정이 올바르게 초기화되지 않아 트랜잭션이 실패할 수 있습니다. 관리자 페이지에서 풀을 초기화해주세요.",
        poolStateAddress: poolStateAddress.toString(),
        poolStateInfo: poolStateAccount ? {
          exists: true, 
          owner: poolStateAccount.owner.toString(), 
          dataSize: poolStateAccount.data?.length || 0
        } : { exists: false },
        adminPage: "/admin/initialize-pool",
        programId: programId.toString()
      };
    }
    
    // 일반 사용자에게도 풀 초기화 필요성 알림
    if (poolStateAccount && poolStateAccount.owner.toString() !== programId.toString()) {
      response.warning = "스테이킹 풀이 아직 초기화되지 않았습니다. 관리자에게 문의하세요.";
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('스테이킹 트랜잭션 준비 중 오류:', error);
    const errorMessage = getErrorMessage(error);
    return res.status(500).json({ 
      error: '스테이킹 트랜잭션 준비 실패: ' + errorMessage,
      errorCode: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}