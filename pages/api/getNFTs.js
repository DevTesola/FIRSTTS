// pages/api/getNFTs.js
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

/**
 * NFT 메타데이터에서 필요한 정보를 추출하는 함수
 * @param {string} uri - 메타데이터 URI
 * @returns {Promise<{image: string, tier: string}>} - 이미지 URL과 티어 정보
 */
async function loadNftMetadata(uri) {
  if (!uri) return { image: '', tier: 'Unknown' };
  
  try {
    const response = await fetch(uri, { timeout: 5000 });
    if (!response.ok) return { image: '', tier: 'Unknown' };
    
    const metadata = await response.json();
    
    // 이미지 URL 처리
    let imageUrl = metadata.image || '';
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // 티어 정보 추출
    const tierAttr = metadata.attributes?.find(attr => 
      attr.trait_type === 'Tier' || attr.trait_type === 'tier'
    );
    const tier = tierAttr ? tierAttr.value : 'Unknown';
    
    return { image: imageUrl, tier };
  } catch (error) {
    console.error('Error fetching metadata for URI:', uri, error.message);
    return { image: '', tier: 'Unknown' };
  }
}

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Solana 연결 설정 (명시적으로 devnet 사용)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Metaplex 인스턴스 생성
    const metaplex = new Metaplex(connection);
    
    // 지갑 주소로 모든 NFT 조회
    const nfts = await metaplex.nfts().findAllByOwner({
      owner: new PublicKey(wallet)
    });
    
    console.log(`Found ${nfts.length} NFTs for wallet ${wallet.slice(0, 4)}...${wallet.slice(-4)}`);
    
    // NFT 데이터 포맷팅
    const formattedNfts = await Promise.all(nfts.map(async nft => {
      try {
        // 메타데이터 로드
        const { image, tier } = await loadNftMetadata(nft.uri);
        
        return {
          mint: nft.mintAddress?.toString() || nft.address?.toString() || 'Unknown',
          name: nft.name || 'Unknown',
          symbol: nft.symbol || '',
          image,
          tier
        };
      } catch (error) {
        console.error(`Error processing NFT:`, error);
        return {
          mint: nft.mintAddress?.toString() || 'Unknown',
          name: nft.name || 'Unknown',
          symbol: nft.symbol || '',
          image: '',
          tier: 'Unknown'
        };
      }
    }));
    
    return res.status(200).json({ nfts: formattedNfts });
  } catch (error) {
    console.error('Error in getNFTs API:', error);
    return res.status(500).json({ error: 'Failed to fetch NFTs: ' + error.message });
  }
}