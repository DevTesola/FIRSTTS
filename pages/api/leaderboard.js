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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { sort = 'score', page = 1, limit = 25 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 25;
    const offset = (pageNumber - 1) * pageSize;
    
    // Get user wallet address if provided
    const { wallet } = req.query;
    
    // Log request parameters
    console.log('Leaderboard API request:', { sort, page: pageNumber, limit: pageSize, wallet });
    
    // In a production environment, fetch data from database
    // For this demo, generate mock data
    const mockData = generateMockLeaderboardData();
    
    // Sort data based on sort parameter
    const sortedData = sortLeaderboardData(mockData, sort);
    
    // Calculate user's rank if wallet provided
    let userRank = null;
    if (wallet) {
      // In production, fetch user data from database
      // For demo, randomly place user in ranks 50-100
      const userRankNum = Math.floor(Math.random() * 50) + 50;
      userRank = {
        rank: userRankNum,
        walletAddress: wallet,
        tokenAmount: Math.floor(100000 * Math.pow(0.95, userRankNum)),
        holdingDays: Math.floor(Math.random() * 365) + 30,
        score: 0 // Will calculate below
      };
      
      // Calculate score
      userRank.score = Math.floor(userRank.tokenAmount * (1 + (userRank.holdingDays / 30) * 0.1));
      userRank.hasEvolvedNFT = userRank.rank <= 100;
    }
    
    // Return data
    res.status(200).json({
      leaderboard: sortedData,
      total: sortedData.length,
      page: pageNumber,
      pages: Math.ceil(sortedData.length / pageSize),
      userRank
    });
    
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
}

// Function to generate mock leaderboard data
function generateMockLeaderboardData() {
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
    
    return {
      rank,
      walletAddress: `${randomWalletString(4)}...${randomWalletString(4)}`,
      tokenAmount,
      holdingDays,
      score,
      hasEvolvedNFT
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