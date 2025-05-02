// pages/api/getStakingStats.js
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from '../../idl/nft_staking.json';

const { Program, AnchorProvider, web3, BN } = require('@coral-xyz/anchor');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = 'CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu';

export default async function handler(req, res) {
  try {
    const { wallet, nocache } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    const cacheStr = nocache || Date.now();
    console.log(`Fetching staking stats for wallet: ${wallet} (cache: ${cacheStr})`);
    
    // Connect to Solana and create Anchor program
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    const provider = new AnchorProvider(connection, null, { commitment: 'confirmed' });
    const program = new Program(idl, programId, provider);
    
    // Get all NFTs owned by wallet or staked in our program
    // First, get all active stakes from database
    const { data: dbStakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*, nft_tier')
      .eq('wallet_address', wallet)
      .eq('status', 'staked')
      .order('staked_at', { ascending: false });
    
    if (stakingError) {
      console.error('Error fetching staking data:', stakingError);
      return res.status(500).json({ error: 'Failed to fetch staking data' });
    }
    
    // Process each stake and check on-chain status
    const currentDate = new Date();
    let projectedRewards = 0;
    let earnedToDate = 0;
    const activeStakes = [];
    
    for (const stake of dbStakingData || []) {
      try {
        let mintPubkey;
        try {
          mintPubkey = new PublicKey(stake.mint_address);
        } catch (e) {
          console.error('Invalid mint address in DB:', stake.mint_address);
          continue;
        }
        
        // Find stake info PDA using the same seeds as in the IDL
        const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("stake"), mintPubkey.toBuffer()],
          programId
        );
        
        // Try to fetch on-chain stake info
        let onChainStakeInfo = null;
        try {
          onChainStakeInfo = await program.account.StakeInfo.fetch(stakeInfoPDA);
          console.log(`Found on-chain stake info for ${stake.mint_address}`);
        } catch (error) {
          console.log(`No on-chain stake info found for ${stake.mint_address}`);
        }
        
        // Merge on-chain and off-chain data
        let stakingData;
        
        if (onChainStakeInfo) {
          // Use on-chain data as primary source
          const stakedAt = new Date(onChainStakeInfo.stakedAt.toNumber() * 1000);
          const stakingPeriod = onChainStakeInfo.stakingPeriod.toNumber();
          const releaseDate = new Date(stakedAt);
          releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
          
          // Calculate progress
          const totalStakingDuration = releaseDate.getTime() - stakedAt.getTime();
          const elapsedDuration = Math.min(
            currentDate.getTime() - stakedAt.getTime(),
            totalStakingDuration
          );
          const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
          const earnedSoFar = (stake.total_rewards * progressPercentage) / 100;
          
          stakingData = {
            ...stake,
            staked_at: stakedAt.toISOString(),
            release_date: releaseDate.toISOString(),
            staking_period: stakingPeriod,
            progress_percentage: parseFloat(progressPercentage.toFixed(2)),
            earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
            days_remaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24))),
            days_elapsed: Math.min(
              Math.ceil(elapsedDuration / (1000 * 60 * 60 * 24)),
              stakingPeriod
            ),
            is_unlocked: currentDate >= releaseDate,
            onChainStatus: true
          };
        } else {
          // Fall back to database data
          const stakingStartDate = new Date(stake.staked_at);
          const releaseDate = new Date(stake.release_date);
          
          const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
          const elapsedDuration = Math.min(
            currentDate.getTime() - stakingStartDate.getTime(),
            totalStakingDuration
          );
          const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
          const earnedSoFar = (stake.total_rewards * progressPercentage) / 100;
          
          stakingData = {
            ...stake,
            progress_percentage: parseFloat(progressPercentage.toFixed(2)),
            earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
            days_remaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24))),
            days_elapsed: Math.min(
              Math.ceil(elapsedDuration / (1000 * 60 * 60 * 24)),
              stake.staking_period
            ),
            is_unlocked: currentDate >= releaseDate,
            onChainStatus: false
          };
        }
        
        // Add to totals
        projectedRewards += parseFloat(stake.total_rewards);
        earnedToDate += parseFloat(stakingData.earned_so_far);
        
        // Add calculated data to stake
        activeStakes.push(stakingData);
        
      } catch (error) {
        console.error(`Error processing stake ${stake.mint_address}:`, error);
        // Continue with next stake
      }
    }
    
    // Format decimal values
    projectedRewards = parseFloat(projectedRewards.toFixed(2));
    earnedToDate = parseFloat(earnedToDate.toFixed(2));
    
    // Return the processed data with timestamp for tracking freshness
    return res.status(200).json({
      activeStakes,
      stats: {
        totalStaked: activeStakes.length,
        projectedRewards,
        earnedToDate
      },
      fetchTime: new Date().toISOString(),
      message: 'Stats include both on-chain and off-chain data'
    });
  } catch (error) {
    console.error('Error in getStakingStats API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Calculate current APY (Annual Percentage Yield) for a stake
 * @param {Object} stake - Staking data object
 * @returns {number} Annual percentage yield
 */
function calculateCurrentAPY(stake) {
  const dailyRate = stake.daily_reward_rate || 25;
  
  const baseAPY = (dailyRate * 365 / stake.total_rewards) * 100;
  
  let stakingBonus = 0;
  if (stake.staking_period >= 365) stakingBonus = 100;
  else if (stake.staking_period >= 180) stakingBonus = 70;
  else if (stake.staking_period >= 90) stakingBonus = 40;
  else if (stake.staking_period >= 30) stakingBonus = 20;
  
  return parseFloat((baseAPY * (1 + stakingBonus / 100)).toFixed(2));
}