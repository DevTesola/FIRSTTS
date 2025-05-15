/**
 * Debug script for investigating staking dashboard issue
 * This script directly examines on-chain staking data to identify discrepancies
 */
const { Connection, PublicKey } = require('@solana/web3.js');
const borsh = require('borsh');

// Constants
const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com';
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

// Input wallet address (can be changed for testing)
const WALLET_ADDRESS = process.argv[2] || '6FGQbp1PgBPXN4z56e9vwSRYQxrryaDKia1gVLc3wjFQ';

// SEED strings
const STAKE_SEED = 'stake';
const USER_STAKING_SEED = 'user_staking';

// Discriminators
const DISCRIMINATORS = {
  STAKE_INFO: Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]),
  USER_STAKING_INFO: Buffer.from([171, 19, 114, 117, 157, 103, 21, 106])
};

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

// Decode stake info account data
function decodeStakeInfo(data) {
  try {
    if (!data || data.length < 50) {
      console.error('Account data too short:', data?.length);
      return null;
    }
    
    const discriminator = DISCRIMINATORS.STAKE_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('Stake info discriminator mismatch');
      return null;
    }
    
    try {
      const decoded = borsh.deserialize(StakeInfo.schema, StakeInfo, data);
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
    
    const discriminator = DISCRIMINATORS.USER_STAKING_INFO;
    const accountDiscriminator = data.slice(0, 8);
    
    if (!Buffer.from(accountDiscriminator).equals(discriminator)) {
      console.error('UserStakingInfo discriminator mismatch');
      return null;
    }
    
    try {
      const decoded = borsh.deserialize(UserStakingInfo.schema, UserStakingInfo, data);
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

// Hash an NFT mint address to generate a predictable ID 
function hashMintAddress(mintAddress) {
  let hash = 0;
  for (let i = 0; i < mintAddress.length; i++) {
    hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
    hash = hash & hash; // 32-bit integer conversion
  }
  
  const id = (Math.abs(hash) % 999) + 1;
  return String(id).padStart(4, '0');
}

async function main() {
  try {
    console.log(`\n🔍 Debugging staking data for wallet: ${WALLET_ADDRESS}`);
    console.log(`========================================================\n`);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    const walletPublicKey = new PublicKey(WALLET_ADDRESS);
    
    // Get user staking PDA
    const [userStakingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_STAKING_SEED), walletPublicKey.toBuffer()],
      programId
    );
    
    console.log(`🔑 User Staking PDA: ${userStakingPDA.toString()}`);
    
    // Fetch user staking account
    const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
    
    if (!userStakingAccount) {
      console.log(`❌ No staking account found for wallet ${WALLET_ADDRESS}`);
      return;
    }
    
    console.log(`✅ Found staking account with ${userStakingAccount.data.length} bytes`);
    
    // Decode user staking info
    const userStakingInfo = decodeUserStakingInfo(userStakingAccount.data);
    
    if (!userStakingInfo) {
      console.log(`❌ Failed to decode user staking info`);
      return;
    }
    
    // Print user staking info details
    console.log(`\n📊 USER STAKING INFO DETAILS:`);
    console.log(`----------------------------`);
    console.log(`Owner: ${new PublicKey(userStakingInfo.owner).toString()}`);
    console.log(`Staked Count: ${userStakingInfo.stakedCount}`);
    console.log(`Collection Bonus: ${userStakingInfo.collectionBonus / 100}%`);
    console.log(`Last Updated: ${new Date(Number(userStakingInfo.lastUpdated) * 1000).toLocaleString()}`);
    
    // Get staked mint addresses
    const stakedMints = userStakingInfo.stakedMints
      .filter(mint => 
        !mint.equals(PublicKey.default) && 
        mint.toString() !== '11111111111111111111111111111111'
      )
      .map(mint => mint.toString());
    
    console.log(`\n🔑 Found ${stakedMints.length} staked mint addresses:`);
    stakedMints.forEach((mint, index) => {
      console.log(`   ${index + 1}. ${mint}`);
    });
    
    // Process each staked NFT
    console.log(`\n🧮 STAKE ACCOUNT DETAILS:`);
    console.log(`----------------------`);
    
    let processedCount = 0;
    let displayedCount = 0;
    let unstaked = 0;
    
    for (const mintAddress of stakedMints) {
      try {
        processedCount++;
        
        const mintPubkey = new PublicKey(mintAddress);
        
        // Get stake account PDA
        const [stakePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
          programId
        );
        
        // Fetch stake account
        const stakeAccount = await connection.getAccountInfo(stakePDA);
        
        if (!stakeAccount) {
          console.log(`   ❌ No stake account found for mint ${mintAddress}`);
          continue;
        }
        
        // Decode stake info
        const stakeInfo = decodeStakeInfo(stakeAccount.data);
        
        if (!stakeInfo) {
          console.log(`   ❌ Failed to decode stake info for mint ${mintAddress}`);
          continue;
        }
        
        // Generate NFT ID from mint address
        const nftId = hashMintAddress(mintAddress);
        
        // Print stake account details 
        console.log(`\n   🔹 STAKE #${processedCount}: ${mintAddress}`);
        console.log(`   NFT ID: ${nftId}`);
        console.log(`   Owner: ${new PublicKey(stakeInfo.owner).toString()}`);
        console.log(`   isInitialized: ${stakeInfo.isInitialized}`);
        console.log(`   isUnstaked: ${stakeInfo.isUnstaked}`);
        console.log(`   Tier Multiplier: ${stakeInfo.tierMultiplier}x`);
        console.log(`   Staked At: ${new Date(Number(stakeInfo.stakedAt) * 1000).toLocaleString()}`);
        console.log(`   Release Time: ${new Date(Number(stakeInfo.releaseTime) * 1000).toLocaleString()}`);
        console.log(`   Daily Reward Rate: ${Number(stakeInfo.rewardRatePerDay)}`);
        
        // Count by status
        if (stakeInfo.isUnstaked === 1) {
          unstaked++;
          console.log(`   ⚠️ This NFT is marked as UNSTAKED but still in the user's stakedMints array`);
        } else {
          displayedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error processing mint ${mintAddress}:`, err.message);
      }
    }
    
    // Summary
    console.log(`\n📋 SUMMARY:`);
    console.log(`-----------`);
    console.log(`Total mint addresses in stakedMints array: ${stakedMints.length}`);
    console.log(`Total stake accounts processed: ${processedCount}`);
    console.log(`NFTs marked as unstaked: ${unstaked}`);
    console.log(`NFTs that should display: ${displayedCount}`);
    
    if (displayedCount !== stakedMints.length) {
      console.log(`\n⚠️ ISSUE DETECTED: Only ${displayedCount} of ${stakedMints.length} NFTs would display in the UI`);
      console.log(`This is because the others are marked as unstaked (isUnstaked=1) but still present in the stakedMints array.`);
      console.log(`\nRECOMMENDED FIX:`);
      console.log(`1. The stakedMints array should be cleaned up when NFTs are unstaked`);
      console.log(`2. In the getOnchainStakingInfoFixed.js API, check for this issue and filter out unstaked NFTs`);
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

main().then(() => console.log('\nDebug script completed.'));