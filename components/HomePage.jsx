"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MintSection from "./MintSection";
import SolaraHeader from "./SolaraHeader";
import CollectionInfo from "./CollectionInfo";
import RefundPolicyModal from "./RefundPolicyModal";
import FooterLinks from "./FooterLinks";
import MintResultModal from "./MintResultModal";
import LoadingOverlay from "./LoadingOverlay";
import ErrorMessage from "./ErrorMessage";
import NFTPreviewMinter from "./NFTPreviewMinter";
import WalletGuide from "./WalletGuide";

// 클라이언트 전용 컴포넌트 래퍼
const ClientOnly = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? children : null;
};

// Dynamic import for better performance - 수정된 방식
const VideoPlayer = dynamic(
  () => import("./VideoPlayer").then(mod => mod.default), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }
);

const COLLECTION_SIZE = 1000;
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function HomePage({ initialMintedCount = 0 }) {
  // State management
  const [loading, setLoading] = useState(false);
  const [minted, setMinted] = useState(initialMintedCount);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [showCollectionStory, setShowCollectionStory] = useState(false);
  const [mintPrice] = useState("3 SOL");
  const [isClient, setIsClient] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mintAttempts, setMintAttempts] = useState(0);
  
  // 디버깅용 로그
  console.log("HomePage render - current minted count:", minted);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    
    // 컴포넌트 디버깅을 위한 로그 추가
    console.log("VideoPlayer type:", typeof VideoPlayer);
    
    // Check local storage for previously visited previews
    const hasSeenPreview = localStorage.getItem("hasSeen_NFTPreview");
    if (!hasSeenPreview) {
      setTimeout(() => {
        setShowPreview(true);
      }, 3000); // Show NFT preview after 3 seconds on site
    }
    
    // NFT Preview 버튼 이벤트 리스너 추가
    const handleShowPreviewEvent = () => {
      console.log("Preview event received");
      setShowPreview(true);
    };
    
    window.addEventListener('show-preview-nft', handleShowPreviewEvent);
    
    return () => {
      window.removeEventListener('show-preview-nft', handleShowPreviewEvent);
    };
  }, []);

  // Fetch minted count on load
  useEffect(() => {
    const fetchMintedCount = async () => {
      try {
        const res = await fetch("/api/getMintedCount");
        if (!res.ok) {
          throw new Error(`Failed to fetch minted count: ${res.statusText}`);
        }
        const data = await res.json();
        console.log("API response:", data);
        
        // 응답 데이터에서 count 값 가져오기
        if (data && data.data && typeof data.data.count === 'number') {
          console.log("Setting minted count to:", data.data.count);
          setMinted(data.data.count);
        } else if (data && typeof data.count === 'number') {
          console.log("Setting minted count to:", data.count);
          setMinted(data.count);
        } else {
          console.error("Unexpected API response format:", data);
        }
      } catch (err) {
        console.error("Failed to fetch minted count:", err);
      }
    };
    
    fetchMintedCount();
    
    // Set up interval to refresh minted count periodically
    const countInterval = setInterval(fetchMintedCount, 30000); // 30초마다 갱신
    
    return () => clearInterval(countInterval);
  }, []);

  // ESC key handler for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowWalletGuide(false);
        setShowRefundPolicy(false);
        setShowCollectionStory(false);
        // Don't close the preview modal with ESC
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Handle mint preview closing
  const handleClosePreview = () => {
    setShowPreview(false);
    localStorage.setItem("hasSeen_NFTPreview", "true");
  };

  // Callback for when minting is complete
  const handleMintComplete = (result) => {
    // Update minted count
    const fetchUpdatedCount = async () => {
      try {
        const countRes = await fetch("/api/getMintedCount");
        if (countRes.ok) {
          const data = await countRes.json();
          console.log("Updated API response:", data);
          
          // 응답 데이터에서 count 값 가져오기
          if (data && data.data && typeof data.data.count === 'number') {
            console.log("Updating minted count to:", data.data.count);
            setMinted(data.data.count);
          } else if (data && typeof data.count === 'number') {
            console.log("Updating minted count to:", data.count);
            setMinted(data.count);
          }
        }
      } catch (error) {
        console.error("Error updating count:", error);
      }
    };
    
    fetchUpdatedCount();
    setMintResult(result);
    setMintAttempts(0); // Reset mint attempts counter on successful mint
  };

  // Handle mint button click from the preview - now just closes the preview
  const handleMintFromPreview = () => {
    handleClosePreview();
  };

  // Handle retry after error
  const handleErrorRetry = () => {
    setErrorMessage(null);
    setErrorDetails(null);
  };

  // Show wallet guide on "How it works" button click
  const handleShowHowItWorks = () => {
    setShowWalletGuide(true);
  };

  // 표시 전에 VideoPlayer 유효성 확인
  const isVideoPlayerValid = typeof VideoPlayer === 'function' || 
                             (typeof VideoPlayer === 'object' && VideoPlayer !== null);

  // 서버 측 렌더링 중에는 로딩 상태 표시
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <div className="ml-3">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative z-20 mx-auto w-full max-w-3xl px-4">
      {/* Loading overlay */}
      {loading && <LoadingOverlay message="Processing transaction..." />}
      
      {/* Modals */}
      {mintResult && <MintResultModal result={mintResult} onClose={() => setMintResult(null)} />}
      {showRefundPolicy && <RefundPolicyModal isVisible={showRefundPolicy} onClose={() => setShowRefundPolicy(false)} />}
      {showWalletGuide && <WalletGuide forceShow={showWalletGuide} onClose={() => setShowWalletGuide(false)} />}
      
      {/* Collection Story Modal */}
      {showCollectionStory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent pointer-events-none rounded-t-xl"></div>
              <video 
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-48 object-cover rounded-t-xl"
                src="/nft-previews/tsts.mp4"
              />
              <button 
                onClick={() => setShowCollectionStory(false)}
                className="absolute top-3 right-3 text-gray-200 hover:text-white bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-colors"
                aria-label="Close story"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-300 to-yellow-300 bg-clip-text text-transparent mb-6">SOLARA: 1000 Destinies, One Universe</h3>
              
              <div className="space-y-5 text-gray-300">
                <p className="leading-relaxed">
                  Join the SOLARA NFT collection of 1000 completely unique creations. Each piece is meticulously crafted with individualized designs - no repeating patterns or duplicate attributes. Every SOLARA NFT tells its own cosmic story.
                </p>
                
                <div className="bg-purple-900/30 p-5 rounded-lg border border-purple-500/30 shadow-inner">
                  <h4 className="font-bold text-yellow-300 text-lg mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Holder Privileges
                  </h4>
                  <p className="leading-relaxed">
                    The top 100 holders will receive the powerful 'Metamorphic Evolution Token.' This token enables your SOLARA NFT to undergo an amazing transformation - evolving into a SOLARA character that perfectly reflects the traits and rarity of your card.
                  </p>
                </div>
                
                <p className="leading-relaxed">
                  These characters won't just be beautiful collectibles - they'll be your avatar in the expanding SOLARA universe, participating in exclusive games and events within our growing ecosystem.
                </p>
                
                <div className="grid grid-cols-2 gap-3 my-6">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg text-center border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                    <div className="font-bold text-yellow-400 text-xl mb-1">50</div>
                    <div className="text-sm text-yellow-200">Legendary NFTs</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg text-center border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                    <div className="font-bold text-pink-400 text-xl mb-1">100</div>
                    <div className="text-sm text-pink-200">Epic NFTs</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg text-center border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                    <div className="font-bold text-purple-400 text-xl mb-1">250</div>
                    <div className="text-sm text-purple-200">Rare NFTs</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg text-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <div className="font-bold text-blue-400 text-xl mb-1">600</div>
                    <div className="text-sm text-blue-200">Common NFTs</div>
                  </div>
                </div>
                
                <p className="leading-relaxed">
                  Legendary, Epic, Rare, or Common - each tier offers unique properties, but remember that every SOLARA is one of a kind. Discover what cosmic secrets your collection will hold.
                </p>
                
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 italic text-gray-400 text-sm">
                  "As the ancient cosmic prophecies foretold - those who unite the SOLARAs shall unlock powers beyond imagination. Will you be among the chosen few?" — Chronicles of the SOLARA Universe
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowCollectionStory(false)}
                  className="py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => {
                    setShowCollectionStory(false);
                    setShowPreview(true);
                  }}
                  className="py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors shadow-lg font-medium"
                >
                  Preview Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* NFT Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <div className="flex justify-end mb-2">
              <button 
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-white p-2"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            
            <NFTPreviewMinter 
              mintPrice={mintPrice}
              onMint={handleMintFromPreview}
              loading={loading}
            />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <SolaraHeader />
      
      {/* VideoPlayer - 클라이언트 측에서만 렌더링 */}
      <ClientOnly>
        {isVideoPlayerValid ? (
          <VideoPlayer src="/SOLARA.mp4" />
        ) : (
          <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-500 mb-8">
            <div>비디오를 로드할 수 없습니다</div>
          </div>
        )}
      </ClientOnly>
      
      <CollectionInfo minted={minted} collectionSize={COLLECTION_SIZE} />
      
      {/* Collection Story Button */}
      <div className="flex justify-center mt-4 mb-6">
        <button
          onClick={() => setShowCollectionStory(true)}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 hover:from-purple-700 hover:via-fuchsia-600 hover:to-pink-700 text-white px-8 py-3.5 rounded-full flex items-center transition-all shadow-xl hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transform hover:scale-105 border-2 border-yellow-300/50"
        >
          {/* 화려한 배경 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-transparent to-yellow-300/20 animate-pulse"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0 blur-sm opacity-70 animate-[shimmer_3s_infinite]"></div>
          
          {/* 아이콘 및 텍스트 (상대적 위치) */}
          <div className="relative flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 group-hover:animate-pulse text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            
            <div>
              <span className="font-bold text-lg">Discover the SOLARA Universe</span>
              <span className="ml-2 bg-gradient-to-r from-yellow-300 to-amber-500 text-black font-bold text-xs px-2 py-1 rounded-full inline-block animate-pulse">NEW</span>
            </div>
          </div>
          
          {/* 별 효과 - 버튼 주위에 반짝이는 효과 */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping animation-delay-700"></div>
        </button>
      </div>
      
      {/* Mint section */}
      <div className="mint-section">
        <ClientOnly>
          <MintSection
            mintPrice={mintPrice}
            onMintComplete={handleMintComplete}
            isClient={isClient}
            setErrorMessage={setErrorMessage}
            setErrorDetails={setErrorDetails}
            setLoading={setLoading}
            showRefundPolicy={() => setShowRefundPolicy(true)}
            mintAttempts={mintAttempts}
          />
        </ClientOnly>
      </div>
      
      {/* Error message display */}
      {errorMessage && (
        <div className="mt-4">
          <ErrorMessage 
            message={errorMessage} 
            type="error" 
            errorDetails={errorDetails}
            onDismiss={() => {
              setErrorMessage(null);
              setErrorDetails(null);
            }}
          />
        </div>
      )}
      
      {/* Footer links */}
      <FooterLinks onShowHowItWorks={handleShowHowItWorks} />
      
    </div>
  );
}