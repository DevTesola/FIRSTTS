/**
 * Enhanced On-chain Staking Info API
 * Directly fetches staking information from the blockchain, bypassing the database
 */
import { Connection, PublicKey } from '@solana/web3.js';
import * as borsh from 'borsh';
import { 
  findStakeInfoPDA, 
  findUserStakingInfoPDA 
} from '../../../shared/utils/pda';
import { PROGRAM_ID } from '../../../shared/constants/program-ids';
import { resolveNftId } from '../../../utils/staking-helpers/nft-id-resolver';

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud/ipfs/';
const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';

// Stake info account layout
class StakeInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      StakeInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // Account type discriminator
          ['isInitialized', 'u8'], // Whether the account is initialized
          ['nftMint', [32]], // NFT mint address
          ['owner', [32]], // Owner address
          ['stakedAt', 'u64'], // Staking start time
          ['lastUpdateTime', 'u64'], // Last update time
          ['releaseTime', 'u64'], // Release time
          ['rewardRatePerDay', 'u64'], // Daily reward rate
          ['accumulatedReward', 'u64'], // Accumulated reward
          ['tierMultiplier', 'u8'], // Tier multiplier
          ['isUnstaked', 'u8'], // Whether the NFT is unstaked
        ],
      },
    ],
  ]);
}

// User staking info account layout
class UserStakingInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      UserStakingInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // Account type discriminator
          ['isInitialized', 'u8'], // Whether the account is initialized
          ['owner', [32]], // Owner address
          ['stakedCount', 'u32'], // Number of staked NFTs
          ['stakedMints', ['vecM', [32]]], // Array of staked NFT mint addresses
          ['collectionBonus', 'u16'], // Collection bonus (%)
          ['padding1', 'u8'], // Padding
          ['padding2', 'u8'], // Padding
          ['lastUpdated', 'u64'], // Last updated time
        ],
      },
    ],
  ]);
}

// Account discriminators
const DISCRIMINATORS = {
  STAKE_INFO: Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]),
  USER_STAKING_INFO: Buffer.from([171, 19, 114, 117, 157, 103, 21, 106])
};

// Decode stake info account data
function decodeStakeInfo(data) {
  try {
    if (!data || data.length < 50) {
      console.error('Account data too short:', data?.length);
      return null;
    }
    
    const discriminator = DISCRIMINATORS.STAKE_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    console.log('StakeInfo discriminator check:', {
      expected: Array.from(discriminator),
      actual: Array.from(accountDiscriminator),
      expectedHex: discriminator.toString('hex'),
      actualHex: Buffer.from(accountDiscriminator).toString('hex'),
      matches: Buffer.from(accountDiscriminator).equals(discriminator)
    });
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('Stake info discriminator mismatch');
      return null;
    }
    
    try {
      const decoded = borsh.deserialize(StakeInfo.schema, StakeInfo, data);
      
      if (decoded) {
        console.log('StakeInfo decoded successfully:', {
          isInitialized: decoded.isInitialized,
          nftMint: new PublicKey(decoded.nftMint).toString(),
          owner: new PublicKey(decoded.owner).toString(),
          stakedAt: Number(decoded.stakedAt),
          releaseTime: Number(decoded.releaseTime),
          tierMultiplier: decoded.tierMultiplier,
          isUnstaked: decoded.isUnstaked
        });
      }
      
      return decoded;
    } catch (borshError) {
      console.error('Failed to decode stake account data:', borshError);
      return null;
    }
  } catch (error) {
    console.error('Exception decoding stake account data:', error);
    return null;
  }
}

// Decode user staking info account data
function decodeUserStakingInfo(data) {
  try {
    if (!data || data.length < 50) {
      console.error('UserStakingInfo account data too short:', data?.length);
      return null;
    }
    
    console.log('UserStakingInfo parsing start', { 
      dataLength: data.length,
      discriminatorProvided: true
    });
    
    const discriminator = DISCRIMINATORS.USER_STAKING_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    console.log('UserStakingInfo discriminator check:', {
      expected: Array.from(discriminator),
      actual: Array.from(accountDiscriminator),
      expectedHex: discriminator.toString('hex'),
      actualHex: Buffer.from(accountDiscriminator).toString('hex'),
      matches: Buffer.from(accountDiscriminator).equals(discriminator)
    });
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('UserStakingInfo discriminator mismatch');
      return null;
    }
    
    try {
      const decoded = borsh.deserialize(UserStakingInfo.schema, UserStakingInfo, data);
      
      if (!decoded) {
        console.error('UserStakingInfo decoding result is null');
        return null;
      }
      
      const owner = new PublicKey(decoded.owner);
      console.log('UserStakingInfo parsing: owner=' + owner.toString() + ', staked count=' + decoded.stakedCount);
      console.log('UserStakingInfo: stakedMints vector length=' + decoded.stakedMints.length);
      console.log('UserStakingInfo: collection bonus=' + decoded.collectionBonus);
      
      console.log('UserStakingInfo parsing complete');
      return decoded;
    } catch (borshError) {
      console.error('UserStakingInfo decoding failed:', borshError);
      return null;
    }
  } catch (error) {
    console.error('UserStakingInfo decoding exception:', error);
    return null;
  }
}

