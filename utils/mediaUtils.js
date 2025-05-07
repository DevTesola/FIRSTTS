/**
 * Utility functions for media handling and optimization
 */

// Use multiple IPFS gateways with preferred order
const personalGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';

// Format the gateway URL to ensure it ends with /ipfs/ for consistent usage
const formatGatewayUrl = (url) => {
  if (!url) return 'https://tesola.mypinata.cloud/ipfs/';
  
  // Remove trailing slash if present
  let formatted = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Add /ipfs/ if not already present
  if (!formatted.endsWith('/ipfs')) {
    formatted = formatted + '/ipfs';
  }
  
  // Ensure it ends with a slash
  return formatted + '/';
};

// 심플하게 ipfs://<hash>/<file> 구조의 URL을 게이트웨이 URL로 변환
function simpleIpfsUrlConversion(ipfsUrl, gateway = 'https://tesola.mypinata.cloud/ipfs/') {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  
  try {
    // ipfs:// 제거
    const hashAndPath = ipfsUrl.replace('ipfs://', '');
    // 쿼리 파라미터 제거
    const cleanHashAndPath = hashAndPath.split('?')[0].split('#')[0];
    
    // gateway URL로 대체
    return `${gateway}${cleanHashAndPath}`;
  } catch (err) {
    console.error('Error converting simple IPFS URL:', err);
    return ipfsUrl;
  }
};

// Store a single formatted personal gateway URL for all image loading
const PERSONAL_GATEWAY = formatGatewayUrl(personalGateway);

// Use multiple gateways in preferred order to improve availability
// Use both IPFS gateways and local fallbacks for reliable image loading
const IPFS_GATEWAYS = [
  PERSONAL_GATEWAY,                                           // Personal gateway (most reliable)
  'https://tesola.mypinata.cloud/ipfs/',                      // Direct pinata gateway (fallback)
  'https://nftstorage.link/ipfs/',                            // NFT.Storage gateway (very reliable)
  'https://ipfs.io/ipfs/',                                    // Original IPFS gateway
  'https://infura-ipfs.io/ipfs/',                             // Infura IPFS gateway (reliable)
  'https://gateway.pinata.cloud/ipfs/',                       // Pinata's public gateway
  'https://dweb.link/ipfs/',                                  // Protocol Labs gateway
  'https://cloudflare-ipfs.com/ipfs/',                        // Cloudflare gateway (often blocked)
];

