/**
 * 직접 온체인 스테이킹 데이터 조회 API
 * 공유 PDA 유틸리티 사용 및 개선된 로깅 기능 추가
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder } from '@project-serum/anchor';
import { findStakeInfoPDA, findUserStakingInfoPDA } from '../../../shared/utils/pda';
import { PROGRAM_ID } from '../../../shared/constants/program-ids';
import { resolveNftId } from '../../../utils/staking-helpers/nft-id-resolver';

// Constants
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// IPFS Gateway URL
const IPFS_GATEWAY = 'https://tesola.mypinata.cloud/ipfs/';

// IPFS CID for images
const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';

// Utility function to generate image URLs
function createImageUrl(nftId) {
  const formattedId = String(nftId).padStart(4, '0');
  const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
  const gatewayUrl = `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${formattedId}.png`;
  
  return {
    ipfs_url: ipfsUrl,
    gateway_url: gatewayUrl,
    nft_image: gatewayUrl,
    ipfs_hash: IMAGES_IPFS_HASH
  };
}

// Calculate days remaining until release
function calculateDaysLeft(releaseDate) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffTime = release - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Calculate progress percentage
function calculateProgress(stakedAt, releaseDate) {
  const start = new Date(stakedAt).getTime();
  const end = new Date(releaseDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log(`👉 Fetching chain data for wallet: ${wallet}`);
    
    // Establish Solana connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    const walletPubkey = new PublicKey(wallet);
    
    // Find and fetch user staking account
    const [userStakingPDA] = findUserStakingInfoPDA(walletPubkey);
    console.log(`👉 User staking PDA: ${userStakingPDA.toString()}`);
    
    const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
    
    if (!userStakingAccount) {
      console.log(`❌ No user staking account found for ${wallet}`);
      return res.status(200).json({
        success: true,
        message: 'No staking data found',
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
    
    console.log(`✅ Found user staking account with ${userStakingAccount.data.length} bytes`);
    
    // Use Anchor's BorshAccountsCoder to decode the account data
    const idl = require('../../../idl/nft_staking.json');
    const coder = new BorshAccountsCoder(idl);
    
    try {
      // Try to decode as UserStakingInfo account
      const userStakingInfo = coder.decode('userStakingInfo', userStakingAccount.data);
      console.log(`✅ Successfully decoded user staking account with ${userStakingInfo.stakedMints.length} staked mints`);
      
      // Print details of each staked mint
      userStakingInfo.stakedMints.forEach((mint, index) => {
        const mintStr = mint.toString();
        console.log(`👉 Mint #${index}: ${mintStr}, isPubKey: ${mint instanceof PublicKey}, isDefault: ${mintStr === PublicKey.default.toString()}`);
      });
      
      // Filter out invalid mints
      const stakedMints = userStakingInfo.stakedMints
        .filter(mint => {
          const isDefault = mint.equals(PublicKey.default);
          const isAllOnes = mint.toString() === '11111111111111111111111111111111';
          console.log(`🔄 Filtering mint ${mint.toString()}: isDefault=${isDefault}, isAllOnes=${isAllOnes}`);
          return !isDefault && !isAllOnes;
        })
        .map(mint => mint.toString());
      
      console.log(`✅ After filtering: ${stakedMints.length} valid staked mints: ${JSON.stringify(stakedMints)}`);
      
      // Process each staked NFT
      const activeStakes = [];
      let totalEarnedSoFar = 0;
      let totalProjectedRewards = 0;
      
      for (const mintAddress of stakedMints) {
        try {
          console.log(`👉 Processing mint ${mintAddress}`);
          const mintPubkey = new PublicKey(mintAddress);
          
          // Find stake account using our utility
          const [stakePDA] = findStakeInfoPDA(mintPubkey);
          console.log(`👉 Derived stake PDA: ${stakePDA.toString()}`);
          
          // Fetch stake account data
          const stakeAccount = await connection.getAccountInfo(stakePDA);
          
          if (!stakeAccount) {
            console.log(`❌ No stake account found for mint ${mintAddress}`);
            continue;
          }
          
          console.log(`✅ Found stake account with ${stakeAccount.data.length} bytes`);
          
          // Try to decode using Anchor's coder
          try {
            const stakeInfo = coder.decode('stakeInfo', stakeAccount.data);
            console.log(`✅ Successfully decoded stake info:`, {
              isInitialized: stakeInfo.isInitialized,
              nftMint: stakeInfo.nftMint.toString(),
              owner: stakeInfo.owner.toString(),
              stakedAt: stakeInfo.stakingStartTime.toString(),
              releaseTime: stakeInfo.releaseTime?.toString(),
              isUnstaked: stakeInfo.isUnstaked
            });
            
            // Skip if unstaked
            if (stakeInfo.isUnstaked === 1) {
              console.log(`⚠️ Skipping mint ${mintAddress} because it's unstaked`);
              continue;
            }
            
            // Calculate NFT ID using our resolver
            const nftId = resolveNftId(mintAddress);
            console.log(`✅ Resolved NFT ID: ${nftId}`);
            
            // Generate image URLs
            const imageUrls = createImageUrl(nftId);
            
            // Calculate times and periods
            const stakedAt = new Date(stakeInfo.stakingStartTime.toNumber() * 1000);
            const releaseTime = new Date(stakeInfo.releaseTime.toNumber() * 1000);
            const stakingPeriod = Math.ceil((stakeInfo.releaseTime.toNumber() - stakeInfo.stakingStartTime.toNumber()) / (24 * 60 * 60));
            
            // Calculate rewards
            const dailyRewardRate = stakeInfo.rewardRatePerDay ? stakeInfo.rewardRatePerDay.toNumber() : 25;
            const totalRewards = stakingPeriod * dailyRewardRate;
            
            // Calculate earned rewards
            const currentTime = Math.floor(Date.now() / 1000);
            const stakingDuration = Math.min(
              currentTime - stakeInfo.stakingStartTime.toNumber(),
              stakeInfo.releaseTime.toNumber() - stakeInfo.stakingStartTime.toNumber()
            );
            const earnedSoFar = Math.floor((stakingDuration / 86400) * dailyRewardRate);
            
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
              nft_tier: 'COMMON', // Could be determined by tier multiplier if available
              staked_at: stakedAt.toISOString(),
              release_date: releaseTime.toISOString(),
              staking_period: stakingPeriod,
              daily_reward_rate: dailyRewardRate,
              total_rewards: totalRewards,
              earned_so_far: earnedSoFar,
              claimed_rewards: 0,
              status: 'staked',
              progress_percentage: calculateProgress(stakedAt, releaseTime),
              days_left: calculateDaysLeft(releaseTime),
              is_unlocked: calculateDaysLeft(releaseTime) === 0,
              
              // Image URLs
              image: imageUrls.ipfs_url,
              image_url: imageUrls.ipfs_url,
              nft_image: imageUrls.gateway_url,
              ipfs_hash: imageUrls.ipfs_hash,
              
              // Debug info
              _debug: {
                source: 'getStakingInfoFromChain',
                nftId,
                mintAddress,
                stakePDA: stakePDA.toString()
              }
            };
            
            activeStakes.push(stakeData);
            console.log(`✅ Successfully processed NFT ${nftId}`);
          } catch (decodeError) {
            console.error(`❌ Failed to decode stake info for ${mintAddress}:`, decodeError);
          }
        } catch (err) {
          console.error(`❌ Error processing mint ${mintAddress}:`, err);
        }
      }
      
      // Build the final response
      const responseData = {
        success: true,
        message: `Found ${activeStakes.length} staked NFTs`,
        stats: {
          activeStakes,
          stats: {
            projectedRewards: totalProjectedRewards,
            earnedToDate: totalEarnedSoFar,
            collectionBonus: userStakingInfo.collectionBonus || 0
          }
        }
      };
      
      return res.status(200).json(responseData);
      
    } catch (decodeError) {
      console.error(`❌ Failed to decode user staking account:`, decodeError);
      return res.status(500).json({
        error: 'Failed to decode user staking account',
        details: decodeError.message
      });
    }
    
  } catch (error) {
    console.error(`❌ Error in getStakingInfoFromChain:`, error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
}