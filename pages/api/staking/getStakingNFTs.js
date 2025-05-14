// pages/api/getStakingNFTs.js
// My Collection 페이지와 동일한 방식으로 실제 NFT 메타데이터 가져오기
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * API to fetch user's NFTs from the SOLARA collection for staking
 * Uses the same approach as the My Collection page
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log(`[getStakingNFTs] Fetching NFTs for wallet: ${wallet}`);
    
    // Step 1: Get NFTs using the same API as My Collection
    try {
      const response = await fetch(`/api/getNFTs?wallet=${wallet}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[getStakingNFTs] Got ${data.nfts?.length || 0} NFTs from getNFTs API`);
      
      // Step 2: Filter out NFTs that are already staked
      try {
        const { data: stakedNFTs, error: stakingError } = await supabase
          .from('nft_staking')
          .select('mint_address')
          .eq('wallet_address', wallet)
          .eq('status', 'staked');
        
        if (!stakingError && stakedNFTs && stakedNFTs.length > 0) {
          const stakedMints = new Set(stakedNFTs.map(item => item.mint_address));
          
          // Filter out NFTs that are already staked
          const originalCount = data.nfts?.length || 0;
          const filteredNFTs = data.nfts.filter(nft => !stakedMints.has(nft.mint));
          
          console.log(`[getStakingNFTs] Filtered out ${originalCount - filteredNFTs.length} already staked NFTs`);
          
          return res.status(200).json({
            success: true,
            nfts: filteredNFTs,
            count: filteredNFTs.length
          });
        } else {
          // No staked NFTs, return all NFTs
          return res.status(200).json({
            success: true,
            nfts: data.nfts || [],
            count: data.nfts?.length || 0
          });
        }
      } catch (stakingError) {
        console.error('[getStakingNFTs] Error checking staked NFTs:', stakingError);
        // Return all NFTs if there's an error checking staked ones
        return res.status(200).json({
          success: true,
          nfts: data.nfts || [],
          count: data.nfts?.length || 0
        });
      }
    } catch (error) {
      console.error('[getStakingNFTs] Error fetching NFTs:', error);
      // If the API call fails, fall back to the original getUserNFTs implementation
      return await fallbackToOriginalMethod(req, res, wallet);
    }
  } catch (error) {
    console.error('[getStakingNFTs] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to load your NFTs. Please try again later.',
      details: error.message,
      success: false,
      nfts: [],
      count: 0
    });
  }
}

/**
 * Fallback to the original getUserNFTs implementation if the primary method fails
 */
async function fallbackToOriginalMethod(req, res, wallet) {
  try {
    console.log(`[getStakingNFTs] Falling back to original method for wallet: ${wallet}`);
    
    // Create a connection to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    let userNFTs = [];
    
    // Step 1: Try the database approach
    try {
      const { data: dbNFTs, error: dbError } = await supabase
        .from('minted_nfts')
        .select('*')
        .eq('wallet', wallet)
        .eq('status', 'completed');
      
      if (dbError) {
        console.error('[getStakingNFTs] Database query error:', dbError);
      } else if (dbNFTs && dbNFTs.length > 0) {
        console.log(`[getStakingNFTs] Found ${dbNFTs.length} NFTs in database for wallet ${wallet}`);
        
        // Format NFTs with necessary data
        userNFTs = dbNFTs.map(nft => ({
          id: nft.mint_index || nft.id,
          mint: nft.mint_address,
          name: nft.name || `SOLARA #${nft.mint_index || nft.id}`,
          image: nft.image_url,
          attributes: nft.metadata?.attributes || []
        }));
      }
    } catch (dbLookupError) {
      console.error('[getStakingNFTs] Error during database lookup:', dbLookupError);
    }
    
    // 모의 데이터 비활성화 - 실제 데이터만 표시
    if (userNFTs.length === 0) {
      console.log('[getStakingNFTs] No NFTs found in database, returning empty array');
      // 실제 프로덕션에서는 모의 데이터를 사용하지 않음
      // userNFTs = generateMockNFTs(wallet);
    }
    
    // Step 2: Check which NFTs are already staked
    try {
      const { data: stakedNFTs, error: stakingError } = await supabase
        .from('nft_staking')
        .select('mint_address')
        .eq('wallet_address', wallet)
        .eq('status', 'staked');
      
      if (!stakingError && stakedNFTs && stakedNFTs.length > 0) {
        const stakedMints = new Set(stakedNFTs.map(item => item.mint_address));
        
        // Filter out NFTs that are already staked
        const beforeCount = userNFTs.length;
        userNFTs = userNFTs.filter(nft => !stakedMints.has(nft.mint));
        
        console.log(`[getStakingNFTs] Filtered out ${beforeCount - userNFTs.length} already staked NFTs`);
      }
    } catch (stakingError) {
      console.error('[getStakingNFTs] Error checking staked NFTs:', stakingError);
    }
    
    // Sort NFTs by ID
    userNFTs.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });
    
    return res.status(200).json({
      success: true,
      nfts: userNFTs,
      count: userNFTs.length
    });
  } catch (error) {
    console.error('[getStakingNFTs] Error in fallback method:', error);
    return res.status(500).json({ 
      error: 'Failed to load your NFTs. Please try again later.',
      details: error.message,
      success: false,
      nfts: [],
      count: 0
    });
  }
}

/**
 * Generate mock NFT data for testing purposes
 */
// 모의 데이터 생성 함수 제거 - 실제 프로덕션 환경에서는 사용하지 않음
/*
function generateMockNFTs(wallet) {
  // 이 함수는 비활성화되었습니다
  return [];
}
*/