// Cache expiry time (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// Regular expressions for URL structure analysis
// IPFS CID v0 (Qm...) 및 CID v1 (bafy...) 형식 지원
const CID_REGEX = /Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-zA-Z0-9]{44}/;
// 명확한 CID 추출용 정규식 - 더 구체적으로
const CID_EXTRACTION_REGEX = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-zA-Z0-9]{44})(?:\/(.*))?$/;
const IMAGE_REGEX = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i;
const VIDEO_REGEX = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/**
 * Simple LRU cache implementation
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get an item from the cache
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;
    
    const item = this.cache.get(key);
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Set an item in the cache
   */
  set(key, value, ttl = CACHE_EXPIRY) {
    // Ensure cache doesn't grow beyond max size
    if (this.cache.size >= this.maxSize) {
      // Remove the oldest item (first item in map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Add to cache with expiry
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
}

// Create cache instance with larger size for better hit rates
const processedUrlCache = new LRUCache(100);

/**
 * Extract IPFS CID from any URL format
 * @param {string} url - The URL containing an IPFS CID
 * @returns {Object} - The extracted CID and file path, or null if not found
 */
function extractIPFSCid(url) {
  if (!url) return { cid: null, path: null };
  
  try {
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const fullPath = url.replace('ipfs://', '').split('?')[0].split('#')[0];
      
      // Properly separate CID from file path - 명확한 CID 추출 (Qm... 형식)
      // 먼저 CID_EXTRACTION_REGEX로 정확히 CID 부분만 추출 시도
      const cidExtract = fullPath.match(CID_EXTRACTION_REGEX);
      if (cidExtract) {
        console.log(`명확한 CID를 찾았습니다: ${cidExtract[1]}, 파일 경로: ${cidExtract[2] || ''}`);
        return {
          cid: cidExtract[1],
          path: cidExtract[2] ? `/${cidExtract[2]}` : ''
        };
      }
      
      // 일반적인 경로 구분 시도 (CID가 명확하지 않은 경우)
      const parts = fullPath.match(/^([^\/]+)(?:\/(.*))?$/);
      if (parts) {
        console.log(`일반 경로 구분: CID=${parts[1]}, 파일 경로=${parts[2] || ''}`);
        return {
          cid: parts[1],
          path: parts[2] ? `/${parts[2]}` : ''
        };
      }
    }
    
    // Handle gateway URLs with /ipfs/
    if (url.includes('/ipfs/')) {
      const parts = url.split('/ipfs/');
      if (parts.length > 1) {
        // Split the path at the first slash after CID
        const fullPath = parts[1].split('?')[0].split('#')[0];
        
        // 명확한 CID 추출 시도
        const cidExtract = fullPath.match(CID_EXTRACTION_REGEX);
        if (cidExtract) {
          console.log(`게이트웨이 URL에서 명확한 CID를 찾았습니다: ${cidExtract[1]}, 파일 경로: ${cidExtract[2] || ''}`);
          return {
            cid: cidExtract[1],
            path: cidExtract[2] ? `/${cidExtract[2]}` : ''
          };
        }
        
        // 일반적인 경로 구분 시도
        const cidAndPath = fullPath.match(/^([^\/]+)(?:\/(.*))?$/);
        if (cidAndPath) {
          console.log(`게이트웨이 URL 일반 분석: CID=${cidAndPath[1]}, 파일 경로=${cidAndPath[2] || ''}`);
          return {
            cid: cidAndPath[1],
            path: cidAndPath[2] ? `/${cidAndPath[2]}` : ''
          };
        }
      }
    }
    
    // Handle direct CIDs
    const matches = url.match(CID_REGEX);
    if (matches && matches[0]) {
      return {
        cid: matches[0],
        path: ''
      };
    }
    
    return { cid: null, path: null };
  } catch (err) {
    console.error('Error extracting IPFS CID:', err);
    return { cid: null, path: null };
  }
}

/**
 * Process an image URL to optimize IPFS content loading with improved fallback strategy
 * @param {string} url - The image URL
 * @param {Object} options - Processing options
 * @param {number} options.width - Optional target width
 * @param {number} options.quality - Optional quality setting (1-100)
 * @param {boolean} options.optimizeFormat - Whether to optimize format
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.gatewayIndex - Which gateway to use (default: 0 for personal gateway)
 * @returns {string} - Processed URL ready for loading
 */
/**
 * Process an image URL with enhanced IPFS gateway handling
 * - Addresses common IPFS gateway failures (403, DNS errors)
 * - Prioritizes IPFS gateways for reliable image loading
 * - Always converts IPFS URLs to gateway URLs for better compatibility
 */
