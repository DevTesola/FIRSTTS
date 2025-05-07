// pages/api/getNFTs.js - Optimized version
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// IPFS gateway options
const IPFS_GATEWAYS = [
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/', 
  'https://tesola.mypinata.cloud/ipfs/',    // 추가: 개인 핀핑 서비스 (좀 더 안정적)
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/'     // 추가: NFT.Storage (안정적)
];

/**
 * NFT 메타데이터에서 필요한 정보를 추출하는 함수
 * Optimized for caching and faster IPFS resolution
 */
async function loadNftMetadata(uri, mintAddress) {
  if (!uri) return { image: '', tier: 'Unknown' };
  
  try {
    // First, check if we have cached metadata in the database
    if (mintAddress) {
      const { data: cachedMetadata } = await supabase
        .from('nft_metadata_cache')
        .select('*')
        .eq('mint_address', mintAddress)
        .single();
      
      if (cachedMetadata && cachedMetadata.last_updated) {
        // Check if cache is fresh (less than 24 hours old)
        const cacheTime = new Date(cachedMetadata.last_updated).getTime();
        const now = Date.now();
        const cacheAge = now - cacheTime;
        
        // If cache is still fresh, use it
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return {
            image: cachedMetadata.image_url,
            tier: cachedMetadata.tier || 'Unknown',
            name: cachedMetadata.name,
            attributes: cachedMetadata.attributes
          };
        }
      }
    }
    
    // If no cache or cache is stale, fetch from URI
    // Handle IPFS URIs
    let metadataUrl = uri;
    if (uri.startsWith('ipfs://')) {
      // IPFS_GATEWAYS 배열에 이미 /ipfs/가 포함되어 있으므로 직접 hash를 연결
      const ipfsHash = uri.replace('ipfs://', '');
      metadataUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
      console.log(`Converting IPFS URI to gateway URL: ${uri} -> ${metadataUrl}`);
    }
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(metadataUrl, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    // Process image URL - 중요: IPFS URL은 그대로 유지하여 프론트엔드에서 처리
    let imageUrl = metadata.image || '';
    
    // IPFS URL을 그대로 반환하여 프론트엔드에서 처리하도록 변경
    // ipfs:// 프로토콜 URL이면 그대로 유지
    if (imageUrl.startsWith('ipfs://')) {
      // 원본 IPFS URL 그대로 사용 (게이트웨이 처리하지 않음)
      console.log(`Preserving original IPFS URL: ${imageUrl}`);
    } 
    // 게이트웨이 URL을 ipfs:// 형식으로 변환 (일관성 및 게이트웨이 라운드 로빈 지원)
    else if (imageUrl && imageUrl.includes('/ipfs/')) {
      try {
        const parts = imageUrl.split('/ipfs/');
        if (parts.length > 1) {
          const ipfsUrl = `ipfs://${parts[1]}`;
          console.log(`게이트웨이 URL을 IPFS 프로토콜로 변환: ${imageUrl} -> ${ipfsUrl}`);
          imageUrl = ipfsUrl;
        }
      } catch (err) {
        console.error('Gateway to IPFS protocol conversion error:', err);
      }
    }
    
    // Extract tier information
    const tierAttr = metadata.attributes?.find(attr => 
      attr.trait_type === 'Tier' || attr.trait_type === 'tier'
    );
    const tier = tierAttr ? tierAttr.value : 'Unknown';
    
    // Cache the metadata for future requests
    if (mintAddress) {
      await supabase
        .from('nft_metadata_cache')
        .upsert({
          mint_address: mintAddress,
          name: metadata.name,
          image_url: imageUrl, // 변환된 IPFS URL 사용 (게이트웨이 URL이 ipfs:// 형식으로 변환됨)
          tier: tier,
          attributes: metadata.attributes || [],
          metadata_uri: uri,
          last_updated: new Date().toISOString()
        }, { onConflict: 'mint_address' });
      
      console.log(`Cached metadata for ${mintAddress} with image URL: ${imageUrl}`);
    }
    
    return { 
      image: imageUrl, 
      tier,
      name: metadata.name,
      attributes: metadata.attributes
    };
  } catch (error) {
    console.error('Error fetching metadata for URI:', uri, error.message);
    
    // If we have a mint address but failed to fetch, try other IPFS gateways
    if (uri.startsWith('ipfs://') && mintAddress) {
      const ipfsHash = uri.replace('ipfs://', '');
      
      // Try alternative gateways
      for (let i = 1; i < IPFS_GATEWAYS.length; i++) {
        try {
          // IPFS_GATEWAYS 배열에 이미 /ipfs/가 포함되어 있으므로 직접 hash를 연결
          const altUrl = `${IPFS_GATEWAYS[i]}${ipfsHash}`;
          
          console.log(`Trying alternative gateway ${i}: ${altUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // shorter timeout for fallbacks
          
          const response = await fetch(altUrl, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const metadata = await response.json();
            
            // Process image URL - 항상 IPFS URL 그대로 유지
            let imageUrl = metadata.image || '';
            
            // 항상 IPFS URL 그대로 유지
            if (imageUrl.startsWith('ipfs://')) {
              // 원본 IPFS URL 그대로 사용 (게이트웨이 변환 없음)
              console.log(`Preserving original IPFS URL (fallback): ${imageUrl}`);
            }
            // 게이트웨이 URL을 ipfs:// 형식으로 변환 (일관성 및 게이트웨이 라운드 로빈 지원)
            else if (imageUrl && imageUrl.includes('/ipfs/')) {
              try {
                const parts = imageUrl.split('/ipfs/');
                if (parts.length > 1) {
                  const ipfsUrl = `ipfs://${parts[1]}`;
                  console.log(`게이트웨이 URL을 IPFS 프로토콜로 변환 (fallback): ${imageUrl} -> ${ipfsUrl}`);
                  imageUrl = ipfsUrl;
                }
              } catch (err) {
                console.error('Fallback gateway to IPFS protocol conversion error:', err);
              }
            }
            
            // Extract tier information
            const tierAttr = metadata.attributes?.find(attr => 
              attr.trait_type === 'Tier' || attr.trait_type === 'tier'
            );
            const tier = tierAttr ? tierAttr.value : 'Unknown';
            
            // Cache this successful gateway for future use
            await supabase
              .from('nft_metadata_cache')
              .upsert({
                mint_address: mintAddress,
                name: metadata.name,
                image_url: imageUrl, // 변환된 IPFS URL 사용
                tier: tier,
                attributes: metadata.attributes || [],
                metadata_uri: uri,
                last_updated: new Date().toISOString(),
                successful_gateway: IPFS_GATEWAYS[i]
              }, { onConflict: 'mint_address' });
            
            return { 
              image: imageUrl, 
              tier,
              name: metadata.name,
              attributes: metadata.attributes
            };
          }
        } catch (fallbackError) {
          // Continue to next gateway
          console.error(`Fallback gateway ${IPFS_GATEWAYS[i]} failed:`, fallbackError.message);
        }
      }
    }
    
    return { image: '', tier: 'Unknown' };
  }
}

