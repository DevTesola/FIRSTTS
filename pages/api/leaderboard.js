// pages/api/leaderboard.js
import { createClient } from '@supabase/supabase-js';

// Regular client (limited permissions)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Service role client (admin permissions, bypass RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  // Add CORS headers for better compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests for the actual API
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    // Get query parameters with enhanced validation
    const { sort = 'score', page = 1, limit = 25 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1); // Minimum page 1
    const pageSize = Math.min(100, Math.max(5, parseInt(limit, 10) || 25)); // Between 5-100
    const offset = (pageNumber - 1) * pageSize;
    
    // Get user wallet address if provided
    const { wallet } = req.query;
    
    // Log request parameters with a tag for easier log filtering
    console.log('[LEADERBOARD] API request:', { sort, page: pageNumber, limit: pageSize, wallet });
    
    // In a production environment, fetch data from database
    // For this demo, generate mock data - with error handling
    let mockData;
    try {
      mockData = generateMockLeaderboardData();
    } catch (mockError) {
      console.error('[LEADERBOARD] Error generating mock data:', mockError);
      mockData = []; // Fallback to empty array on error
    }
    
    // Sort data - with basic validation
    const validSortOptions = ['score', 'tokens', 'duration'];
    const validatedSort = validSortOptions.includes(sort) ? sort : 'score';
    const sortedData = sortLeaderboardData(mockData, validatedSort);
    
    // Extract paginated slice of data
    const paginatedData = sortedData.slice(offset, offset + pageSize);
    
    // Calculate user's rank if wallet provided
    let userRank = null;
    if (wallet) {
      try {
        // In production, fetch user data from database
        // For demo, consistently generate a user's rank based on wallet address hash
        const getUserRank = (address) => {
          // Generate a consistent hash for the wallet address
          const hash = address.split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
          }, 0);
          
          // Use hash to determine a rank between 1-150 (making it sometimes in top 100)
          return Math.max(1, Math.min(150, (hash % 150) + 1));
        };
        
        const userRankNum = getUserRank(wallet);
        
        // Sample IPFS hashes for user NFTs
        const sampleUserIpfsHashes = [
          'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
          'QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8'
        ];
        
        // Generate a deterministic IPFS hash based on wallet
        const walletHash = wallet.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const userIpfsHash = sampleUserIpfsHashes[walletHash % sampleUserIpfsHashes.length];
        
        userRank = {
          rank: userRankNum,
          walletAddress: wallet,
          tokenAmount: Math.floor(100000 * Math.pow(0.96, userRankNum)),
          holdingDays: Math.floor((Math.abs(wallet.charCodeAt(0) * 37) % 365) + 30),
          score: 0, // Will calculate below
          // Add image fields
          image_url: `ipfs://${userIpfsHash}/image.png`,
          nft_image: undefined, // Alternative source
          ipfs_hash: userIpfsHash
        };
        
        // Calculate score with same formula used in generateMockLeaderboardData
        userRank.score = Math.floor(userRank.tokenAmount * (1 + (userRank.holdingDays / 30) * 0.1));
        userRank.hasEvolvedNFT = userRank.rank <= 100;
      } catch (userRankError) {
        console.error('[LEADERBOARD] Error calculating user rank:', userRankError);
        // Provide default user rank on error
        userRank = {
          rank: 101,
          walletAddress: wallet,
          tokenAmount: 10000,
          holdingDays: 30,
          score: 11000,
          hasEvolvedNFT: false,
          // Add default image fields
          image_url: `ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX/image.png`,
          nft_image: undefined,
          ipfs_hash: 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX'
        };
      }
    }
    
    // Add performance and caching headers
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    // Return data with success flag for consistent API responses
    res.status(200).json({
      success: true,
      leaderboard: paginatedData, // Only return the paginated slice
      total: sortedData.length,
      page: pageNumber,
      pages: Math.ceil(sortedData.length / pageSize),
      userRank,
      // Add pagination links for convenience
      links: {
        first: pageNumber > 1 ? `/api/leaderboard?sort=${validatedSort}&page=1&limit=${pageSize}` : null,
        prev: pageNumber > 1 ? `/api/leaderboard?sort=${validatedSort}&page=${pageNumber-1}&limit=${pageSize}` : null,
        next: pageNumber < Math.ceil(sortedData.length / pageSize) ? `/api/leaderboard?sort=${validatedSort}&page=${pageNumber+1}&limit=${pageSize}` : null,
        last: pageNumber < Math.ceil(sortedData.length / pageSize) ? `/api/leaderboard?sort=${validatedSort}&page=${Math.ceil(sortedData.length / pageSize)}&limit=${pageSize}` : null,
      }
    });
    
  } catch (error) {
    console.error('[LEADERBOARD] Unhandled error in API:', error);
    // Return error with consistent error response format
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch leaderboard data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Function to generate mock leaderboard data
function generateMockLeaderboardData() {
  // Sample IPFS hashes for demonstration - usually these would be real NFT metadata
  const sampleIpfsHashes = [
    'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    'QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8',
    'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX',
    'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    'Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
    'QmYA2fn8cMbVWo4v95RwcwJVyQsNtnEwHerfWR8UNtEwoE'
  ];

  // Create 100 mock entries
  const mockData = Array.from({ length: 100 }, (_, i) => {
    const rank = i + 1;
    // Exponentially decrease token amounts for lower ranks
    const tokenAmount = Math.floor(100000 * Math.pow(0.95, i));
    const holdingDays = Math.floor(Math.random() * 365) + 30;
    
    // Calculate score based on tokens and holding period
    const score = Math.floor(tokenAmount * (1 + (holdingDays / 30) * 0.1));
    
    // For top 10, simulate evolved NFTs
    const hasEvolvedNFT = rank <= 10;
    
    // Generate a deterministic IPFS hash based on rank
    const ipfsHash = sampleIpfsHashes[rank % sampleIpfsHashes.length];
    
    // Create image URLs with different formats to simulate real data variety
    let imageUrl;
    const imageType = rank % 4; // Randomly choose different image source types
    
    switch(imageType) {
      case 0:
        // IPFS URL format
        imageUrl = `ipfs://${ipfsHash}/image.png`;
        break;
      case 1:
        // Gateway URL format
        imageUrl = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}/image.png`;
        break;
      case 2:
        // Direct URL format
        imageUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}/image.png`;
        break;
      case 3:
        // Leave undefined to test fallback - about 25% of entries
        imageUrl = undefined;
        break;
    }
    
    return {
      rank,
      walletAddress: `${randomWalletString(4)}...${randomWalletString(4)}`,
      tokenAmount,
      holdingDays,
      score,
      hasEvolvedNFT,
      // Add image fields that match our expected structure:
      image_url: imageUrl,
      nft_image: imageUrl ? undefined : "loading:indicator", // Use loading indicator instead of local image
      ipfs_hash: ipfsHash
    };
  });
  
  return mockData;
}

