// pages/api/getStakingInfo.js
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { calculateEarnedRewards } from '../../utils/staking';
import idl from '../../idl/nft_staking.json';

const { Program, AnchorProvider } = require('@coral-xyz/anchor');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

export default async function handler(req, res) {
  try {
    const { wallet, mintAddress } = req.query;
    
    // Input validation
    if (!wallet || !mintAddress) {
      return res.status(400).json({ 
        error: 'Wallet address and mint address are required',
        success: false
      });
    }
    
    // Validate wallet address
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        success: false
      });
    }
    
    // Validate mint address
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid mint address format',
        success: false
      });
    }
    
    // Set request timeout
    const requestTimeout = setTimeout(() => {
      return res.status(408).json({
        error: 'Request timeout',
        success: false
      });
    }, 30000);
    
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Create Anchor provider and program - Fixed initialization
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // Create a dummy wallet for provider (since we're only reading)
    const dummyWallet = {
      publicKey: new PublicKey("11111111111111111111111111111111"),
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };
    
    const provider = new AnchorProvider(
      connection, 
      dummyWallet, 
      { commitment: 'confirmed' }
    );
    
    // Initialize the program with the IDL - with error handling
    let program;
    try {
      // IDL을 사용하기 전에 먼저 올바른 구조를 가지고 있는지 확인
      // IDL은 accounts, instructions, types 등의 속성을 가져야 함
      if (!idl || !idl.accounts) {
        console.warn('IDL missing required account definitions');
        throw new Error('Invalid IDL structure');
      }
      
      // StakeInfo 계정 타입이 있는지 확인
      const stakeInfoAcct = idl.accounts.find(acct => acct.name === 'StakeInfo');
      if (!stakeInfoAcct) {
        console.warn('IDL missing StakeInfo account definition');
        throw new Error('StakeInfo account not found in IDL');
      }
      
      // 수동으로 계정 매핑 정보 조회 - Anchor 프로그램이 내부적으로 이 작업을 수행함
      const accountDiscriminators = {};
      idl.accounts.forEach(acct => {
        // discriminator 값이 있는지 확인
        if (acct.discriminator) {
          const discriminatorKey = acct.name;
          accountDiscriminators[discriminatorKey] = Buffer.from(acct.discriminator);
        }
      });
      
      // Anchor 프로그램 초기화
      program = new Program(idl, programId, provider);
      
      // Log available instructions to diagnose the program
      if (program.instruction) {
        const availableInstructions = Object.keys(program.instruction);
        console.log('Available program instructions:', availableInstructions);
      }
      
      if (program.account) {
        console.log('Available program accounts:', Object.keys(program.account));
      }
    } catch (programInitError) {
      console.error('Error initializing Anchor program:', programInitError);
      console.error('프로그램 초기화 실패 - 수동 데이터 처리로 전환합니다');
      // Continue with fallback approach
    }
    
    // Find stake info PDA
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), mintPubkey.toBuffer()],
      programId
    );
    
    // Try to fetch on-chain stake info
    let onChainStakeInfo = null;
    let isStakedOnChain = false;
    
    try {
      // 먼저 계정 데이터를 raw 형태로 가져옴
      const accountInfo = await connection.getAccountInfo(stakeInfoPDA);
      
      if (accountInfo) {
        // 계정이 존재하는지 확인
        console.log('Found stake info account at', stakeInfoPDA.toString());
        console.log('Account owner:', accountInfo.owner.toString());
        console.log('Expected program ID:', programId.toString());
        console.log('Account data length:', accountInfo.data.length);
        
        // 계정 소유자가 프로그램과 일치하는지 확인
        if (accountInfo.owner.equals(programId)) {
          console.log('Account is owned by the staking program.');
          isStakedOnChain = true;
          
          // 프로그램을 통해 데이터 파싱 시도
          if (program && program.account && program.account.stakeInfo) {
            try {
              onChainStakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
              console.log('Successfully parsed stake info via Anchor:', onChainStakeInfo);
            } catch (anchorError) {
              console.error('Failed to parse with Anchor:', anchorError.message);
              
              // 수동 파싱 시도 - StakeInfo 구조 (IDL 기반)
              try {
                // discriminator (8 bytes) 건너뛰기
                const dataWithoutDiscriminator = accountInfo.data.slice(8);
                
                // StakeInfo 구조 수동 파싱
                // owner: 32 bytes (PublicKey)
                const ownerPubkey = new PublicKey(dataWithoutDiscriminator.slice(0, 32));
                
                // mint: 32 bytes (PublicKey)
                const mintPubkey = new PublicKey(dataWithoutDiscriminator.slice(32, 64));
                
                // staked_at: 8 bytes (i64)
                const stakedAt = dataWithoutDiscriminator.readBigInt64LE(64);
                
                // release_date: 8 bytes (i64)
                const releaseDate = dataWithoutDiscriminator.readBigInt64LE(72);
                
                // 나머지 필드 파싱...
                
                // 수동 파싱된 데이터 구성
                onChainStakeInfo = {
                  owner: ownerPubkey,
                  mint: mintPubkey,
                  stakedAt: {
                    toNumber: () => Number(stakedAt)
                  },
                  releaseDate: {
                    toNumber: () => Number(releaseDate)
                  },
                  isStaked: dataWithoutDiscriminator[80] === 1, // 1 byte (bool)
                  // tier: dataWithoutDiscriminator[81], // 1 byte (u8)
                  stakingPeriod: {
                    toNumber: () => {
                      // 출시 날짜 - 스테이킹 시작 날짜를 사용하여 기간 계산
                      const start = Number(stakedAt);
                      const end = Number(releaseDate);
                      return Math.floor((end - start) / (24 * 60 * 60)); // 초 단위를 일 단위로 변환
                    }
                  }
                };
                
                console.log('Manually parsed stake info:', onChainStakeInfo);
              } catch (manualParseError) {
                console.error('Failed manual parsing:', manualParseError.message);
              }
            }
          } else {
            console.log('Anchor program not available, using raw account data');
            // Anchor 프로그램 없이 기본적인 상태만 설정
            isStakedOnChain = true;
          }
        } else {
          console.log('Account exists but is owned by a different program:', 
            accountInfo.owner.toString(), 'instead of', programId.toString());
        }
      } else {
        console.log('No account found at', stakeInfoPDA.toString());
      }
    } catch (error) {
      console.log('Error fetching stake info:', error.message);
    }
    
    // Verify NFT ownership
    console.log('[getStakingInfo] Verifying NFT ownership...');
    let isOwner = false;
    
    try {
      if (isStakedOnChain) {
        isOwner = true;
      } else {
        // Safer token account verification with error handling
        try {
          const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
            mint: mintPubkey
          });
          
          // Safely access the value property
          if (tokenAccounts && tokenAccounts.value && tokenAccounts.value.length > 0) {
            console.log('[getStakingInfo] NFT ownership verified through token accounts for wallet:', wallet);
            isOwner = true;
          } else {
            console.log('[getStakingInfo] No token accounts found for this mint and wallet');
          }
        } catch (tokenError) {
          console.error('[getStakingInfo] Error getting token accounts:', tokenError.message);
          // Fallback to getParsedTokenAccountsByOwner which might be more reliable
          try {
            const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
              mint: mintPubkey
            });
            
            if (parsedTokenAccounts && parsedTokenAccounts.value && parsedTokenAccounts.value.length > 0) {
              console.log('[getStakingInfo] NFT ownership verified through parsed token accounts');
              isOwner = true;
            }
          } catch (parsedTokenError) {
            console.error('[getStakingInfo] Error getting parsed token accounts:', parsedTokenError.message);
          }
        }
      }
    } catch (ownershipError) {
      console.warn('[getStakingInfo] Ownership verification error:', ownershipError);
    }
    
    // Get staking info from database
    const { data, error } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('[getStakingInfo] Database query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch staking info', 
        details: error.message,
        success: false 
      });
    }
    
    // If no staking record found
    if (!data && !isStakedOnChain) {
      return res.status(200).json({ 
        isStaked: false,
        isOwner,
        success: true
      });
    }
    
    // Merge on-chain and off-chain data
    let stakingInfo;
    
    if (isStakedOnChain && onChainStakeInfo) {
      const stakingStartDate = new Date(onChainStakeInfo.stakedAt.toNumber() * 1000);
      const stakingPeriod = onChainStakeInfo.stakingPeriod.toNumber();
      const releaseDate = new Date(stakingStartDate);
      releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
      
      const currentDate = new Date();
      const nftTier = data?.nft_tier || 'COMMON';
      
      const rewardInfo = calculateEarnedRewards(
        nftTier, 
        stakingStartDate, 
        currentDate, 
        stakingPeriod
      );
      
      stakingInfo = {
        wallet_address: onChainStakeInfo.owner.toString(),
        mint_address: onChainStakeInfo.mint.toString(),
        staked_at: stakingStartDate.toISOString(),
        release_date: releaseDate.toISOString(),
        staking_period: stakingPeriod,
        status: 'staked',
        nft_tier: data?.nft_tier || 'COMMON',
        nft_name: data?.nft_name || `SOLARA NFT`,
        total_rewards: data?.total_rewards || rewardInfo.totalRewards,
        daily_reward_rate: data?.daily_reward_rate || rewardInfo.baseRate,
        progress_percentage: rewardInfo.progressPercentage,
        earned_so_far: rewardInfo.earnedRewards,
        remaining_rewards: rewardInfo.remainingRewards,
        days_remaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24))),
        is_unlocked: currentDate >= releaseDate,
        lockup_complete: currentDate >= releaseDate,
        elapsed_days: rewardInfo.elapsedDays,
        onChainData: {
          stakeInfoPDA: stakeInfoPDA.toString(),
          stakedAt: onChainStakeInfo.stakedAt.toNumber(),
          stakingPeriod: stakingPeriod
        }
      };
    } else if (data) {
      const stakingStartDate = new Date(data.staked_at);
      const releaseDate = new Date(data.release_date);
      const currentDate = new Date();
      const stakingPeriod = data.staking_period;
      const nftTier = data.nft_tier || 'COMMON';
      
      const rewardInfo = calculateEarnedRewards(
        nftTier, 
        stakingStartDate, 
        currentDate, 
        stakingPeriod
      );
      
      stakingInfo = {
        ...data,
        progress_percentage: rewardInfo.progressPercentage,
        earned_so_far: rewardInfo.earnedRewards,
        remaining_rewards: rewardInfo.remainingRewards,
        days_remaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24))),
        is_unlocked: currentDate >= releaseDate,
        lockup_complete: currentDate >= releaseDate,
        elapsed_days: rewardInfo.elapsedDays,
      };
    }
    
    // Clean up timeout
    clearTimeout(requestTimeout);
    
    return res.status(200).json({
      isStaked: true,
      stakingInfo,
      isOwner,
      success: true,
      isOnChain: isStakedOnChain
    });
  } catch (error) {
    console.error('[getStakingInfo] Error in getStakingInfo API:', error);
    
    // Provide a more specific error message for the "Cannot read properties of undefined (reading 'size')" error
    if (error.message && error.message.includes("Cannot read properties of undefined (reading 'size')")) {
      return res.status(500).json({ 
        error: 'Error processing token accounts. Please try again.',
        details: 'Token account data structure error',
        success: false
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      success: false
    });
  } finally {
    // Ensure cleanup even in error cases
    if (typeof requestTimeout !== 'undefined') {
      clearTimeout(requestTimeout);
    }
  }
}