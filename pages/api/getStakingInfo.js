// pages/api/getStakingInfo.js
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { calculateEarnedRewards } from '../../utils/staking';
import { initializeStakingProgram } from '../../shared/utils/program-initializer';

const { AnchorProvider } = require('@coral-xyz/anchor');

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
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Setup provider
    const provider = new AnchorProvider(
      connection, 
      { publicKey: walletPubkey }, // Read-only wallet
      { commitment: 'confirmed' }
    );
    
    // Initialize Anchor program
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // Initialize the program with the updated IDL using specialized initializer
    let program;
    try {
      // 프로그램 초기화 유틸리티 사용
      program = initializeStakingProgram({
        connection,
        provider,
        useUpdatedIdl: true,
        enableLogs: true
      });
      
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
                
                // is_staked: 1 byte (bool)
                const isStaked = dataWithoutDiscriminator[80] === 1;
                
                // tier: 1 byte (u8)
                const tier = dataWithoutDiscriminator[81];
                
                // last_claim_time: 8 bytes (i64)
                const lastClaimTime = dataWithoutDiscriminator.readBigInt64LE(82);
                
                // staking_period: 8 bytes (u64)
                const stakingPeriod = dataWithoutDiscriminator.readBigUInt64LE(90);
                
                // 간소화된 StakeInfo 구조 생성
                onChainStakeInfo = {
                  owner: ownerPubkey,
                  mint: mintPubkey,
                  stakedAt: stakedAt,
                  releaseDate: releaseDate,
                  isStaked: isStaked,
                  tier: tier,
                  lastClaimTime: lastClaimTime,
                  stakingPeriod: stakingPeriod,
                };
                
                console.log('Manually parsed stake info:', onChainStakeInfo);
              } catch (parseError) {
                console.error('Failed to manually parse account data:', parseError);
              }
            }
          }
        }
      } else {
        console.log('No account found at', stakeInfoPDA.toString());
      }
    } catch (err) {
      console.error('Error fetching on-chain stake info:', err);
    }
    
    // Check if user owns this NFT
    console.log('[getStakingInfo] Verifying NFT ownership...');
    let ownsNFT = false;
    
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { mint: mintPubkey }
      );
      
      ownsNFT = tokenAccounts.value.length > 0 && 
                tokenAccounts.value.some(account => 
                  account.account.data.parsed.info.tokenAmount.uiAmount === 1);
                  
      if (ownsNFT) {
        console.log(`[getStakingInfo] NFT ownership verified through token accounts for wallet: ${wallet}`);
      } else {
        console.log(`[getStakingInfo] User does not directly own this NFT in their wallet: ${wallet}`);
      }
    } catch (err) {
      console.error('Error verifying NFT ownership:', err);
    }
    
    // Check Supabase for stake info
    let supabaseStakeInfo = null;
    
    try {
      const { data, error } = await supabase
        .from('staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .single();
        
      if (error) {
        console.error('Supabase query error:', error);
      }
      
      if (data) {
        supabaseStakeInfo = data;
        console.log('Supabase stake info found:', data);
      }
    } catch (err) {
      console.error('Error querying Supabase:', err);
    }
    
    // Determine if NFT is staked
    const isStaked = isStakedOnChain || (supabaseStakeInfo && supabaseStakeInfo.is_staked);
    
    // Prepare response data
    let responseData = {
      isStaked: isStaked,
      ownsNFT: ownsNFT,
      mintAddress: mintAddress
    };
    
    // If staked, include staking info
    if (isStaked) {
      // Combine on-chain and off-chain data, prioritizing on-chain data
      let stakedAt, releaseDate, stakingPeriod, tier;
      
      if (onChainStakeInfo) {
        // Convert BigInt to Number for JSON serialization
        stakedAt = Number(onChainStakeInfo.stakedAt);
        releaseDate = Number(onChainStakeInfo.releaseDate);
        stakingPeriod = Number(onChainStakeInfo.stakingPeriod);
        tier = onChainStakeInfo.tier;
      } else if (supabaseStakeInfo) {
        stakedAt = new Date(supabaseStakeInfo.staked_at).getTime();
        releaseDate = new Date(supabaseStakeInfo.release_date).getTime();
        stakingPeriod = supabaseStakeInfo.staking_period;
        tier = supabaseStakeInfo.tier;
      }
      
      // Calculate progress and earned rewards
      const now = Date.now();
      const totalDuration = releaseDate - stakedAt;
      const elapsed = Math.max(0, now - stakedAt);
      const progressPercentage = (elapsed / totalDuration) * 100;
      
      // Get tier multiplier based on tier value
      let tierMultiplier = 1; // Default
      switch (tier) {
        case 3: // LEGENDARY
          tierMultiplier = 8;
          break;
        case 2: // EPIC
          tierMultiplier = 4;
          break;
        case 1: // RARE
          tierMultiplier = 2;
          break;
        case 0: // COMMON
        default:
          tierMultiplier = 1;
          break;
      }
      
      // Calculate rewards based on tier, staking period and elapsed time
      const baseRewardRate = 25; // 25 TESOLA per day for common tier
      const dailyReward = baseRewardRate * tierMultiplier;
      const totalRewards = dailyReward * (stakingPeriod / 86400000); // Convert ms to days
      const earnedSoFar = calculateEarnedRewards(
        stakedAt,
        now,
        releaseDate,
        totalRewards
      );
      
      // Add staking info to response
      responseData.stakingInfo = {
        staked_at: new Date(stakedAt).toISOString(),
        release_date: new Date(releaseDate).toISOString(),
        staking_period: stakingPeriod,
        tier: tier,
        tier_multiplier: tierMultiplier,
        progress_percentage: progressPercentage,
        earned_so_far: Math.floor(earnedSoFar), // Round down to integer
        total_rewards: totalRewards,
        is_unlocked: now >= releaseDate
      };
    }
    
    // Clear timeout
    clearTimeout(requestTimeout);
    
    // Return response
    return res.status(200).json({
      success: true,
      ...responseData
    });
    
  } catch (error) {
    console.error('Error in getStakingInfo:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      success: false
    });
  }
}