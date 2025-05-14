/**
 * Staking Analytics Utilities
 * 
 * This module provides functions for analyzing and visualizing staking data
 * to help users understand their staking performance and projections.
 */

/**
 * Calculates projected rewards over time based on current staking portfolio
 * 
 * @param {Array} stakes - Array of active stake objects
 * @param {number} days - Number of days to project (default: 365)
 * @param {boolean} includeBonuses - Whether to include time-based bonuses in projections
 * @returns {Object} Projected rewards data
 */
export function calculateProjectedRewards(stakes, days = 365, includeBonuses = true) {
  if (!stakes || !Array.isArray(stakes) || stakes.length === 0) {
    return {
      totalProjected: 0,
      dailyRate: 0,
      timeline: [],
      byTier: {}
    };
  }

  // Define daily reward rates by tier
  const tierRates = {
    'LEGENDARY': 200,
    'EPIC': 100,
    'RARE': 50,
    'COMMON': 25
  };

  // Initialize rewards tracker
  let dailyRate = 0;
  const timeline = [];
  const byTier = {
    'LEGENDARY': 0,
    'EPIC': 0,
    'RARE': 0,
    'COMMON': 0
  };

  // Calculate daily reward rate for all staked NFTs
  stakes.forEach(stake => {
    const tier = (stake.nft_tier || 'COMMON').toUpperCase();
    const rate = tierRates[tier] || tierRates.COMMON;
    dailyRate += rate;
    byTier[tier] += rate;
  });

  // Generate timeline data points
  let cumulativeReward = 0;
  for (let day = 1; day <= days; day++) {
    // Apply time-based bonuses if enabled
    let dayMultiplier = 1;
    
    if (includeBonuses) {
      // First 7 days: 2x bonus
      if (day <= 7) {
        dayMultiplier = 2;
      }
      // Days 8-14: 1.75x bonus
      else if (day <= 14) {
        dayMultiplier = 1.75;
      }
      // Days 15-30: 1.5x bonus
      else if (day <= 30) {
        dayMultiplier = 1.5;
      }
      // 30+ days: 1.2x bonus
      else if (day <= 90) {
        dayMultiplier = 1.2;
      }
      // 90+ days: 1.4x bonus
      else if (day <= 180) {
        dayMultiplier = 1.4;
      }
      // 180+ days: 1.7x bonus
      else if (day <= 365) {
        dayMultiplier = 1.7;
      }
      // 365+ days: 2x bonus
      else {
        dayMultiplier = 2;
      }
    }

    const dayReward = dailyRate * dayMultiplier;
    cumulativeReward += dayReward;
    
    // Add data point every 30 days or on specific milestone days
    if (day === 1 || day === 7 || day === 14 || day === 30 || day === 90 || 
        day === 180 || day === 365 || day % 30 === 0 || day === days) {
      timeline.push({
        day,
        reward: dayReward,
        cumulative: cumulativeReward,
        multiplier: dayMultiplier
      });
    }
  }

  return {
    totalProjected: cumulativeReward,
    dailyRate,
    timeline,
    byTier
  };
}

/**
 * Calculates staking performance metrics
 * 
 * @param {Array} stakes - Array of active stake objects
 * @returns {Object} Performance metrics
 */
export function calculatePerformanceMetrics(stakes) {
  if (!stakes || !Array.isArray(stakes) || stakes.length === 0) {
    return {
      totalEarned: 0,
      averageDailyEarning: 0,
      bestPerformer: null,
      stakingEfficiency: 0,
      totalStakingDays: 0,
      averageStakingPeriod: 0
    };
  }

  let totalEarned = 0;
  let totalStakingDays = 0;
  let bestPerformer = null;
  let bestPerformanceRate = 0;

  // Process each stake to calculate metrics
  stakes.forEach(stake => {
    const earned = stake.earned_so_far || 0;
    totalEarned += earned;
    
    // Calculate staking duration in days
    const stakedAt = new Date(stake.staked_at);
    const now = new Date();
    const stakingDuration = Math.max(1, Math.ceil((now - stakedAt) / (1000 * 60 * 60 * 24)));
    totalStakingDays += stakingDuration;
    
    // Determine best performing NFT based on daily earning rate
    const dailyRate = earned / stakingDuration;
    if (dailyRate > bestPerformanceRate) {
      bestPerformanceRate = dailyRate;
      bestPerformer = {
        id: stake.id,
        name: stake.nft_name,
        tier: stake.nft_tier,
        image: stake.image_url || stake.image,
        earned,
        stakingDuration,
        dailyRate
      };
    }
  });

  // Calculate average metrics
  const averageDailyEarning = totalStakingDays > 0 ? totalEarned / totalStakingDays : 0;
  const averageStakingPeriod = stakes.length > 0 ? totalStakingDays / stakes.length : 0;
  
  // Calculate staking efficiency (actual vs. theoretical maximum earnings)
  // This is a simplified calculation - in a real app you'd use more factors
  const stakingEfficiency = bestPerformer ? (bestPerformer.dailyRate / getMaxDailyRate(bestPerformer.tier)) * 100 : 0;

  return {
    totalEarned,
    averageDailyEarning,
    bestPerformer,
    stakingEfficiency,
    totalStakingDays,
    averageStakingPeriod
  };
}