// Helper function to sort leaderboard data
function sortLeaderboardData(data, sortBy) {
  const dataCopy = [...data];
  
  switch(sortBy) {
    case 'tokens':
      return dataCopy.sort((a, b) => b.tokenAmount - a.tokenAmount);
    case 'duration':
      return dataCopy.sort((a, b) => b.holdingDays - a.holdingDays);
    case 'score':
    default:
      return dataCopy.sort((a, b) => b.score - a.score);
  }
}

// Helper function to generate random wallet addresses
function randomWalletString(length) {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* 
In production, you would implement real database queries like:

async function fetchLeaderboardData(sortBy = 'score', pageNumber = 1, pageSize = 25) {
  let query = supabaseAdmin
    .from('user_stats')
    .select('id, wallet_address, token_amount, first_token_date, total_score');
  
  // Add sorting
  switch(sortBy) {
    case 'tokens':
      query = query.order('token_amount', { ascending: false });
      break;
    case 'duration':
      query = query.order('holding_days', { ascending: false });
      break;
    case 'score':
    default:
      query = query.order('total_score', { ascending: false });
      break;
  }
  
  // Add pagination
  query = query.range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1);
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching leaderboard data:', error);
    throw new Error('Database query failed');
  }
  
  return data.map((row, index) => {
    const rank = (pageNumber - 1) * pageSize + index + 1;
    return {
      rank,
      walletAddress: `${row.wallet_address.slice(0,4)}...${row.wallet_address.slice(-4)}`,
      tokenAmount: row.token_amount,
      holdingDays: calculateHoldingDays(row.first_token_date),
      score: row.total_score,
      hasEvolvedNFT: rank <= 100
    };
  });
}

function calculateHoldingDays(firstTokenDate) {
  const now = new Date();
  const firstDate = new Date(firstTokenDate);
  const diffTime = Math.abs(now - firstDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
*/