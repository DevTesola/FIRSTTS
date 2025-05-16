import StakingComponent from "../components/StakingComponent";
import Head from "next/head";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Layout from "../components/Layout";
import StakingDashboard from "../components/staking/StakingDashboard";
import StakingAnalytics from "../components/staking/StakingAnalytics";
import StakingRewards from "../components/staking/StakingRewards-enhanced";
import NFTGallery from "../components/staking/NFTGallery";
import Leaderboard from "../components/staking/Leaderboard";
import GovernanceTab from "../components/staking/GovernanceTab";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorMessage from "../components/ErrorMessage";
import ErrorBoundary from "../components/ErrorBoundary";
import { GlassButton, PrimaryButton } from "../components/Buttons";
import EnhancedProgressiveImage from "../components/EnhancedProgressiveImage";
import { createPlaceholder } from "../utils/mediaUtils";
import { getNFTImageUrl } from "../utils/nftImageUtils";
import { fetchAPI, getErrorMessage } from "../utils/apiClient";
import { getStakingStats as fetchEnhancedStakingStats } from "../services/stakingService";
import EnhancedStakingButton from "../components/staking/EnhancedStakingButton";
import LaunchAnnouncementModal from "../components/LaunchAnnouncementModal";

// Simple loading placeholder component
const LoadingPlaceholder = ({ height = "200px", text = "Loading..." }) => (
  <div 
    className="flex items-center justify-center bg-gray-800/50 rounded-xl border border-purple-500/20 p-4"
    style={{ height }}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
      <p className="text-gray-300">{text}</p>
    </div>
  </div>
);

