// utils/ipfs.js
/**
 * IPFS 관련 유틸리티 함수들
 */

// Base URL for the Next.js application (defaults to development server)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Converts IPFS URLs to internal proxy URLs.
 * This ensures all IPFS requests come from the same origin, solving CORS issues.
 * 
 * @param {string} url - Original IPFS URL
 * @returns {string} - Proxied URL
 */
export function getProxiedIpfsUrl(url) {
  if (!url) return '';
  
  // IPFS 프로토콜 URL 처리 (ipfs://)
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `${APP_URL}/api/ipfs/${cid}`;
  }
  
  // 알려진 IPFS 게이트웨이 URL 처리
  const knownGateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/', 
    'https://dweb.link/ipfs/',
    'https://tesola.mypinata.cloud/ipfs/'  // 개인 게이트웨이도 포함
  ];
  
  for (const gateway of knownGateways) {
    if (url.includes(gateway)) {
      const cid = url.split(gateway)[1];
      return `${APP_URL}/api/ipfs/${cid}`;
    }
  }
  
  // IPFS URL이 아닌 경우 원본 URL 반환
  return url;
}

/**
 * Updates image URLs in NFT metadata object to use proxied URLs.
 * 
 * @param {Object} nft - NFT metadata object
 * @returns {Object} - NFT metadata object with updated image URLs
 */
export function processNftMetadata(nft) {
  if (!nft) return nft;
  
  // 깊은 복사로 원본 객체 변경 방지
  const processedNft = JSON.parse(JSON.stringify(nft));
  
  // 이미지 URL 처리
  if (processedNft.image) {
    processedNft.image = getProxiedIpfsUrl(processedNft.image);
  }
  
  // 프로필 이미지 등 추가 이미지 필드 처리
  if (processedNft.avatar) {
    processedNft.avatar = getProxiedIpfsUrl(processedNft.avatar);
  }
  
  // 추가 처리가 필요한 다른 이미지 필드가 있다면 여기에 추가
  
  return processedNft;
}

/**
 * Processes an array of NFT metadata objects.
 * 
 * @param {Array} nfts - Array of NFT metadata objects
 * @returns {Array} - Processed array of NFT metadata objects
 */
export function processNftArray(nfts) {
  if (!Array.isArray(nfts)) return nfts;
  return nfts.map(nft => processNftMetadata(nft));
}