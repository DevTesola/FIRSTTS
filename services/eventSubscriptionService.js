/**
 * Solana Event Subscription Service
 *
 * Handles real-time subscriptions to on-chain program events for NFT staking
 */

// 중요: PublicKey를 반드시 가장 먼저 임포트하여 가용성 보장
import * as web3 from '@solana/web3.js';
const { PublicKey } = web3;
// Fix import path to use shared/constants
import { PROGRAM_ID } from '../shared/constants/program-ids';
import { ACCOUNT_DISCRIMINATORS as DISCRIMINATORS } from '../shared/constants/discriminators';
import { isClient } from '../utils/clientSideUtils';

// Collection of active subscriptions
const activeSubscriptions = new Map();

/**
 * Subscribe to account changes for a specific staking account
 * 
 * @param {Object} connection - Solana connection object
 * @param {string} mintAddress - NFT mint address
 * @param {function} callback - Function to call when updates occur
 * @returns {string} Subscription ID
 */
export function subscribeToStakeAccount(connection, mintAddress, callback) {
  if (!isClient || !connection || !mintAddress) {
    console.warn('Cannot subscribe: missing parameters or not in client');
    return null;
  }
  
  try {
    // Create the stake account PDA
    const [stakeAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake'), new PublicKey(mintAddress).toBuffer()],
      new PublicKey(PROGRAM_ID)
    );
    
    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      stakeAccountPda,
      (accountInfo) => {
        // Extract data from the account
        try {
          // Check if the account is a stake info account
          if (accountInfo.data.length > 8 &&
              accountInfo.data.slice(0, 8).equals(DISCRIMINATORS.STAKE_INFO)) {
            
            // Account exists and is a stake info account
            // Parse the data and call the callback
            const data = parseStakeAccountData(accountInfo.data);
            if (callback && typeof callback === 'function') {
              callback({
                type: 'stake_update',
                mintAddress,
                data
              });
            }
          }
        } catch (error) {
          console.error('Error processing stake account update:', error);
        }
      },
      'confirmed'
    );
    
    // Store the subscription
    activeSubscriptions.set(mintAddress, {
      id: subscriptionId,
      type: 'stake_account',
      connection
    });
    
    return subscriptionId;
  } catch (error) {
    console.error('Error subscribing to stake account:', error);
    return null;
  }
}

/**
 * Subscribe to user staking info account changes
 * 
 * @param {Object} connection - Solana connection object
 * @param {string} walletAddress - User wallet address
 * @param {function} callback - Function to call when updates occur
 * @returns {string} Subscription ID
 */
export function subscribeToUserStakingInfo(connection, walletAddress, callback) {
  if (!isClient || !connection || !walletAddress) {
    console.warn('Cannot subscribe: missing parameters or not in client');
    return null;
  }
  
  try {
    // Create the user staking info PDA
    const [userStakingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_staking'), new PublicKey(walletAddress).toBuffer()],
      new PublicKey(PROGRAM_ID)
    );
    
    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      userStakingPda,
      (accountInfo) => {
        // Extract data from the account
        try {
          // Check if the account is a user staking info account
          if (accountInfo.data.length > 8 &&
              accountInfo.data.slice(0, 8).equals(DISCRIMINATORS.USER_STAKING_INFO)) {
            
            // Account exists and is a user staking info account
            // Parse the data and call the callback
            const data = parseUserStakingData(accountInfo.data);
            if (callback && typeof callback === 'function') {
              callback({
                type: 'user_staking_update',
                walletAddress,
                data
              });
            }
          }
        } catch (error) {
          console.error('Error processing user staking update:', error);
        }
      },
      'confirmed'
    );
    
    // Store the subscription
    activeSubscriptions.set(`user_${walletAddress}`, {
      id: subscriptionId,
      type: 'user_staking',
      connection
    });
    
    return subscriptionId;
  } catch (error) {
    console.error('Error subscribing to user staking info:', error);
    return null;
  }
}

/**
 * Subscribe to program account changes for any staking activity
 * 
 * @param {Object} connection - Solana connection object
 * @param {function} callback - Function to call when updates occur
 * @returns {string} Subscription ID
 */
