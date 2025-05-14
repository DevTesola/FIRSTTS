/**
 * Unified utility functions for NFT image processing
 * 
 * Provides consistent handling of different image fields and formats with fallback mechanisms.
 */
import { processImageUrl, createPlaceholder } from "./mediaUtils";
import { ipfsConfig } from "./config";

// Pre-prepared default image paths
const DEFAULT_PREVIEW_IMAGES = [
  '/nft-previews/0119.png',
  '/nft-previews/0171.png',
  '/nft-previews/0327.png',
  '/nft-previews/0416.png',
  '/nft-previews/0418.png',
  '/nft-previews/0579.png'
];

const PLACEHOLDER_IMAGE = '/placeholder-nft.png';

/**
 * Extracts the most appropriate image URL from an NFT object.
 * 
 * @param {Object} nft - NFT object (supports various API response formats)
 * @returns {string} The optimal image URL
 */
export function getNFTImageUrl(nft) {
  if (!nft) return PLACEHOLDER_IMAGE;
  
  // For staking page, which has cache busting parameters
  if (nft._cacheBust) {
    console.log(`Cache busting requested by ${nft.__source || 'unknown'} at ${nft._cacheBust}`);
  }
  
  // 로컬 이미지 사용 안함 - 실제 NFT 이미지만 사용하거나 로딩 상태 보여줌
  const preferRemote = nft.preferRemote !== false; // 기본값: true (항상 원격 이미지 선호)
  if (preferRemote) {
    console.log(`🌐 원격 이미지 선호 설정 활성화: ${nft.__source || 'unknown'}`);
  }
  
  // Add source tracking for debugging
  const source = nft.__source || 'unknown';
  const nftId = nft.id || nft.mint_address || nft.mintAddress || 'unknown';
  
  // 스테이킹 페이지 컴포넌트를 위한 특별 처리 - my-collection과 일관되게 처리
  // Dashboard, My NFTs, Leaderboard 등 모든 스테이킹 관련 컴포넌트 감지 강화
  const isStakingComponent = source.includes('StakedNFTCard') || 
                             source.includes('NFTGallery') || 
                             source.includes('Leaderboard') || 
                             source.includes('Dashboard') || 
                             source.includes('staking') ||
                             source.includes('enlarged') ||
                             source.includes('thumbnail');
  
  // 스테이킹 페이지 컴포넌트인 경우 항상 캐시 버스팅 추가
  if (isStakingComponent && !nft._cacheBust) {
    nft._cacheBust = Date.now();
  }
  
  if (isStakingComponent) {
    console.log(`💠 스테이킹 페이지 컴포넌트 감지: ${source}, NFT ID: ${nftId}`);
    
    // 캐시 버스팅이 있으면 로그 남기기
    if (nft._cacheBust) {
      console.log(`🔄 캐시 버스팅 적용 중: ${nft._cacheBust}`);
    }
    
    // 스테이킹 컴포넌트의 경우 강제로 실제 NFT 데이터 사용 설정
    if (!nft.using_actual_nft_data) {
      console.log(`⚠️ using_actual_nft_data 필드가 없어 강제 설정`);
      nft.using_actual_nft_data = true;
    }
    
    // 1. 스테이킹 NFT API 응답이 IPFS URL 필드를 포함하는지 확인
    if ((nft.image && nft.image.startsWith('ipfs://')) || 
        (nft.image_url && nft.image_url.startsWith('ipfs://')) || 
        (nft.nft_image && nft.nft_image.includes('/ipfs/')) ||
        (nft.metadata && nft.metadata.image && nft.metadata.image.startsWith('ipfs://'))) {
      
      console.log(`✅ 스테이킹 컴포넌트에서 IPFS 이미지 URL 발견, 정상 처리 진행`);
      // IPFS URL을 발견했으므로 기본 처리 로직으로 계속 진행 (아래 코드)
      // NFT 데이터 구조 통합을 위해 다양한 필드를 확인하고 IPFS URL 추출
      
      // 우선 순위 1: metadata.image 필드에서 IPFS URL 추출 (가장 신뢰할 수 있는 소스)
      if (nft.metadata && nft.metadata.image && nft.metadata.image.startsWith('ipfs://')) {
        const ipfsPath = nft.metadata.image.replace('ipfs://', '');
        const directGatewayUrl = `${ipfsConfig.gateway}/ipfs/${ipfsPath}`;
        const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
        console.log(`🔄 스테이킹 컴포넌트: metadata.image 필드에서 IPFS URL 추출: ${directGatewayUrl}${cacheBuster}`);
        return `${directGatewayUrl}${cacheBuster}`;
      }
      
      // 우선 순위 2: image 필드에서 IPFS URL 추출
      if (nft.image && nft.image.startsWith('ipfs://')) {
        const ipfsPath = nft.image.replace('ipfs://', '');
        const directGatewayUrl = `${ipfsConfig.gateway}/ipfs/${ipfsPath}`;
        const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
        console.log(`🔄 스테이킹 컴포넌트: image 필드에서 IPFS URL 추출: ${directGatewayUrl}${cacheBuster}`);
        return `${directGatewayUrl}${cacheBuster}`;
      }
      
      // 우선 순위 3: image_url 필드에서 IPFS URL 추출
      if (nft.image_url && nft.image_url.startsWith('ipfs://')) {
        const ipfsPath = nft.image_url.replace('ipfs://', '');
        const directGatewayUrl = `${ipfsConfig.gateway}/ipfs/${ipfsPath}`;
        const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
        console.log(`🔄 스테이킹 컴포넌트: image_url 필드에서 IPFS URL 추출: ${directGatewayUrl}${cacheBuster}`);
        return `${directGatewayUrl}${cacheBuster}`;
      }
      
      // 우선 순위 4: nft_image 필드에서 게이트웨이 URL 추출
      if (nft.nft_image && nft.nft_image.includes('/ipfs/')) {
        const parts = nft.nft_image.split('/ipfs/');
        if (parts.length > 1) {
          const directGatewayUrl = `${ipfsConfig.gateway}/ipfs/${parts[1]}`;
          const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
          console.log(`🔄 스테이킹 컴포넌트: nft_image 필드에서 게이트웨이 URL 추출: ${directGatewayUrl}${cacheBuster}`);
          return `${directGatewayUrl}${cacheBuster}`;
        }
      }
    } 
    
    // 2. IPFS URL이 없고 ID만 있는 경우, ID 기반으로 IPFS URL 생성
    if (nftId && nftId !== 'unknown') {
      console.log(`🔍 IPFS URL 누락, ID로 생성 시도: ${nftId}`);
      
      // ID에서 숫자 추출 - 더 강력하게 만듦
      let numericId = null;
      if (typeof nftId === 'string') {
        // 더 강력한 정규식으로 숫자 추출 (모든, 심지어 중간에 포함된 숫자도 찾아봄)
        let allMatches = nftId.match(/\d+/g);
        if (allMatches && allMatches.length > 0) {
          // 가장 긴 숫자 시퀀스를 사용 (보통 실제 ID에 해당)
          let longestMatch = allMatches.reduce((a, b) => a.length > b.length ? a : b);
          numericId = longestMatch;
          console.log(`🔍 ID에서 숫자열 다수 발견, 가장 긴 시퀀스 선택: ${numericId}`);
        }
      } else if (typeof nftId === 'number') {
        numericId = nftId.toString();
      }
      
      // Mint 주소에서 추출 시도
      if (!numericId && nft.mint) {
        let mintAddressHash = 0;
        for (let i = 0; i < nft.mint.length; i++) {
          mintAddressHash += nft.mint.charCodeAt(i);
        }
        // 1~999 사이의 결정론적 숫자 생성
        numericId = (mintAddressHash % 999 + 1).toString();
        console.log(`🔍 Mint 주소에서 결정론적 ID 생성: ${numericId}`);
      }
      
      // 숫자 ID가 있으면 IPFS URL 생성 및 직접 반환
      if (numericId) {
        // 4자리 ID 형식으로 패딩
        const formattedId = String(numericId).padStart(4, '0');
        console.log(`🔢 숫자 ID 기반 포맷팅: ${formattedId} (원본 ID: ${numericId})`);
        
        // TESOLA 컬렉션의 IPFS CID - 환경 변수에서 가져오기
        const COLLECTION_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
        
        // 스테이킹 페이지에는 직접 Pinata 게이트웨이 URL 사용 (IPFS 프로토콜 건너뛰기)
        const directGatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${formattedId}.png`;
        
        // 캐시 버스팅 추가
        const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
        console.log(`🔄 생성된 IPFS URL + 캐시 버스팅: ${directGatewayUrl}${cacheBuster}`);
        return `${directGatewayUrl}${cacheBuster}`;
      }
    }
    
    // 3. NFT 이름에서 ID 추출 시도 (기존 로직보다 더 강력하게)
    if (nft.name || nft.nft_name) {
      const nameStr = nft.name || nft.nft_name;
      const nameMatch = nameStr.match(/#\s*(\d+)/);
      if (nameMatch && nameMatch[1]) {
        const numericId = nameMatch[1];
        const formattedId = String(numericId).padStart(4, '0');
        console.log(`🔢 이름에서 ID 추출 성공: ${formattedId} (원본 이름: ${nameStr})`);
        
        // 환경 변수에서 이미지 CID 가져오기
        const COLLECTION_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
        const directGatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${formattedId}.png`;
        
        const cacheBuster = nft._cacheBust ? `?cb=${nft._cacheBust}` : '';
        console.log(`🔄 이름에서 ID 추출로 생성된 URL: ${directGatewayUrl}${cacheBuster}`);
        return `${directGatewayUrl}${cacheBuster}`;
      }
    }
  }
  
  // Standard image URL selection process for other pages
  // Classify image URLs by type
  const images = {
    ipfs: [],         // IPFS protocol URLs
    gateway: [],      // IPFS gateway URLs 
    local: [],        // Local image paths (사용하지 않음 - 로컬 이미지 대신 로딩 인디케이터로 대체)
    other: [],        // Other URLs
    fallback: null    // Final fallback - 필요한 경우 로딩 인디케이터 특수 URL 반환
  };
  
  // Check and categorize each possible image field
  if (nft.image_url) {
    if (nft.image_url.startsWith('ipfs://')) {
      images.ipfs.push(nft.image_url);
    } else if (nft.image_url.includes('/ipfs/')) {
      images.gateway.push(nft.image_url);
    } else if (nft.image_url.startsWith('/')) {
      images.local.push(nft.image_url);
    } else {
      images.other.push(nft.image_url);
    }
  }
  
  if (nft.nft_image) {
    if (nft.nft_image.startsWith('ipfs://')) {
      images.ipfs.push(nft.nft_image);
    } else if (nft.nft_image.includes('/ipfs/')) {
      images.gateway.push(nft.nft_image);
    } else if (nft.nft_image.startsWith('/')) {
      images.local.push(nft.nft_image);
    } else {
      images.other.push(nft.nft_image);
    }
  }
  
  if (nft.image) {
    if (nft.image.startsWith('ipfs://')) {
      images.ipfs.push(nft.image);
    } else if (nft.image.includes('/ipfs/')) {
      images.gateway.push(nft.image);
    } else if (nft.image.startsWith('/')) {
      images.local.push(nft.image);
    } else {
      images.other.push(nft.image);
    }
  }
  
  // Check for IPFS hash and create IPFS URL
  if (nft.ipfs_hash) {
    images.ipfs.push(`ipfs://${nft.ipfs_hash}`);
  }
  
  // Check metadata image
  if (nft.metadata?.image) {
    if (nft.metadata.image.startsWith('ipfs://')) {
      images.ipfs.push(nft.metadata.image);
    } else if (nft.metadata.image.includes('/ipfs/')) {
      images.gateway.push(nft.metadata.image);
    } else if (nft.metadata.image.startsWith('/')) {
      images.local.push(nft.metadata.image);
    } else {
      images.other.push(nft.metadata.image);
    }
  }
  
  // 중요: NFT ID 기반 IPFS URL 생성 (실제 NFT 데이터 표시를 위해)
  // NFT ID가 있는 경우 해당 ID로 IPFS URL 생성
  if (nftId && nftId !== 'unknown') {
    // ID에서 숫자 추출
    let numericId = null;
    if (typeof nftId === 'string') {
      const match = nftId.match(/(\d+)/);
      if (match && match[1]) {
        numericId = match[1];
      }
    } else if (typeof nftId === 'number') {
      numericId = nftId.toString();
    }
    
    // 숫자 ID가 있으면 IPFS URL 생성
    if (numericId) {
      // 4자리 ID 형식으로 패딩
      const formattedId = String(numericId).padStart(4, '0');
      // 환경 변수에서 이미지 CID 가져오기 - 설정에서 가져오기
      const IMAGES_CID = ipfsConfig.imagesCid;
      // IPFS URL 생성
      const generatedIpfsUrl = `ipfs://${IMAGES_CID}/${formattedId}.png`;
      
      // 로그 제거
      // const source = nft.__source || 'unknown';
      // console.log(`[${source}] Generated IPFS URL for NFT ${nftId}: ${generatedIpfsUrl}`);
      
      // IPFS URL을 더 높은 우선순위로 추가 (실제 NFT 이미지 강제 표시)
      images.ipfs.unshift(generatedIpfsUrl);
    }
  }
  
  // Set fallback - 항상 마지막에 사용
  images.fallback = getFallbackImage(nft);
  
  // 로그 제거
  // console.log(`NFT ${nftId} (${source}) image sources:`, {
  //   ipfs: images.ipfs.length,
  //   gateway: images.gateway.length,
  //   local: images.local.length,
  //   other: images.other.length,
  //   hasFallback: !!images.fallback
  // });
  
  // 이미지 우선순위 정의 - 항상 실제 NFT 이미지가 우선되도록 함
  // 1. IPFS Protocol URLs (최고 품질) - 항상 최우선
  // 2. Gateway URLs (직접 IPFS 게이트웨이 링크)
  // 3. Other URLs (일반 HTTP/HTTPS URL)
  // 4. Local URLs (로컬 폴백) - 더 이상 사용하지 않음
  // 5. Fallback (최후의 수단)
  let selectedUrl = null;
  
  // 강제로 IPFS와 게이트웨이 URL을 우선시하여 실제 NFT 이미지가 표시되도록 함
  if (images.ipfs.length > 0) {
    selectedUrl = images.ipfs[0];
    console.log(`Selected IPFS URL for NFT ${nftId}: ${selectedUrl}`);
  } else if (images.gateway.length > 0) {
    selectedUrl = images.gateway[0];
    console.log(`Selected gateway URL for NFT ${nftId}: ${selectedUrl}`);
  } else if (images.other.length > 0) {
    selectedUrl = images.other[0];
    console.log(`Selected other URL for NFT ${nftId}: ${selectedUrl}`);
  } else {
    // 스테이킹 컴포넌트인 경우 로딩 인디케이터 URL 사용 (로컬 이미지 대신)
    if (isStakingComponent) {
      console.log(`⚠️ No valid image URL found for NFT ${nftId}, showing loading indicator`);
      return "loading:indicator"; // 특수 URL로 로딩 인디케이터 사용
    } else {
      // 다른 컴포넌트는 일반 폴백 사용
      selectedUrl = images.fallback;
      console.log(`Using fallback for NFT ${nftId}: ${selectedUrl}`);
    }
  }
  
  // 최종 URL 표준화 - IPFS 프로토콜 URL 유지하여 다양한 게이트웨이 시도 허용
  // ipfs:// 프로토콜을 유지하면 EnhancedProgressiveImage 컴포넌트가 다양한 게이트웨이를 시도할 수 있음
  if (selectedUrl && selectedUrl.startsWith('ipfs://')) {
    // For non-staking pages, always convert to Tesola Pinata gateway
    const ipfsPath = selectedUrl.replace('ipfs://', '');
    const directGatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsPath}`;
    
    // Add cache busting if requested
    if (nft._cacheBust) {
      return `${directGatewayUrl}?cb=${nft._cacheBust}`;
    }
    
    console.log(`Converting IPFS protocol to direct gateway: ${selectedUrl} -> ${directGatewayUrl}`);
    return directGatewayUrl;
  }
  
  // 게이트웨이 URL을 ipfs:// 형식으로 변환 (일관성 및 게이트웨이 라운드 로빈 지원)
  if (selectedUrl && selectedUrl.includes('/ipfs/')) {
    try {
      // Extract the IPFS path from the gateway URL
      const parts = selectedUrl.split('/ipfs/');
      if (parts.length > 1) {
        // Always use Tesola Pinata gateway
        const directGatewayUrl = `${ipfsConfig.gateway}/ipfs/${parts[1]}`;
        
        // Add cache busting if requested
        if (nft._cacheBust) {
          return `${directGatewayUrl}?cb=${nft._cacheBust}`;
        }
        
        console.log(`Standardizing gateway URL: ${selectedUrl} -> ${directGatewayUrl}`);
        return directGatewayUrl;
      }
    } catch (err) {
      console.error('Gateway URL standardization error:', err);
    }
  }
  
  // Add cache busting to the final URL if requested
  if (selectedUrl && nft._cacheBust) {
    const separator = selectedUrl.includes('?') ? '&' : '?';
    return `${selectedUrl}${separator}cb=${nft._cacheBust}`;
  }
  
  return selectedUrl || PLACEHOLDER_IMAGE;
}

/**
 * Generate NFT fallback image with better local fallbacks
 * 
 * @param {Object} nft - NFT object
 * @returns {string} Fallback image URL
 */
export function getFallbackImage(nft) {
  if (!nft) return PLACEHOLDER_IMAGE;
  
  // Try to generate a local preview path first
  try {
    // Available preview images
    const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
    
    // Extract id or mint address - try all possible field names
    const id = nft.id || nft.mint_address || nft.mintAddress || nft.mint;
    
    if (id) {
      // Format numeric parts for local image mapping
      let numericPart = null;
      
      // First try to extract a numeric portion if it looks like "SOLARA #123" or similar
      const nameMatch = (nft.name || nft.nft_name || '').match(/#\s*(\d+)/);
      if (nameMatch && nameMatch[1]) {
        numericPart = parseInt(nameMatch[1]);
      }
      
      // Then try to extract from ID
      if (numericPart === null) {
        const idMatch = String(id).match(/(\d+)/);
        if (idMatch && idMatch[1]) {
          numericPart = parseInt(idMatch[1]);
        }
      }
      
      // Try to extract from image URL if available
      if (numericPart === null) {
        const urlFields = [nft.image, nft.image_url, nft.nft_image];
        for (const field of urlFields) {
          if (field && typeof field === 'string') {
            const urlMatch = field.match(/\/(\d+)\./);
            if (urlMatch && urlMatch[1]) {
              numericPart = parseInt(urlMatch[1]);
              break;
            }
          }
        }
      }
      
      // Hash function for consistent image selection from any string
      const hashString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };
      
      // If we found a numeric part, use it to select an image
      if (numericPart !== null) {
        const index = numericPart % previewImages.length;
        return `/nft-previews/${previewImages[index]}`;
      }
      
      // If no numeric part, hash the ID string
      const hashedId = hashString(String(id));
      const index = hashedId % previewImages.length;
      return `/nft-previews/${previewImages[index]}`;
    }
    
    // If still no ID found, use timestamp-based fallback
    const timestamp = Date.now();
    const index = timestamp % previewImages.length;
    return `/nft-previews/${previewImages[index]}`;
  } catch (err) {
    console.error("Error generating fallback image:", err);
  }
  
  // Default fallback if all else fails
  return PLACEHOLDER_IMAGE;
}

/**
 * Get NFT name (supports various formats)
 * 
 * @param {Object} nft - NFT object
 * @param {string} defaultPrefix - Default name prefix (e.g., 'SOLARA')
 * @returns {string} NFT name
 */
export function getNFTName(nft, defaultPrefix = 'SOLARA') {
  if (!nft) return `${defaultPrefix} NFT`;
  
  // Process various name fields
  const name = 
    nft.name || 
    nft.nft_name || 
    nft.title ||
    nft.metadata?.name;
  
  if (name) return name;
  
  // Generate ID-based name
  const id = nft.id || nft.nftId || nft.tokenId || 
            (nft.mint_address ? nft.mint_address.slice(0, 4) : null) ||
            (nft.mint ? nft.mint.slice(0, 4) : null);
  
  return id ? `${defaultPrefix} #${id}` : `${defaultPrefix} NFT`;
}

