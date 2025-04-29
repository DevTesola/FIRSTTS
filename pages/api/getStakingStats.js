// pages/api/getStakingStats.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
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
      
      // Return stake with additional calculated fields
      return {
        ...stake,
        progress_percentage: progressPercentage,
        earned_so_far: parseFloat(earnedSoFar.toFixed(2))
      };
    });
    
    // Format decimal values
    projectedRewards = parseFloat(projectedRewards.toFixed(2));
    earnedToDate = parseFloat(earnedToDate.toFixed(2));
    
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