/**
 * Staking synchronization utilities 
 * Provides functions for synchronizing blockchain staking state with database
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { PROGRAM_ID, STAKE_SEED, USER_STAKING_SEED, DISCRIMINATORS } from './constants';
import { BN } from 'bn.js';
import * as borsh from 'borsh';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Staking account layout (simplified version)
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
          ['discriminator', [8]], // Account type identifier
          ['isInitialized', 'u8'], // Initialization flag
          ['nftMint', [32]], // NFT mint address
          ['owner', [32]], // Owner address
          ['stakedAt', 'u64'], // Staking start time
          ['lastUpdateTime', 'u64'], // Last update time
          ['releaseTime', 'u64'], // Release time
          ['rewardRatePerDay', 'u64'], // Daily reward rate
          ['accumulatedReward', 'u64'], // Accumulated reward
          ['tierMultiplier', 'u8'], // Tier multiplier
          ['isUnstaked', 'u8'], // Unstaking flag
        ],
      },
    ],
  ]);
}

/**
 * Decode stake info account data
 * @param {Buffer} data - Account data
 * @returns {Object|null} Decoded stake info or null if invalid
 */
export function decodeStakeInfo(data) {
  try {
    // Each account data should have minimum structure
    if (!data || data.length < 50) {
      console.error('Account data too short:', data?.length);
      return null;
    }
    
    // Check account type discriminator (STAKE_INFO_DISCRIMINATOR)
    const discriminator = DISCRIMINATORS.STAKE_INFO || Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]);
    const accountDiscriminator = data.slice(0, 8);
    
    // If discriminator doesn't match, this is a different account type
    if (!accountDiscriminator.equals(discriminator)) {
      return null;
    }
    
    // Try to decode
    try {
      return borsh.deserialize(StakeInfo.schema, StakeInfo, data);
    } catch (borshError) {
      console.error('Failed to decode stake account data:', borshError);
      
      // Extract basic info manually if possible
      if (data.length >= 40 + 32) { // discriminator(8) + isInitialized(1) + nftMint(32)
        const isInitialized = data[8];
        const nftMint = data.slice(9, 41);
        const owner = data.length >= 73 ? data.slice(41, 73) : Buffer.alloc(32);
        const isUnstaked = data.length > 73 ? data[data.length - 1] : 0;
        
        return {
          discriminator: accountDiscriminator,
          isInitialized,
          nftMint,
          owner,
          stakedAt: new BN(0),
          lastUpdateTime: new BN(0),
          releaseTime: new BN(0),
          rewardRatePerDay: new BN(0),
          accumulatedReward: new BN(0),
          tierMultiplier: 1,
          isUnstaked
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Exception during stake account data decoding:', error);
    return null;
  }
}

/**
 * Convert to PublicKey
 * @param {string} address - Address string
 * @returns {PublicKey} PublicKey instance
 */
export function toPublicKey(address) {
  try {
    return new PublicKey(address);
  } catch (err) {
    throw new Error(`Invalid public key: ${address}`);
  }
}

/**
 * Convert Solana timestamp to JavaScript Date
 * @param {number} timestamp - Solana timestamp in seconds
 * @returns {Date} JavaScript Date object
 */
export function solanaTimestampToDate(timestamp) {
  // Return current time if timestamp is invalid
  if (!timestamp || isNaN(timestamp) || timestamp > Number.MAX_SAFE_INTEGER) {
    console.warn('Invalid timestamp:', timestamp);
    return new Date();
  }
  return new Date(timestamp * 1000);
}

/**
 * Create image URL for NFT
 * @param {string} id - NFT ID
 * @returns {Object} Image URLs in different formats
 */
export function createImageUrl(id) {
  // Extract numeric ID if not numeric
  const numericId = parseInt(id.toString().replace(/\D/g, ''));
  // Format as 4-digit number
  const formattedId = String(numericId).padStart(4, '0');
  
  // IPFS CID for images
  const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
  // IPFS Gateway
  const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud/ipfs/';
  
  // Create both ipfs:// URL and gateway URL
  const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
  const gatewayUrl = `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${formattedId}.png`;
  
  return {
    ipfs_url: ipfsUrl,     // ipfs:// protocol URL
    gateway_url: gatewayUrl, // Directly accessible gateway URL
    nft_image: gatewayUrl,   // Field for backward compatibility
    ipfs_hash: IMAGES_IPFS_HASH  // Store IPFS CID
  };
}

/**
 * Get stake info for NFT from blockchain
 * @param {PublicKey|string} mintPubkey - NFT mint address
 * @returns {Promise<Object|null>} Stake info or null if not staked
 */
export async function getStakeInfoFromChain(mintPubkey) {
  try {
    // Ensure mintPubkey is PublicKey instance
    const mintPublicKey = mintPubkey instanceof PublicKey ? 
      mintPubkey : new PublicKey(mintPubkey);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    
    // Calculate stake info PDA
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPublicKey.toBuffer()],
      programId
    );

    // Check if the account exists
    const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
    
    if (!stakeInfoAccount) {
      return null;
    }

    try {
      // Decode account data
      const stakeInfo = decodeStakeInfo(stakeInfoAccount.data);
      
      if (!stakeInfo) {
        return {
          exists: true,
          error: 'Failed to decode account data'
        };
      }

      // Convert to PublicKey
      const nftMint = new PublicKey(stakeInfo.nftMint);
      const owner = new PublicKey(stakeInfo.owner);

      return {
        exists: true,
        pda: stakeInfoPDA.toString(),
        nftMint: nftMint.toString(),
        owner: owner.toString(),
        stakedAt: solanaTimestampToDate(Number(stakeInfo.stakedAt)),
        lastUpdateTime: solanaTimestampToDate(Number(stakeInfo.lastUpdateTime)),
        releaseTime: solanaTimestampToDate(Number(stakeInfo.releaseTime)),
        rewardRatePerDay: Number(stakeInfo.rewardRatePerDay),
        accumulatedReward: Number(stakeInfo.accumulatedReward),
        tierMultiplier: stakeInfo.tierMultiplier,
        isUnstaked: stakeInfo.isUnstaked === 1
      };
    } catch (error) {
      console.error('Failed to process stake account info:', error);
      return {
        exists: true,
        error: error.message
      };
    }
  } catch (error) {
    console.error('Failed to get stake info from chain:', error);
    throw error;
  }
}

