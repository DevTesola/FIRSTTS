"use client";

import { createPlaceholder, processImageUrl, getOptimalImageSize, isIPFSUrl } from "./mediaUtils";
import { debugLog, debugError } from "./debugUtils";

/**
 * 고정 캐시 키 생성 함수
 * 이미지 깜빡임을 방지하기 위해 안정적인 캐시 키를 생성합니다.
 * @param {string} id - 컴포넌트 ID 또는 NFT ID
 * @param {string} alt - 대체 텍스트
 * @param {string} source - 소스 컴포넌트 정보
 * @returns {string} 안정적인 캐시 키
 */
export function generateStableCacheKey(id, alt, source) {
  // ID가 있으면 ID 기반 캐시 키 생성
  if (id) {
    return `stable-${id}`;
  }
  
  // Alt 텍스트가 있으면 alt 텍스트 기반 캐시 키 생성
  if (alt) {
    // 영문자와 숫자만 추출
    const simpleId = alt.replace(/[^a-z0-9]/gi, '');
    return `img-${simpleId}`;
  }
  
  // 소스 컴포넌트 정보 기반 캐시 키
  if (source) {
    return `src-${source.replace(/[^a-z0-9]/gi, '')}`;
  }
  
  // 기본값 - 세션 단위로 안정적인 키
  // 페이지가 새로고침될 때만 바뀌도록 처리
  return 'session-stable';
}

/**
 * 표준 IPFS 게이트웨이 목록
 * 다양한 백업 게이트웨이를 제공하여 안정성 향상
 */
export const IPFS_GATEWAYS = [
  'https://tesola.mypinata.cloud/ipfs/',  // Private gateway (highest priority)
  'https://gateway.pinata.cloud/ipfs/',    // Pinata gateway 
  'https://nftstorage.link/ipfs/',         // NFT.Storage (stable)
  'https://ipfs.io/ipfs/',                 // IPFS.io
  'https://dweb.link/ipfs/',               // Protocol Labs
  'https://cloudflare-ipfs.com/ipfs/'      // Cloudflare
];

/**
 * IPFS URL 처리 함수
 * IPFS URL을 HTTP URL로 변환합니다.
 * @param {string} src - 원본 URL 또는 IPFS URL
 * @param {Object} options - 옵션
 * @returns {string} 처리된 URL
 */
export function processIPFSUrl(src, options = {}) {
  if (!src) return '';
  
  const {
    gatewayIndex = 0,
    cacheKey = 'stable',
    preferCustomGateway = true
  } = options;
  
  // IPFS URL인지 확인
  if (!isIPFSUrl(src) && !src.includes('/ipfs/')) {
    return src;
  }
  
  // IPFS 프로토콜 URL 처리
  let hashAndPath = '';
  if (src.startsWith('ipfs://')) {
    hashAndPath = src.replace('ipfs://', '');
  } else if (src.includes('/ipfs/')) {
    // 기존 HTTP 게이트웨이 URL에서 hash 추출
    hashAndPath = src.split('/ipfs/')[1];
  }
  
  if (!hashAndPath) return src;
  
  // 적절한 게이트웨이 선택
  const gateway = preferCustomGateway ? 
    IPFS_GATEWAYS[0] : // 항상 우리 커스텀 게이트웨이 사용
    IPFS_GATEWAYS[Math.min(gatewayIndex, IPFS_GATEWAYS.length - 1)];
  
  // 최종 URL 생성
  let finalUrl = `${gateway}${hashAndPath}`;
  
  // 캐시 키 추가 (안정적인 캐싱을 위해)
  if (cacheKey) {
    finalUrl += finalUrl.includes('?') ? `&_cb=${cacheKey}` : `?_cb=${cacheKey}`;
  }
  
  return finalUrl;
}

/**
 * 화면 크기 감지 함수
 * 현재 화면 크기에 따라 'mobile', 'tablet', 'desktop' 중 하나를 반환합니다.
 * @returns {string} 화면 타입
 */
export function detectScreenType() {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width <= 640) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * 로딩 인디케이터 렌더링 함수
 * 로딩 상태를 보여주는 UI 생성
 * @param {boolean} isSimple - 단순 로딩 인디케이터 여부
 * @returns {JSX.Element} 로딩 인디케이터 JSX
 */
