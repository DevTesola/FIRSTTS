// pages/my-collection.js
import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import NFTCard from '../components/NFTCard';
import EnhancedProgressiveImage from '../components/EnhancedProgressiveImage';
import StakingComponent from '../components/StakingComponent';
import { processNftArray } from '../utils/ipfs';
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
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const itemsPerPage = 9; // 한 페이지에 표시할 NFT 수
  
  // 스테이킹 모달 상태
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [stakingSuccess, setStakingSuccess] = useState(false);
  
  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState({ twitter: false, telegram: false });
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // NFT 데이터 가져오기 - 페이지네이션 적용
  const fetchOwnedNFTs = useCallback(async (page = 1) => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      console.log('Fetching NFTs for wallet:', publicKey.toString());
      
      // 페이지네이션 파라미터 포함하여 요청
      const res = await fetch(`/api/getNFTs?wallet=${publicKey.toString()}&page=${page}&limit=${itemsPerPage}`, {
        timeout: 30000 // 30초 타임아웃
      });
      
      console.log('API Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch NFTs: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API Data received:', data);
      
      // 페이지네이션 정보 업데이트
      setTotalNFTs(data.pagination.total);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
      
      setOwnedNFTs(data.nfts || []);
      console.log('NFTs count:', data.nfts.length);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err.message || "Failed to load NFTs");
      setErrorDetails(err.toString());
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);
  
  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchOwnedNFTs(currentPage);
  }, [publicKey, connected, currentPage, fetchOwnedNFTs]);
  
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
        fetchOwnedNFTs(currentPage);
      }, 500);
    }
  };
  
  // 스테이킹 핸들러
  const handleStake = (nft) => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet to stake NFTs");
      return;
    }
    
    setSelectedNFT(nft);
    setShowStakingModal(true);
  };
  
  // 스테이킹 성공 핸들러
  const handleStakingSuccess = (result) => {
    setStakingSuccess(true);
    
    // 5초 후 성공 메시지 숨기기
    setTimeout(() => {
      setStakingSuccess(false);
    }, 5000);
    
    // 모달 닫기
    setShowStakingModal(false);
    
    // 데이터 새로고침
    fetchOwnedNFTs(currentPage);
  };
  
  // 스테이킹 오류 핸들러
  const handleStakingError = (error) => {
    console.error("Staking error:", error);
    setError(`Failed to stake NFT: ${error.message}`);
    setErrorDetails(error.toString());
    
    // 모달 닫기
    setShowStakingModal(false);
  };
  
  // 공유 핸들러
  const handleShare = (nft) => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet to share NFTs");
      return;
    }
    
    setSelectedNFT(nft);
    setShowShareModal(true);
  };
  
  // 트위터 공유 핸들러
  const handleTwitterShare = async () => {
    if (!selectedNFT || !publicKey) return;
    
    setShareLoading(prev => ({ ...prev, twitter: true }));
    
    try {
      // NFT 정보 추출
      const nftId = selectedNFT.name?.match(/#(\d+)/)?.[ 1] || '0';
      const formattedId = String(nftId).padStart(4, '0');
      const tier = selectedNFT.tier || 'Unknown';
      const mintAddress = selectedNFT.mint;
      
      // 네트워크 설정
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      
      // 링크 생성
      const solscanUrl = `https://solscan.io/token/${mintAddress}?cluster=${network}`;
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      const tesolaUrl = `https://tesola.xyz/solara/${nftId}`;
      
      // 트윗 텍스트 생성
      const tweetText = encodeURIComponent(
        `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection! 🚀\n\n` +
        `View on Solscan: ${solscanUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
      
      // 사용자 안내
      alert('Please share on Twitter and then return to this window for your reward.');
      
      // 트위터 창 열기
      const twitterWindow = window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
      
      // 팝업 차단 확인
      if (!twitterWindow || twitterWindow.closed || typeof twitterWindow.closed === 'undefined') {
        alert('Please allow popups to open Twitter and earn rewards.');
        setShareLoading(prev => ({ ...prev, twitter: false }));
        return;
      }
      
      // 사용자가 공유를 완료할 시간을 주기 위한 지연
      setTimeout(async () => {
        const confirmed = window.confirm('Did you complete sharing on Twitter? Confirm to receive your TESOLA tokens.');
        
        if (confirmed) {
          try {
            // 보상 API 호출
            const response = await fetch('/api/recordTweetReward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                wallet: publicKey.toString(),
                reference_id: `nft_tweet_${formattedId}`,
                reward_type: 'tweet',
                nft_id: nftId,
                mint_address: mintAddress
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error processing tweet reward');
            }
            
            // 성공 메시지
            alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
            setShareSuccess(true);
            
            // 5초 후 성공 메시지 숨기기
            setTimeout(() => {
              setShareSuccess(false);
            }, 5000);
          } catch (error) {
            console.error('Tweet reward error:', error);
            alert(`Error: ${error.message}`);
          }
        }
        
        setShareLoading(prev => ({ ...prev, twitter: false }));
      }, 5000);
    } catch (error) {
      console.error('Error in twitter share process:', error);
      setShareLoading(prev => ({ ...prev, twitter: false }));
      alert(`Error: ${error.message}`);
    }
  };
  
  // 텔레그램 공유 핸들러
  const handleTelegramShare = async () => {
    if (!selectedNFT || !publicKey) return;
    
    setShareLoading(prev => ({ ...prev, telegram: true }));
    
    try {
      // NFT 정보 추출
      const nftId = selectedNFT.name?.match(/#(\d+)/)?.[ 1] || '0';
      const formattedId = String(nftId).padStart(4, '0');
      const tier = selectedNFT.tier || 'Unknown';
      const mintAddress = selectedNFT.mint;
      
      // 네트워크 설정
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      
      // 링크 생성
      const solscanUrl = `https://solscan.io/token/${mintAddress}?cluster=${network}`;
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      const tesolaUrl = `https://tesola.xyz/solara/${nftId}`;
      const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
      
      // 공유 텍스트 생성
      const shareText = encodeURIComponent(
        `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection! 🚀\n\n` +
        `View on Solscan: ${solscanUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `Join our community: ${telegramCommunityUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
      
      // 사용자 안내
      alert('Please share on Telegram and then return to this window for your reward.');
      
      // 텔레그램 창 열기
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${shareText}`;
      const telegramWindow = window.open(telegramUrl, '_blank');
      
      // 팝업 차단 확인
      if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
        alert('Please allow popups to open Telegram and earn rewards.');
        setShareLoading(prev => ({ ...prev, telegram: false }));
        return;
      }
      
      // 사용자가 공유를 완료할 시간을 주기 위한 지연
      setTimeout(async () => {
        const confirmed = window.confirm('Did you complete sharing on Telegram? Confirm to receive your TESOLA tokens.');
        
        if (confirmed) {
          try {
            // 보상 API 호출
            const response = await fetch('/api/recordTweetReward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                wallet: publicKey.toString(),
                reference_id: `nft_telegram_${formattedId}`,
                reward_type: 'telegram_share',
                nft_id: nftId,
                mint_address: mintAddress
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error processing Telegram reward');
            }
            
            // 성공 메시지
            alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
            setShareSuccess(true);
            
            // 5초 후 성공 메시지 숨기기
            setTimeout(() => {
              setShareSuccess(false);
            }, 5000);
          } catch (error) {
            console.error('Telegram reward error:', error);
            alert(`Error: ${error.message}`);
          }
        }
        
        setShareLoading(prev => ({ ...prev, telegram: false }));
      }, 5000);
    } catch (error) {
      console.error('Error in telegram share process:', error);
      setShareLoading(prev => ({ ...prev, telegram: false }));
      alert(`Error: ${error.message}`);
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
        
        {/* 스테이킹 성공 메시지 */}
        {stakingSuccess && (
          <div className="mb-6">
            <ErrorMessage 
              message="NFT staked successfully! You'll receive TESOLA rewards based on your staking period."
              type="success"
              onDismiss={() => setStakingSuccess(false)}
            />
          </div>
        )}
        
        {/* 공유 성공 메시지 */}
        {shareSuccess && (
          <div className="mb-6">
            <ErrorMessage 
              message="NFT shared successfully! 5 TESOLA tokens have been added to your rewards."
              type="success"
              onDismiss={() => setShareSuccess(false)}
            />
          </div>
        )}
        
        {/* 스테이킹 모달 */}
        {showStakingModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowStakingModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                aria-label="Close staking modal"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-4">Stake Your SOLARA NFT</h2>
              
              <StakingComponent 
                nft={selectedNFT}
                onSuccess={handleStakingSuccess}
                onError={handleStakingError}
              />
            </div>
          </div>
        )}
        
        {/* 공유 모달 */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowShareModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                aria-label="Close share modal"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-4">Share Your SOLARA NFT</h2>
              
              {/* NFT 정보 */}
              <div className="flex items-center mb-6 p-3 bg-gray-800 rounded-lg">
                {selectedNFT.image && (
                  <img 
                    src={selectedNFT.image} 
                    alt={selectedNFT.name} 
                    className="w-16 h-16 rounded object-cover mr-3"
                  />
                )}
                <div>
                  <h3 className="font-medium">{selectedNFT.name}</h3>
                  <p className="text-sm text-gray-300">{selectedNFT.tier}</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Share your NFT on social media and earn TESOLA tokens!
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleTwitterShare}
                  disabled={shareLoading.twitter}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  {shareLoading.twitter ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                      Share on Twitter (+5 TESOLA)
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleTelegramShare}
                  disabled={shareLoading.telegram}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  {shareLoading.telegram ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
                      </svg>
                      Share on Telegram (+5 TESOLA)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
                {ownedNFTs.map((nft) => {
                  // Format NFT name to ensure 4-digit ID display
                  if (nft.name && nft.name.includes('#')) {
                    nft.name = nft.name.replace(/#(\d+)/, (match, id) => 
                      `#${String(id).padStart(4, '0')}`
                    );
                  }
                  
                  return (
                    <div 
                      key={nft.mint} 
                      className="border border-purple-500 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 bg-gray-900/50"
                      onClick={() => handleNFTClick(nft)}
                    >
                      <div className="relative aspect-square">
                        <EnhancedProgressiveImage 
                          src={nft.image} 
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          lazyLoad={true}
                          quality={85}
                        />
                        
                        {/* NFT info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white font-semibold truncate">{nft.name}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-purple-300 text-sm">{nft.tier}</p>
                            {nft.mint && <p className="text-gray-400 text-xs font-mono">{nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</p>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="p-3 bg-gray-800 flex justify-between items-center gap-2">
                        <button 
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md flex-1"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            window.open(`https://solscan.io/token/${nft.mint}?cluster=devnet`, '_blank');
                          }}
                        >
                          View
                        </button>
                        <button 
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex-1"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            handleShare(nft);
                          }}
                        >
                          Share
                        </button>
                        <button 
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md flex-1"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            handleStake(nft);
                          }}
                        >
                          Stake
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page buttons */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page and 1 page on each side of current
                    const showPageButton = pageNum === 1 || 
                                          pageNum === totalPages || 
                                          Math.abs(pageNum - currentPage) <= 1;
                                        
                    // Show ellipsis
                    if (!showPageButton && (pageNum === currentPage - 2 || pageNum === currentPage + 2)) {
                      return (
                        <span
                          key={`ellipsis-${pageNum}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    if (!showPageButton) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium ${
                          currentPage === pageNum 
                            ? 'bg-purple-700 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
            
            {/* NFT 수량 표시 */}
            {totalNFTs > 0 && (
              <div className="text-center mt-6 text-gray-400">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalNFTs)}-
                {Math.min(currentPage * itemsPerPage, totalNFTs)} of {totalNFTs} NFTs
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}