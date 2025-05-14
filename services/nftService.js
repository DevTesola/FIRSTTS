/**
 * NFT Service
 * 
 * Handles all NFT-related operations including minting, fetching,
 * and managing NFT data. This service abstracts the business logic
 * from the component layer and API routes.
 */

import { api, endpoints } from './api';

/**
 * Get the current minted count of NFTs
 * 
 * @returns {Promise<Object>} - Object containing minted count and total supply
 */
export async function getMintedCount() {
  try {
    return await api.get(endpoints.nft.getMinted);
  } catch (error) {
    console.error('Failed to fetch minted count:', error);
    throw error;
  }
}

/**
 * Get the current mint price
 * 
 * @returns {Promise<Object>} - Object containing price information
 */
export async function getMintPrice() {
  try {
    return await api.get(endpoints.nft.getMintPrice);
  } catch (error) {
    console.error('Failed to fetch mint price:', error);
    throw error;
  }
}

/**
 * Initiate NFT purchase transaction
 * 
 * @param {Object} data - Purchase data including wallet address
 * @returns {Promise<Object>} - Transaction data 
 */
export async function purchaseNFT(data) {
  try {
    return await api.post(endpoints.nft.purchaseNFT, data);
  } catch (error) {
    console.error('Failed to purchase NFT:', error);
    throw error;
  }
}

/**
 * Complete NFT minting process
 * 
 * @param {Object} data - Transaction data for completing mint
 * @returns {Promise<Object>} - Minting result data
 */
export async function completeMinting(data) {
  try {
    return await api.post(endpoints.nft.completeMinting, data);
  } catch (error) {
    console.error('Failed to complete minting:', error);
    throw error;
  }
}

/**
 * Get NFTs for a specific wallet
 * 
 * @param {string} wallet - Wallet address
 * @param {boolean} allMetadata - Whether to include full metadata
 * @returns {Promise<Array>} - Array of NFT objects
 */
export async function getNFTsByWallet(wallet, allMetadata = false) {
  try {
    return await api.get(`${endpoints.nft.getNFTs}?wallet=${wallet}${allMetadata ? '&includeMetadata=true' : ''}`);
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    throw error;
  }
}

/**
 * Get all NFTs in the collection
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Array of NFT objects
 */
export async function getAllNFTs(params = {}) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    // Always include all=true
    queryParams.append('all', 'true');
    
    return await api.get(`${endpoints.nft.getNFTs}?${queryParams.toString()}`);
  } catch (error) {
    console.error('Failed to fetch all NFTs:', error);
    throw error;
  }
}

/**
 * Verify NFT ownership
 * 
 * @param {string} wallet - Wallet address
 * @param {string} mintAddress - NFT mint address
 * @returns {Promise<boolean>} - Whether the wallet owns the NFT
 */
export async function verifyNFTOwnership(wallet, mintAddress) {
  try {
    const nfts = await getNFTsByWallet(wallet);
    return nfts.some(nft => nft.mint === mintAddress);
  } catch (error) {
    console.error('Failed to verify NFT ownership:', error);
    throw error;
  }
}

/**
 * Get NFT metadata by mint address
 * 
 * @param {string} mintAddress - NFT mint address
 * @returns {Promise<Object>} - NFT metadata
 */
export async function getNFTMetadata(mintAddress) {
  try {
    return await api.get(`${endpoints.nft.getNFTs}?mint=${mintAddress}&includeMetadata=true`);
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    throw error;
  }
}

/**
 * Get NFT image URL with fallback
 * 
 * @param {Object} options - NFT and context information
 * @param {string} options.imageUrl - Original image URL
 * @param {string} [options.__source] - Source component requesting the image
 * @returns {string} - Processed image URL with fallback
 */
export function getNFTImageUrl(options) {
  // Handle both string input (legacy) and object input
  const imageUrl = typeof options === 'string' ? options : options.imageUrl || options.image;
  const source = options.__source || '';
  
  // Detect if request is coming from staking components
  const isStakingComponent = source.includes('staking') || 
                            source.includes('Staking') || 
                            source.includes('stake') || 
                            source.includes('Stake') ||
                            source.includes('dashboard') || 
                            source.includes('Dashboard') ||
                            source.includes('leaderboard') || 
                            source.includes('Leaderboard');
  
  // For staking components, use a specially formatted IPFS URL instead of local fallbacks
  if (!imageUrl) {
    return isStakingComponent ? 
      `ipfs://placeholder/${Math.random().toString(36).substring(2, 10)}` : 
      '/placeholder-nft.png';
  }
  
  // Handle IPFS URLs
  if (imageUrl.startsWith('ipfs://')) {
    const cid = imageUrl.replace('ipfs://', '');
    return `/api/ipfs/${cid}`;
  }
  
  // If URL is a local path and coming from staking component, use special IPFS placeholder
  if (imageUrl.startsWith('/') && isStakingComponent) {
    return `ipfs://placeholder/${Math.random().toString(36).substring(2, 10)}`;
  }
  
  return imageUrl;
}

export default {
  getMintedCount,
  getMintPrice,
  purchaseNFT,
  completeMinting,
  getNFTsByWallet,
  getAllNFTs,
  verifyNFTOwnership,
  getNFTMetadata,
  getNFTImageUrl
};