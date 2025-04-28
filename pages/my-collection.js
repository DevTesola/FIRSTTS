// pages/my-collection.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Layout 컴포넌트 동적 로딩
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
});

// 지갑 버튼 동적 로딩
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function MyCollection() {
  const { publicKey, connected } = useWallet();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 한 페이지에 표시할 NFT 수
  
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!connected || !publicKey) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching NFTs for wallet:', publicKey.toString());
        
        // 긴 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
        
        // 서버에서 사용자 NFT 가져오기
        const res = await fetch(`/api/getNFTs?wallet=${publicKey.toString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('API Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error response:', errorText);
          throw new Error(`Failed to fetch NFTs: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('API Data received:', data);
        
        // 이미지 URL 포맷팅 추가
        const formattedNFTs = (data.nfts || []).map(nft => {
          // 이미지 URL 확인 및 수정
          if (nft.image && nft.image.startsWith('ipfs://')) {
            // Pinata 게이트웨이 사용
            const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
            const ipfsHash = nft.image.replace('ipfs://', '');
            nft.image = `${ipfsGateway}/ipfs/${ipfsHash}`;
          }
          return nft;
        });
        
        setOwnedNFTs(formattedNFTs);
        console.log('NFTs count:', formattedNFTs.length);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnedNFTs();
  }, [publicKey, connected]);
  
  // NFT 클릭 핸들러
  const handleNFTClick = (nft) => {
    // NFT ID 추출 (이름이나 mint 주소 사용)
    let nftId;
    if (nft.name) {
      // "#123"과 같은 패턴에서 숫자 추출
      const match = nft.name.match(/#(\d+)/);
      if (match && match[1]) {
        nftId = match[1];
      }
    }
    
    // ID를 찾지 못했으면 mint 주소 사용
    if (!nftId && nft.mint) {
      nftId = nft.mint;
    }
    
    // ID가 있으면 상세 페이지로 이동
    if (nftId) {
      router.push(`/solara/${nftId}`);
    }
  };
  
  // 현재 페이지의 NFT 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNFTs = ownedNFTs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ownedNFTs.length / itemsPerPage);
  
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // 페이지 상단으로 스크롤
    window.scrollTo(0, 0);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">My SOLARA Collection</h1>
        
        {!connected && (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Connect your wallet to see your SOLARA NFTs</p>
            <div className="mt-4 flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="ml-4">Loading your NFTs...</p>
          </div>
        )}
        
        {connected && !loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedNFTs.length === 0 ? (
                <p className="text-xl col-span-full text-center py-12">You don't own any SOLARA NFTs yet</p>
              ) : (
                currentNFTs.map((nft) => (
                  <div 
                    key={nft.mint} 
                    className="border border-purple-500 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
                    onClick={() => handleNFTClick(nft)}
                  >
                    {nft.image ? (
                      <div className="relative aspect-square">
                        <img 
                          src={nft.image} 
                          alt={nft.name || "SOLARA NFT"} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.onerror = null;
                            // 안전한 외부 placeholder 서비스 사용
                            e.target.src = 'https://placehold.co/400x400/3f1f5f/ffffff?text=SOLARA+NFT'; 
                            console.log('Image load error for:', nft.name);
                          }} 
                        />
                        {/* NFT 정보 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white font-semibold truncate">{nft.name || `SOLARA NFT`}</p>
                          <p className="text-purple-300 text-sm">{nft.tier || "Unknown Tier"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-gray-700 flex items-center justify-center">
                        <div className="text-center p-4">
                          <p className="text-gray-400 mb-2">이미지 없음</p>
                          <p className="text-purple-300 font-semibold">{nft.name || "SOLARA NFT"}</p>
                          <p className="text-xs text-gray-500">{nft.mint?.slice(0, 6)}...{nft.mint?.slice(-6)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1 ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
            
            {/* NFT 수량 정보 */}
            {ownedNFTs.length > 0 && (
              <div className="text-center mt-6 text-gray-400">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, ownedNFTs.length)} of {ownedNFTs.length} NFTs
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}