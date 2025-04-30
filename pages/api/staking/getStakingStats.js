import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API to fetch user's staking statistics
 * Provides active staking records and overall staking metrics
 */
export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log(`Fetching staking stats for wallet: ${wallet}`);
    
    // Get active staking records
    const { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('status', 'staked')
      .order('staked_at', { ascending: false });
    
    if (stakingError) {
      console.error('Error fetching staking data:', stakingError);
      return res.status(500).json({ error: 'Failed to fetch staking data' });
    }
    
    // Process staking data to add calculated fields
    const currentDate = new Date();
    let projectedRewards = 0;
    let earnedToDate = 0;
    
    const activeStakes = stakingData.map(stake => {
      const stakingStartDate = new Date(stake.staked_at);
      const releaseDate = new Date(stake.release_date);
      
      // Calculate total staking duration in milliseconds
      const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
      
      // Calculate elapsed duration (capped at total duration)
      const elapsedDuration = Math.min(
        currentDate.getTime() - stakingStartDate.getTime(),
        totalStakingDuration
      );
      
      // Calculate progress percentage
      const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
      
      // Calculate earned rewards so far
      const earnedSoFar = (stake.total_rewards * progressPercentage) / 100;
      
      // Add to totals
      projectedRewards += parseFloat(stake.total_rewards);
      earnedToDate += parseFloat(earnedSoFar);
      
      // Calculate days remaining
      const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
      
      // Determine if the staking period is complete
      const isUnlocked = currentDate >= releaseDate;
      
      // Return stake with additional calculated fields
      return {
        ...stake,
        progress_percentage: parseFloat(progressPercentage.toFixed(2)),
        earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
        days_remaining: daysRemaining,
        is_unlocked: isUnlocked
      };
    });
    
    // Format decimal values
    projectedRewards = parseFloat(projectedRewards.toFixed(2));
    earnedToDate = parseFloat(earnedToDate.toFixed(2));
    
    // If no stakes are found, try to generate mock data for testing
    if (activeStakes.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No staking data found, generating mock data for testing');
      
      // This code only runs in development mode for testing UI
      const mockStats = generateMockStakingData(wallet);
      
      return res.status(200).json({
        activeStakes: mockStats.activeStakes,
        stats: mockStats.stats,
        isMockData: true // Flag to indicate this is mock data
      });
    }
    
    // Return the processed data
    return res.status(200).json({
      activeStakes,
      stats: {
        totalStaked: activeStakes.length,
        projectedRewards,
        earnedToDate
      }
    });
  } catch (error) {
    console.error('Error in getStakingStats API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate mock staking data for testing purposes
 * @param {string} wallet - Wallet address
 * @returns {Object} Object with activeStakes and stats
 */
function generateMockStakingData(wallet) {
  // Create 1-3 mock staked NFTs
  const mockStakes = [];
  const tiers = [
    { name: 'Legendary', dailyRate: 200 },
    { name: 'Epic', dailyRate: 100 },
    { name: 'Rare', dailyRate: 50 },
    { name: 'Common', dailyRate: 25 }
  ];
  
  // Hash the wallet address for consistent results
  const hash = Array.from(wallet).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const stakesCount = (hash % 3) + 1; // 1-3 stakes
  
  let totalProjected = 0;
  let totalEarned = 0;
  
  for (let i = 0; i < stakesCount; i++) {
    // Generate a unique ID based on wallet and index
    const id = ((hash + i) % 999) + 1;
    
    // Select a tier based on wallet hash (weighted for testing)
    const tierIndex = (hash + i) % 4;
    const tier = tiers[tierIndex];
    
    // Create varied staking dates and periods
    const now = new Date();
    
    // Staking start date between 1-60 days ago
    const daysAgo = ((hash + i * 13) % 60) + 1;
    const stakingStartDate = new Date(now);
    stakingStartDate.setDate(stakingStartDate.getDate() - daysAgo);
    
    // Staking period between 30-365 days
    const stakingPeriod = [30, 90, 180, 365][((hash + i * 7) % 4)];
    const releaseDate = new Date(stakingStartDate);
    releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
    
    // Calculate rewards
    const totalRewards = tier.dailyRate * stakingPeriod;
    
    // Calculate progress
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    const elapsedDuration = Math.min(
      now.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
    const earnedSoFar = (totalRewards * progressPercentage) / 100;
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24)));
    
    // Mock stake object
    const mockStake = {
      id: `mock-stake-${i}-${id}`,
      wallet_address: wallet,
      mint_address: `mock${id}${wallet.substr(0, 8)}`,
      nft_name: `SOLARA #${id}`,
      nft_tier: tier.name,
      staking_period: stakingPeriod,
      staked_at: stakingStartDate.toISOString(),
      release_date: releaseDate.toISOString(),
      total_rewards: totalRewards,
      daily_reward_rate: tier.dailyRate,
      status: 'staked',
      
      // Calculated fields
      progress_percentage: parseFloat(progressPercentage.toFixed(2)),
      earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
      days_remaining: daysRemaining,
      is_unlocked: now >= releaseDate
    };
    
    mockStakes.push(mockStake);
    totalProjected += totalRewards;
    totalEarned += earnedSoFar;
  }
  
  return {
    activeStakes: mockStakes,
    stats: {
      totalStaked: mockStakes.length,
      projectedRewards: parseFloat(totalProjected.toFixed(2)),
      earnedToDate: parseFloat(totalEarned.toFixed(2))
    }
  };
}