export function subscribeToStakingProgram(connection, callback) {
  if (!isClient || !connection) {
    console.warn('Cannot subscribe: missing parameters or not in client');
    return null;
  }
  
  try {
    // Subscribe to program account changes
    const subscriptionId = connection.onProgramAccountChange(
      new PublicKey(PROGRAM_ID),
      (accountInfo, context) => {
        // Determine the account type and handle accordingly
        try {
          if (!accountInfo.accountInfo.data || accountInfo.accountInfo.data.length < 8) {
            return; // Not enough data to identify account type
          }
          
          const accountDiscriminator = accountInfo.accountInfo.data.slice(0, 8);
          let type = null;
          let data = null;
          
          // Identify account type by discriminator
          if (accountDiscriminator.equals(DISCRIMINATORS.STAKE_INFO)) {
            type = 'stake_info';
            data = parseStakeAccountData(accountInfo.accountInfo.data);
          } else if (accountDiscriminator.equals(DISCRIMINATORS.USER_STAKING_INFO)) {
            type = 'user_staking_info';
            data = parseUserStakingData(accountInfo.accountInfo.data);
          } else if (accountDiscriminator.equals(DISCRIMINATORS.POOL_STATE)) {
            type = 'pool_state';
            data = parsePoolStateData(accountInfo.accountInfo.data);
          }
          
          if (type && callback && typeof callback === 'function') {
            callback({
              type,
              accountId: accountInfo.accountId.toString(),
              data,
              slot: context.slot
            });
          }
        } catch (error) {
          console.error('Error processing program account update:', error);
        }
      },
      'confirmed'
    );
    
    // Store the subscription
    activeSubscriptions.set('program_subscription', {
      id: subscriptionId,
      type: 'program',
      connection
    });
    
    return subscriptionId;
  } catch (error) {
    console.error('Error subscribing to staking program:', error);
    return null;
  }
}

/**
 * Unsubscribe from an event subscription
 * 
 * @param {string} subscriptionId - ID of the subscription to remove
 * @param {Object} connection - Solana connection object (optional if provided during subscribe)
 * @returns {boolean} Success indicator
 */
export function unsubscribe(subscriptionKey, connection = null) {
  if (!isClient) return false;
  
  try {
    // Get the subscription
    const subscription = activeSubscriptions.get(subscriptionKey);
    if (!subscription) return false;
    
    // Use the provided connection or the one from the subscription
    const conn = connection || subscription.connection;
    if (!conn) return false;
    
    // Unsubscribe
    conn.removeAccountChangeListener(subscription.id);
    activeSubscriptions.delete(subscriptionKey);
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

/**
 * Clean up all active subscriptions
 * 
 * @param {Object} connection - Solana connection object
 * @returns {number} Number of subscriptions removed
 */
export function unsubscribeAll(connection) {
  if (!isClient || !connection) return 0;
  
  let count = 0;
  for (const [key, subscription] of activeSubscriptions.entries()) {
    try {
      connection.removeAccountChangeListener(subscription.id);
      activeSubscriptions.delete(key);
      count++;
    } catch (error) {
      console.error(`Error removing subscription ${key}:`, error);
    }
  }
  
  return count;
}

/**
 * Parse stake account data from buffer
 * 
 * @param {Buffer} data - Account data buffer
 * @returns {Object} Parsed stake account data
 */
function parseStakeAccountData(data) {
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
  
  return {
    owner: owner.toString(),
    mintAddress: mintAddress.toString(),
    stakedAt: Number(stakedAt),
    releaseDate: Number(releaseDate),
    isStaked,
    tier,
    lastClaimTime: Number(lastClaimTime),
    stakingPeriod: Number(stakingPeriod),
    autoCompound,
    accumulatedCompound: Number(accumulatedCompound),
    currentTimeMultiplier: Number(currentTimeMultiplier),
    lastMultiplierUpdate: Number(lastMultiplierUpdate),
    milestonesAchieved,
    nextMilestoneDays: Number(nextMilestoneDays),
    compoundFrequency,
    compoundStreak,
    compoundStreakMultiplier: Number(compoundStreakMultiplier)
  };
}

/**
 * Parse user staking data from buffer
 * 
 * @param {Buffer} data - Account data buffer
 * @returns {Object} Parsed user staking data
 */
function parseUserStakingData(data) {
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
    stakedMints.push(mint.toString());
    offset += 32;
  }
  
  // Extract collection bonus (u64)
  const collectionBonus = data.readBigUInt64LE(offset);
  
  return {
    owner: owner.toString(),
    stakedCount,
    stakedMints,
    collectionBonus: Number(collectionBonus)
  };
}

/**
 * Parse pool state data from buffer
 * 
 * @param {Buffer} data - Account data buffer
 * @returns {Object} Parsed pool state data
 */
function parsePoolStateData(data) {
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
    commonMultiplier: Number(commonMultiplier),
    rareMultiplier: Number(rareMultiplier),
    epicMultiplier: Number(epicMultiplier),
    legendaryMultiplier: Number(legendaryMultiplier),
    longStakingBonus: Number(longStakingBonus),
    maxNftsPerUser,
    timeMultiplierIncrement: Number(timeMultiplierIncrement),
    timeMultiplierPeriodDays: Number(timeMultiplierPeriodDays),
    maxTimeMultiplier: Number(maxTimeMultiplier)
  };
}

export default {
  subscribeToStakeAccount,
  subscribeToUserStakingInfo,
  subscribeToStakingProgram,
  unsubscribe,
  unsubscribeAll
};