function processImageUrl(url, options = {}) {
  // 빈 URL인 경우 로딩 인디케이터 반환 (placeholder 이미지 대신)
  if (!url) return options && options.isStakingComponent ? 'loading:indicator' : '/placeholder-nft.png';
  if (url.startsWith('data:')) return url; // Already a data URI
  
  // IPFS URL 처리 - 최우선
  // IPFS URL인 경우, 항상 최우선으로 처리하여 로컬 이미지로 변환되지 않도록 함
  if (url.startsWith('ipfs://') || url.includes('/ipfs/')) {
    console.log(`🔍 IPFS URL 발견 - 최우선 처리: ${url}`);
    
    // 직접 IPFS 프로토콜 URL인 경우 (ipfs://)
    if (url.startsWith('ipfs://')) {
      // 테솔라 Pinata 게이트웨이로 강제 변환
      const hashAndPath = url.replace('ipfs://', '');
      
      // NFT ID 추출 시도 (스테이킹 컴포넌트 지원 강화)
      let nftId = null;
      const nftIdMatch = hashAndPath.match(/\/(\d{4})\.png$/);
      if (nftIdMatch && nftIdMatch[1]) {
        nftId = nftIdMatch[1];
        console.log(`🔢 IPFS URL에서 NFT ID 추출됨: ${nftId}`);
      }
      
      // 항상 테솔라 Pinata 게이트웨이 사용
      const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
      
      // 스테이킹 컴포넌트 판별 (options.__source 확인)
      const isStakingComponent = options && options.__source && 
        (options.__source.includes('StakedNFTCard') || 
         options.__source.includes('NFTGallery') || 
         options.__source.includes('Leaderboard') || 
         options.__source.includes('Dashboard') || 
         options.__source.includes('StakingDashboard') || 
         options.__source.includes('staking'));
      
      // 스테이킹 컴포넌트인 경우 캐시 버스팅 추가
      if (isStakingComponent || (options && options.forceNoCaching)) {
        const cacheBuster = `?_cb=${Date.now()}`;
        const finalUrl = `${gatewayUrl}${cacheBuster}`;
        console.log(`🔄 IPFS URL을 테솔라 게이트웨이로 변환 (캐시 버스팅 적용): ${url} => ${finalUrl}`);
        return finalUrl;
      }
      
      console.log(`🔄 IPFS URL을 테솔라 게이트웨이로 변환: ${url} => ${gatewayUrl}`);
      return gatewayUrl;
    }
    
    // 이미 게이트웨이 URL인 경우 (https://.../ipfs/...)
    if (url.includes('/ipfs/')) {
      // 테솔라 프로젝트 전용 게이트웨이가 아닌 경우 변환
      if (!url.includes('tesola.mypinata.cloud')) {
        // CID와 경로 추출
        const { cid, path } = extractIPFSCid(url);
        if (cid) {
          // 항상 테솔라 Pinata 게이트웨이 사용
          const tesolaGatewayUrl = `https://tesola.mypinata.cloud/ipfs/${cid}${path || ''}`;
          
          // 스테이킹 컴포넌트 판별 (options.__source 확인)
          const isStakingComponent = options && options.__source && 
            (options.__source.includes('StakedNFTCard') || 
            options.__source.includes('NFTGallery') || 
            options.__source.includes('Leaderboard') || 
            options.__source.includes('Dashboard') || 
            options.__source.includes('StakingDashboard') || 
            options.__source.includes('staking'));
            
          // 스테이킹 컴포넌트인 경우 캐시 버스팅 추가
          if (isStakingComponent || (options && options.forceNoCaching)) {
            const cacheBuster = `?_cb=${Date.now()}`;
            const finalUrl = `${tesolaGatewayUrl}${cacheBuster}`;
            console.log(`🔄 게이트웨이 URL을 테솔라 게이트웨이로 변환 (캐시 버스팅 적용): ${url} => ${finalUrl}`);
            return finalUrl;
          }
          
          console.log(`🔄 기존 게이트웨이 URL을 테솔라 게이트웨이로 변환: ${url} => ${tesolaGatewayUrl}`);
          return tesolaGatewayUrl;
        }
      }
      
      // 이미 테솔라 게이트웨이를 사용 중이거나 CID 추출 실패 시 원본 URL 반환
      // 스테이킹 컴포넌트 판별 (options.__source 확인)
      const isStakingComponent = options && options.__source && 
        (options.__source.includes('StakedNFTCard') || 
         options.__source.includes('NFTGallery') || 
         options.__source.includes('Leaderboard') || 
         options.__source.includes('Dashboard') || 
         options.__source.includes('StakingDashboard') || 
         options.__source.includes('staking'));
      
      // 스테이킹 컴포넌트인 경우 캐시 버스팅 추가
      if (isStakingComponent || (options && options.forceNoCaching)) {
        const separator = url.includes('?') ? '&' : '?';
        const cacheBuster = `${separator}_cb=${Date.now()}`;
        const finalUrl = `${url}${cacheBuster}`;
        console.log(`🔄 테솔라 게이트웨이 URL에 캐시 버스팅 추가: ${url} => ${finalUrl}`);
        return finalUrl;
      }
      
      return url;
    }
  }
  
  // 로컬 이미지 경로인 경우 처리 - 스테이킹 페이지에서는 로딩 인디케이터로 변환
  if (url.startsWith('/')) {
    console.log(`🔍 로컬 경로 발견! ${url}`);
    
    // 스테이킹 컴포넌트 판별 (options.__source 확인)
    const isStakingComponent = options && options.__source && 
      (options.__source.includes('StakedNFTCard') || 
       options.__source.includes('NFTGallery') || 
       options.__source.includes('Leaderboard') || 
       options.__source.includes('Dashboard') || 
       options.__source.includes('StakingDashboard') || 
       options.__source.includes('staking'));

    // 스테이킹 컴포넌트에서는 로컬 이미지를 로딩 인디케이터로 변환
    if (isStakingComponent) {
      console.log(`⚠️ 스테이킹 컴포넌트에서 로컬 이미지 경로 감지: ${url} -> 로딩 인디케이터로 변환`);
      return "loading:indicator";
    }
    
    // NFT 미리보기 폴더의 이미지인지 확인 (/nft-previews/)
    const isNftPreview = url.includes('/nft-previews/');
    
    // 파일 경로에서 NFT ID 추출 시도
    try {
      // 파일 이름에서 NFT ID 추출
      const filenameParts = url.split('/');
      const filename = filenameParts[filenameParts.length - 1];
      const nftIdMatch = filename.match(/(\d+)/);
      
      if (nftIdMatch && nftIdMatch[1]) {
        // NFT ID를 찾았으면 IPFS URL로 변환
        const nftId = parseInt(nftIdMatch[1]);
        
        // 4자리 숫자로 변환 (TESOLA 컬렉션 표준)
        const formattedId = String(nftId).padStart(4, '0');
        
        // 실제 TESOLA 컬렉션의 IPFS CID
        const COLLECTION_IPFS_HASH = 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
        
        // 직접 테솔라 게이트웨이 URL 생성 - ipfs:// 프로토콜 대신 직접 게이트웨이 URL 사용
        const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${formattedId}.png`;
        
        console.log(`🔄 로컬 이미지 변환 성공! ${url} => ${gatewayUrl}`);
        return gatewayUrl;
      }
      
      // NFT ID를 찾지 못했지만 nft-previews 폴더의 이미지라면 (특별 처리)
      if (isNftPreview) {
        // 미리보기 이미지에서 숫자 추출
        const previewMatch = filename.match(/(\d{4})/);
        if (previewMatch && previewMatch[1]) {
          // 미리보기 이미지의 ID를 실제 NFT ID로 사용
          const formattedId = previewMatch[1];
          const COLLECTION_IPFS_HASH = 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
          const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${formattedId}.png`;
          
          console.log(`🔄 미리보기 이미지 변환 성공! ${url} => ${gatewayUrl}`);
          return gatewayUrl;
        }
      }
    } catch (err) {
      console.error('❌ 로컬 이미지 변환 중 오류:', err);
    }
    
    // ======== 통계적 분석 기반 ID 매핑 시도 ========
    // 특정 로컬 경로 패턴에 따른 NFT ID 매핑 시도
    if (isNftPreview) {
      // 특정 미리보기 파일명과 실제 NFT ID 매핑
      const previewToNftMap = {
        '0119.png': '0119',
        '0171.png': '0171',
        '0327.png': '0327',
        '0416.png': '0416', 
        '0418.png': '0418',
        '0579.png': '0579',
        '0625.mp4': '0625',
        '0113.mp4': '0113'
      };
      
      // 파일명 추출
      const fileName = url.split('/').pop();
      
      // 매핑 찾기
      if (previewToNftMap[fileName]) {
        const formattedId = previewToNftMap[fileName];
        const COLLECTION_IPFS_HASH = 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
        const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${formattedId}.png`;
        
        console.log(`🔍 미리보기 매핑 사용! ${url} => ${gatewayUrl}`);
        return gatewayUrl;
      }
    }
    
    // 모든 시도 실패시 스테이킹 컴포넌트에서는 로딩 인디케이터 반환, 다른 페이지에서는 IPFS URL 생성
    if (options && options.__source && options.__source.includes('staking')) {
      console.warn(`⚠️ 스테이킹 관련 컴포넌트에서 로컬 이미지 ${url}를 로딩 인디케이터로 변환`);
      return "loading:indicator";
    }
    
    // 다른 페이지에서는 기본 IPFS URL 생성
    console.warn(`⚠️ 로컬 경로 ${url}에서 ID를 추출할 수 없음. 기본 IPFS URL 생성`);
    
    // 해시 기반으로 결정론적 NFT ID 선택 (URL 경로를 해시하여 일관된 NFT 표시)
    const hashString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
      }
      return Math.abs(hash);
    };
    
    // 결정론적인 ID 선택 (해시 기반으로 일관된 NFT 표시)
    const nftIds = ['0119', '0171', '0327', '0416', '0418', '0579', '0625', '0113'];
    const hashValue = hashString(url);
    const selectedId = nftIds[hashValue % nftIds.length];
    
    const COLLECTION_IPFS_HASH = 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
    const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${selectedId}.png`;
    
    console.log(`🔄 로컬 이미지 경로 해시 기반 변환: ${url} => ${gatewayUrl}`);
    return gatewayUrl;
  }
  
  // Extract options with defaults - preferRemote 항상 true로 강제 설정
  const { 
    width, 
    quality = 80, // Higher default quality for better images
    optimizeFormat = false,
    useCache = true,
    gatewayIndex = null,  // Allow automatic gateway selection
    preferLocalFiles = false, // 항상 false로 설정하여 로컬 이미지 사용 방지
    preferRemote = true // 항상 원격 이미지 우선
  } = options;
  
  try {
    let processedUrl = url;
    
    // Handle IPFS URLs - 이미 위에서 처리되었으므로 여기서는 처리하지 않음
    
    // Handle empty URLs gracefully by replacing with placeholder
    if (processedUrl === '' || processedUrl === 'ipfs://') {
      console.warn('Empty or invalid URL detected in processImageUrl');
      processedUrl = '/placeholder-nft.png'; // Default placeholder image
    }
    
    // Add optimization parameters if required
    let queryParams = [];
    
    // Add width parameter if specified
    if (width && !isNaN(width)) {
      queryParams.push(`width=${width}`);
    }
    
    // Add quality parameter if specified and valid
    if (quality && !isNaN(quality) && quality >= 1 && quality <= 100) {
      queryParams.push(`quality=${quality}`);
    }
    
    // Add format optimization if requested
    if (optimizeFormat) {
      queryParams.push('format=webp'); // Use WebP if supported
    }
    
    // Add cache buster if cache not desired
    if (!useCache) {
      queryParams.push(`_cb=${Date.now()}`);
    }
    
    // Append query parameters to URL if we have any
    if (queryParams.length > 0) {
      const separator = processedUrl.includes('?') ? '&' : '?';
      return `${processedUrl}${separator}${queryParams.join('&')}`;
    }
    
    return processedUrl;
  } catch (err) {
    console.error('Error processing image URL:', err);
    // Return a valid placeholder on any error
    return '/placeholder-nft.png';
  }
}

/**
 * Gets all available gateway URLs for an IPFS CID and path
 * @param {string} cid - The IPFS CID
 * @param {string} path - The file path after the CID
 * @returns {string[]} - Array of gateway URLs for the CID and path
 */
function getGatewayUrls(cid, path = '') {
  if (!cid) return [];
  
  // Basic gateway URLs without additional parameters
  return IPFS_GATEWAYS.map(gateway => {
    const formattedGateway = gateway.endsWith('/') ? gateway : `${gateway}/`;
    return `${formattedGateway}${cid}${path}`;
  });
}

/**
 * Gets appropriate image size based on container width and options
 * @param {number} containerWidth - The width of the container
 * @param {Object} options - Additional options
 * @param {string} options.screenType - 'mobile', 'tablet', or 'desktop'
 * @param {boolean} options.isHighQuality - Whether to use higher quality sizes
 * @returns {number} The optimal image width
 */
function getOptimalImageSize(containerWidth = 0, options = {}) {
  if (!containerWidth || containerWidth <= 0) {
    return 640; // Default size if container width is not provided
  }
  
  const { screenType = 'desktop', isHighQuality = false } = options;
  
  // Define size breakpoints for different screen types and quality levels
  const sizes = {
    mobile: isHighQuality ? [320, 640, 960] : [240, 480, 640],
    tablet: isHighQuality ? [640, 960, 1200] : [480, 640, 960],
    desktop: isHighQuality ? [960, 1200, 1600, 2048] : [640, 960, 1200, 1600]
  };
  
  // Use appropriate size array based on screen type
  const sizeArray = sizes[screenType] || sizes.desktop;
  
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const effectiveWidth = containerWidth * pixelRatio;
  
  // Find the smallest size that is larger than the container
  for (const size of sizeArray) {
    if (size >= effectiveWidth) {
      return size;
    }
  }
  
  // Fallback to largest size
  return sizeArray[sizeArray.length - 1];
}

/**
 * Creates a placeholder image
 * @param {string} text - Text to display on placeholder
 * @param {string} bgColor - Optional background color override
 * @param {Object} options - Additional options for placeholder generation
 * @param {boolean} options.gradient - Whether to use gradient background
 * @param {boolean} options.blur - Whether to add blur effect
 * @returns {string} Data URL for the placeholder
 */
function createPlaceholder(text = 'SOLARA', bgColor, options = {}) {
  const { gradient = false, blur = false } = options;
  const displayText = text || 'SOLARA';
  
  // Calculate color based on text if not provided
  const baseColor = bgColor || (() => {
    const hash = displayText.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 25%)`;
  })();
  
  // Limit text length for SVG display
  const trimmedText = displayText.length > 16 ? 
    displayText.substring(0, 15) + '...' : 
    displayText;
  
  // Create SVG with optional gradient and blur
  let svgContent;
  
  if (gradient) {
    // Extract hue from baseColor if it's HSL format
    let hue = 240; // Default purple hue
    const hslMatch = baseColor.match(/hsl\(\s*(\d+)/);
    if (hslMatch && hslMatch[1]) {
      hue = parseInt(hslMatch[1]);
    }
    
    // Create gradient with complementary colors
    const gradientHue1 = hue;
    const gradientHue2 = (hue + 60) % 360;
    
    svgContent = `
      <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
        <defs>
          <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stop-color='hsl(${gradientHue1}, 70%, 20%)' />
            <stop offset='100%' stop-color='hsl(${gradientHue2}, 70%, 30%)' />
          </linearGradient>
          ${blur ? '<filter id="blur"><feGaussianBlur stdDeviation="3" /></filter>' : ''}
        </defs>
        <rect width='400' height='400' fill='url(#grad)' ${blur ? 'filter="url(#blur)"' : ''} />
        <text x='50%' y='50%' font-family='sans-serif' font-size='24' text-anchor='middle' fill='white' dominant-baseline='middle'>${trimmedText}</text>
      </svg>
    `.trim().replace(/\n\s+/g, ' ');
  } else {
    // Simple colored background
    svgContent = `
      <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
        ${blur ? '<filter id="blur"><feGaussianBlur stdDeviation="3" /></filter>' : ''}
        <rect width='400' height='400' fill='${baseColor}' ${blur ? 'filter="url(#blur)"' : ''} />
        <text x='50%' y='50%' font-family='sans-serif' font-size='24' text-anchor='middle' fill='white' dominant-baseline='middle'>${trimmedText}</text>
      </svg>
    `.trim().replace(/\n\s+/g, ' ');
  }
  
  // Convert SVG to data URL with proper encoding
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

/**
 * Check if a URL is an IPFS URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's an IPFS URL
 */
function isIPFSUrl(url) {
  if (!url) return false;
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) return true;
  
  // Handle gateway URLs with /ipfs/
  if (url.includes('/ipfs/')) return true;
  
  // Handle direct CIDs
  if (CID_REGEX.test(url)) return true;
  
  return false;
}

/**
 * Fix common IPFS URL issues
 * @param {string} url - The URL to fix
 * @returns {string} - Fixed URL
 */
function fixIPFSUrl(url) {
  if (!url) return '';
  
  // Already a data URI
  if (url.startsWith('data:')) return url;
  
  try {
    // Convert ipfs:// protocol to HTTP gateway
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '').split('?')[0].split('#')[0];
      return `${IPFS_GATEWAYS[0]}${cid}`;
    }
    
    // If it's already a gateway URL, keep it as is
    if (url.includes('/ipfs/')) {
      return url;
    }
    
    // If it's a direct CID, convert to gateway URL
    if (CID_REGEX.test(url)) {
      return `${IPFS_GATEWAYS[0]}${url}`;
    }
    
    // Not an IPFS URL, return as is
    return url;
  } catch (err) {
    console.error('Error fixing IPFS URL:', err);
    return url; // Return original on error
  }
}

/**
 * Direct gateway URL generator using personal gateway
 * @param {string} url - Original URL or CID
 * @returns {string} - Direct gateway URL using personal gateway
 */
function getDirectGatewayUrl(url) {
  if (!url) return '';
  
  // Get the CID from any format
  const cid = extractIPFSCid(url);
  if (!cid) return url; // Not an IPFS URL
  
  // Extract filename if available
  let filename = '';
  const pathMatch = url.match(new RegExp(`${cid}/(.+)`));
  if (pathMatch && pathMatch[1]) {
    filename = `/${pathMatch[1]}`;
  }
  
  // Use personal gateway with cache buster to prevent caching issues
  return `${PERSONAL_GATEWAY}${cid}${filename}?_cb=${Date.now()}`;
}

/**
 * Get a deterministic NFT preview image path based on NFT ID
 * @param {string|number} nftId - The NFT ID or stake ID
 * @returns {string} Path to the preview image
 */
function getNftPreviewImage(nftId) {
  if (!nftId) return '/nft-previews/0119.png'; // Default fallback
  
  // Extract numeric part if ID contains non-digits
  const numericId = parseInt(String(nftId).replace(/\D/g, '') || '1');
  
  // Available preview images (excluding mp4 files)
  const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
  
  // Select deterministically based on ID
  const selectedImage = previewImages[numericId % previewImages.length];
  
  return `/nft-previews/${selectedImage}`;
}

/**
 * Preloads an image with specified options for improved loading performance
 * @param {string} url - The URL of the image to preload
 * @param {Object} options - Options for preloading
 * @param {number} options.width - Desired width for the image
 * @param {number} options.quality - Quality setting (1-100)
 * @param {boolean} options.optimizeFormat - Whether to optimize format
 * @returns {Promise} - Promise resolving when image is preloaded
 */
function preloadImage(url, options = {}) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided for preloading'));
      return;
    }
    
    // Process the URL with any optimization options
    const processedUrl = processImageUrl(url, options);
    
    // Create a new image to preload
    const img = new Image();
    
    img.onload = () => resolve(processedUrl);
    img.onerror = () => reject(new Error(`Failed to preload image: ${processedUrl}`));
    
    // Start loading the image
    img.src = processedUrl;
  });
}

module.exports = {
  extractIPFSCid,
  processImageUrl,
  getOptimalImageSize,
  createPlaceholder,
  getGatewayUrls,
  isIPFSUrl,
  fixIPFSUrl,
  getDirectGatewayUrl,
  getNftPreviewImage,
  preloadImage,
  simpleIpfsUrlConversion
};