// pages/api/getStakingInfo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  try {
    const { wallet, mintAddress } = req.query;
    
    if (!wallet || !mintAddress) {
      return res.status(400).json({ error: 'Wallet address and mint address are required' });
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
      // PGRST116 is "no rows returned" error, we handle this differently
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch staking info' });
    }
    
    // If no staking record found
    if (!data) {
      return res.status(200).json({ 
        isStaked: false 
      });
    }
    
    // Calculate progress percentage and earned rewards so far
    const stakingStartDate = new Date(data.staked_at);
    const releaseDate = new Date(data.release_date);
    const currentDate = new Date();
    
    // Calculate total staking duration in milliseconds
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    
    // Calculate elapsed duration (capped at total duration)
    const elapsedDuration = Math.min(
      currentDate.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    
    // Calculate progress percentage
    const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
    
    // Calculate earned rewards so far (linear accrual)
    const earnedSoFar = (data.total_rewards * progressPercentage) / 100;
    
    // Add calculated fields to the staking info
    const stakingInfo = {
      ...data,
      progress_percentage: progressPercentage,
      earned_so_far: parseFloat(earnedSoFar.toFixed(2))
    };
    
    return res.status(200).json({
      isStaked: true,
      stakingInfo
    });
  } catch (error) {
    console.error('Error in getStakingInfo API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}