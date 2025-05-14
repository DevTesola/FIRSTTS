/**
 * Staking Service
 * 
 * Centralizes all staking-related business logic and API interactions.
 * This service handles staking operations, reward calculations, and 
 * staking analytics.
 */

import { api, endpoints } from './api';

/**
 * Prepare NFT staking transaction
 * 
 * @param {Object} data - Staking data including wallet and NFT mint addresses
 * @returns {Promise<Object>} - Transaction data for staking
 */
export async function prepareStaking(data) {
  try {
    return await api.post(endpoints.staking.prepare, data);
  } catch (error) {
    console.error('Failed to prepare staking:', error);
    throw error;
  }
}

/**
 * Complete NFT staking process
 * 
 * @param {Object} data - Transaction signature and data
 * @returns {Promise<Object>} - Staking result
 */
export async function completeStaking(data) {
  try {
    return await api.post(endpoints.staking.complete, data);
  } catch (error) {
    console.error('Failed to complete staking:', error);
    throw error;
  }
}

/**
 * Prepare NFT unstaking transaction
 * 
 * @param {Object} data - Unstaking data including wallet and NFT mint addresses
 * @returns {Promise<Object>} - Transaction data for unstaking
 */
export async function prepareUnstaking(data) {
  try {
    return await api.post(endpoints.staking.prepareUnstaking, data);
  } catch (error) {
    console.error('Failed to prepare unstaking:', error);
    throw error;
  }
}

/**
 * Complete NFT unstaking process
 * 
 * @param {Object} data - Transaction signature and data
 * @returns {Promise<Object>} - Unstaking result
 */
export async function completeUnstaking(data) {
  try {
    return await api.post(endpoints.staking.completeUnstaking, data);
  } catch (error) {
    console.error('Failed to complete unstaking:', error);
    throw error;
  }
}

/**
 * Prepare emergency NFT unstaking transaction
 * 
 * @param {Object} data - Emergency unstaking data including wallet and NFT mint addresses
 * @returns {Promise<Object>} - Transaction data for emergency unstaking
 */
export async function prepareEmergencyUnstaking(data) {
  try {
    return await api.post(endpoints.staking.prepareEmergencyUnstaking, data);
  } catch (error) {
    console.error('Failed to prepare emergency unstaking:', error);
    throw error;
  }
}

/**
 * Complete emergency NFT unstaking process
 * 
 * @param {Object} data - Transaction signature and data
 * @returns {Promise<Object>} - Emergency unstaking result
 */
export async function completeEmergencyUnstaking(data) {
  try {
    return await api.post(endpoints.staking.completeEmergencyUnstaking, data);
  } catch (error) {
    console.error('Failed to complete emergency unstaking:', error);
    throw error;
  }
}

/**
 * Initialize token account for staking rewards
 * 
 * @param {Object} data - Wallet data for token account initialization
 * @returns {Promise<Object>} - Token account initialization result
 */
export async function initializeTokenAccount(data) {
  try {
    return await api.post(endpoints.staking.initializeTokenAccount, data);
  } catch (error) {
    console.error('Failed to initialize token account:', error);
    throw error;
  }
}

/**
 * Directly submit a signed transaction
 * 
 * @param {Object} data - Signed transaction data
 * @returns {Promise<Object>} - Transaction submission result
 */
export async function submitTransaction(data) {
  try {
    return await api.post(endpoints.transaction.submitTransaction, data);
  } catch (error) {
    console.error('Failed to submit transaction:', error);
    throw error;
  }
}

/**
 * Get staking information for a wallet
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Object>} - Staking information
 */