export function renderLoadingIndicator(isSimple = false) {
  if (isSimple) {
    return (
      <div className="absolute bottom-1 right-1 p-1 bg-black/30 rounded-full">
        <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1"></div>
        <span className="text-xs text-white/70">이미지 로딩 중...</span>
      </div>
    </div>
  );
}

/**
 * 에러 오버레이 렌더링 함수
 * 에러 상태를 보여주는 UI 생성
 * @param {boolean} isSimple - 단순 에러 표시 여부
 * @returns {JSX.Element} 에러 오버레이 JSX
 */
export function renderErrorOverlay(isSimple = false) {
  if (isSimple) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-red-900/30 to-purple-900/30 backdrop-blur-sm">
      <div className="text-center p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-red-300">이미지를 불러올 수 없습니다</p>
      </div>
    </div>
  );
}

/**
 * 이미지 URL 생성 함수
 * 다양한 소스를 처리하고 최적화된 이미지 URL을 생성합니다.
 * @param {string} src - 원본 이미지 URL
 * @param {Object} options - 이미지 처리 옵션
 * @returns {string} 최적화된 이미지 URL
 */
export function createOptimizedImageUrl(src, options = {}) {
  const {
    width = 800,
    quality = 80,
    cacheKey = 'stable',
    gatewayIndex = 0,
    optimizeFormat = true,
    preferRemote = true,
    componentSource = ''
  } = options;
  
  if (!src) return '';
  
  // IPFS URL 처리
  if (isIPFSUrl(src) || src.includes('/ipfs/')) {
    return processIPFSUrl(src, {
      gatewayIndex,
      cacheKey,
      preferCustomGateway: preferRemote
    });
  }
  
  // 일반 URL 처리 (mediaUtils의 processImageUrl 활용)
  try {
    return processImageUrl(src, {
      width,
      quality,
      optimizeFormat,
      useCache: true,
      preferRemote,
      __source: componentSource,
      _cacheBust: cacheKey
    });
  } catch (error) {
    debugError('imageUtils', '이미지 URL 처리 중 오류:', error);
    return src; // 오류 발생 시 원본 URL 반환
  }
}

/**
 * NFT ID에서 이미지 URL 생성 함수
 * NFT ID를 기반으로 IPFS 이미지 URL을 생성합니다.
 * @param {string} nftId - NFT ID
 * @param {Object} options - URL 생성 옵션
 * @returns {string} 생성된 이미지 URL
 */
export function createNftImageUrl(nftId, options = {}) {
  const {
    cacheKey = 'stable',
    cid = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike',
    gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud'
  } = options;
  
  if (!nftId) return '';
  
  // ID 형식 맞추기 (4자리)
  const formattedId = String(nftId).padStart(4, '0');
  
  // URL 생성
  const gatewayUrl = `${gateway}/ipfs/${cid}/${formattedId}.png`;
  
  // 캐시 키 추가
  const finalUrl = cacheKey ? 
    `${gatewayUrl}?_cb=${cacheKey}` : 
    gatewayUrl;
  
  return finalUrl;
}

/**
 * 대체 이미지 URL 생성 함수
 * Image load failed 시 사용할 대체 이미지 URL을 생성합니다.
 * @param {string} nftId - NFT ID 또는 이미지 식별자
 * @returns {string} 대체 이미지 URL
 */
export function createFallbackImageUrl(nftId) {
  if (!nftId) return '/placeholder-nft.png';
  
  // 기본 미리보기 이미지 목록
  const fallbackImages = [
    '0119.png', 
    '0171.png', 
    '0327.png', 
    '0416.png', 
    '0418.png', 
    '0579.png'
  ];
  
  // NFT ID를 숫자로 변환
  let numericId;
  if (typeof nftId === 'number') {
    numericId = nftId;
  } else {
    // 문자열 해시 생성 (일관된 결과를 위함)
    let hash = 0;
    const str = String(nftId);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // 32bit 정수로 변환
    }
    numericId = Math.abs(hash);
  }
  
  // 이미지 선택
  const selectedImage = fallbackImages[numericId % fallbackImages.length];
  return `/nft-previews/${selectedImage}`;
}

// 이 모듈에서 mediaUtils의 기능도 모두 재export
export { createPlaceholder, isIPFSUrl, getOptimalImageSize };