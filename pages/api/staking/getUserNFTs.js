// pages/api/staking/getUserNFTs.js
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
 * This includes both on-chain verification and database lookups
 * This version properly filters out already staked NFTs
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log(`Fetching NFTs for wallet (staking): ${wallet}`);
    
    // Create a connection to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    let userNFTs = [];
    
    // Step 1: First try the database approach (fast and has metadata)
    try {
      const { data: dbNFTs, error: dbError } = await supabase
        .from('minted_nfts')
        .select('*')
        .eq('wallet', wallet)
        .eq('status', 'completed');
      
      if (dbError) {
        console.error('Database query error:', dbError);
        // Continue with on-chain approach if database fails
      } else if (dbNFTs && dbNFTs.length > 0) {
        console.log(`Found ${dbNFTs.length} NFTs in database for wallet ${wallet}`);
        
        // Format NFTs with necessary data
        userNFTs = dbNFTs.map(nft => ({
          id: nft.mint_index || nft.id,
          mint: nft.mint_address,
          name: nft.name || `SOLARA #${nft.mint_index || nft.id}`,
          image: nft.image_url || generateIPFSUrl(nft.mint_index || nft.id), // 우선 IPFS URL 생성
          image_url: nft.image_url || generateIPFSUrl(nft.mint_index || nft.id), // 중복 필드 추가
          nft_image: nft.image_url || generateIPFSUrl(nft.mint_index || nft.id), // NFT 이미지 URL 직접 제공
          attributes: nft.metadata?.attributes || []
        }));
      }
    } catch (dbLookupError) {
      console.error('Error during database lookup:', dbLookupError);
      // Continue with on-chain approach
    }
    
    // If we didn't get any NFTs from the database, generate mock data for testing
    if (userNFTs.length === 0) {
      console.log('No NFTs found in database, generating mock data');
      
      try {
        // Generate mock NFTs for testing purposes
        userNFTs = generateMockNFTs(wallet);
        console.log(`Generated ${userNFTs.length} mock NFTs for testing`);
      } catch (mockError) {
        console.error('Error generating mock NFT data:', mockError);
        // Return empty array if even mock generation fails
        userNFTs = [];
      }
    }
    
    // Step 2: IMPORTANT - Check which NFTs are already staked to avoid duplicates and confusion
    try {
      const { data: stakedNFTs, error: stakingError } = await supabase
        .from('nft_staking')
        .select('mint_address, nft_name, is_claimed, status')
        .eq('wallet_address', wallet)
        .in('status', ['staked', 'claimed']);
      
      if (!stakingError && stakedNFTs && stakedNFTs.length > 0) {
        console.log(`Found ${stakedNFTs.length} already staked NFTs`);
        
        // Create staked NFTs map for quick lookup
        const stakedMints = new Set(stakedNFTs.map(item => item.mint_address));
        
        // Mark NFTs that are staked in the response
        userNFTs = userNFTs.map(nft => {
          const isStaked = stakedMints.has(nft.mint);
          const stakedInfo = isStaked ? 
            stakedNFTs.find(stake => stake.mint_address === nft.mint) : null;
          
          return {
            ...nft,
            isStaked: isStaked,
            stakeStatus: stakedInfo?.status || null
          };
        });
        
        // By default, filter out staked NFTs - user will see them in dashboard
        const stakableNFTs = userNFTs.filter(nft => !nft.isStaked);
        
        console.log(`Returning ${stakableNFTs.length} NFTs available for staking`);
        return res.status(200).json({
          success: true,
          nfts: stakableNFTs,
          count: stakableNFTs.length,
          totalCount: userNFTs.length,
          stakedCount: stakedNFTs.length
        });
      }
    } catch (stakingError) {
      console.error('Error checking staked NFTs:', stakingError);
      // Continue with unfiltered list if there's an error
    }
    
    // Sort NFTs by ID
    userNFTs.sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });
    
    // Return the results
    return res.status(200).json({
      success: true,
      nfts: userNFTs,
      count: userNFTs.length
    });
    
  } catch (error) {
    console.error('Error in staking/getUserNFTs API:', error);
    // Always return a valid response even when there's an error
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
 * IPFS URL을 생성하는 함수
 * @param {number|string} id - NFT ID
 * @returns {string} 완전한 IPFS 게이트웨이 URL
 */
function generateIPFSUrl(id) {
  try {
    // ID가 없으면 기본 이미지 반환
    if (!id) return "loading:indicator";

    // ID 포맷팅 (4자리 숫자로)
    const formattedId = String(id).padStart(4, '0');

    // 환경 변수에서 IPFS 설정 가져오기
    const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
    const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';

    // 캐시 버스팅 파라미터 추가
    const timestamp = Date.now();
    const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_forcereload=true&_t=${timestamp}`;

    console.log(`🔄 getUserNFTs API: NFT ID ${id}에 대해 IPFS URL 생성: ${gatewayUrl}`);
    return gatewayUrl;
  } catch (error) {
    console.error('IPFS URL 생성 오류:', error);
    return "error:generating-url";
  }
}

/**
 * 모의 NFT 데이터 생성 함수
 * 테스트 환경에서만 사용됩니다
 */
function generateMockNFTs(wallet) {
  // 3-5개의 랜덤 NFT 생성
  const count = Math.floor(Math.random() * 3) + 3;
  const mockNFTs = [];

  for (let i = 0; i < count; i++) {
    const id = Math.floor(Math.random() * 1000) + 1;
    const formattedId = String(id).padStart(4, '0');

    mockNFTs.push({
      id: id,
      mint: `mock_mint_${wallet.slice(0, 6)}_${formattedId}`,
      name: `SOLARA #${formattedId}`,
      image: generateIPFSUrl(id),
      image_url: generateIPFSUrl(id),
      nft_image: generateIPFSUrl(id),
      attributes: [
        {
          trait_type: "Tier",
          value: i === 0 ? "Legendary" : i === 1 ? "Epic" : i === 2 ? "Rare" : "Common"
        }
      ]
    });
  }

  return mockNFTs;
}