/**
 * Get the theoretical maximum daily rate for a given tier
 * 
 * @param {string} tier - NFT tier
 * @returns {number} Maximum daily rate
 */
function getMaxDailyRate(tier) {
  const normalizedTier = (tier || '').toUpperCase();
  
  if (normalizedTier.includes('LEGENDARY')) return 200;
  if (normalizedTier.includes('EPIC')) return 100;
  if (normalizedTier.includes('RARE')) return 50;
  return 25; // Common
}

/**
 * Generates tier distribution data for visualization
 * 
 * @param {Array} stakes - Array of active stake objects
 * @returns {Object} Tier distribution data
 */
export function getTierDistribution(stakes) {
  if (!stakes || !Array.isArray(stakes) || stakes.length === 0) {
    return {
      counts: { LEGENDARY: 0, EPIC: 0, RARE: 0, COMMON: 0 },
      percentages: { LEGENDARY: 0, EPIC: 0, RARE: 0, COMMON: 0 },
      rewardShare: { LEGENDARY: 0, EPIC: 0, RARE: 0, COMMON: 0 }
    };
  }

  // Define daily reward rates by tier
  const tierRates = {
    'LEGENDARY': 200,
    'EPIC': 100,
    'RARE': 50,
    'COMMON': 25
  };

  // Initialize distribution data
  const counts = { LEGENDARY: 0, EPIC: 0, RARE: 0, COMMON: 0 };
  const rewardContribution = { LEGENDARY: 0, EPIC: 0, RARE: 0, COMMON: 0 };
  let totalDaily = 0;

  // Count NFTs by tier and calculate reward contribution
  stakes.forEach(stake => {
    const tier = getTierCategory(stake.nft_tier);
    counts[tier]++;
    
    const rate = tierRates[tier];
    rewardContribution[tier] += rate;
    totalDaily += rate;
  });

  // Calculate percentages
  const totalNFTs = stakes.length;
  const percentages = {};
  const rewardShare = {};
  
  Object.keys(counts).forEach(tier => {
    percentages[tier] = totalNFTs > 0 ? (counts[tier] / totalNFTs) * 100 : 0;
    rewardShare[tier] = totalDaily > 0 ? (rewardContribution[tier] / totalDaily) * 100 : 0;
  });

  return {
    counts,
    percentages,
    rewardShare
  };
}

/**
 * Normalize tier name to one of the standard categories
 * 
 * @param {string} tier - Original tier name
 * @returns {string} Normalized tier category
 */
function getTierCategory(tier) {
  const normalizedTier = (tier || '').toUpperCase();
  
  if (normalizedTier.includes('LEGENDARY')) return 'LEGENDARY';
  if (normalizedTier.includes('EPIC')) return 'EPIC';
  if (normalizedTier.includes('RARE')) return 'RARE';
  return 'COMMON';
}

/**
 * Calculate optimal staking strategy based on current portfolio
 * 
 * @param {Array} stakes - Array of active stake objects
 * @param {Array} unstaked - Array of unstaked NFTs available for staking
 * @returns {Object} Strategy recommendations
 */
