// utils/ipfs.js
/**
 * IPFS 관련 유틸리티 함수들
 */

// Next.js 애플리케이션의 기본 URL (기본값은 개발 서버)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * IPFS URL을 내부 프록시 URL로 변환합니다.
 * 이렇게 하면 모든 IPFS 요청이 동일한 출처(same origin)에서 이루어져 CORS 문제가 해결됩니다.
 * 
 * @param {string} url - 원본 IPFS URL
 * @returns {string} - 프록시된 URL
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
    'https://ipfs.infura.io/ipfs/',
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
 * NFT 메타데이터 객체의 이미지 URL을 프록시된 URL로 업데이트합니다.
 * 
 * @param {Object} nft - NFT 메타데이터 객체
 * @returns {Object} - 이미지 URL이 업데이트된 NFT 메타데이터 객체
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
 * NFT 메타데이터 배열을 처리합니다.
 * 
 * @param {Array} nfts - NFT 메타데이터 객체 배열
 * @returns {Array} - 처리된 NFT 메타데이터 객체 배열
 */
export function processNftArray(nfts) {
  if (!Array.isArray(nfts)) return nfts;
  return nfts.map(nft => processNftMetadata(nft));
}