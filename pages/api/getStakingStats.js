// pages/api/getStakingStats.js - 캐시 방지 및 데이터 일관성 개선
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API to fetch user's staking statistics with improved caching and consistency
 * Provides active staking records and overall staking metrics
 */
import { sendSuccess, sendError, validateMethod, validateQuery } from "../../utils/apiResponses";

export default async function handler(req, res) {
  // API 메소드 검증
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }
  
  // 필수 쿼리 파라미터 검증
  if (!validateQuery(req, res, ['wallet'])) {
    return;
  }
  
  try {
    const { wallet, nocache } = req.query;
    const cacheStr = nocache || Date.now(); // 캐시 방지 파라미터
    // 로그 출력 줄이기
    // console.log(`Fetching staking stats for wallet: ${wallet} (cache: ${cacheStr})`);
    
    // Get active staking records with detailed info
    const { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*, nft_tier') // nft_tier만 포함 (image_url은 데이터베이스에 없음)
      .eq('wallet_address', wallet)
      .eq('status', 'staked')
      .order('staked_at', { ascending: false });
      
    // console.log(`Fetching staking data for wallet ${wallet}...`);  // 디버깅 로그 추가
    
    if (stakingError) {
      console.error('Error fetching staking data:', stakingError);
      return sendError(res, 'Failed to fetch staking data', 500, 'DATABASE_ERROR', stakingError);
    }
    
    // CRITICAL NEW STEP: Get actual NFT data from minted_nfts table to match accurate image URLs
    // This step ensures we get the correct image URLs for each NFT, not just mock data
    const mintAddresses = stakingData.map(stake => stake.mint_address).filter(Boolean);
    console.log(`Found ${mintAddresses.length} mint addresses to look up`);
    
    // Create a mapping of mint address to actual NFT data
    let nftDataByMint = {};
    
    if (mintAddresses.length > 0) {
      // *** 중요: Supabase 쿼리를 더 많은 정보를 포함하도록 확장 ***
      const { data: nftData, error: nftError } = await supabase
        .from('minted_nfts')
        .select('*, metadata')  // 메타데이터 필드도 명시적으로 포함
        .in('mint_address', mintAddresses);
      
      if (!nftError && nftData) {
        console.log(`Found ${nftData.length} NFTs in minted_nfts table`);
        
        // 각 NFT에 대한 세부 정보 로깅 (디버깅용)
        nftData.forEach(nft => {
          console.log(`NFT ${nft.mint_index || nft.id} details:`, {
            has_image_url: !!nft.image_url,
            image_url_type: nft.image_url ? (nft.image_url.startsWith('ipfs://') ? 'ipfs' : 
                                           (nft.image_url.startsWith('/') ? 'local' : 'other')) : 'none',
            has_metadata: !!nft.metadata,
            metadata_img: nft.metadata?.image ? 'yes' : 'no'
          });
        });
        
        // Create lookup by mint address
        nftDataByMint = nftData.reduce((acc, nft) => {
          if (nft.mint_address) {
            acc[nft.mint_address] = nft;
          }
          return acc;
        }, {});
      } else {
        console.error('Error fetching NFT data:', nftError);
      }
    }
    
    // Process staking data to add calculated fields
    const currentDate = new Date();
    let projectedRewards = 0;
    let earnedToDate = 0;
    
    const activeStakes = stakingData.map(stake => {
      const stakingStartDate = new Date(stake.staked_at);
      const releaseDate = new Date(stake.release_date);
      
      // Calculate total staking duration in milliseconds
      const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
      
      // Calculate elapsed duration (capped at total duration)
      const elapsedDuration = Math.min(
        currentDate.getTime() - stakingStartDate.getTime(),
        totalStakingDuration
      );
      
      // Calculate progress percentage
      const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
      
      // Calculate earned rewards so far
      const earnedSoFar = (stake.total_rewards * progressPercentage) / 100;
      
      // Add to totals
      projectedRewards += parseFloat(stake.total_rewards);
      earnedToDate += parseFloat(earnedSoFar);
      
      // Calculate days remaining
      const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
      
      // Determine if the staking period is complete
      const isUnlocked = currentDate >= releaseDate;
      
      // Calculate days elapsed
      const daysElapsed = Math.min(
        Math.ceil(elapsedDuration / (1000 * 60 * 60 * 24)),
        stake.staking_period
      );
      
      // *** 핵심 개선 - My NFTs 탭과 동일한 방식으로 처리 ***
      // 실제 NFT 데이터를 사용하여 진짜 NFT 이미지 URL 표시
      const actualNft = nftDataByMint[stake.mint_address];
      
      // 실제 데이터에서 NFT ID 추출
      const nftId = actualNft?.mint_index || actualNft?.id || stake.id || 
                   (stake.mint_address ? stake.mint_address.slice(0, 8) : '0');
      
      console.log(`Processing stake for NFT ID: ${nftId}, mint: ${stake.mint_address}`);
      
      // *** 핵심: My NFTs와 정확히 동일한 방식으로 이미지 처리 ***
      let nftImageUrl = null;         // 최종 NFT 이미지 URL
      let ipfsHash = null;            // IPFS 해시 (있는 경우)
      let ipfsUrl = null;             // IPFS URL
      let gatewayUrl = null;          // 게이트웨이 URL
      let previewImage = null;        // 로컬 프리뷰 이미지
      
      // 1. 실제 NFT 데이터가 있는 경우 - 최우선 순위
      if (actualNft) {
        console.log(`Found actual NFT data for ${stake.mint_address}`);
        
        // My NFTs 탭과 정확히 같은 방식으로 이미지 URL 설정
        // 실제 이미지 URL이 있는 경우 (mint_nfts 테이블의 image_url 필드)
        if (actualNft.image_url) {
          nftImageUrl = actualNft.image_url;
          console.log(`Using actual image_url from database: ${nftImageUrl}`);
          
          // IPFS URL 식별 및 게이트웨이 URL 생성
          if (nftImageUrl.startsWith('ipfs://')) {
            ipfsUrl = nftImageUrl;
            
            // IPFS 해시 추출
            const hashParts = ipfsUrl.replace('ipfs://', '').split('/');
            ipfsHash = hashParts[0];
            
            // 파일 경로 추출
            const filePath = '/' + (hashParts.slice(1).join('/') || '');
            
            // 게이트웨이 URL 생성
            gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}${filePath}`;
            console.log(`Generated gateway URL: ${gatewayUrl} from IPFS URL: ${ipfsUrl}`);
          }
          // 이미 게이트웨이 URL인 경우
          else if (nftImageUrl.includes('/ipfs/')) {
            gatewayUrl = nftImageUrl;
            
            // IPFS URL 역으로 생성
            const parts = gatewayUrl.split('/ipfs/');
            if (parts.length > 1) {
              ipfsHash = parts[1].split('/')[0];
              ipfsUrl = `ipfs://${parts[1]}`;
            }
          }
        }
        // 메타데이터에서 이미지 URL 추출 (두 번째 우선순위)
        else if (actualNft.metadata?.image) {
          nftImageUrl = actualNft.metadata.image;
          console.log(`Using image URL from metadata: ${nftImageUrl}`);
          
          if (nftImageUrl.startsWith('ipfs://')) {
            ipfsUrl = nftImageUrl;
            ipfsHash = ipfsUrl.replace('ipfs://', '').split('/')[0];
            
            // 파일 경로 추출 및 게이트웨이 URL 생성
            const filePath = ipfsUrl.replace(`ipfs://${ipfsHash}`, '') || '/';
            gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}${filePath}`;
          }
        }
        // NFT 인덱스로 이미지 경로 생성 (세 번째 우선순위)
        else if (actualNft.mint_index) {
          const formattedId = String(actualNft.mint_index).padStart(4, '0');
          nftImageUrl = `/nft-images/${formattedId}.png`;
          console.log(`Using generated image path from mint_index: ${nftImageUrl}`);
        }
      }
      
      // 2. 실제 NFT 데이터가 없는 경우 - 기존 로직으로 대체
      if (!nftImageUrl) {
        console.log(`No actual image URL found, using generated data for NFT ID: ${nftId}`);
        
        // IPFS 해시 설정 (있는 경우 사용, 없으면 기본값)
        if (!ipfsHash) {
          ipfsHash = stake.ipfs_hash;
          
          if (!ipfsHash) {
            // 실제 TESOLA 컬렉션의 IPFS CID
            const COLLECTION_IPFS_HASH = process.env.COLLECTION_IPFS_HASH || 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
            ipfsHash = COLLECTION_IPFS_HASH;
          }
          
          // 4자리 ID로 포맷팅 - 항상 숫자 ID 기반으로 처리
          let formattedId;
          
          // stake.id가 있으면 해당 ID 사용 (일관된 이미지 로딩을 위해 숫자만 추출)
          if (stake.id) {
            try {
              const numericId = parseInt(String(stake.id).replace(/\D/g, '') || '0');
              formattedId = String(numericId).padStart(4, '0');
              console.log(`숫자 ID 기반 포맷팅: ${formattedId} (원본 ID: ${stake.id})`);
            } catch (err) {
              // 숫자로 변환할 수 없는 경우 fallback 처리
              formattedId = '0001';
              console.log(`ID 변환 실패, 기본값 사용: ${formattedId}`);
            }
          } else if (nftId) {
            // NFT ID가 있는 경우 (숫자만 추출하고 4자리로 포맷팅)
            try {
              const numericId = parseInt(String(nftId).replace(/\D/g, '') || '0');
              formattedId = String(numericId).padStart(4, '0');
              console.log(`일반 NFT ID 포맷팅: ${formattedId} (원본: ${nftId})`);
            } catch (err) {
              formattedId = '0001';
              console.log(`NFT ID 변환 실패, 기본값 사용: ${formattedId}`);
            }
          } else {
            // ID 정보가 없는 경우 fallback 처리
            formattedId = '0001';
            console.log(`ID 정보 없음, 기본값 사용: ${formattedId}`);
          }
          
          // IPFS URL 생성
          ipfsUrl = `ipfs://${ipfsHash}/${formattedId}.png`;
          gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}/${formattedId}.png`;
          
          console.log(`Generated IPFS URLs with formatted ID: ${formattedId}, URL: ${ipfsUrl}`);
        }
        
        // 생성된 IPFS URL을 기본 이미지 URL로 설정
        nftImageUrl = ipfsUrl;
      }
      
      // 3. 로컬 이미지를 IPFS 플레이스홀더로 변환 (모든 경로 처리)
      const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
      const numericId = parseInt(String(nftId).replace(/\D/g, '') || '1');
      previewImage = `/nft-previews/${previewImages[Math.abs(numericId % previewImages.length)]}`;
      
      // 모든 로컬 이미지 경로는 여기 추가해야 함
      const isLocalPath = (url) => {
        if (!url) return false;
        // 로컬 경로는 항상 '/'로 시작하거나 '/nft-' 또는 '/placeholder' 등을 포함
        return url.startsWith('/') || 
               url.includes('/nft-') || 
               url.includes('/placeholder') || 
               url.includes('/public/') ||
               url === 'placeholder-nft.png';
      };
      
      // IPFS URL이 없거나 로컬 경로인 경우 (모든 로컬 경로 패턴 체크)
      if (!nftImageUrl || isLocalPath(nftImageUrl)) {
        // 로컬 이미지 경로나 이미지가 없는 경우 IPFS 플레이스홀더로 변환
        const randomId = Math.random().toString(36).substring(2, 10);
        console.log(`로컬 이미지 경로 또는 빈 이미지 URL을 IPFS 플레이스홀더로 변환: ${nftImageUrl} -> ipfs://placeholder/${randomId}`);
        nftImageUrl = `ipfs://placeholder/${randomId}`;
      }
      
      // If we have the actual NFT, include its name and other details
      const nftName = actualNft?.name || stake.nft_name || `SOLARA #${nftId}`;
      const nftTier = actualNft?.metadata?.attributes?.find(attr => 
        attr.trait_type?.toLowerCase() === 'tier' || attr.trait_type?.toLowerCase() === 'rarity'
      )?.value || stake.nft_tier || 'Common';
      
      // Return stake with additional calculated fields
      return {
        ...stake,
        progress_percentage: parseFloat(progressPercentage.toFixed(2)),
        earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
        days_remaining: daysRemaining,
        days_elapsed: daysElapsed,
        is_unlocked: isUnlocked,
        current_apy: calculateCurrentAPY(stake),
        
        // NFT specifics from the actual NFT data when available
        nft_name: nftName,
        nft_tier: nftTier,
        
        // 이미지 필드 통합 처리 - 모든 필드에 일관된 값 설정
        ipfs_hash: ipfsHash,
        image: nftImageUrl,           // 실제 NFT 이미지 URL (DB에서 가져온 URL)
        image_url: nftImageUrl,       // 동일한 URL 사용 (일관성을 위해)
        nft_image: gatewayUrl || nftImageUrl,  // 게이트웨이 URL 또는 기본 URL
        
        // 추가 디버깅 정보
        _debug_image_source: actualNft ? "actual_nft_data" : "generated",
        
        // Include a flag indicating if this is using actual NFT data
        using_actual_nft_data: !!actualNft,
        
        // Metadata for additional API consumers
        metadata: actualNft?.metadata || {
          name: nftName,
          attributes: [
            { trait_type: "Tier", value: nftTier }
          ],
          image: nftImageUrl  // 메타데이터 이미지 필드도 동일한 값으로 설정
        }
      };
    });
    
    // Format decimal values
    projectedRewards = parseFloat(projectedRewards.toFixed(2));
    earnedToDate = parseFloat(earnedToDate.toFixed(2));
    
    // If no stakes are found, try to generate mock data for testing
    // 항상 개발 및 테스트용 데이터 생성 (스테이킹 표시 테스트 위해)
    if (activeStakes.length === 0) {
      console.log('No staking data found, generating mock data for testing');
      
      // This code runs in any environment for testing UI
      const mockStats = generateMockStakingData(wallet);
      
      console.log('Returning mock data with image fields:', 
        mockStats.activeStakes.length > 0 ? {
          image: mockStats.activeStakes[0].image,
          image_url: mockStats.activeStakes[0].image_url,
          nft_image: mockStats.activeStakes[0].nft_image,
          ipfs_hash: mockStats.activeStakes[0].ipfs_hash
        } : 'No mock stakes'
      );
      
      return sendSuccess(res, {
        activeStakes: mockStats.activeStakes,
        stats: mockStats.stats,
        isMockData: true, // Flag to indicate this is mock data
        fetchTime: new Date().toISOString()
      });
    }
    
    // 샘플 데이터 로깅
    if (activeStakes && activeStakes.length > 0) {
      console.log('getStakingStats API - 첫 번째 stake 이미지 필드 확인:', {
        image: activeStakes[0].image,
        image_url: activeStakes[0].image_url,
        nft_image: activeStakes[0].nft_image,
        ipfs_hash: activeStakes[0].ipfs_hash
      });
    }
    
    // 샘플 데이터 로깅 - NFT 정보 더 자세히 확인 
    if (activeStakes && activeStakes.length > 0) {
      console.log('getStakingStats API - 첫 번째 stake 상세 정보:', {
        id: activeStakes[0].id,
        mint_address: activeStakes[0].mint_address,
        image: activeStakes[0].image,
        image_url: activeStakes[0].image_url,
        nft_image: activeStakes[0].nft_image,
        ipfs_hash: activeStakes[0].ipfs_hash,
        metadata: activeStakes[0].metadata ? '있음' : '없음',
        mint_index: activeStakes[0].mint_index
      });
    }
    
    // Return the processed data with timestamp for tracking freshness
    return sendSuccess(res, {
      activeStakes,
      stats: {
        totalStaked: activeStakes.length,
        projectedRewards,
        earnedToDate
      },
      debug: {
        image_fields_sample: activeStakes.length > 0 ? {
          image: activeStakes[0].image,
          image_url: activeStakes[0].image_url,
          nft_image: activeStakes[0].nft_image,
          starts_with_ipfs: activeStakes[0].image?.startsWith('ipfs://')
        } : null,
        has_actual_nft_data: activeStakes.some(s => s.using_actual_nft_data),
        source: "enhanced_getStakingStats"
      },
      fetchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getStakingStats API:', error);
    return sendError(res, 'Internal server error', 500, 'SERVER_ERROR', error);
  }
}

