/**
 * 민팅 전용 설정
 * 메인넷에서만 민팅이 진행되도록 하는 별도 설정
 */

// 민팅 전용 메인넷 설정
export const mintingConfig = {
  // 민팅 전용 네트워크 (항상 mainnet)
  network: process.env.NEXT_PUBLIC_MINTING_NETWORK || 'mainnet-beta',
  
  // 민팅 전용 RPC 엔드포인트 (메인넷)
  rpcEndpoint: process.env.NEXT_PUBLIC_MINTING_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  
  // NFT 가격 (3 SOL = 3,000,000,000 lamports)
  nftPriceLamports: parseInt(process.env.NFT_PRICE_LAMPORTS || '3000000000'),
  
  // 민팅 지갑 주소
  sellerPublicKey: process.env.NEXT_PUBLIC_SELLER_PUBLIC_KEY || 'qNfZ9QHYyu5dDDMvVAZ1hE55JX4GfUYQyfvLzZKBZi3',
  
  // NFT 총 공급량
  nftSupply: parseInt(process.env.NEXT_PUBLIC_COLLECTION_SIZE || '1000'),
  
  // Commitment 레벨 (메인넷에서는 더 안전하게)
  commitment: 'confirmed',
  
  // SOL 단위로 가격 가져오기
  getNftPriceInSol() {
    return this.nftPriceLamports / 1e9;
  },
  
  // 메인넷인지 확인
  isMainnet() {
    return this.network === 'mainnet-beta';
  },
  
  // 민팅 전용 설정 검증
  validate() {
    const errors = [];
    
    if (!this.isMainnet()) {
      errors.push('민팅 네트워크가 메인넷으로 설정되지 않았습니다.');
    }
    
    if (!this.rpcEndpoint.includes('mainnet')) {
      errors.push('민팅 RPC 엔드포인트가 메인넷으로 설정되지 않았습니다.');
    }
    
    if (this.nftPriceLamports !== 3000000000) {
      errors.push('NFT 가격이 3 SOL로 설정되지 않았습니다.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// 일반 설정 (스테이킹 등에서 사용, devnet 유지)
export const generalConfig = {
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  commitment: 'confirmed'
};

export default mintingConfig;