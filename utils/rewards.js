/**
 * Centralized reward system utilities
 * Integrates reward-related functions used across multiple components
 */

// Set default reward amount (use environment variable or default value)
export const SHARE_REWARD_AMOUNT = parseInt(process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5');

// Constants for staking rewards
export const STAKING_REWARDS_BY_TIER = {
  "Legendary": 2.0,  // 2.0 TESOLA per day
  "Rare": 1.5,       // 1.5 TESOLA per day
  "Uncommon": 1.0,   // 1.0 TESOLA per day
  "Common": 0.5      // 0.5 TESOLA per day
};

// Default daily reward if tier not found
export const DEFAULT_DAILY_REWARD = 0.5;

// Early unstaking penalty percentage
export const EARLY_UNSTAKING_PENALTY_PERCENT = 50;

/**
 * Check if a reward has already been claimed for a specific transaction
 * 
 * @param {Array} rewardHistory - User's reward history array
 * @param {string} reference - Reference ID (transaction signature or NFT ID)
 * @param {string} rewardType - Reward type (tweet, mint_tweet, telegram_share, etc.)
 * @returns {boolean} - Whether reward has already been claimed
 */
export function hasReceivedReward(rewardHistory, reference, rewardType) {
  if (!rewardHistory || !rewardHistory.length || !reference) {
    return false;
  }
  
  // References can have various formats, so check multiple patterns
  const relatedRewards = rewardHistory.filter(reward => {
    // Exact match for reference ID
    const exactMatch = 
      reward.reference_id === reference || 
      reward.tx_signature === reference;
    
    // Match with prefixes (like mint_ID patterns)
    const prefixMatch = reward.reference_id && (
      reward.reference_id.includes(`mint_${reference}`) || 
      reference.includes(`mint_${reward.reference_id}`) ||
      reward.reference_id.includes(`nft_${reference}`) || 
      reference.includes(`nft_${reward.reference_id}`)
    );
    
    return exactMatch || prefixMatch;
  });
  
  if (relatedRewards.length === 0) {
    return false;
  }
  
  // Check reward type
  if (rewardType === 'tweet') {
    // For tweets, check all tweet-related rewards
    return relatedRewards.some(reward => 
      reward.reward_type === 'tweet' || reward.reward_type === 'mint_tweet'
    );
  }
  
  // For other types (telegram, general, etc.)
  return relatedRewards.some(reward => reward.reward_type === rewardType);
}

/**
 * Check reward status for a specific NFT ID
 * 
 * @param {Array} rewardHistory - User's reward history array
 * @param {string} nftId - NFT ID
 * @returns {Object} - Object with reward status for each platform
 */
export function checkNftRewardStatus(rewardHistory, nftId) {
  if (!rewardHistory || !rewardHistory.length || !nftId) {
    return {
      tweet: false,
      mintTweet: false,
      telegram: false,
      collection: false
    };
  }
  
  // Normalize NFT ID (ensure 4 digits with leading zeros)
  const normalizedId = String(nftId).padStart(4, '0');
  
  // Check rewards status for each platform
  const tweetRewarded = rewardHistory.some(reward => 
    reward.reference_id === `nft_tweet_${normalizedId}` && reward.reward_type === 'tweet'
  );
  
  const mintTweetRewarded = rewardHistory.some(reward => 
    reward.reference_id === `mint_${normalizedId}` && reward.reward_type === 'mint_tweet'
  );
  
  const telegramRewarded = rewardHistory.some(reward => 
    reward.reference_id === `nft_telegram_${normalizedId}` && reward.reward_type === 'telegram_share'
  );
  
  const collectionRewarded = rewardHistory.some(reward => 
    reward.reference_id === `collection_${normalizedId}` && reward.reward_type === 'collection_share'
  );
  
  return {
    tweet: tweetRewarded,
    mintTweet: mintTweetRewarded,
    telegram: telegramRewarded,
    collection: collectionRewarded
  };
}

/**
 * Create a share URL for social media platforms
 * 
 * @param {string} platform - Sharing platform (twitter, telegram)
 * @param {Object} data - Data to share (nftId, tier, mintAddress, txSignature, etc.)
 * @returns {string} - Sharing URL
 */
export function createShareUrl(platform, data) {
  if (!platform || !data) {
    return null;
  }
  
  const { nftId, tier, mintAddress, txSignature } = data;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const formattedId = nftId ? String(nftId).padStart(4, '0') : "";
  
  // Create blockchain explorer URL
  const solscanUrl = mintAddress 
    ? `https://solscan.io/token/${mintAddress}?cluster=${network}`
    : txSignature 
      ? `https://solscan.io/tx/${txSignature}?cluster=${network}`
      : `https://solscan.io/address/${process.env.NEXT_PUBLIC_COLLECTION_MINT || ''}?cluster=${network}`;
  
  // Create Magic Eden URL
  const magicEdenUrl = mintAddress
    ? `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`
    : `https://magiceden.io/marketplace/slr?cluster=${network}`;
  
  // Tesola website URL
  const tesolaUrl = nftId
    ? `https://tesola.xyz/solara/${nftId}`
    : `https://tesola.xyz`;
  
  // Telegram community URL
  const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
  
  // Create share text
  let shareText;
  if (nftId && tier) {
    // With NFT information
    shareText = `I just minted SOLARA #${formattedId} – ${tier} tier! 🚀\n\n` +
              `View on Solscan: ${solscanUrl}\n` +
              `View on Magic Eden: ${magicEdenUrl}\n` +
              `Visit: ${tesolaUrl}\n\n`;
  } else {
    // General transaction sharing
    shareText = `Check out my SOLARA transaction! 🚀\n\n` +
              `View on Solscan: ${solscanUrl}\n` +
              `Visit: ${tesolaUrl}\n\n`;
  }
  
  // Add hashtags
  shareText += `#SOLARA #NFT #Solana`;
  
  // Create platform-specific URL
  if (platform === 'twitter') {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  } else if (platform === 'telegram') {
    // For Telegram, add community link
    const telegramText = shareText + `\n\nJoin our community: ${telegramCommunityUrl}`;
    return `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${encodeURIComponent(telegramText)}`;
  }
  
  // Default response
  return null;
}

/**
 * Process staking rewards calculation
 * 
 * @param {Object} stakingData - Staking record with all necessary information
 * @returns {Object} - Calculated rewards information
 */
export function calculateStakingRewards(stakingData) {
  if (!stakingData) {
    return { 
      earnedSoFar: 0,
      progressPercentage: 0,
      projectedTotal: 0,
      dailyRate: DEFAULT_DAILY_REWARD
    };
  }
  
  try {
    // Get parameters from staking data
    const {
      staked_at,
      release_date,
      nft_tier,
      total_rewards,
      daily_reward_rate
    } = stakingData;
    
    // Safety checks
    if (!staked_at || !release_date) {
      throw new Error('Missing staking dates information');
    }
    
    // Parse dates
    const stakingStartDate = new Date(staked_at);
    const releaseDate = new Date(release_date);
    const currentDate = new Date();
    
    // Calculate total staking duration in milliseconds
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    if (totalStakingDuration <= 0) {
      throw new Error('Invalid staking duration');
    }
    
    // Calculate elapsed duration (capped at total duration)
    const elapsedDuration = Math.min(
      currentDate.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    
    // Calculate progress percentage
    const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
    
    // Calculate earned rewards so far
    let earnedSoFar;
    
    // If total_rewards is provided, use it for calculation
    if (total_rewards !== undefined && total_rewards !== null) {
      earnedSoFar = (total_rewards * progressPercentage) / 100;
    } 
    // Otherwise calculate based on tier and daily rate
    else {
      // Get the daily reward rate either from stakingData or from the tier
      const dailyRate = daily_reward_rate || 
                      (nft_tier ? STAKING_REWARDS_BY_TIER[nft_tier] : null) || 
                      DEFAULT_DAILY_REWARD;
      
      // Calculate total duration in days
      const totalDays = totalStakingDuration / (1000 * 60 * 60 * 24);
      
      // Calculate projected total
      const projectedTotal = dailyRate * totalDays;
      
      // Calculate earned so far
      earnedSoFar = (projectedTotal * progressPercentage) / 100;
      
      // Update calculated values
      stakingData.total_rewards = projectedTotal;
      stakingData.daily_reward_rate = dailyRate;
    }
    
    // Format to 2 decimal places
    earnedSoFar = parseFloat(earnedSoFar.toFixed(2));
    
    // Return calculated values
    return {
      earnedSoFar,
      progressPercentage,
      projectedTotal: parseFloat((stakingData.total_rewards || 0).toFixed(2)),
      dailyRate: stakingData.daily_reward_rate || DEFAULT_DAILY_REWARD
    };
  } catch (error) {
    console.error('Error calculating staking rewards:', error);
    return { 
      earnedSoFar: 0,
      progressPercentage: 0,
      projectedTotal: 0,
      dailyRate: DEFAULT_DAILY_REWARD,
      error: error.message
    };
  }
}

/**
 * Calculate early unstaking penalty
 * 
 * @param {Object} stakingData - Staking record with all necessary information
 * @returns {Object} - Penalty information
 */
export function calculateUnstakingPenalty(stakingData) {
  if (!stakingData) {
    return { penalty: 0, penaltyPercentage: 0 };
  }
  
  try {
    const { staked_at, release_date, total_rewards } = stakingData;
    
    // Safety checks
    if (!staked_at || !release_date || total_rewards === undefined) {
      return { penalty: 0, penaltyPercentage: 0 };
    }
    
    // Parse dates
    const stakingStartDate = new Date(staked_at);
    const releaseDate = new Date(release_date);
    const currentDate = new Date();
    
    // If already past release date, no penalty
    if (currentDate >= releaseDate) {
      return { penalty: 0, penaltyPercentage: 0 };
    }
    
    // Calculate remaining time
    const totalDuration = releaseDate.getTime() - stakingStartDate.getTime();
    const remainingTime = releaseDate.getTime() - currentDate.getTime();
    const remainingPercentage = (remainingTime / totalDuration) * 100;
    
    // Calculate penalty based on remaining time
    const penaltyPercentage = (remainingPercentage * EARLY_UNSTAKING_PENALTY_PERCENT) / 100;
    const penalty = (total_rewards * penaltyPercentage) / 100;
    
    return { 
      penalty: parseFloat(penalty.toFixed(2)), 
      penaltyPercentage: parseFloat(penaltyPercentage.toFixed(2)) 
    };
  } catch (error) {
    console.error('Error calculating unstaking penalty:', error);
    return { penalty: 0, penaltyPercentage: 0, error: error.message };
  }
}

/**
 * Claim all available rewards
 * 
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<Object>} - Claim result
 */
export async function claimRewards(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  
  try {
    const response = await fetch('/api/claimRewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet: walletAddress
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to claim rewards');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
}

/**
 * Record a reward
 * 
 * @param {string} walletAddress - User wallet address
 * @param {string} referenceId - Reference ID
 * @param {string} rewardType - Reward type
 * @param {Object} additionalData - Additional data
 * @returns {Promise<Object>} - Reward recording result
 */
export async function recordReward(walletAddress, referenceId, rewardType, additionalData = {}) {
  if (!walletAddress || !referenceId || !rewardType) {
    throw new Error('Missing required parameters: wallet, referenceId, and rewardType are required');
  }
  
  try {
    const response = await fetch('/api/recordTweetReward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet: walletAddress,
        reference_id: referenceId,
        reward_type: rewardType,
        ...additionalData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error processing ${rewardType} reward`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error recording ${rewardType} reward:`, error);
    throw error;
  }
}

/**
 * Format staking period for display
 * 
 * @param {number} days - Number of days
 * @returns {string} - Formatted period string
 */
export function formatStakingPeriod(days) {
  if (!days || days < 1) return "Less than a day";
  
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  
  if (remainingDays === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return `${months} month${months !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}