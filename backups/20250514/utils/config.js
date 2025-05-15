/**
 * 환경 변수 및 설정 관리
 * 
 * 이 모듈은 여러 부분에서 사용되는 설정값들을 중앙에서 관리합니다.
 * 환경 변수에 대한 타입 변환, 기본값 설정 및 검증 로직을 포함합니다.
 */

// Supabase 구성
export const supabaseConfig = {
  // Supabase URL (필수)
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  
  // Supabase 익명 키 (필수)
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Supabase 서비스 롤 키 (관리자 작업에 필요)
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // 유효한 구성인지 확인
  isValid: function() {
    return Boolean(this.url && this.anonKey);
  },
  
  // 관리자 권한 사용 가능 여부
  hasAdminAccess: function() {
    return Boolean(this.serviceKey);
  }
};

// Solana 네트워크 구성
export const solanaConfig = {
  // RPC 엔드포인트
  rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  
  // 네트워크 (mainnet-beta, testnet, devnet)
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  
  // NFT 가격 (lamports)
  nftPrice: parseInt(process.env.NFT_PRICE_LAMPORTS || '1500000000'),
  
  // NFT 총 공급량
  nftSupply: parseInt(process.env.NFT_TOTAL_SUPPLY || '1000'),
  
  // Commitment 레벨
  commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
  
  // SOL 단위로 가격 가져오기
  getNftPriceInSol: function() {
    return this.nftPrice / 1e9;
  },
  
  // 네트워크가 mainnet인지 확인
  isMainnet: function() {
    return this.network === 'mainnet-beta';
  }
};

// IPFS configuration
export const ipfsConfig = {
  // Default IPFS gateway
  gateway: process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || 'https://tesola.mypinata.cloud',
  
  // Collection resources CID (metadata JSON 폴더)
  resourceCid: process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu',
  
  // NFT 이미지 전용 CID (이미지 폴더)
  imagesCid: process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike',
  
  // Fallback gateway list
  fallbackGateways: [
    'https://cloudflare-ipfs.com',
    'https://ipfs.io',
    'https://gateway.pinata.cloud',
    'https://dweb.link'
  ],
  
  // Pinata API 키 (있는 경우)
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
  
  // API 키가 설정되어 있는지 확인
  hasPinataAccess: function() {
    return Boolean(this.pinataApiKey && this.pinataSecretKey);
  },
  
  // Create IPFS URL (from CID)
  getIpfsUrl: function(cid, useMainGateway = true) {
    if (!cid) return '';
    
    // Handle ipfs:// protocol
    const cleanCid = cid.replace('ipfs://', '');
    
    // Use default gateway or first fallback gateway
    const gateway = useMainGateway 
      ? this.gateway 
      : this.fallbackGateways[0];
      
    return `${gateway}/ipfs/${cleanCid}`;
  },
  
  // Create NFT image URL (from NFT ID)
  getNftImageUrl: function(nftId, options = {}) {
    if (!nftId) return '';
    
    // Format NFT ID to 4 digits
    const numericId = parseInt(String(nftId).replace(/\D/g, ''));
    const formattedId = String(numericId).padStart(4, '0');
    
    const { protocol = 'gateway', gateway = this.gateway } = options;
    
    // Return either the IPFS protocol URL or the gateway URL
    if (protocol === 'ipfs') {
      return `ipfs://${this.imagesCid}/${formattedId}.png`;
    } else {
      return `${gateway}/ipfs/${this.imagesCid}/${formattedId}.png`;
    }
  }
};

// 앱 구성
export const appConfig = {
  // 환경 (development, production, test)
  env: process.env.NODE_ENV || 'development',
  
  // 사이트 URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tesola.io',
  
  // 프로젝트 이름
  projectName: process.env.NEXT_PUBLIC_PROJECT_NAME || 'TESOLA',
  
  // 개발 환경인지 확인
  isDev: function() {
    return this.env === 'development';
  },
  
  // 프로덕션 환경인지 확인
  isProd: function() {
    return this.env === 'production';
  },
  
  // 테스트 환경인지 확인
  isTest: function() {
    return this.env === 'test';
  },
  
  // 설정 디버깅 정보 출력
  debug: function() {
    if (this.isDev()) {
      console.log('App Config:', {
        env: this.env,
        siteUrl: this.siteUrl,
        projectName: this.projectName
      });
      
      console.log('Solana Config:', {
        network: solanaConfig.network,
        rpcEndpoint: solanaConfig.rpcEndpoint,
        nftPrice: solanaConfig.getNftPriceInSol() + ' SOL'
      });
      
      console.log('IPFS Config:', {
        gateway: ipfsConfig.gateway,
        resourceCid: ipfsConfig.resourceCid,
        imagesCid: ipfsConfig.imagesCid,
        hasPinataAccess: ipfsConfig.hasPinataAccess()
      });
      
      console.log('Supabase Config:', {
        url: supabaseConfig.url ? '✓ Set' : '✗ Missing',
        anonKey: supabaseConfig.anonKey ? '✓ Set' : '✗ Missing',
        serviceKey: supabaseConfig.serviceKey ? '✓ Set' : '✗ Missing'
      });
    }
  }
};

// 기본 내보내기
export default {
  app: appConfig,
  solana: solanaConfig,
  supabase: supabaseConfig,
  ipfs: ipfsConfig
};