export async function getStakingInfo(wallet) {
  try {
    return await api.get(`${endpoints.staking.getInfo}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get staking info:', error);
    throw error;
  }
}

/**
 * Get staking statistics with enhanced data handling
 * 
 * @param {string} wallet - Wallet address to get staking statistics for
 * @param {Object} options - Additional options
 * @param {boolean} options.forceFresh - Whether to bypass cache and get fresh data
 * @param {function} options.onError - Error callback function
 * @returns {Promise<Object>} - Staking statistics and active stakes with normalized data
 */
export async function getStakingStats(wallet, options = {}) {
  try {
    if (!wallet) {
      console.warn('Wallet address is required for getStakingStats');
      return {
        activeStakes: [],
        stats: {
          totalStaked: 0,
          projectedRewards: 0,
          earnedToDate: 0
        }
      };
    }
    
    const { forceFresh = true, onError } = options;
    console.log(`Fetching staking stats for wallet: ${wallet}`);
    
    // Add cache-busting parameter if forceFresh is true
    const cacheParam = forceFresh ? `nocache=${Date.now()}` : '';
    const url = `${endpoints.staking.getStats}?wallet=${wallet}${cacheParam ? `&${cacheParam}` : ''}`;
    
    const data = await api.get(url);
    console.log(`Staking stats loaded - activeStakes count: ${data?.activeStakes?.length || 0}`);
    
    // Normalize the data structure to ensure consistency across components
    // Handle different response formats - either standard or API response format with 'success' field
    const responseData = data.success && data.data ? data.data : data;
    
    if (!responseData || !responseData.activeStakes) {
      console.warn("Invalid staking data format received, using empty default structure");
      return {
        activeStakes: [],
        stats: {
          totalStaked: 0,
          projectedRewards: 0,
          earnedToDate: 0
        }
      };
    }
    
    // Process and normalize active stakes data
    const normalizedActiveStakes = (responseData.activeStakes || [])
      .filter(stake => stake && typeof stake === 'object' && (stake.id || stake.mint_address))
      .map(stake => {
        // Process image fields for consistency
        const imageFields = {};
        
        // Prioritize IPFS images
        if (stake.ipfs_hash) {
          imageFields.image_url = `ipfs://${stake.ipfs_hash}`;
        } else if (stake.image_url && stake.image_url.startsWith('ipfs://')) {
          imageFields.image_url = stake.image_url;
        } else if (stake.image && stake.image.startsWith('ipfs://')) {
          imageFields.image_url = stake.image;
        } else if (stake.nft_image && stake.nft_image.startsWith('ipfs://')) {
          imageFields.image_url = stake.nft_image;
        } else if (stake.metadata?.image && stake.metadata.image.startsWith('ipfs://')) {
          imageFields.image_url = stake.metadata.image;
        }
        
        // Generate IPFS URL from NFT ID if possible and no other IPFS image is available
        if (!imageFields.image_url) {
          // Extract NFT ID from various possible fields
          const id = stake.id || stake.nft_id;
          if (id) {
            // Extract numeric portion if ID is a string
            const numericId = typeof id === 'string' ? id.match(/(\d+)/) : null;
            if (numericId && numericId[1]) {
              const formattedId = String(numericId[1]).padStart(4, '0');
              // Use environment variable for IMAGES_CID
              const COLLECTION_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
              imageFields.image_url = `ipfs://${COLLECTION_IPFS_HASH}/${formattedId}.png`;
            }
          } else {
            // If we still don't have an image URL, use a generated IPFS URL pattern
            // which will be detected and handled by our image components
            imageFields.image_url = `ipfs://placeholder/${Math.random().toString(36).substring(2, 10)}`;
          }
        }
        
        // For any local image URLs in staking context, replace with an IPFS placeholder
        if (imageFields.image_url && imageFields.image_url.startsWith('/')) {
          // Local image paths should be replaced with IPFS placeholder in staking context
          // This will be detected by our image components and handled appropriately
          imageFields.image_url = `ipfs://placeholder/${Math.random().toString(36).substring(2, 10)}`;
        }
        
        // Format NFT ID for consistent display
        let displayId = stake.id;
        if (displayId && typeof displayId === 'string') {
          const match = displayId.match(/(\d+)/);
          if (match && match[1]) {
            displayId = String(match[1]).padStart(4, '0');
          }
        }
        
        // Return normalized stake object
        return {
          id: stake.id || stake.mint_address || `unknown-${Math.random().toString(36).substr(2, 9)}`,
          mint_address: stake.mint_address || stake.id || 'unknown-mint',
          nft_name: stake.nft_name || stake.name || `SOLARA #${displayId || '0000'}`,
          nft_tier: stake.nft_tier || stake.tier || "Common",
          staked_at: stake.staked_at || new Date().toISOString(),
          release_date: stake.release_date || new Date(Date.now() + 30*86400000).toISOString(),
          progress_percentage: stake.progress_percentage || 0,
          earned_so_far: stake.earned_so_far || 0,
          total_rewards: stake.total_rewards || 0,
          auto_compound: stake.auto_compound || false,
          accumulated_compound: stake.accumulated_compound || 0,
          
          // Add image fields with IPFS priority
          ...imageFields,
          
          // Keep original properties
          ...stake
        };
      });
    
    // Make sure stats object is properly structured
    const normalizedStats = responseData.stats || {
      totalStaked: normalizedActiveStakes.length,
      projectedRewards: normalizedActiveStakes.reduce((sum, stake) => sum + (stake.total_rewards || 0), 0),
      earnedToDate: normalizedActiveStakes.reduce((sum, stake) => sum + (stake.earned_so_far || 0), 0),
      collectionBonus: responseData.collectionBonus || 0,
      timeMultiplier: responseData.timeMultiplier || 1
    };
    
    return {
      activeStakes: normalizedActiveStakes,
      stats: normalizedStats
    };
  } catch (error) {
    console.error('Failed to get staking stats:', error);
    
    // Call error handler if provided
    if (typeof onError === 'function') {
      onError(error);
    }
    
    // Return empty data structure on error
    return {
      activeStakes: [],
      stats: {
        totalStaked: 0,
        projectedRewards: 0,
        earnedToDate: 0
      },
      error: error.message || "Failed to load staking data"
    };
  }
}