/**
 * Get all staked NFTs for a wallet from blockchain
 * @param {PublicKey|string} walletAddress - Wallet address
 * @returns {Promise<Object>} Staking info for wallet
 */
export async function getWalletStakingInfoFromChain(walletAddress) {
  try {
    // Ensure walletPubkey is PublicKey instance
    const walletPubkey = walletAddress instanceof PublicKey ? 
      walletAddress : new PublicKey(walletAddress);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    
    // Calculate user staking info PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
      programId
    );

    // Check if the user staking account exists
    const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
    
    if (!userStakingInfoAccount) {
      return { stakes: [] };
    }

    // Get all program accounts to filter in memory
    const programAccounts = await connection.getProgramAccounts(programId);
    
    // Filter accounts in memory
    const filteredAccounts = [];
    for (const account of programAccounts) {
      try {
        const stakeInfo = decodeStakeInfo(account.account.data);
        if (stakeInfo && !stakeInfo.isUnstaked) {
          const owner = new PublicKey(stakeInfo.owner);
          if (owner.equals(walletPubkey)) {
            filteredAccounts.push(account);
          }
        }
      } catch (error) {
        console.log('Error filtering account:', error);
      }
    }

    // Extract stake info from filtered accounts
    const stakes = [];
    for (const account of filteredAccounts) {
      try {
        const stakeInfo = decodeStakeInfo(account.account.data);
        if (stakeInfo && !stakeInfo.isUnstaked) {
          // Verify owner matches current wallet
          const owner = new PublicKey(stakeInfo.owner);
          if (owner.equals(walletPubkey)) {
            const nftMint = new PublicKey(stakeInfo.nftMint);
            stakes.push({
              pda: account.pubkey.toString(),
              nftMint: nftMint.toString(),
              owner: owner.toString(),
              stakedAt: solanaTimestampToDate(Number(stakeInfo.stakedAt)),
              lastUpdateTime: solanaTimestampToDate(Number(stakeInfo.lastUpdateTime)),
              releaseTime: solanaTimestampToDate(Number(stakeInfo.releaseTime)),
              rewardRatePerDay: Number(stakeInfo.rewardRatePerDay),
              accumulatedReward: Number(stakeInfo.accumulatedReward),
              tierMultiplier: stakeInfo.tierMultiplier,
              isUnstaked: stakeInfo.isUnstaked === 1
            });
          }
        }
      } catch (err) {
        console.error('Error parsing stake account:', err);
      }
    }

    return { stakes };
  } catch (error) {
    console.error('Failed to get wallet staking info from chain:', error);
    throw error;
  }
}