// Function to calculate days from seconds
function secondsToDays(seconds) {
  return Math.ceil(seconds / (24 * 60 * 60));
}

// Convert Solana timestamp to JavaScript Date
function solanaTimestampToDate(timestamp) {
  if (!timestamp || isNaN(timestamp) || timestamp > Number.MAX_SAFE_INTEGER) {
    console.warn('Invalid timestamp:', timestamp);
    return new Date();
  }
  return new Date(timestamp * 1000);
}

// Calculate days left until release date
function calculateDaysLeft(releaseDate) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Calculate staking progress percentage
function calculateProgress(stakedAt, releaseDate) {
  const start = new Date(stakedAt).getTime();
  const end = new Date(releaseDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

// Generate image URLs for NFT
function createImageUrl(nftId) {
  try {
    // Make sure ID is a 4-digit string
    const formattedId = String(nftId).padStart(4, '0');
    console.log(`Creating image URL for NFT ID: ${nftId}, formatted: ${formattedId}`);
    
    // Create IPFS and gateway URLs
    const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
    const gatewayUrl = `${IPFS_GATEWAY}ipfs/${IMAGES_IPFS_HASH}/${formattedId}.png`;
    
    console.log(`Generated URLs: IPFS=${ipfsUrl}, Gateway=${gatewayUrl}`);
    
    return {
      ipfs_url: ipfsUrl,
      gateway_url: gatewayUrl,
      nft_image: gatewayUrl,
      ipfs_hash: IMAGES_IPFS_HASH
    };
  } catch (err) {
    console.error('Error creating image URL:', err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log(`Fetching on-chain staking data for wallet ${wallet}`);
    
    // Establish Solana connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programPublicKey = new PublicKey(PROGRAM_ID);
    const walletPublicKey = new PublicKey(wallet);
    
    console.log('Using program ID:', PROGRAM_ID);
    
    // Get user staking PDA using the utility function
    const [userStakingPDA] = findUserStakingInfoPDA(walletPublicKey);
    
    console.log('User staking PDA derived:', userStakingPDA.toString());
    
    // Fetch user staking account
    const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
    
    // If no account exists, return empty data
    if (!userStakingAccount) {
      console.log('No staking account found for wallet', wallet);
      return res.status(200).json({ 
        success: true,
        message: 'No staking info found',
        stats: {
          activeStakes: [],
          stats: {
            projectedRewards: 0,
            earnedToDate: 0,
            collectionBonus: 0
          }
        }
      });
    }
    
    console.log(`Found staking account with ${userStakingAccount.data.length} bytes`);
    
    // Decode user staking info
    const userStakingInfo = decodeUserStakingInfo(userStakingAccount.data);
    
    if (!userStakingInfo) {
      return res.status(500).json({ 
        error: 'Failed to decode user staking info',
        message: 'The account data structure was unexpected'
      });
    }
    
    // Get staked mint addresses, log each before filtering
    console.log('Raw stakedMints array length:', userStakingInfo.stakedMints.length);
    userStakingInfo.stakedMints.forEach((mint, index) => {
      console.log(`Mint #${index}: ${mint.toString()}, isDefault: ${mint.equals(PublicKey.default)}`);
    });
    
    // Filter out invalid ones
    const stakedMints = userStakingInfo.stakedMints
      .filter(mint => {
        const isDefault = mint.equals(PublicKey.default);
        const isAllOnes = mint.toString() === '11111111111111111111111111111111';
        console.log(`Filtering mint ${mint.toString()}: isDefault=${isDefault}, isAllOnes=${isAllOnes}, keep=${!isDefault && !isAllOnes}`);
        return !isDefault && !isAllOnes;
      })
      .map(mint => mint.toString());
    
    console.log(`Found ${stakedMints.length} staked mint addresses after filtering:`, stakedMints);
    
    // Collection bonus
    const collectionBonus = userStakingInfo.collectionBonus;
    
    // Process each staked NFT
    const activeStakes = [];
    let totalEarnedSoFar = 0;
    let totalProjectedRewards = 0;
    
    for (const mintAddress of stakedMints) {
      try {
        console.log(`Processing mint ${mintAddress}`);
        const mintPubkey = new PublicKey(mintAddress);
        
        // Get stake account PDA using the utility function
        const [stakePDA] = findStakeInfoPDA(mintPubkey);
        console.log(`Derived stake PDA: ${stakePDA.toString()}`);
        
        // Fetch stake account
        const stakeAccount = await connection.getAccountInfo(stakePDA);
        
        if (!stakeAccount) {
          console.log(`No stake account found for mint ${mintAddress}`);
          continue;
        }
        
        console.log(`Found stake account with ${stakeAccount.data.length} bytes`);
        
        // Decode stake info
        const stakeInfo = decodeStakeInfo(stakeAccount.data);
        
        if (!stakeInfo) {
          console.log(`Failed to decode stake info for mint ${mintAddress}`);
          continue;
        }
        
        // Skip if unstaked
        if (stakeInfo.isUnstaked === 1) {
          console.log(`Mint ${mintAddress} is unstaked (isUnstaked=${stakeInfo.isUnstaked}), skipping`);
          continue;
        }
        
        console.log(`Stake info decoded successfully for mint ${mintAddress}. isUnstaked=${stakeInfo.isUnstaked}, tierMultiplier=${stakeInfo.tierMultiplier}`);
        
        // Resolve NFT ID
        const nftId = resolveNftId(mintAddress);
        console.log(`Resolved NFT ID: ${nftId}`);
        
        // Determine NFT tier based on multiplier
        let nftTier = 'COMMON';
        if (stakeInfo.tierMultiplier >= 8) nftTier = 'LEGENDARY';
        else if (stakeInfo.tierMultiplier >= 4) nftTier = 'EPIC';
        else if (stakeInfo.tierMultiplier >= 2) nftTier = 'RARE';
        
        // Generate image URLs
        const imageUrls = createImageUrl(nftId);
        
        // Calculate time-related values
        const stakedAt = solanaTimestampToDate(Number(stakeInfo.stakedAt));
        const releaseTime = solanaTimestampToDate(Number(stakeInfo.releaseTime));
        const lastUpdateTime = solanaTimestampToDate(Number(stakeInfo.lastUpdateTime));
        
        // Calculate staking period and rewards
        const stakingPeriod = secondsToDays(Number(stakeInfo.releaseTime) - Number(stakeInfo.stakedAt));
        const dailyRewardRate = Number(stakeInfo.rewardRatePerDay);
        const totalRewards = stakingPeriod * dailyRewardRate;
        
        // Calculate earned rewards so far
        const currentTime = Math.floor(Date.now() / 1000);
        const stakedTime = Math.min(
          currentTime - Number(stakeInfo.stakedAt), 
          Number(stakeInfo.releaseTime) - Number(stakeInfo.stakedAt)
        );
        const earnedSoFar = Math.floor((stakedTime / 86400) * dailyRewardRate);
        
        // Update totals
        totalEarnedSoFar += earnedSoFar;
        totalProjectedRewards += totalRewards;
        
        // Create stake record
        const stakeData = {
          id: nftId,
          staked_nft_id: nftId,
          nft_id: nftId,
          mint_address: mintAddress,
          wallet_address: wallet,
          nft_name: `SOLARA #${nftId}`,
          nft_tier: nftTier,
          staked_at: stakedAt.toISOString(),
          release_date: releaseTime.toISOString(),
          last_update: lastUpdateTime.toISOString(),
          staking_period: stakingPeriod,
          daily_reward_rate: dailyRewardRate,
          total_rewards: totalRewards,
          earned_so_far: earnedSoFar,
          claimed_rewards: 0,
          status: 'staked',
          progress_percentage: calculateProgress(stakedAt, releaseTime),
          days_left: calculateDaysLeft(releaseTime),
          is_unlocked: calculateDaysLeft(releaseTime) === 0,
          image: imageUrls.ipfs_url,
          image_url: imageUrls.ipfs_url,
          nft_image: imageUrls.gateway_url,
          ipfs_hash: imageUrls.ipfs_hash,
          stake_pda: stakePDA.toString(),
          tier_multiplier: stakeInfo.tierMultiplier,
          // Debug info
          _debug: {
            source: "onchain-api",
            mintAddress,
            nftId,
            stakePDA: stakePDA.toString(),
            userStakingPDA: userStakingPDA.toString()
          }
        };
        
        activeStakes.push(stakeData);
        console.log(`Successfully processed stake for NFT ${nftId}`);
      } catch (err) {
        console.error(`Error processing mint ${mintAddress}:`, err);
      }
    }
    
    // Prepare response data
    const responseData = {
      success: true,
      message: `Found ${activeStakes.length} staked NFTs`,
      stats: {
        activeStakes,
        stats: {
          projectedRewards: totalProjectedRewards,
          earnedToDate: totalEarnedSoFar,
          collectionBonus
        }
      }
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching on-chain staking info:', error);
    return res.status(500).json({
      error: 'Error fetching on-chain staking info',
      details: error.message
    });
  }
}