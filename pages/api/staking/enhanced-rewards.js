/**
 * Enhanced Rewards API Endpoint
 * 
 * Provides detailed information about the enhanced reward system including:
 * - Dynamic time-based multipliers
 * - Collection bonuses
 * - Milestone achievements
 * - Compound streaks
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getNodeEndpoint } from '../../../utils/cluster';
import { PROGRAM_ID } from '../../../utils/staking-helpers/constants';

// Error handling middleware
const withErrorHandling = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('Enhanced rewards API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message || 'Unknown error'
    });
  }
};

/**
 * Enhanced reward details API handler
 */
async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }
  
  const { wallet, mintAddress } = req.query;
  
  if (!wallet) {
    return res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
  }
  
  // Connect to the Solana network
  const connection = new Connection(getNodeEndpoint(), 'confirmed');
  
  try {
    // Create a PublicKey from the wallet address
    const walletPublicKey = new PublicKey(wallet);
    
    // Fetch user staking info
    const userStakingInfo = await getUserStakingInfo(connection, walletPublicKey);
    
    // If a specific mint address is provided, fetch details for that NFT
    let specificNFTDetails = null;
    if (mintAddress) {
      specificNFTDetails = await getStakeAccountInfo(
        connection, 
        new PublicKey(mintAddress)
      );
    }
    
    // Fetch all stake accounts for this user's staked NFTs
    const stakedNFTs = await getStakedNFTDetails(
      connection, 
      userStakingInfo.stakedMints
    );
    
    // Get pool state for general staking parameters
    const poolState = await getPoolState(connection);
    
    // Calculate collection bonus
    const collectionBonus = calculateCollectionBonus(userStakingInfo.stakedCount);
    
    // Return the complete enhanced reward data
    return res.status(200).json({
      success: true,
      data: {
        userStakingInfo: {
          owner: userStakingInfo.owner.toString(),
          stakedCount: userStakingInfo.stakedCount,
          collectionBonus, // Percentage value
          stakedMints: userStakingInfo.stakedMints.map(mint => mint.toString())
        },
        specificNFT: specificNFTDetails,
        stakedNFTs,
        poolParameters: {
          rewardRate: poolState.rewardRate,
          commonMultiplier: poolState.commonMultiplier,
          rareMultiplier: poolState.rareMultiplier,
          epicMultiplier: poolState.epicMultiplier,
          legendaryMultiplier: poolState.legendaryMultiplier,
          longStakingBonus: poolState.longStakingBonus,
          timeMultiplierIncrement: poolState.timeMultiplierIncrement,
          timeMultiplierPeriodDays: poolState.timeMultiplierPeriodDays,
          maxTimeMultiplier: poolState.maxTimeMultiplier
        }
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced reward data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching enhanced reward data',
      error: error.message
    });
  }
}

/**
 * Get user staking info from the blockchain
 */