/**
 * Get NFT tier (rarity)
 * 
 * @param {Object} nft - NFT object
 * @returns {string} NFT tier
 */
export function getNFTTier(nft) {
  if (!nft) return 'Common';
  
  // Check direct tier fields
  const tier = 
    nft.tier || 
    nft.nft_tier || 
    nft.rarity;
  
  if (tier) return tier;
  
  // Find tier attribute in attributes array
  const tierAttribute = nft.attributes?.find(
    attr => attr.trait_type?.toLowerCase() === 'tier' || 
            attr.trait_type?.toLowerCase() === 'rarity'
  );
  
  if (tierAttribute?.value) return tierAttribute.value;
  
  return 'Common'; // Default value
}

/**
 * Get tier-related class styles from NFT
 * 
 * @param {Object} nft - NFT object
 * @returns {Object} Style classes based on tier
 */
export function getTierStyles(nft) {
  const tier = getNFTTier(nft)?.toLowerCase() || 'common';
  
  // Basic style mapping
  if (tier.includes('legendary')) {
    return {
      text: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-500/30',
      gradient: 'from-yellow-500 to-amber-500'
    };
  }
  
  if (tier.includes('epic')) {
    return {
      text: 'text-purple-400',
      bg: 'bg-purple-900/30',
      border: 'border-purple-500/30',
      gradient: 'from-purple-500 to-indigo-500'
    };
  }
  
  if (tier.includes('rare')) {
    return {
      text: 'text-blue-400',
      bg: 'bg-blue-900/30',
      border: 'border-blue-500/30',
      gradient: 'from-blue-500 to-cyan-500'
    };
  }
  
  // Common default value
  return {
    text: 'text-green-400',
    bg: 'bg-green-900/30',
    border: 'border-green-500/30',
    gradient: 'from-green-500 to-emerald-500'
  };
}

// 기본 내보내기
export default {
  getNFTImageUrl,
  getFallbackImage,
  getNFTName,
  getNFTTier,
  getTierStyles
};