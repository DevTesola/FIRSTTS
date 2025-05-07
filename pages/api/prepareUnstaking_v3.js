// pages/api/prepareUnstaking_v3.js
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress 
} from '@solana/spl-token';

// 각 헬퍼 모듈 직접 임포트
import { getErrorMessage, handleTransaction } from '../../utils/staking-helpers/error-handler';
import { PROGRAM_ID, ESCROW_SEED, STAKE_SEED, USER_STAKING_SEED } from '../../utils/staking-helpers/constants';

// 트랜잭션 명령어 식별자는 기존 상수 계속 사용
import { UNSTAKE_NFT_DISCRIMINATOR } from '../../utils/staking';

// 기존 스테이킹 유틸리티에서 일부 함수만 가져오기
import { calculateUnstakingPenalty } from '../../utils/staking';

// 단순한 보상 계산 함수 구현
function calculateEarnedRewards(nftTier, startDate, currentDate, stakingPeriod) {
  // 기본 보상률 설정 (등급에 따라 다름)
  const baseRatePerDay = {
    'COMMON': 10,
    'RARE': 20,
    'EPIC': 35,
    'LEGENDARY': 50
  }[nftTier.toUpperCase()] || 10; // 기본값은 COMMON
  
  // 스테이킹 일수 계산
  const stakingDays = Math.max(1, Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24)));
  
  // 장기 스테이킹 보너스 (30일 이상 스테이킹 시 10% 추가)
  const longTermBonus = stakingPeriod >= 30 ? 1.1 : 1.0;
  
  // 총 보상 계산
  const totalRewards = Math.round(baseRatePerDay * stakingDays * longTermBonus);
  
  return {
    earnedRewards: totalRewards,
    stakingDays,
    baseRatePerDay,
    longTermBonus
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, and staking ID are required',
        success: false 
      });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        success: false 
      });
    }
    
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid mint address format',
        success: false 
      });
    }
    
    console.log(`Fetching staking record ID: ${stakingId}`);
    const { data: stakingRecord, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('id', stakingId)
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (stakingError || !stakingRecord) {
      console.error('Error fetching staking record:', stakingError || 'No record found');
      return res.status(404).json({ 
        error: stakingError ? stakingError.message : 'Staking record not found',
        success: false 
      });
    }
    
    console.log('Found staking record:', stakingRecord);
    
    // Calculate unstaking penalty
    const currentDate = new Date();
    const stakingStartDate = new Date(stakingRecord.staked_at);
    const releaseDate = new Date(stakingRecord.release_date);
    const nftTier = stakingRecord.nft_tier || 'COMMON';
    const stakingPeriod = stakingRecord.staking_period;
    
    // 스테이킹 기간 완료 여부 확인
    const isPremature = currentDate < releaseDate;
    const daysRemaining = isPremature ? Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)) : 0;
    
    // 조기 언스테이킹 허용 - 페널티 계산
    let penaltyInfo;
    if (isPremature) {
      // 조기 언스테이킹 페널티 계산
      const originalRewards = calculateEarnedRewards(nftTier, stakingStartDate, releaseDate, stakingPeriod).earnedRewards;
      const actualRewards = calculateEarnedRewards(nftTier, stakingStartDate, currentDate, stakingPeriod).earnedRewards;
      
      // 최소 일수 요구 (최소 7일 이상 스테이킹해야 언스테이킹 가능)
      const stakingDays = Math.ceil((currentDate - stakingStartDate) / (1000 * 60 * 60 * 24));
      const minStakingDays = 7; // 최소 7일 스테이킹 필요
      
      if (stakingDays < minStakingDays) {
        return res.status(400).json({
          error: `최소 ${minStakingDays}일 이상 스테이킹해야 언스테이킹이 가능합니다. 현재 ${stakingDays}일 스테이킹 되었습니다.`,
          unstakingDetails: {
            isPremature: true,
            releaseDate: releaseDate.toISOString(),
            currentDate: currentDate.toISOString(),
            daysRemaining: daysRemaining,
            stakingDays: stakingDays,
            minStakingDays: minStakingDays,
            canWithdraw: false
          },
          success: false
        });
      }
      
      // 페널티 계산 - 남은 기간에 비례하여 증가 (최대 50%)
      const remainingPercent = daysRemaining / stakingPeriod;
      const penaltyPercent = Math.min(Math.round(remainingPercent * 50), 50); // 최대 50% 페널티
      const penaltyAmount = Math.round(actualRewards * (penaltyPercent / 100));
      const finalReward = actualRewards - penaltyAmount;
      
      console.log('조기 언스테이킹 페널티 계산:', {
        stakingDays,
        daysRemaining,
        originalRewards,
        actualRewards,
        penaltyPercent,
        penaltyAmount,
        finalReward
      });
      
      penaltyInfo = {
        isPremature: true,
        earnedRewards: actualRewards,
        penaltyAmount: penaltyAmount,
        penaltyPercentage: penaltyPercent,
        finalReward: finalReward,
        stakingDays
      };
      
      console.log('조기 언스테이킹 허용 (페널티 적용):', penaltyInfo);
      
    } else {
      // 스테이킹 기간이 완료되었으므로 페널티 없음
      penaltyInfo = {
        isPremature: false,
        earnedRewards: calculateEarnedRewards(nftTier, stakingStartDate, currentDate, stakingPeriod).earnedRewards,
        penaltyAmount: 0,
        penaltyPercentage: 0,
        finalReward: calculateEarnedRewards(nftTier, stakingStartDate, currentDate, stakingPeriod).earnedRewards
      };
    }
    
    console.log('Preparing unstaking transaction...');
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    // 프로그램 ID 설정 - 일관성을 위해 prepareStaking_v3.js와 동일한 방식으로 초기화
    const programId = new PublicKey(PROGRAM_ID);
    
    // Find PDAs based on the actual seeds from your Rust program
    // stakeInfoPDA 생성 코드는 정확함, 수정 불필요
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    // 스테이킹 정보 PDA 계정 존재하는지 확인
    console.log('Stake info PDA:', stakeInfoPDA.toString());
    const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
    
    if (!stakeInfoAccount) {
      console.error('Stake info account does not exist on-chain');
      return res.status(404).json({
        error: '온체인에서 스테이킹 정보를 찾을 수 없습니다. NFT가 올바르게 스테이킹되지 않았을 수 있습니다.',
        success: false
      });
    }
    
    // 계정의 소유자가 프로그램 ID인지 확인 (추가)
    if (!stakeInfoAccount.owner.equals(programId)) {
      console.error('Stake info account is owned by the wrong program:', stakeInfoAccount.owner.toString());
      return res.status(400).json({
        error: '스테이킹 정보 계정이 올바른 프로그램에 의해 소유되지 않았습니다.',
        details: {
          actual: stakeInfoAccount.owner.toString(),
          expected: programId.toString()
        },
        success: false
      });
    }
    
    console.log('Found stake info account on-chain:', {
      address: stakeInfoPDA.toString(),
      owner: stakeInfoAccount.owner.toString(),
      size: stakeInfoAccount.data.length
    });
    
    // StakeInfo 계정 데이터 파싱 시도
    try {
      const stakeInfoData = stakeInfoAccount.data;
      
      // 기본 파싱 - 문서화된 구조를 기반으로 함
      // IDL에 정의된 StakeInfo 구조:
      // 8바이트 discriminator + 32바이트 owner + 32바이트 mint + 
      // 8바이트 staked_at + 8바이트 release_date + 1바이트 is_staked + 
      // 1바이트 tier + 8바이트 last_claim_time + 8바이트 staking_period + 
      // 1바이트 auto_compound + 8바이트 accumulated_compound
      
      if (stakeInfoData.length >= 107) { // 최소 크기 확인
        // Discriminator는 건너뜀 (8바이트)
        const offset = 8;
        
        // 중요 데이터 추출
        const ownerPubkeyBytes = stakeInfoData.slice(offset, offset + 32);
        const mintPubkeyBytes = stakeInfoData.slice(offset + 32, offset + 64);
        const stakedAtTimestampSeconds = stakeInfoData.readBigUInt64LE(offset + 64);
        const releaseTimestampSeconds = stakeInfoData.readBigUInt64LE(offset + 72);
        const isStaked = stakeInfoData[offset + 80] === 1;
        const tier = stakeInfoData[offset + 81];
        const lastClaimTimestampSeconds = stakeInfoData.readBigUInt64LE(offset + 82);
        const stakingPeriodSeconds = stakeInfoData.readBigUInt64LE(offset + 90);
        
        // 날짜 변환
        const stakedAtTimestamp = Number(stakedAtTimestampSeconds) * 1000;
        const releaseTimestamp = Number(releaseTimestampSeconds) * 1000;
        const lastClaimTimestamp = Number(lastClaimTimestampSeconds) * 1000;
        
        const stakedAt = new Date(stakedAtTimestamp);
        const releaseDate = new Date(releaseTimestamp);
        const lastClaimTime = new Date(lastClaimTimestamp);
        
        // 현재 시간과 비교
        const now = new Date();
        const timeRemaining = releaseDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
        const stakingDays = Math.ceil((now - stakedAt) / (1000 * 60 * 60 * 24));
        
        console.log('StakeInfo 계정 분석:', {
          owner: Buffer.from(ownerPubkeyBytes).toString('hex'),
          mint: Buffer.from(mintPubkeyBytes).toString('hex'),
          stakedAt: stakedAt.toISOString(),
          releaseDate: releaseDate.toISOString(),
          isStaked,
          tier,
          lastClaimTime: lastClaimTime.toISOString(),
          stakingPeriodDays: Number(stakingPeriodSeconds) / (24 * 60 * 60),
          currentDate: now.toISOString(),
          timeRemaining: timeRemaining > 0 ? `${daysRemaining}일 남음` : '스테이킹 기간 완료',
          stakingDays,
          canUnstake: true // 조기 언스테이킹 허용
        });
        
        // 온체인 데이터 기반 정보를 제공하지만, 언스테이킹을 차단하지는 않음
        // (조기 언스테이킹 허용)
        if (timeRemaining > 0) {
          console.log(`조기 언스테이킹 허용: 스테이킹 기간이 아직 ${daysRemaining}일 남아있지만 조기 해제 허용`);
          
          // 최소 스테이킹 기간 검증 (최소 7일)
          const minStakingDays = 7;
          if (stakingDays < minStakingDays) {
            console.warn(`최소 스테이킹 기간(${minStakingDays}일) 미달: ${stakingDays}일만 스테이킹됨`);
            // 경고만 로깅하고 계속 진행 (API 로직에서 최종 결정)
          }
        }
      }
    } catch (parseError) {
      console.error('StakeInfo 계정 데이터 파싱 오류:', parseError);
      // 파싱 오류는 무시하고 계속 진행 (정보 제공용)
    }
    
    // escrowAuthorityPDA 생성 방식 수정 - Buffer.from() 추가하여 일관성 확보
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    console.log('Escrow authority PDA:', escrowAuthorityPDA.toString());
    
    // Get user staking info PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );
    
    console.log('User staking info PDA:', userStakingInfoPDA.toString());
    
    // user_staking_info 계정이 존재하는지 확인 (추가)
    const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
    if (!userStakingInfoAccount) {
      console.error('User staking info account does not exist on-chain');
      return res.status(404).json({
        error: '사용자 스테이킹 정보 계정을 찾을 수 없습니다.',
        success: false
      });
    }
    
    // Get escrow token account
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true  // Allow owner off curve
    );
    
    console.log('Escrow token account:', escrowTokenAccount.toString());
    
    // 초기화된 pool_state 계정 주소
    // 관리자가 초기화한 키페어 계정 주소
    const poolStateAddress = new PublicKey('YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu');
    
    // pool_state 계정이 존재하는지 확인
    const poolStateAccount = await connection.getAccountInfo(poolStateAddress);
    
    // 계정이 있고 소유자가 프로그램 ID인지 확인
    if (poolStateAccount) {
      console.log('Pool state account exists, owner:', poolStateAccount.owner.toString());
      console.log('Expected owner (program ID):', programId.toString());
      console.log('Pool initialized correctly:', poolStateAccount.owner.equals(programId));
      
      if (!poolStateAccount.owner.equals(programId)) {
        console.error('Pool state is owned by wrong program');
        return res.status(400).json({
          error: '풀 상태 계정이 올바른 프로그램에 의해 소유되지 않았습니다.',
          success: false
        });
      }
    } else {
      console.log('Pool state account does not exist');
      return res.status(404).json({
        error: '풀 상태 계정이 존재하지 않습니다. 관리자에게 문의하세요.',
        success: false
      });
    }
    
    // IDL에 명시된 대로 계정 준비 - unstake_nft 명령에 필요한 계정만 포함
    // unstake_nft는 스테이킹 트랜잭션보다 더 적은 수의 계정이 필요합니다
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },         // owner
      { pubkey: mintPubkey, isSigner: false, isWritable: false },         // nft_mint
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },    // user_nft_account
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },  // escrow_nft_account
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false }, // escrow_authority
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },        // stake_info
      { pubkey: poolStateAddress, isSigner: false, isWritable: true },    // pool_state
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },  // user_staking_info
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }    // token_program
    ];
    
    // For unstake_nft, there are no arguments, just the discriminator
    const instructionData = Buffer.from(UNSTAKE_NFT_DISCRIMINATOR);
    
    // Create the instruction
    const unstakeInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: instructionData
    });
    
    // Add the instruction to the transaction
    tx.add(unstakeInstruction);
    
    // 계정 정보 로깅
    console.log('계정 구조:');
    const accountNames = [
      "owner", "nft_mint", "user_nft_account", "escrow_nft_account", 
      "escrow_authority", "stake_info", "pool_state", "user_staking_info", 
      "token_program"
    ];
    accounts.forEach((acc, idx) => {
      console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
    });
    
    // 트랜잭션 시뮬레이션
    console.log('트랜잭션 시뮬레이션 중...');
    try {
      // 시뮬레이션을 위해 임시 설정
      tx.feePayer = walletPubkey;
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      
      const simulation = await connection.simulateTransaction(tx);
      
      if (simulation.value.err) {
        console.warn('시뮬레이션 오류:', simulation.value.err);
        console.log('시뮬레이션 로그:', simulation.value.logs);
        
        // 오류 메시지 확인
        const logs = simulation.value.logs || [];
        const errorMessages = [];
        
        if (logs.some(log => log.includes('AccountNotInitialized'))) {
          errorMessages.push('계정이 초기화되지 않았습니다.');
        }
        
        if (logs.some(log => log.includes('AccountOwnedByWrongProgram'))) {
          errorMessages.push('계정이 올바른 프로그램에 의해 소유되지 않았습니다.');
        }
        
        // 스테이킹 기간 관련 오류 감지 (하지만 차단하지 않음 - 조기 언스테이킹 허용)
        const hasStakingPeriodError = logs.some(log => 
          log.includes('Error Code: StakingPeriodNotCompleted') || 
          log.includes('Error Number: 6004')
        );
        
        if (hasStakingPeriodError) {
          const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
          console.warn(`스테이킹 기간이 아직 ${daysRemaining}일 남아있지만, 조기 언스테이킹을 허용합니다. (페널티 적용)`);
          
          errorMessages.push(`조기 언스테이킹: 스테이킹 기간이 아직 ${daysRemaining}일 남아있어 온체인 트랜잭션이 실패할 수 있습니다.`);
          
          // 사용자에게 보여줄 경고 메시지를 로깅하지만, 트랜잭션은 계속 진행
          console.log('경고: 이 트랜잭션은 온체인에서 "StakingPeriodNotCompleted" 오류로 실패할 가능성이 높습니다.');
          console.log('프론트엔드에서 사용자에게 이 가능성을 알려야 합니다.');
        }
        
        // 경고를 표시하지만 처리를 중단하지 않음
        console.warn('시뮬레이션 오류 메시지:', errorMessages);
      } else {
        console.log('시뮬레이션 성공!');
      }
    } catch (simError) {
      console.warn('시뮬레이션 실행 오류:', simError);
    }
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // Set transaction properties
    tx.feePayer = walletPubkey;
    tx.recentBlockhash = blockhash;
    
    // Serialize transaction
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('Unstaking transaction created successfully', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // 조기 언스테이킹 가능성 경고
    const warningMessage = penaltyInfo.isPremature 
      ? `주의: 스테이킹 기간이 ${Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24))}일 남아있어 이 트랜잭션은 실패할 수 있습니다. 조기 언스테이킹은 ${penaltyInfo.penaltyPercentage}%의 페널티가 적용됩니다.`
      : null;
    
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      stakingInfo: stakingRecord,
      unstakingDetails: {
        isPremature: penaltyInfo.isPremature,
        earnedRewards: penaltyInfo.earnedRewards,
        penaltyAmount: penaltyInfo.penaltyAmount,
        penaltyPercentage: penaltyInfo.penaltyPercentage,
        finalReward: penaltyInfo.finalReward,
        transactionExpiry: lastValidBlockHeight + 150,
        canWithdraw: true, // 조기 언스테이킹 허용
        daysRemaining: penaltyInfo.isPremature 
          ? Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)) 
          : 0,
        stakingDays: penaltyInfo.stakingDays || Math.ceil((currentDate - stakingStartDate) / (1000 * 60 * 60 * 24))
      },
      warning: warningMessage,
      note: penaltyInfo.isPremature 
        ? "참고: 온체인 프로그램에서는 스테이킹 기간 완료 전 언스테이킹이 제한되어 있습니다. 프론트엔드에서 이 경고를 사용자에게 표시해야 합니다."
        : null
    });
  } catch (error) {
    console.error('언스테이킹 트랜잭션 준비 중 오류:', error);
    const errorMessage = getErrorMessage(error);
    return res.status(500).json({ 
      error: '언스테이킹 트랜잭션 준비 실패: ' + errorMessage,
      errorCode: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      success: false
    });
  }
}