async function getUserStakingInfo(connection, walletPublicKey) {
  try {
    // Find the PDA for the user staking info account
    const [userStakingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_staking'), walletPublicKey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    );
    
    // Get the account info
    const accountInfo = await connection.getAccountInfo(userStakingPDA);
    
    if (!accountInfo || !accountInfo.data) {
      // No staking info found, return default values
      return {
        owner: walletPublicKey,
        stakedCount: 0,
        stakedMints: [],
        collectionBonus: 0
      };
    }
    
    // Parse account data
    return parseUserStakingData(accountInfo.data);
  } catch (error) {
    console.error('Error fetching user staking info:', error);
    // Return default values on error
    return {
      owner: walletPublicKey,
      stakedCount: 0,
      stakedMints: [],
      collectionBonus: 0
    };
  }
}

/**
 * Get stake account info for a specific NFT
 */
async function getStakeAccountInfo(connection, mintPublicKey) {
  try {
    // Find the PDA for the stake info account
    const [stakePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake'), mintPublicKey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    );
    
    // Get the account info
    const accountInfo = await connection.getAccountInfo(stakePDA);
    
    if (!accountInfo || !accountInfo.data) {
      return null; // Not staked
    }
    
    // Parse stake account data
    return parseStakeAccountData(accountInfo.data);
  } catch (error) {
    console.error('Error fetching stake account info:', error);
    return null;
  }
}

/**
 * Get details for all staked NFTs
 */
async function getStakedNFTDetails(connection, mintAddresses) {
  if (!mintAddresses || mintAddresses.length === 0) {
    return [];
  }
  
  // Fetch stake accounts for all mints in parallel
  const promises = mintAddresses.map(mint => 
    getStakeAccountInfo(connection, mint)
  );
  
  const results = await Promise.all(promises);
  
  // Filter out null results and associate with mint addresses
  return results
    .map((result, index) => {
      if (!result) return null;
      
      return {
        mintAddress: mintAddresses[index].toString(),
        ...result
      };
    })
    .filter(Boolean);
}

/**
 * Get pool state information
 */
async function getPoolState(connection) {
  try {
    // Find the PDA for the pool state account
    const [poolStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool')],
      new PublicKey(PROGRAM_ID)
    );
    
    // Get the account info
    const accountInfo = await connection.getAccountInfo(poolStatePDA);
    
    if (!accountInfo || !accountInfo.data) {
      throw new Error('Pool state account not found');
    }
    
    // Parse pool state data
    return parsePoolStateData(accountInfo.data);
  } catch (error) {
    console.error('Error fetching pool state:', error);
    throw error;
  }
}

/**
 * Calculate collection bonus based on staked count
 */
function calculateCollectionBonus(stakedCount) {
  if (stakedCount >= 21) {
    return 20; // 20% for 21+ NFTs
  } else if (stakedCount >= 11) {
    return 15; // 15% for 11-20 NFTs
  } else if (stakedCount >= 6) {
    return 10; // 10% for 6-10 NFTs
  } else if (stakedCount >= 3) {
    return 5;  // 5% for 3-5 NFTs
  } else {
    return 0;  // No bonus for fewer than 3 NFTs
  }
}

/**
 * Parse user staking data from buffer
 */
function parseUserStakingData(data) {
  try {
    // Skip the 8-byte discriminator
    let offset = 8;
    
    // Extract owner (Pubkey - 32 bytes)
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Extract staked count (u8)
    const stakedCount = data[offset];
    offset += 1;
    
    // Extract staked mints vector
    // First 4 bytes are the vector length
    const stakedMintsCount = data.readUInt32LE(offset);
    offset += 4;
    
    // Extract each mint (Pubkey - 32 bytes each)
    const stakedMints = [];
    for (let i = 0; i < stakedMintsCount; i++) {
      const mint = new PublicKey(data.slice(offset, offset + 32));
      stakedMints.push(mint);
      offset += 32;
    }
    
    // Extract collection bonus (u64)
    const collectionBonus = data.readBigUInt64LE(offset);
    
    return {
      owner,
      stakedCount,
      stakedMints,
      collectionBonus: Number(collectionBonus) / 100 // Convert basis points to percentage
    };
  } catch (error) {
    console.error('Error parsing user staking data:', error);
    throw error;
  }
}

/**
 * Parse stake account data from buffer
 */
function parseStakeAccountData(data) {
  try {
    // Skip the 8-byte discriminator
    let offset = 8;
    
    // Basic data parsing - this should be expanded based on actual data structure
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const mintAddress = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Extract timestamps (i64 values)
    const stakedAt = data.readBigInt64LE(offset);
    offset += 8;
    
    const releaseDate = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract boolean isStaked
    const isStaked = data[offset] === 1;
    offset += 1;
    
    // Extract u8 tier
    const tier = data[offset];
    offset += 1;
    
    // Extract lastClaimTime (i64)
    const lastClaimTime = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract staking period (u64)
    const stakingPeriod = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract auto compound flag
    const autoCompound = data[offset] === 1;
    offset += 1;
    
    // Extract accumulated compound (u64)
    const accumulatedCompound = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract time multiplier fields
    const currentTimeMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    const lastMultiplierUpdate = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract milestone bitmap (u8)
    const milestonesAchieved = data[offset];
    offset += 1;
    
    // Extract next milestone days (u64)
    const nextMilestoneDays = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract compound frequency (u8) 
    const compoundFrequency = data[offset];
    offset += 1;
    
    // Extract compound streak (u16)
    const compoundStreak = data.readUInt16LE(offset);
    offset += 2;
    
    // Extract compound streak multiplier (u64)
    const compoundStreakMultiplier = data.readBigUInt64LE(offset);
    
    // Convert the milestone bitmap to an array of achieved milestones
    const achievedMilestones = [];
    if (milestonesAchieved & 1) achievedMilestones.push(30);  // 30-day milestone
    if (milestonesAchieved & 2) achievedMilestones.push(90);  // 90-day milestone
    if (milestonesAchieved & 4) achievedMilestones.push(180); // 180-day milestone
    if (milestonesAchieved & 8) achievedMilestones.push(365); // 365-day milestone
    
    // Calculate staking duration in days
    const now = Math.floor(Date.now() / 1000);
    const stakingDuration = now - Number(stakedAt);
    const daysStaked = Math.floor(stakingDuration / 86400);
    
    // Convert compoundFrequency to readable format
    let compoundFrequencyLabel;
    switch (compoundFrequency) {
      case 0:
        compoundFrequencyLabel = 'Daily';
        break;
      case 1:
        compoundFrequencyLabel = 'Weekly';
        break;
      case 2:
        compoundFrequencyLabel = 'Monthly';
        break;
      default:
        compoundFrequencyLabel = 'Manual';
        break;
    }
    
    return {
      owner: owner.toString(),
      mintAddress: mintAddress.toString(),
      stakedAt: Number(stakedAt),
      releaseDate: Number(releaseDate),
      isStaked,
      tier,
      tierLabel: ['Common', 'Rare', 'Epic', 'Legendary'][tier] || 'Unknown',
      lastClaimTime: Number(lastClaimTime),
      stakingPeriod: Number(stakingPeriod),
      daysStaked,
      autoCompound,
      accumulatedCompound: Number(accumulatedCompound),
      currentTimeMultiplier: Number(currentTimeMultiplier) / 100, // Convert basis points to percentage
      lastMultiplierUpdate: Number(lastMultiplierUpdate),
      achievedMilestones,
      nextMilestoneDays: Number(nextMilestoneDays),
      compoundFrequency,
      compoundFrequencyLabel,
      compoundStreak,
      compoundStreakMultiplier: Number(compoundStreakMultiplier) / 100, // Convert basis points to percentage
      // Progress to next milestone
      nextMilestone: getNextMilestone(daysStaked),
      progressToNextMilestone: calculateProgressToNextMilestone(daysStaked)
    };
  } catch (error) {
    console.error('Error parsing stake account data:', error);
    throw error;
  }
}

/**
 * Parse pool state data from buffer
 */
function parsePoolStateData(data) {
  try {
    // Skip the 8-byte discriminator
    let offset = 8;
    
    // Extract admin (Pubkey - 32 bytes)
    const admin = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Extract reward rate (u64)
    const rewardRate = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract emergency fee percent (u8)
    const emergencyFeePercent = data[offset];
    offset += 1;
    
    // Extract paused flag (bool)
    const paused = data[offset] === 1;
    offset += 1;
    
    // Extract total staked (u64)
    const totalStaked = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract tier multipliers (u64 each)
    const commonMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    const rareMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    const epicMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    const legendaryMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract long staking bonus (u64)
    const longStakingBonus = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract max NFTs per user (u8)
    const maxNftsPerUser = data[offset];
    offset += 1;
    
    // Extract enhanced staking fields
    const timeMultiplierIncrement = data.readBigUInt64LE(offset);
    offset += 8;
    
    const timeMultiplierPeriodDays = data.readBigUInt64LE(offset);
    offset += 8;
    
    const maxTimeMultiplier = data.readBigUInt64LE(offset);
    
    return {
      admin: admin.toString(),
      rewardRate: Number(rewardRate),
      emergencyFeePercent,
      paused,
      totalStaked: Number(totalStaked),
      commonMultiplier: Number(commonMultiplier) / 100, // Convert basis points to percentage
      rareMultiplier: Number(rareMultiplier) / 100, // Convert basis points to percentage
      epicMultiplier: Number(epicMultiplier) / 100, // Convert basis points to percentage
      legendaryMultiplier: Number(legendaryMultiplier) / 100, // Convert basis points to percentage
      longStakingBonus: Number(longStakingBonus) / 100, // Convert basis points to percentage
      maxNftsPerUser,
      timeMultiplierIncrement: Number(timeMultiplierIncrement) / 100, // Convert basis points to percentage
      timeMultiplierPeriodDays: Number(timeMultiplierPeriodDays),
      maxTimeMultiplier: Number(maxTimeMultiplier) / 100 // Convert basis points to percentage
    };
  } catch (error) {
    console.error('Error parsing pool state data:', error);
    throw error;
  }
}

/**
 * Get the next milestone based on days staked
 */
function getNextMilestone(daysStaked) {
  const milestones = [30, 90, 180, 365];
  
  for (const milestone of milestones) {
    if (daysStaked < milestone) {
      return milestone;
    }
  }
  
  return null; // All milestones achieved
}

/**
 * Calculate progress to next milestone
 */
function calculateProgressToNextMilestone(daysStaked) {
  const nextMilestone = getNextMilestone(daysStaked);
  
  if (!nextMilestone) {
    return 100; // All milestones achieved
  }
  
  // For first milestone
  if (nextMilestone === 30) {
    return Math.min(100, Math.floor((daysStaked / 30) * 100));
  }
  
  // For other milestones
  const prevMilestones = {
    90: 30,
    180: 90,
    365: 180
  };
  
  const prevMilestone = prevMilestones[nextMilestone];
  const progressRange = nextMilestone - prevMilestone;
  const daysAfterPrevMilestone = daysStaked - prevMilestone;
  
  return Math.min(100, Math.floor((daysAfterPrevMilestone / progressRange) * 100));
}

// Export the API endpoint with error handling
export default withErrorHandling(handler);