export default async function handler(req, res) {
  try {
    const { wallet, limit = 20, page = 1 } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Calculate pagination offset
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Solana 연결 설정 (명시적으로 devnet 사용)
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com', 
      'confirmed'
    );
    
    // Metaplex 인스턴스 생성
    const metaplex = new Metaplex(connection);
    
    // 지갑 주소로 모든 NFT 조회
    const nfts = await metaplex.nfts().findAllByOwner({
      owner: new PublicKey(wallet)
    });
    
    console.log(`Found ${nfts.length} NFTs for wallet ${wallet.slice(0, 4)}...${wallet.slice(-4)}`);
    
    // Get total count for pagination
    const total = nfts.length;
    
    // Apply pagination to the NFTs array
    const paginatedNfts = nfts.slice(offset, offset + parseInt(limit));
    
    // Process NFTs in parallel with optimized metadata loading
    const formattedNfts = await Promise.all(paginatedNfts.map(async nft => {
      try {
        const mintAddress = nft.mintAddress?.toString() || nft.address?.toString() || 'Unknown';
        
        // Load metadata with caching support
        const { image, tier, name, attributes } = await loadNftMetadata(nft.uri, mintAddress);
        
        return {
          mint: mintAddress,
          name: name || nft.name || 'Unknown',
          symbol: nft.symbol || '',
          image,
          tier,
          attributes
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
    
    return res.status(200).json({ 
      nfts: formattedNfts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getNFTs API:', error);
    return res.status(500).json({ error: 'Failed to fetch NFTs: ' + error.message });
  }
}