export default function StakingPage() {
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stakingStats, setStakingStats] = useState(null);
  const [userNFTs, setUserNFTs] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [governanceData, setGovernanceData] = useState(null);
  const [isLoadingGovernance, setIsLoadingGovernance] = useState(false);
  const [stakingPeriod, setStakingPeriod] = useState(30);
  
  // Load staking stats when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      // 각 함수를 setTimeout으로 래핑하여 실행 순서 제어 및 렌더링 루프 분리
      setTimeout(() => {
        fetchStakingStats();
      }, 100);
      
      setTimeout(() => {
        fetchUserNFTs();
      }, 300);
      
      setTimeout(() => {
        fetchGovernanceData();
      }, 500);
    } else {
      // Reset states when wallet disconnects
      setStakingStats(null);
      setUserNFTs([]);
      setSelectedNFT(null);
      setGovernanceData(null);
    }
  }, [connected, publicKey, lastRefreshTime]);
  
  // Fetch governance data
  const fetchGovernanceData = async () => {
    if (!publicKey) return;
    
    setIsLoadingGovernance(true);
    setError(null);
    
    try {
      console.log("Fetching governance data...");
      const response = await fetch(`/api/governance/getUserVotingPower?wallet=${publicKey.toString()}&nocache=${Date.now()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch governance data");
      }
      
      const data = await response.json();
      console.log("Governance data loaded:", data);
      setGovernanceData(data);
    } catch (err) {
      console.error("Error fetching governance data:", err);
      
      // If real API fails, use mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log("Using mock governance data");
        
        // Create mock governance data for testing UI
        const mockData = {
          wallet: publicKey.toString(),
          votingPower: Math.floor(Math.random() * 50) + 10,
          canCreateProposal: true,
          activeProposals: 3,
          proposalCreateThreshold: 10,
          recentProposals: [
            {
              id: "proposal1",
              title: "Update Community Treasury Allocation",
              description: "This proposal aims to adjust the distribution of treasury funds, allocating 30% to community-driven development projects.",
              forVotes: 1240,
              againstVotes: 320,
              quorum: 1000,
              status: 'active',
              endTime: new Date(Date.now() + 86400000 * 3) // 3일 후 종료
            },
            {
              id: "proposal2", 
              title: "Staking Rewards Expansion Proposal",
              description: "Increase staking reward tiers for Rare and Epic NFTs by 15% and introduce special weekly bonuses for continuous stakers.",
              forVotes: 980,
              againstVotes: 760,
              quorum: 1500,
              status: 'active',
              endTime: new Date(Date.now() + 86400000 * 5) // 5일 후 종료
            },
            {
              id: "proposal3",
              title: "TESOLA Partnership Framework",
              description: "Establish guidelines for project partnerships and integrations with other Solana ecosystem projects.",
              forVotes: 2150,
              againstVotes: 350, 
              quorum: 2000,
              status: 'active',
              endTime: new Date(Date.now() + 86400000 * 2) // 2일 후 종료
            }
          ],
          timestamp: new Date().toISOString()
        };
        
        setGovernanceData(mockData);
      } else {
        // In production, set error
        setError("Failed to load governance data. Please try again later.");
      }
    } finally {
      setIsLoadingGovernance(false);
    }
  };
  
  // Fetch user's staking stats with fallback to on-chain data if service fails
  const fetchStakingStats = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log("Fetching staking stats...");
      
      // 완전히 새로운 방식의 온체인 데이터 API 시도
      try {
        console.log("모든 스테이킹된 NFT를 가져오는 Anchor 기반 API 시도...");
        
        // 새롭게 개발한 get-all-staked-nfts 엔드포인트 사용 
        const response = await fetch(`/api/staking/get-all-staked-nfts?wallet=${publicKey.toString()}&nocache=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`온체인 API 오류: ${response.status}`);
        }
        
        const onchainData = await response.json();
        
        // API 응답에 디버그 정보가 있으면 출력
        if (onchainData.debug_info) {
          console.log("스테이킹 정보 디버그 데이터:", onchainData.debug_info);
        }
        
        // 데이터 유효성 검사
        if (onchainData && onchainData.stats && onchainData.stats.activeStakes) {
          const nftCount = onchainData.stats.activeStakes.length;
          console.log(`온체인 API: ${nftCount}개의 스테이킹된 NFT 발견`);
          
          // NFT 리스트 로깅
          console.log("스테이킹된 NFT 목록:");
          onchainData.stats.activeStakes.forEach((stake, index) => {
            console.log(`[${index}] ID: ${stake.id}, 민트: ${stake.mint_address}, 이름: ${stake.nft_name}`);
            console.log(`    이미지: ${stake.nft_image}`);
          });
          
          // 온체인 데이터 사용
          setStakingStats(onchainData.stats);
          setIsLoading(false);
          console.log("온체인 데이터 로드 성공!");
          return;
        } else {
          console.log("API 응답이 예상 형식과 다릅니다:", onchainData);
          
          // 응답에 에러가 있으면 표시
          if (onchainData.error) {
            console.error("API 응답 오류:", onchainData.error);
            if (onchainData.message) {
              console.error("오류 메시지:", onchainData.message);
            }
          }
        }
      } catch (onchainErr) {
        console.warn("새 온체인 API 호출 중 오류 발생:", onchainErr);
        
        // 기존 API를 첫 번째 폴백으로 시도
        try {
          console.log("첫 번째 폴백 API 시도...");
          const fallbackResponse = await fetch(`/api/staking/getStakingInfoFromChain?wallet=${publicKey.toString()}&nocache=${Date.now()}`);
          
          if (!fallbackResponse.ok) {
            throw new Error(`첫 번째 폴백 API 오류: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData && fallbackData.stats && fallbackData.stats.activeStakes) {
            console.log(`첫 번째 폴백 API: ${fallbackData.stats.activeStakes.length}개의 스테이킹된 NFT 발견`);
            setStakingStats(fallbackData.stats);
            setIsLoading(false);
            console.log("첫 번째 폴백 데이터 사용 성공");
            return;
          }
        } catch (fallback1Err) {
          console.warn("첫 번째 폴백 API도 실패:", fallback1Err);
          
          // 두 번째 폴백으로 기존 direct-onchain 시도
          try {
            console.log("두 번째 폴백 API 시도...");
            const fallback2Response = await fetch(`/api/staking/direct-onchain?wallet=${publicKey.toString()}&nocache=${Date.now()}`);
            
            if (!fallback2Response.ok) {
              throw new Error(`두 번째 폴백 API 오류: ${fallback2Response.status}`);
            }
            
            const fallback2Data = await fallback2Response.json();
            
            if (fallback2Data && fallback2Data.stats && fallback2Data.stats.activeStakes) {
              console.log(`두 번째 폴백 API: ${fallback2Data.stats.activeStakes.length}개의 스테이킹된 NFT 발견`);
              setStakingStats(fallback2Data.stats);
              setIsLoading(false);
              console.log("두 번째 폴백 데이터 사용 성공");
              return;
            }
          } catch (fallback2Err) {
            console.warn("두 번째 폴백 API도 실패:", fallback2Err);
          }
        }
      }
      
      // Fall back to the service method if on-chain API fails
      console.log("Falling back to service method...");
      const data = await fetchEnhancedStakingStats(
        publicKey.toString(), 
        { 
          forceFresh: true,
          onError: (err) => {
            console.error("Error in staking service:", err);
            setError(getErrorMessage(err, "Failed to load your staking data. Please try again later."));
          }
        }
      );
      
      // Log the data from the service
      if (data && data.activeStakes) {
        console.log(`Service API: Found ${data.activeStakes.length} active stakes`);
        
        // First item debugging
        if (data.activeStakes.length > 0) {
          const firstStake = data.activeStakes[0];
          console.log("Sample service stake data:", {
            id: firstStake.id,
            mint: firstStake.mint_address,
            name: firstStake.nft_name,
            image_url: firstStake.image_url
          });
        }
      }
      
      setStakingStats(data);
    } catch (err) {
      console.error("Error fetching staking stats:", err);
      setError(getErrorMessage(err, "Failed to load your staking data. Please try again later."));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 수정된 fetchUserNFTs 함수 - My Collection과 동일한 API 및 로직 사용
  const fetchUserNFTs = async () => {
    if (!publicKey) return;
    
    setIsLoadingNFTs(true);
    setError(null); // Clear any previous errors
    
    try {
      // 캐시 버스팅을 위한 타임스탬프
      const cacheBuster = Date.now();
      console.log("Fetching NFTs for staking...");
      // My Collection 페이지와 완전히 동일한 API 사용
      const response = await fetch(`/api/getNFTs?wallet=${publicKey.toString()}&limit=100&nocache=${cacheBuster}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch NFTs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.nfts?.length || 0} NFTs from API`);
      
      // 스테이킹된 NFT 필터링 - 최신 상태 가져오기
      const stakedResponse = await fetch(`/api/getStakingStats?wallet=${publicKey.toString()}&nocache=${Date.now()}`);
      if (!stakedResponse.ok) {
        throw new Error("Failed to fetch staking data for filtering");
      }
      
      const stakingData = await stakedResponse.json();
      const stakedMints = new Set();
      
      if (stakingData && stakingData.activeStakes) {
        console.log(`Found ${stakingData.activeStakes.length} staked NFTs to filter out`);
        stakingData.activeStakes.forEach(stake => {
          stakedMints.add(stake.mint_address);
        });
      }
      
      // 스테이킹되지 않은 NFT만 필터링
      const availableNFTs = data.nfts.filter(nft => !stakedMints.has(nft.mint));
      
      // 이미지 URL 디버깅 (처음 몇 개 NFT만)
      if (availableNFTs.length > 0) {
        const sampleNft = availableNFTs[0];
        console.log("Sample NFT image data:", {
          nft_name: sampleNft.name,
          image_url: sampleNft.image,
          processed_url: getNFTImageUrl({...sampleNft, __source: 'debug-staking-page'})
        });
      }
      
      console.log(`Filtered NFTs: ${availableNFTs.length} available out of ${data.nfts.length} total`);
      setUserNFTs(availableNFTs || []);
    } catch (err) {
      console.error("Error fetching user NFTs:", err);
      setError("NFT 데이터를 불러오는데 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      
      // 개발 환경에서는 모의 데이터 생성 (간소화)
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log("Generating mock NFT data as last resort");
          const mockNFTs = generateMockNFTs(publicKey.toString());
          setUserNFTs(mockNFTs);
        } catch (mockError) {
          console.error("Error generating mock data:", mockError);
        }
      }
    } finally {
      setIsLoadingNFTs(false);
    }
  };
  
  // Helper function to generate mock NFTs client-side if needed
  const generateMockNFTs = (wallet) => {
    const hash = Array.from(wallet).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const nftCount = (hash % 5) + 2; // 2-6 NFTs per wallet
    
    const mockNFTs = [];
    const tiers = ['Common', 'Rare', 'Epic', 'Legendary'];
    
    for (let i = 0; i < nftCount; i++) {
      const id = ((hash + i) % 999) + 1;
      const tierIndex = Math.min(Math.floor(Math.random() * 10 / 3), 3);
      const tier = tiers[tierIndex];
      
      mockNFTs.push({
        id: id.toString().padStart(4, '0'),
        mint: `mock${id}${wallet.substr(0, 8)}`,
        name: `SOLARA #${id}`,
        image: `/nft-previews/${(id % 5) + 1}.jpg`,
        attributes: [
          { trait_type: "Tier", value: tier },
          { trait_type: "Background", value: ["Cosmic", "Nebula", "Deep Space", "Starfield", "Galaxy"][id % 5] },
          { trait_type: "Design", value: ["Circuit", "Geometric", "Holographic", "Digital", "Futuristic"][id % 5] }
        ]
      });
    }
    
    return mockNFTs;
  };
  
  // Handle NFT selection
  const handleSelectNFT = (nft) => {
    setSelectedNFT(nft);
    setActiveTab("stake");
  };
  
  // Handle successful staking or unstaking with full data refresh
  const handleStakingSuccess = () => {
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn';
    successMessage.innerHTML = `
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>Staking transaction successful! Refreshing data...</span>
      </div>
    `;
    document.body.appendChild(successMessage);
    setTimeout(() => {
      successMessage.remove();
    }, 5000);
    
    // Reset selection
    setSelectedNFT(null);
    
    // Return to dashboard
    setActiveTab("dashboard");
    
    // Force data refresh with a delay to ensure backend updates are complete
    setTimeout(() => {
      // This will force re-fetching of both stats and NFTs
      setLastRefreshTime(Date.now());
    }, 1000);
  };
  
  // Function to refresh all data - useful for manual refresh buttons
  const refreshAllData = () => {
    setLastRefreshTime(Date.now());
  };
  
  // Render different content based on active tab
  const renderTabContent = () => {
    if (!connected) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-8 max-w-lg mx-auto backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Connect your Solana wallet to view your SOLARA NFTs and start earning TESOLA tokens through staking.
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case "dashboard":
        return (
          (() => {
            // 무한 렌더링 문제 해결을 위해 컴포넌트를 래핑
            // 데이터가 없거나 로딩 중이면 로딩 상태 표시
            if (isLoading) {
              return (
                <div className="flex justify-center items-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              );
            }
            
            if (!stakingStats || (stakingStats.activeStakes && stakingStats.activeStakes.length === 0)) {
              return (
                <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white mb-2">No Staking Data Found</h3>
                  <p className="text-gray-400 mb-4">
                    Your staking information will appear here once you stake your first NFT.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button 
                      onClick={refreshAllData}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Refresh Data
                    </button>
                    <button
                      onClick={() => setActiveTab("nfts")}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      View My NFTs
                    </button>
                  </div>
                </div>
              );
            }
            
            // 데이터가 있을 때 StakingDashboard 렌더링
            try {
              // 안정화 처리: 깊은 복사로 불변성 보장 및 오류 방지
              const safeStats = JSON.parse(JSON.stringify(stakingStats));
              
              // key 속성 추가하여 리렌더링 최적화
              // Suspense로 감싸서 로딩 상태 핸들링
              return (
                <ErrorBoundary>
                  <StakingDashboard 
                    key="dashboard-stable" 
                    stats={safeStats}
                    isLoading={isLoading}
                    onRefresh={refreshAllData}
                  />
                </ErrorBoundary>
              );
            } catch (err) {
              console.error("대시보드 렌더링 오류:", err);
              return (
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
                  <p className="text-gray-400 mb-4">
                    There was an error rendering the staking dashboard. Please try refreshing the page.
                  </p>
                  <button 
                    onClick={refreshAllData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Refresh Data
                  </button>
                </div>
              );
            }
          })()
        );
      case "analytics":
        return (
          <ErrorBoundary>
            <StakingAnalytics
              stats={stakingStats}
              unstaked={userNFTs}
              isLoading={isLoading} 
              onRefresh={refreshAllData}
            />
          </ErrorBoundary>
        );
      case "nfts":
        return (
          <ErrorBoundary>
            {(() => {
              // NFT 탭도 비슷한 방식으로 래핑하여 안정화
              if (isLoadingNFTs) {
                return (
                  <div className="flex justify-center items-center p-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                );
              }
              
              try {
                // 깊은 복사로 불변성 보장
                const safeNFTs = userNFTs ? JSON.parse(JSON.stringify(userNFTs)) : [];
                
                return (
                  <NFTGallery 
                    key="nfts-gallery-stable"
                    nfts={safeNFTs} 
                    isLoading={false} 
                    onSelectNFT={handleSelectNFT}
                    onRefresh={refreshAllData}
                  />
                );
              } catch (err) {
                console.error("NFT 갤러리 렌더링 오류:", err);
                return (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Error Loading NFTs</h3>
                    <p className="text-gray-400 mb-4">
                      There was an error rendering your NFT gallery. Please try refreshing the page.
                    </p>
                    <button 
                      onClick={refreshAllData}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      Refresh Data
                    </button>
                  </div>
                );
              }
            })()}
          </ErrorBoundary>
        );
      case "leaderboard":
        return (
          <ErrorBoundary>
            <Leaderboard 
              stats={stakingStats}
              isLoading={isLoading}
              onRefresh={refreshAllData}
            />
          </ErrorBoundary>
        );
      case "governance":
        return (
          <ErrorBoundary>
            <GovernanceTab 
              governanceData={governanceData}
              isLoading={isLoadingGovernance}
              onRefresh={refreshAllData}
            />
          </ErrorBoundary>
        );
      case "stake":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {selectedNFT ? (
                <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1v-2H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2z" clipRule="evenodd" />
                    </svg>
                    Stake NFT
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 mb-6 flex items-center">
                    {/* Use source property to indicate staking context */}
                    {selectedNFT.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden mr-4">
                        <EnhancedProgressiveImage 
                          src={(() => {
                            console.log(`Staking page - Selected NFT 이미지 필드 정보:`, {
                              id: selectedNFT.id,
                              mint: selectedNFT.mint,
                              image: selectedNFT.image,
                              image_url: selectedNFT.image_url
                            });
                            
                            // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                            // 단순화된 강력한 로직: 항상 ID를 추출하여 직접 IPFS URL을 생성하는 방식으로 변경
                            
                            let nftId = null;
                            
                            // 1. selectedNFT.id에서 숫자 추출 시도 (가장 높은 우선순위)
                            if (selectedNFT.id) {
                              const match = String(selectedNFT.id).match(/(\d+)/);
                              if (match && match[1]) {
                                nftId = match[1];
                                console.log(`스테이킹 페이지: ID에서 숫자 추출: ${nftId}`);
                              }
                            }
                            
                            // 2. selectedNFT.name에서 숫자 추출 시도
                            if (!nftId && selectedNFT.name) {
                              const match = selectedNFT.name.match(/#(\d+)/);
                              if (match && match[1]) {
                                nftId = match[1];
                                console.log(`스테이킹 페이지: 이름에서 숫자 추출: ${nftId}`);
                              }
                            }
                            
                            // 3. mint 주소 해시로 숫자 생성
                            if (!nftId && selectedNFT.mint) {
                              let hash = 0;
                              for (let i = 0; i < selectedNFT.mint.length; i++) {
                                hash = ((hash << 5) - hash) + selectedNFT.mint.charCodeAt(i);
                                hash = hash & hash;
                              }
                              nftId = Math.abs(hash) % 999 + 1;
                              console.log(`스테이킹 페이지: mint 주소 해시로 ID 생성: ${nftId}`);
                            }
                            
                            // 최후의 수단: 임의의 숫자 생성
                            if (!nftId) {
                              nftId = Math.floor(Math.random() * 999) + 1;
                              console.log(`스테이킹 페이지: 임의의 ID 생성: ${nftId}`);
                            }
                            
                            // 모든 상황에서 항상 직접 IPFS URL 생성
                            const formattedId = String(nftId).padStart(4, '0');
                            // 최신 환경 변수 사용 (하드코딩 제거)
                            const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                            const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                            const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_cb=${Date.now()}`;
                            
                            // 로그로 생성된 URL 확인
                            console.log(`❗❗❗ 스테이킹 페이지: 강제 생성된 IPFS URL: ${gatewayUrl}`);
                            console.log(`❗❗❗ 스테이킹 페이지: 사용된 CID: ${IMAGES_CID}`);
                            
                            return gatewayUrl;
                          })()} alt={selectedNFT.name} 
                          className="w-full h-full"
                          lazyLoad={false}
                          priority={true}
                          // Don't add __source here as it's already in getNFTImageUrl
                          placeholder={createPlaceholder(selectedNFT.name || "SOLARA NFT")}
                        />
                        {/* 디버깅용 정보 표시 */}
                        <div className="absolute bottom-0 right-0 bg-black/80 p-1 text-[6px] text-white">
                          {JSON.stringify({
                            image: selectedNFT?.image?.substring(0, 15) + '...',
                            image_url: selectedNFT?.image_url?.substring(0, 15) + '...',
                            starts_with: selectedNFT?.image?.startsWith('/') ? 'local' : 
                                        selectedNFT?.image?.startsWith('ipfs://') ? 'ipfs' : 'other',
                            src: 'stake-sel'
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white">{selectedNFT.name}</h4>
                      <p className="text-sm text-gray-400">#{selectedNFT.id}</p>
                      <div className="flex items-center mt-1">
                        <span className="px-2 py-0.5 text-xs rounded bg-purple-900 text-purple-300 font-medium">
                          {selectedNFT.attributes?.find(attr => attr.trait_type === "Tier")?.value || "Common"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <button
                      onClick={() => setSelectedNFT(null)}
                      className="text-sm text-gray-400 hover:text-white flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Choose a different NFT
                    </button>
                  </div>
                  
                  {/* This uses the new ThreePhaseStakingButton */}
                  <div className="mt-4">
                    <div className="px-4 py-3 bg-indigo-900/30 rounded-lg border border-indigo-500/30 mb-4">
                      <p className="text-sm text-indigo-300 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>새로운 스테이킹 방식이 적용되었습니다! 이제 계정 초기화 문제 없이 NFT를 스테이킹 할 수 있습니다.</span>
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="stakingPeriod" className="block text-sm font-medium text-gray-300 mb-1">
                        스테이킹 기간
                      </label>
                      <select
                        id="stakingPeriod"
                        value={stakingPeriod}
                        onChange={(e) => setStakingPeriod(parseInt(e.target.value, 10))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                      >
                        <option value="7">7일</option>
                        <option value="30">30일</option>
                        <option value="90">90일</option>
                        <option value="180">180일</option>
                        <option value="365">365일</option>
                      </select>
                    </div>

                    {/* Use EnhancedStakingButton for unified staking */}
                    <EnhancedStakingButton
                      nft={selectedNFT}
                      stakingPeriod={stakingPeriod}
                      onSuccess={handleStakingSuccess}
                      onError={(err) => setError(err.message)}
                    />

                    {/* No legacy fallback needed anymore */}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6 h-full flex flex-col justify-center items-center">
                  <h3 className="text-xl font-bold text-white mb-2">No NFT Selected</h3>
                  <p className="text-gray-400 text-center mb-4">
                    Please select an NFT from your collection to stake.
                  </p>
                  <PrimaryButton 
                    onClick={() => setActiveTab("nfts")}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    }
                  >
                    View My NFTs
                  </PrimaryButton>
                </div>
              )}
            </div>
            <div>
              <ErrorBoundary>
                <StakingRewards stats={stakingStats} isLoading={isLoading} onSuccess={refreshAllData} />
              </ErrorBoundary>
            </div>
          </div>
        );
      default:
        return <div>Unknown tab</div>;
    }
  };
  
  return (
    <>
      <Head>
        <title>TESOLA - NFT Staking Platform</title>
        <meta name="description" content="Stake your SOLARA NFTs to earn TESOLA tokens. Higher tier NFTs earn more rewards." />
      </Head>
      
      <Layout>
        {isLoading && <LoadingOverlay message="Loading staking data..." />}
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 font-orbitron">
            NFT Staking Platform
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Stake your SOLARA NFTs to earn TESOLA tokens. Earn up to 200 TESOLA per day with legendary NFTs.
          </p>
        </div>
        
        {/* Error display */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}
        
        {/* 에러 핸들링을 위한 ErrorBoundary */}
        
        {/* Staking explanation */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-4 md:p-6 border border-purple-500/30 shadow-lg backdrop-blur-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="mb-4 md:mb-0 md:mr-6 bg-purple-500/20 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">TESOLA Hold-to-Earn Program</h2>
              <p className="text-gray-300 mb-4">
                Stake your SOLARA NFTs and earn TESOLA tokens based on NFT tier and staking period.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <div className="font-bold text-yellow-400 text-lg">200</div>
                  <div className="text-xs text-gray-400">TESOLA/day (Legendary)</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <div className="font-bold text-pink-400 text-lg">100</div>
                  <div className="text-xs text-gray-400">TESOLA/day (Epic)</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <div className="font-bold text-purple-400 text-lg">50</div>
                  <div className="text-xs text-gray-400">TESOLA/day (Rare)</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <div className="font-bold text-blue-400 text-lg">25</div>
                  <div className="text-xs text-gray-400">TESOLA/day (Common)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800/60 rounded-lg p-1 w-full max-w-2xl">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Staking Dashboard
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "analytics" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("nfts")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "nfts" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                My NFTs
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "leaderboard" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab("governance")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "governance" 
                    ? "bg-purple-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Governance
              </button>
              {selectedNFT && (
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "stake" 
                      ? "bg-purple-600 text-white" 
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  Stake NFT
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Sync Status Indicator */}
        <div className="flex justify-center mb-4">
          <button 
            onClick={refreshAllData}
            className="flex items-center space-x-1 bg-gray-800/30 hover:bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="mb-12">
          {renderTabContent()}
        </div>
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              Initial Spike Rewards
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Earn bonus rewards in the first 30 days of staking:
            </p>
            <ul className="text-sm space-y-2 text-gray-300">
              <li className="flex justify-between">
                <span>First 7 days:</span>
                <span className="font-medium text-yellow-300">+100% (2x rewards)</span>
              </li>
              <li className="flex justify-between">
                <span>Days 8-14:</span>
                <span className="font-medium text-yellow-300">+75% (1.75x rewards)</span>
              </li>
              <li className="flex justify-between">
                <span>Days 15-30:</span>
                <span className="font-medium text-yellow-300">+50% (1.5x rewards)</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-purple-900/20 rounded-lg p-5 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Long-term Staking Bonuses
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Earn additional rewards for longer staking periods:
            </p>
            <ul className="text-sm space-y-2 text-gray-300">
              <li className="flex justify-between">
                <span>30+ days:</span>
                <span className="font-medium text-green-300">+20% rewards</span>
              </li>
              <li className="flex justify-between">
                <span>90+ days:</span>
                <span className="font-medium text-green-300">+40% rewards</span>
              </li>
              <li className="flex justify-between">
                <span>180+ days:</span>
                <span className="font-medium text-green-300">+70% rewards</span>
              </li>
              <li className="flex justify-between">
                <span>365+ days:</span>
                <span className="font-medium text-green-300">+100% rewards</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-pink-900/20 rounded-lg p-5 border border-pink-500/20">
            <h3 className="text-lg font-semibold text-pink-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Special Benefits
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Additional benefits for staking your NFTs:
            </p>
            <ul className="text-sm space-y-2 text-gray-300">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Monthly airdrops for 30+ day stakers</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Game NFT presale access (90+ days)</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Exclusive profile badges (180+ days)</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Real-world merchandise & events (365+ days)</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Custom styles for animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </Layout>
    </>
  );
}