export function calculateOptimalStrategy(stakes, unstaked) {
  // This is a simplified recommendation engine - a real one would be more sophisticated
  if (!stakes || !Array.isArray(stakes)) {
    return {
      recommendations: ["Start staking your NFTs to earn TESOLA tokens"],
      suggestedActions: [],
      potentialGains: 0
    };
  }
  
  const recommendations = [];
  const suggestedActions = [];
  let potentialGains = 0;
  
  // 1. Check if user has any stakes expiring soon (in next 7 days)
  const now = new Date();
  const expiringStakes = stakes.filter(stake => {
    if (!stake.release_date) return false;
    const releaseDate = new Date(stake.release_date);
    const daysUntilRelease = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilRelease <= 7 && daysUntilRelease > 0;
  });
  
  if (expiringStakes.length > 0) {
    recommendations.push(`You have ${expiringStakes.length} NFT${expiringStakes.length > 1 ? 's' : ''} reaching optimal restaking time soon.`);
    suggestedActions.push("Consider restaking these NFTs to maintain your earning rate");
    potentialGains += expiringStakes.length * 25; // Simplified calculation
  }
  
  // 2. Check if user has a balanced portfolio (variety of tiers)
  const distribution = getTierDistribution(stakes);
  if (distribution.counts.LEGENDARY === 0 && distribution.counts.EPIC === 0) {
    recommendations.push("Your portfolio lacks higher tier NFTs which offer better rewards.");
    if (unstaked && unstaked.length > 0) {
      // Check if user has higher tier NFTs that aren't staked
      const highTierUnstaked = unstaked.filter(nft => {
        const tier = nft.attributes?.find(attr => attr.trait_type === 'Tier')?.value || '';
        return tier.toUpperCase().includes('LEGENDARY') || tier.toUpperCase().includes('EPIC');
      });
      
      if (highTierUnstaked.length > 0) {
        suggestedActions.push(`Stake your ${highTierUnstaked.length} higher tier NFT${highTierUnstaked.length > 1 ? 's' : ''} for better rewards`);
        potentialGains += highTierUnstaked.length * 100; // Simplified calculation
      } else {
        suggestedActions.push("Consider acquiring higher tier NFTs for better rewards");
      }
    } else {
      suggestedActions.push("Consider acquiring higher tier NFTs for better rewards");
    }
  }
  
  // 3. Check if there's opportunity to stack bonuses
  if (stakes.length > 0) {
    // Check if any stakes are near a bonus threshold
    const nearThreshold = stakes.filter(stake => {
      if (!stake.staked_at) return false;
      const stakedAt = new Date(stake.staked_at);
      const stakingDays = Math.ceil((now - stakedAt) / (1000 * 60 * 60 * 24));
      // Check if close to a bonus threshold (within 5 days)
      return (
        (stakingDays >= 25 && stakingDays < 30) ||
        (stakingDays >= 85 && stakingDays < 90) ||
        (stakingDays >= 175 && stakingDays < 180) ||
        (stakingDays >= 360 && stakingDays < 365)
      );
    });
    
    if (nearThreshold.length > 0) {
      recommendations.push(`You have ${nearThreshold.length} NFT${nearThreshold.length > 1 ? 's' : ''} close to reaching a bonus threshold.`);
      suggestedActions.push("Keep these NFTs staked to receive increased rewards");
      potentialGains += nearThreshold.length * 50; // Simplified calculation
    }
  }
  
  // 4. Default recommendations if none of the above apply
  if (recommendations.length === 0) {
    if (stakes.length === 0) {
      recommendations.push("Start staking your NFTs to earn TESOLA tokens.");
      if (unstaked && unstaked.length > 0) {
        suggestedActions.push(`Stake your ${unstaked.length} available NFT${unstaked.length > 1 ? 's' : ''}`);
        potentialGains = unstaked.length * 25; // Simplified calculation
      }
    } else {
      recommendations.push("Your staking portfolio is performing well!");
      if (unstaked && unstaked.length > 0) {
        suggestedActions.push(`Stake your remaining ${unstaked.length} NFT${unstaked.length > 1 ? 's' : ''} to maximize rewards`);
        potentialGains = unstaked.length * 25; // Simplified calculation
      } else {
        suggestedActions.push("Continue with your current staking strategy");
      }
    }
  }
  
  return {
    recommendations,
    suggestedActions,
    potentialGains
  };
}

/**
 * Generate time series data for historical earnings
 * 
 * @param {Array} stakes - Array of active stake objects
 * @param {number} days - Number of days to include in the history
 * @returns {Array} Daily earnings data
 */
export function generateEarningsTimeSeries(stakes, days = 30) {
  if (!stakes || !Array.isArray(stakes) || stakes.length === 0) {
    return Array(days).fill(0).map((_, index) => ({
      day: index + 1,
      date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000),
      earned: 0,
      cumulative: 0
    }));
  }
  
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Initialize daily earnings data
  const dailyData = Array(days).fill(0).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day: index + 1,
      date,
      earned: 0,
      cumulative: 0
    };
  });
  
  // Define daily reward rates by tier
  const tierRates = {
    'LEGENDARY': 200,
    'EPIC': 100,
    'RARE': 50,
    'COMMON': 25
  };
  
  // Calculate daily earnings for each stake
  stakes.forEach(stake => {
    if (!stake.staked_at) return;
    
    const stakedAt = new Date(stake.staked_at);
    if (stakedAt > now) return; // Future stake, skip
    
    const tier = getTierCategory(stake.nft_tier);
    const baseRate = tierRates[tier];
    
    // Calculate earnings for each day
    dailyData.forEach((day, index) => {
      const currentDate = day.date;
      
      // Skip if staking started after this day
      if (stakedAt > currentDate) return;
      
      // Calculate days staked as of this day
      const daysStaked = Math.ceil((currentDate - stakedAt) / (1000 * 60 * 60 * 24));
      
      // Apply appropriate multiplier based on staking duration
      let multiplier = 1;
      if (daysStaked <= 7) multiplier = 2;
      else if (daysStaked <= 14) multiplier = 1.75;
      else if (daysStaked <= 30) multiplier = 1.5;
      else if (daysStaked <= 90) multiplier = 1.2;
      else if (daysStaked <= 180) multiplier = 1.4;
      else if (daysStaked <= 365) multiplier = 1.7;
      else multiplier = 2;
      
      day.earned += baseRate * multiplier;
    });
  });
  
  // Calculate cumulative earnings
  let cumulative = 0;
  dailyData.forEach(day => {
    cumulative += day.earned;
    day.cumulative = cumulative;
  });
  
  return dailyData;
}

// Export all functions
export default {
  calculateProjectedRewards,
  calculatePerformanceMetrics,
  getTierDistribution,
  calculateOptimalStrategy,
  generateEarningsTimeSeries
};