// pages/api/getStakingInfo.js
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { calculateEarnedRewards } from './reward-calculator';
import idl from '../../idl/nft_staking.json';

const { Program, AnchorProvider } = require('@coral-xyz/anchor');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = 'CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu';

export default async function handler(req, res) {
  try {
    const { wallet, mintAddress } = req.query;
    
    if (!wallet || !mintAddress) {
      return res.status(400).json({ 
        error: 'Wallet address and mint address are required',
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
    
    // Initialize the program with the IDL fetched from on-chain
    const program = new Program(idl, programId, provider);
    
    // Log available instructions to diagnose the program
    const availableInstructions = Object.keys(program.instruction);
    console.log('Available program instructions:', availableInstructions);
    console.log('Available program accounts:', Object.keys(program.account));
    
    // Find stake info PDA
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), mintPubkey.toBuffer()],
      programId
    );
    
    // Try to fetch on-chain stake info
    let onChainStakeInfo = null;
    let isStakedOnChain = false;
    
    try {
      onChainStakeInfo = await program.account.StakeInfo.fetch(stakeInfoPDA);
      isStakedOnChain = true;
      console.log('Found on-chain stake info:', onChainStakeInfo);
    } catch (error) {
      console.log('No on-chain stake info found:', error.message);
    }
    
    // Verify NFT ownership
    console.log('[getStakingInfo] Verifying NFT ownership...');
    let isOwner = false;
    
    try {
      if (isStakedOnChain) {
        isOwner = true;
      } else {
        const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
          mint: mintPubkey
        });
        
        if (tokenAccounts.value.length > 0) {
          console.log('[getStakingInfo] NFT ownership verified through token accounts for wallet:', wallet);
          isOwner = true;
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
    
    return res.status(200).json({
      isStaked: true,
      stakingInfo,
      isOwner,
      success: true,
      isOnChain: isStakedOnChain
    });
  } catch (error) {
    console.error('[getStakingInfo] Error in getStakingInfo API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      success: false
    });
  }
}