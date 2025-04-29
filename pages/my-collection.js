// pages/my-collection.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import NFTCard from '../components/NFTCard';

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
  const [errorDetails, setErrorDetails] = useState(null);
  const router = useRouter();
  
  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 한 페이지에 표시할 NFT 수
  
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!connected || !publicKey) return;
      
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
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
        setError(err.message || "Failed to load NFTs");
        setErrorDetails(err.toString());
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
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 다시 시도 핸들러
  const handleRetry = () => {
    if (publicKey) {
      setError(null);
      setErrorDetails(null);
      setLoading(true);
      
      // 0.5초 지연 후 다시 시도 (UI 반응성 향상)
      setTimeout(() => {
        fetch(`/api/getNFTs?wallet=${publicKey.toString()}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch NFTs: ${res.status}`);
            return res.json();
          })
          .then(data => {
            const formattedNFTs = (data.nfts || []).map(nft => {
              if (nft.image && nft.image.startsWith('ipfs://')) {
                const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                const ipfsHash = nft.image.replace('ipfs://', '');
                nft.image = `${ipfsGateway}/ipfs/${ipfsHash}`;
              }
              return nft;
            });
            
            setOwnedNFTs(formattedNFTs);
            setLoading(false);
          })
          .catch(err => {
            console.error('Retry error:', err);
            setError(err.message || "Failed to load NFTs on retry");
            setErrorDetails(err.toString());
            setLoading(false);
          });
      }, 500);
    }
  };

  // 오프라인 상태 감지
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // 온라인/오프라인 상태 이벤트 리스너
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    // 초기 상태 설정
    setIsOffline(!navigator.onLine);
    
    // 이벤트 리스너 등록
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // 클린업
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">My SOLARA Collection</h1>
        
        {/* 오프라인 알림 */}
        {isOffline && (
          <ErrorMessage
            message="You are currently offline"
            type="warning"
            className="mb-6"
          />
        )}
        
        {!connected && (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Connect your wallet to see your SOLARA NFTs</p>
            <div className="mt-4 flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              message={error}
              type="error"
              errorDetails={errorDetails}
              onRetry={handleRetry}
              onDismiss={() => {
                setError(null);
                setErrorDetails(null);
              }}
            />
          </div>
        )}
        
        {loading && (
          <div className="py-12">
            <p className="text-center text-gray-400 mb-8">Loading your NFTs...</p>
            <LoadingSkeleton type="nft" count={6} />
          </div>
        )}
        
        {connected && !loading && !error && (
          <>
            {ownedNFTs.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl mb-4">You don't own any SOLARA NFTs yet</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
                >
                  Mint Your First NFT
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentNFTs.map((nft) => (
                  <NFTCard 
                    key={nft.mint} 
                    nft={nft} 
                    onClick={() => handleNFTClick(nft)}
                    showActions={true}
                  />
                ))}
              </div>
            )}
            
            {/* 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNum ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded bg-gray-700 disabled:opacity-50 hover:bg-gray-600 transition-colors"
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