/**
 * Add or update staking record in database
 * @param {Object} onchainData - On-chain staking data
 * @returns {Promise<Object>} Database operation result
 */
export async function upsertStakingRecord(onchainData) {
  try {
    // Extract or generate NFT ID
    let nftId = null;
    
    // Try to find NFT data in minted_nfts table
    const { data: nftData, error: nftError } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('mint_address', onchainData.nftMint)
      .single();

    if (nftError && nftError.code !== 'PGRST116') { // PGRST116: No rows returned
      console.error('Failed to query NFT data:', nftError);
    }

    // Use NFT data if available, otherwise generate ID
    if (nftData) {
      nftId = nftData.mint_index || nftData.id;
    } else {
      // Generate hash-based ID from mint address
      const mintAddress = onchainData.nftMint;
      let hash = 0;
      for (let i = 0; i < mintAddress.length; i++) {
        hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      nftId = Math.abs(hash) % 999 + 1;
    }

    // Calculate staking period in days
    const stakedAt = new Date(onchainData.stakedAt);
    const releaseTime = new Date(onchainData.releaseTime);
    const stakingPeriod = Math.ceil((releaseTime - stakedAt) / (1000 * 60 * 60 * 24));
    
    // Determine tier based on multiplier
    let nftTier = 'Common';
    if (onchainData.tierMultiplier >= 8) {
      nftTier = 'LEGENDARY';
    } else if (onchainData.tierMultiplier >= 4) {
      nftTier = 'EPIC';
    } else if (onchainData.tierMultiplier >= 2) {
      nftTier = 'RARE';
    }

    // Generate image URLs
    const imageUrlData = createImageUrl(nftId.toString());

    // Ensure dates are formatted as strings
    const formatDate = (date) => {
      if (date instanceof Date) {
        return date.toISOString();
      }
      return date;
    };

    // Create staking record
    const stakingRecord = {
      mint_address: onchainData.nftMint,
      wallet_address: onchainData.owner,
      nft_id: nftId.toString(),
      nft_name: `SOLARA #${nftId}`,
      nft_tier: nftTier,
      staked_at: formatDate(onchainData.stakedAt),
      release_date: formatDate(onchainData.releaseTime),
      last_update: formatDate(onchainData.lastUpdateTime),
      staking_period: stakingPeriod,
      daily_reward_rate: onchainData.rewardRatePerDay,
      total_rewards: onchainData.rewardRatePerDay * stakingPeriod,
      status: onchainData.isUnstaked ? 'unstaked' : 'staked',
      image: imageUrlData.ipfs_url,
      image_url: imageUrlData.ipfs_url,
      nft_image: imageUrlData.gateway_url,
      ipfs_hash: imageUrlData.ipfs_hash,
      last_verified: new Date().toISOString(),
      sync_status: 'synced'
    };

    // Insert or update record in database
    const { data, error } = await supabase
      .from('nft_staking')
      .upsert([stakingRecord], { onConflict: 'mint_address' })
      .select();

    if (error) {
      console.error('Failed to update staking record:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to upsert staking record:', error);
    throw error;
  }
}

/**
 * Mark NFT as unstaked in database
 * @param {string} mintAddress - NFT mint address
 * @returns {Promise<Object>} Database operation result
 */
export async function markAsUnstaked(mintAddress) {
  try {
    // Update record status to unstaked
    const { data, error } = await supabase
      .from('nft_staking')
      .update({
        status: 'unstaked',
        unstaked_at: new Date().toISOString(),
        last_verified: new Date().toISOString(),
        sync_status: 'synced',
        unstaked_reason: 'blockchain_sync'
      })
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .select();

    if (error) {
      console.error('Failed to mark NFT as unstaked:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to mark NFT as unstaked:', error);
    throw error;
  }
}

/**
 * Check for discrepancies between blockchain and database
 * @returns {Promise<Object>} Discrepancies found
 */
export async function checkDiscrepancies() {
  try {
    const discrepancies = [];
    
    // 1. Get staked NFTs from database
    const { data: dbStakedNfts, error: dbError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('status', 'staked');
    
    if (dbError) {
      console.error('Failed to fetch staking data from database:', dbError);
      throw new Error('Failed to fetch staking data from database');
    }

    // 2. Check each NFT against blockchain
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Missing on chain
    const missingOnChain = [];
    
    for (const dbNft of dbStakedNfts) {
      try {
        const mintPubkey = new PublicKey(dbNft.mint_address);
        const onchainData = await getStakeInfoFromChain(mintPubkey);
        
        // Missing on blockchain or already unstaked
        if (!onchainData || onchainData.isUnstaked) {
          missingOnChain.push(dbNft);
          discrepancies.push({
            ...dbNft,
            issue: 'missing_on_chain'
          });
        }
        
        // Missing image URL
        if (!dbNft.image_url || !dbNft.image) {
          discrepancies.push({
            ...dbNft,
            issue: 'missing_image_url'
          });
        }
      } catch (err) {
        console.error(`Failed to verify NFT ${dbNft.mint_address} on-chain:`, err);
      }
    }

    // Get program accounts limited by 100
    const programId = new PublicKey(PROGRAM_ID);
    const programAccounts = await connection.getProgramAccounts(programId);
    
    // Filter in memory
    const allAccounts = programAccounts.filter(account => {
      try {
        const stakeInfo = decodeStakeInfo(account.account.data);
        return stakeInfo && stakeInfo.isInitialized === 1;
      } catch (error) {
        return false;
      }
    });

    // Limit account count
    const ACCOUNT_LIMIT = 100;
    const limitedAccounts = allAccounts.slice(0, ACCOUNT_LIMIT);
    
    // Check for missing in database
    const missingInDatabase = [];
    
    for (const account of limitedAccounts) {
      try {
        // Get full account data
        const accountInfo = await connection.getAccountInfo(account.pubkey);
        const stakeInfo = decodeStakeInfo(accountInfo.data);
        
        if (stakeInfo && !stakeInfo.isUnstaked) {
          const nftMint = new PublicKey(stakeInfo.nftMint);
          const mintAddress = nftMint.toString();
          
          // Search for this NFT in database
          const { data: dbRecord, error: dbLookupError } = await supabase
            .from('nft_staking')
            .select('*')
            .eq('mint_address', mintAddress)
            .eq('status', 'staked')
            .single();
          
          if (dbLookupError || !dbRecord) {
            // Only on-chain - missing in database
            const owner = new PublicKey(stakeInfo.owner);
            missingInDatabase.push({
              mint_address: mintAddress,
              wallet_address: owner.toString(),
              staked_at: solanaTimestampToDate(stakeInfo.stakedAt.toNumber()),
              release_date: solanaTimestampToDate(stakeInfo.releaseTime.toNumber())
            });
            
            discrepancies.push({
              mint_address: mintAddress,
              wallet_address: owner.toString(),
              issue: 'missing_in_db'
            });
          }
        }
      } catch (err) {
        console.error('Failed to verify account:', err);
      }
    }

    // Image URL missing
    const imageUrlMissing = dbStakedNfts.filter(nft => !nft.image_url || !nft.image);

    return {
      success: true,
      totalChecked: limitedAccounts.length,
      missingInDatabase,
      missingOnChain,
      imageUrlMissing,
      discrepancies
    };
  } catch (error) {
    console.error('Failed to check discrepancies:', error);
    throw error;
  }
}

/**
 * Synchronize single NFT
 * @param {string} mintAddress - NFT mint address
 * @returns {Promise<Object>} Sync result
 */
export async function syncNFT(mintAddress) {
  try {
    // Verify mint address
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      throw new Error(`Invalid mint address: ${mintAddress}`);
    }

    // Get on-chain data
    const onchainData = await getStakeInfoFromChain(mintPubkey);
    
    if (!onchainData || onchainData.error) {
      // Not found on chain - update database record
      const { data, error } = await supabase
        .from('nft_staking')
        .update({ 
          status: 'unstaked',
          last_verified: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('mint_address', mintAddress)
        .select();
      
      if (error) {
        console.error('Failed to update staking record:', error);
        throw new Error(`Failed to update database: ${error.message}`);
      }
      
      return {
        success: true,
        message: 'NFT is not staked on-chain, marked as unstaked in database',
        data
      };
    }
    
    // Handle unstaked on-chain
    if (onchainData.isUnstaked) {
      const { data, error } = await supabase
        .from('nft_staking')
        .update({ 
          status: 'unstaked',
          unstaked_at: new Date().toISOString(),
          last_verified: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('mint_address', mintAddress)
        .select();
      
      if (error) {
        console.error('Failed to update staking record:', error);
        throw new Error(`Failed to update database: ${error.message}`);
      }
      
      return {
        success: true,
        message: 'NFT is unstaked on-chain, marked as unstaked in database',
        data
      };
    }
    
    // Sync on-chain data to database
    const result = await upsertStakingRecord(onchainData);
    
    return {
      success: true,
      message: 'NFT staking data synchronized successfully',
      onchainData,
      dbResult: result
    };
  } catch (error) {
    console.error('Failed to sync NFT:', error);
    throw error;
  }
}

/**
 * Synchronize all NFTs for a wallet
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Object>} Sync result
 */
export async function syncWalletNFTs(walletAddress) {
  try {
    // Verify wallet address
    const walletPubkey = toPublicKey(walletAddress);
    
    // Get wallet's staking info from chain
    const { stakes } = await getWalletStakingInfoFromChain(walletPubkey);
    
    if (stakes.length === 0) {
      return {
        success: true,
        message: 'No staked NFTs found for this wallet.',
        count: 0,
        results: []
      };
    }
    
    // Sync all NFTs
    const results = [];
    for (const stake of stakes) {
      try {
        const mintPubkey = new PublicKey(stake.nftMint);
        const onchainData = await getStakeInfoFromChain(mintPubkey);
        
        if (onchainData && !onchainData.error && !onchainData.isUnstaked) {
          // Sync on-chain data to database
          const result = await upsertStakingRecord(onchainData);
          results.push({
            mint: stake.nftMint,
            status: 'synchronized',
            result
          });
        } else {
          results.push({
            mint: stake.nftMint,
            status: 'skipped',
            reason: onchainData?.error || 'NFT is unstaked or invalid'
          });
        }
      } catch (err) {
        console.error(`Failed to sync NFT ${stake.nftMint}:`, err);
        results.push({
          mint: stake.nftMint,
          status: 'error',
          error: err.message
        });
      }
    }
    
    return {
      success: true,
      message: `Synchronized ${results.filter(r => r.status === 'synchronized').length} NFTs.`,
      count: results.filter(r => r.status === 'synchronized').length,
      total: stakes.length,
      results
    };
  } catch (error) {
    console.error('Failed to sync wallet NFTs:', error);
    throw error;
  }
}

/**
 * Update NFT metadata
 * @param {string} mintAddress - NFT mint address
 * @returns {Promise<Object>} Update result
 */
export async function updateNFTMetadata(mintAddress) {
  try {
    // Get staking info
    const { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('mint_address', mintAddress)
      .single();
    
    if (stakingError) {
      throw new Error(`Staking record not found: ${stakingError.message}`);
    }

    // Get NFT data from minted_nfts table
    const { data: nftData, error: nftError } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('mint_address', mintAddress)
      .single();
    
    // Extract or generate NFT ID
    let nftId;
    let needsNewMetadata = false;
    
    if (nftError) { // No NFT data
      // Get ID from staking data or generate
      nftId = stakingData.nft_id || String(Math.floor(Math.random() * 999) + 1).padStart(4, '0');
      needsNewMetadata = true;
    } else {
      nftId = nftData.mint_index || nftData.id;
    }

    // Generate image URLs
    const imageUrlData = createImageUrl(nftId.toString());
    
    // Create metadata
    const metadata = {
      name: `SOLARA #${nftId}`,
      symbol: "SOLARA",
      description: "SOLARA NFT Collection",
      image: imageUrlData.ipfs_url, // Use ipfs:// protocol URL
      attributes: [
        {
          trait_type: "Tier",
          value: stakingData.nft_tier || "Common"
        }
      ]
    };

    // Update staking table
    const { data: updateResult, error: updateError } = await supabase
      .from('nft_staking')
      .update({
        image: imageUrlData.ipfs_url,
        image_url: imageUrlData.ipfs_url,
        nft_image: imageUrlData.gateway_url,
        nft_name: `SOLARA #${nftId}`,
        ipfs_hash: imageUrlData.ipfs_hash,
        metadata: metadata,
        last_verified: new Date().toISOString()
      })
      .eq('mint_address', mintAddress)
      .select();
    
    if (updateError) {
      throw new Error(`Failed to update staking record: ${updateError.message}`);
    }

    // Update or create minted_nfts record
    let mintedNftResult;
    
    if (needsNewMetadata) {
      // Create new record
      const { data: insertResult, error: insertError } = await supabase
        .from('minted_nfts')
        .insert([{
          mint_address: mintAddress,
          wallet: stakingData.wallet_address,
          mint_index: nftId,
          name: `SOLARA #${nftId}`,
          image_url: imageUrlData.ipfs_url,
          nft_image: imageUrlData.gateway_url,
          ipfs_hash: imageUrlData.ipfs_hash,
          metadata: metadata,
          status: 'completed'
        }])
        .select();
      
      if (insertError) {
        console.error('Failed to create minted_nfts record:', insertError);
      } else {
        mintedNftResult = insertResult;
      }
    } else {
      // Update existing record
      const { data: updateNftResult, error: updateNftError } = await supabase
        .from('minted_nfts')
        .update({
          image_url: imageUrlData.ipfs_url,
          nft_image: imageUrlData.gateway_url,
          ipfs_hash: imageUrlData.ipfs_hash,
          metadata: metadata
        })
        .eq('mint_address', mintAddress)
        .select();
      
      if (updateNftError) {
        console.error('Failed to update minted_nfts record:', updateNftError);
      } else {
        mintedNftResult = updateNftResult;
      }
    }

    return {
      success: true,
      message: 'NFT metadata updated successfully',
      nftId: nftId,
      imageUrl: imageUrlData.ipfs_url,
      gatewayUrl: imageUrlData.gateway_url,
      ipfsHash: imageUrlData.ipfs_hash,
      stakingUpdate: updateResult,
      mintedNftUpdate: mintedNftResult || null
    };
  } catch (error) {
    console.error('Failed to update NFT metadata:', error);
    throw error;
  }
}

/**
 * Run comprehensive staking synchronization
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} Sync results
 */
export async function runSyncCheck(options = {}) {
  try {
    const {
      limit = 50,
      fixMissingRecords = true,
      updateMetadata = true,
      walletAddress = null
    } = options;

    // Track operation metrics
    const startTime = Date.now();
    const results = {
      checked: 0,
      updated: 0,
      errors: 0,
      created: 0,
      noChange: 0,
      details: []
    };

    // Choose sync strategy based on options
    if (walletAddress) {
      // Sync specific wallet
      const walletResult = await syncWalletNFTs(walletAddress);
      results.checked = walletResult.total || 0;
      results.updated = walletResult.count || 0;
      results.details.push({
        type: 'wallet_sync',
        wallet: walletAddress,
        result: walletResult
      });
    } else {
      // Find discrepancies
      const discrepancies = await checkDiscrepancies();
      
      // Process missing in database
      if (fixMissingRecords && discrepancies.missingInDatabase.length > 0) {
        const missingLimit = Math.min(discrepancies.missingInDatabase.length, limit);
        for (let i = 0; i < missingLimit; i++) {
          const item = discrepancies.missingInDatabase[i];
          try {
            await syncNFT(item.mint_address);
            results.created++;
          } catch (error) {
            console.error(`Failed to sync missing NFT ${item.mint_address}:`, error);
            results.errors++;
          }
        }
      }
      
      // Process missing on chain
      for (const item of discrepancies.missingOnChain) {
        try {
          await markAsUnstaked(item.mint_address);
          results.updated++;
        } catch (error) {
          console.error(`Failed to mark NFT as unstaked ${item.mint_address}:`, error);
          results.errors++;
        }
      }
      
      // Update missing image URLs
      if (updateMetadata && discrepancies.imageUrlMissing.length > 0) {
        const imageLimit = Math.min(discrepancies.imageUrlMissing.length, limit);
        for (let i = 0; i < imageLimit; i++) {
          const item = discrepancies.imageUrlMissing[i];
          try {
            await updateNFTMetadata(item.mint_address);
            results.updated++;
          } catch (error) {
            console.error(`Failed to update metadata for ${item.mint_address}:`, error);
            results.errors++;
          }
        }
      }
      
      results.checked = discrepancies.totalChecked || 0;
      results.details.push({
        type: 'discrepancy_check',
        found: discrepancies.discrepancies.length,
        missingInDb: discrepancies.missingInDatabase.length,
        missingOnChain: discrepancies.missingOnChain.length,
        imageUrlMissing: discrepancies.imageUrlMissing.length
      });
    }

    // Calculate elapsed time
    const elapsedMs = Date.now() - startTime;
    
    // Final result
    return {
      success: true,
      elapsedMs,
      results
    };
  } catch (error) {
    console.error('Sync check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}