/**
 * Get staked NFTs for a wallet
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Array>} - Array of staked NFT objects
 */
export async function getStakedNFTs(wallet) {
  try {
    return await api.get(`${endpoints.staking.getNFTs}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get staked NFTs:', error);
    throw error;
  }
}

/**
 * Get unstaked NFTs for a wallet
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Array>} - Array of unstaked NFT objects
 */
export async function getUnstakedNFTs(wallet) {
  try {
    return await api.get(`${endpoints.staking.getUserNFTs}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get unstaked NFTs:', error);
    throw error;
  }
}

/**
 * Calculate estimated rewards for an NFT
 * 
 * @param {Object} nft - NFT object with attributes
 * @param {number} stakingDuration - Duration in days
 * @returns {number} - Estimated rewards
 */
export function calculateEstimatedRewards(nft, stakingDuration = 30) {
  // Get NFT tier
  const tier = nft.attributes?.find(attr => attr.trait_type === 'Tier')?.value || 'Common';
  
  // Base rewards per day
  let baseReward = 10;
  
  // Tier multipliers
  const tierMultipliers = {
    'Legendary': 3.0,
    'Epic': 2.0,
    'Rare': 1.5,
    'Common': 1.0
  };
  
  // Get multiplier based on tier (default to 1.0)
  const multiplier = tierMultipliers[tier] || 1.0;
  
  // Calculate total rewards
  return baseReward * multiplier * stakingDuration;
}

/**
 * Get rewards for a wallet
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Object>} - Rewards information
 */
export async function getRewards(wallet) {
  try {
    return await api.get(`${endpoints.rewards.getRewards}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get rewards:', error);
    throw error;
  }
}

/**
 * Prepare a transaction for claiming rewards on-chain
 *
 * @param {Object} data - Data object with wallet and mintAddress
 * @returns {Promise<Object>} - Transaction data for claiming rewards
 */
export async function prepareClaimRewards(data) {
  try {
    return await api.post(endpoints.rewards.prepareClaimRewards, data);
  } catch (error) {
    console.error('Failed to prepare claim rewards transaction:', error);
    throw error;
  }
}

/**
 * Complete the claim rewards process after on-chain transaction
 *
 * @param {Object} data - Transaction signature and related data
 * @returns {Promise<Object>} - Claim result
 */
export async function completeClaimRewards(data) {
  try {
    return await api.post(endpoints.rewards.completeClaimRewards, data);
  } catch (error) {
    console.error('Failed to complete claim rewards process:', error);
    throw error;
  }
}

/**
 * Claim available rewards (deprecated - use prepareClaimRewards and completeClaimRewards for on-chain claims)
 *
 * @param {Object} data - Claim data including wallet
 * @returns {Promise<Object>} - Claim result
 */
export async function claimRewards(data) {
  try {
    return await api.post(endpoints.rewards.claimRewards, data);
  } catch (error) {
    console.error('Failed to claim rewards:', error);
    throw error;
  }
}

/**
 * Record social share for bonus rewards
 * 
 * @param {Object} data - Share data including wallet and platform
 * @returns {Promise<Object>} - Share result
 */
export async function recordSocialShare(data) {
  try {
    return await api.post(endpoints.rewards.recordShare, data);
  } catch (error) {
    console.error('Failed to record social share:', error);
    throw error;
  }
}

/**
 * Generate referral code
 * 
 * @param {Object} data - User wallet data
 * @returns {Promise<Object>} - Referral code result
 */
export async function generateReferralCode(data) {
  try {
    return await api.post(endpoints.referral.generateCode, data);
  } catch (error) {
    console.error('Failed to generate referral code:', error);
    throw error;
  }
}

/**
 * Register using a referral code
 * 
 * @param {Object} data - Referral data including code and user wallet
 * @returns {Promise<Object>} - Registration result
 */
export async function registerReferral(data) {
  try {
    return await api.post(endpoints.referral.registerReferral, data);
  } catch (error) {
    console.error('Failed to register referral:', error);
    throw error;
  }
}

/**
 * Claim referral rewards
 * 
 * @param {Object} data - Claim data including user wallet
 * @returns {Promise<Object>} - Claim result
 */
export async function claimReferralRewards(data) {
  try {
    return await api.post(endpoints.referral.claimReferralRewards, data);
  } catch (error) {
    console.error('Failed to claim referral rewards:', error);
    throw error;
  }
}

/**
 * Get referral statistics for a wallet
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Object>} - Referral statistics
 */
export async function getReferralStats(wallet) {
  try {
    return await api.get(`${endpoints.referral.getReferralStats}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get referral stats:', error);
    throw error;
  }
}

/**
 * Initialize user social activity account
 * 
 * @param {Object} data - Social profile data
 * @returns {Promise<Object>} - Initialization result
 */
export async function initSocialActivity(data) {
  try {
    return await api.post(endpoints.social.initSocialActivity, data);
  } catch (error) {
    console.error('Failed to initialize social activity:', error);
    throw error;
  }
}

/**
 * Get social activity status for a user
 * 
 * @param {string} wallet - Wallet address
 * @returns {Promise<Object>} - Social activity status
 */
export async function getSocialStatus(wallet) {
  try {
    return await api.get(`${endpoints.social.getSocialStatus}?wallet=${wallet}`);
  } catch (error) {
    console.error('Failed to get social status:', error);
    throw error;
  }
}

export default {
  prepareStaking,
  completeStaking,
  prepareUnstaking,
  completeUnstaking,
  prepareEmergencyUnstaking,
  completeEmergencyUnstaking,
  initializeTokenAccount,
  submitTransaction,
  getStakingInfo,
  getStakingStats,
  getStakedNFTs,
  getUnstakedNFTs,
  calculateEstimatedRewards,
  getRewards,
  claimRewards,
  prepareClaimRewards,
  completeClaimRewards,
  recordSocialShare,
  generateReferralCode,
  registerReferral,
  claimReferralRewards,
  getReferralStats,
  initSocialActivity,
  getSocialStatus
};