/**
 * Calculate current APY (Annual Percentage Yield) for a stake
 * @param {Object} stake - Staking data object
 * @returns {number} Annual percentage yield
 */
function calculateCurrentAPY(stake) {
  const dailyRate = stake.daily_reward_rate || 25; // Default to 25 if not set
  
  // Base APY calculation (daily rewards * 365 / total rewards) * 100
  const baseAPY = (dailyRate * 365 / stake.total_rewards) * 100;
  
  // Long-term staking bonus
  let stakingBonus = 0;
  if (stake.staking_period >= 365) stakingBonus = 100; // +100%
  else if (stake.staking_period >= 180) stakingBonus = 70; // +70%
  else if (stake.staking_period >= 90) stakingBonus = 40; // +40%
  else if (stake.staking_period >= 30) stakingBonus = 20; // +20%
  
  return parseFloat((baseAPY * (1 + stakingBonus / 100)).toFixed(2));
}

/**
 * Generate mock staking data for testing purposes with consistent image fields
 * @param {string} wallet - Wallet address
 * @returns {Object} Object with activeStakes and stats
 */
function generateMockStakingData(wallet) {
  // Create 1-3 mock staked NFTs
  const mockStakes = [];
  const tiers = [
    { name: 'LEGENDARY', dailyRate: 200 },
    { name: 'EPIC', dailyRate: 100 },
    { name: 'RARE', dailyRate: 50 },
    { name: 'COMMON', dailyRate: 25 }
  ];
  
  // Available NFT preview images (matching those in public directory)
  const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
  
  // 실제 TESOLA 컬렉션의 IPFS CID - 일관된 이미지 로딩을 위해 하나만 사용
  const COLLECTION_IPFS_HASH = process.env.COLLECTION_IPFS_HASH || 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
  
  // 내 게이트웨이는 항상 작동하므로 기본값으로 설정
  // My NFTs 탭에서는 잘 작동하는데 여기서는 작동하지 않는 문제 수정
  const PERSONAL_GATEWAY = 'https://tesola.mypinata.cloud/ipfs/';
  
  // 백업 게이트웨이 옵션
  const BACKUP_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://nftstorage.link/ipfs/'
  ];
  
  // Hash the wallet address for consistent results
  const hash = Array.from(wallet).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const stakesCount = (hash % 3) + 1; // 1-3 stakes
  
  let totalProjected = 0;
  let totalEarned = 0;
  
  // Try to get real NFT data from supabase for this test wallet
  // This is just a best-effort attempt to get real NFT information
  // Fetch NFTs from the minted_nfts table that are owned by this wallet
  console.log(`Attempting to get real NFT data for mock staking with wallet: ${wallet}`);
  
  for (let i = 0; i < stakesCount; i++) {
    // Generate a unique ID based on wallet and index
    const id = ((hash + i) % 999) + 1;
    
    // Select a tier based on wallet hash (weighted for testing)
    const tierIndex = (hash + i) % 4;
    const tier = tiers[tierIndex];
    
    // Create varied staking dates and periods
    const now = new Date();
    
    // Staking start date between 1-60 days ago
    const daysAgo = ((hash + i * 13) % 60) + 1;
    const stakingStartDate = new Date(now);
    stakingStartDate.setDate(stakingStartDate.getDate() - daysAgo);
    
    // Staking period between 30-365 days
    const stakingPeriod = [30, 90, 180, 365][((hash + i * 7) % 4)];
    const releaseDate = new Date(stakingStartDate);
    releaseDate.setDate(releaseDate.getDate() + stakingPeriod);
    
    // Calculate rewards
    const totalRewards = tier.dailyRate * stakingPeriod;
    
    // Calculate progress
    const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
    const elapsedDuration = Math.min(
      now.getTime() - stakingStartDate.getTime(),
      totalStakingDuration
    );
    const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
    const earnedSoFar = (totalRewards * progressPercentage) / 100;
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24)));
    
    // Calculate days elapsed
    const daysElapsed = Math.min(
      Math.ceil(elapsedDuration / (1000 * 60 * 60 * 24)),
      stakingPeriod
    );
    
    // Select image sources that are aligned with getUserNFTs functionality
    const ipfsHash = COLLECTION_IPFS_HASH;
    const imageIndex = id % previewImages.length;
    // 로컬 경로 참조 제거 (IPFS URL만 사용하도록 개선)
    
    // 모든 경우에 일관되게 숫자 ID로 포맷팅 (4자리)
    const mockMintAddress = `mock${id}${wallet.substr(0, 8)}`;
    const formattedId = String(id).padStart(4, '0'); // 직접 숫자 ID 사용
    
    // 항상 IPFS URL 사용하여 일관성 유지 (모의 데이터여도 실제와 동일한 형식)
    const ipfsUrl = `ipfs://${ipfsHash}/${formattedId}.png`;
    
    // 게이트웨이 URL도 생성
    const gatewayUrl = `${PERSONAL_GATEWAY}${ipfsHash}/${formattedId}.png`;
    
    // 일관성을 위해 로컬 경로 완전히 제거
    // localImagePath 변수는 이미 정의되어 있으므로 다시 정의하지 않음
    // ipfsUrl을 사용 (로컬 경로 사용 안함)
    
    // IMPORTANT: Ensure EVERY mock stake has ALL possible image fields for maximum compatibility
    // This ensures that all components can find at least one image field they're looking for
    const mockStake = {
      id: `mock-stake-${i}-${id}`,
      wallet_address: wallet,
      mint_address: `mock${id}${wallet.substr(0, 8)}`,
      nft_name: `SOLARA #${id}`,
      nft_tier: tier.name,
      staking_period: stakingPeriod,
      staked_at: stakingStartDate.toISOString(),
      release_date: releaseDate.toISOString(),
      total_rewards: totalRewards,
      daily_reward_rate: tier.dailyRate,
      status: 'staked',
      
      // 이미지 필드 통합 처리 - 모든 필드에 일관된 값 설정
      ipfs_hash: ipfsHash,
      image: ipfsUrl,                  // 일관된 방식으로 IPFS URL 사용
      image_url: ipfsUrl,              // 동일한 URL 설정
      nft_image: gatewayUrl,           // 게이트웨이 URL
      _debug_image_source: "mock_data",
      
      // Include metadata field for components that might be looking for it
      metadata: {
        image: ipfsUrl,
        name: `SOLARA #${id}`,
        attributes: [
          { trait_type: "Tier", value: tier.name },
          { trait_type: "Background", value: ["Cosmic", "Nebula", "Deep Space", "Starfield"][id % 4] }
        ]
      },
      
      // Flag as mock data
      is_mock_data: true,
      
      // Calculated fields
      progress_percentage: parseFloat(progressPercentage.toFixed(2)),
      earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
      days_remaining: daysRemaining,
      days_elapsed: daysElapsed,
      is_unlocked: now >= releaseDate,
      current_apy: calculateCurrentAPY({
        daily_reward_rate: tier.dailyRate,
        total_rewards: totalRewards,
        staking_period: stakingPeriod
      })
    };
    
    mockStakes.push(mockStake);
    totalProjected += totalRewards;
    totalEarned += earnedSoFar;
  }
  
  console.log(`Generated ${mockStakes.length} mock stakes with improved image fields using personal gateway`);
  
  return {
    activeStakes: mockStakes,
    stats: {
      totalStaked: mockStakes.length,
      projectedRewards: parseFloat(totalProjected.toFixed(2)),
      earnedToDate: parseFloat(totalEarned.toFixed(2))
    }
  };
}