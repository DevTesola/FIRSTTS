// components/staking/NFTGallery.jsx
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GlassButton, PrimaryButton, SecondaryButton } from "../Buttons";
import { processImageUrl, createPlaceholder, getNftPreviewImage } from "../../utils/mediaUtils";
import { getNFTImageUrl, getNFTName, getNFTTier, getTierStyles } from "../../utils/nftImageUtils";
import EnhancedProgressiveImage from "../EnhancedProgressiveImage";

/**
 * NFTGallery Component
 * Displays user's NFTs and allows for selection for staking
 */
const NFTGallery = ({ nfts = [], isLoading, onSelectNFT, onRefresh }) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, staked: 0 });
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [hoveredNFT, setHoveredNFT] = useState(null);
  const { publicKey, connected } = useWallet();
  
  // Fetch staking statistics when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      if (!connected || !publicKey) return;
      
      try {
        const response = await fetch(`/api/getStakingStats?wallet=${publicKey.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.activeStakes) {
            setStats(prev => ({ ...prev, staked: data.activeStakes.length }));
          }
        }
      } catch (error) {
        console.error("Error fetching staking stats:", error);
      }
    };
    
    fetchStats();
  }, [connected, publicKey]);
  
  // Update total NFT count whenever nfts prop changes
  useEffect(() => {
    setStats(prev => ({ ...prev, total: nfts.length }));
  }, [nfts]);
  
  // Filter NFTs based on tier and search term
  const filteredNFTs = nfts.filter((nft) => {
    // 먼저 이미 스테이킹된 NFT 제외 (API에서 미리 필터링되었지만 추가 확인)
    if (nft.isStaked) return false;
    
    // Get NFT tier from attributes
    const tierAttribute = nft.attributes?.find(
      (attr) => attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    const tier = tierAttribute ? tierAttribute.value.toLowerCase() : "common";
    
    // Apply tier filter
    const matchesTier = 
      filter === "all" || 
      (filter === "legendary" && tier.includes("legendary")) ||
      (filter === "epic" && tier.includes("epic")) ||
      (filter === "rare" && tier.includes("rare")) ||
      (filter === "common" && tier.includes("common"));
    
    // Apply search filter
    const matchesSearch = 
      searchTerm === "" || 
      (nft.name && nft.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (nft.mint && nft.mint.includes(searchTerm));
    
    return matchesTier && matchesSearch;
  });
  
  // Get NFT tier badge styling
  const getTierBadge = (nft) => {
    const tierAttribute = nft.attributes?.find(
      (attr) => attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    const tier = tierAttribute ? tierAttribute.value.toLowerCase() : "common";
    
    if (tier.includes("legendary")) return "bg-yellow-900 text-yellow-300";
    if (tier.includes("epic")) return "bg-purple-900 text-purple-300";
    if (tier.includes("rare")) return "bg-blue-900 text-blue-300";
    return "bg-green-900 text-green-300"; // Common default
  };
  
  // Get NFT tier text and standardize
  const getTierText = (nft) => {
    const tierAttribute = nft.attributes?.find(
      (attr) => attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    
    if (!tierAttribute || !tierAttribute.value) return "Common";
    
    const tier = tierAttribute.value.trim().toUpperCase();
    if (tier.includes("LEGEND")) return "Legendary";
    if (tier.includes("EPIC")) return "Epic";
    if (tier.includes("RARE")) return "Rare";
    return "Common";
  };
  
  // Get daily reward rate based on tier
  const getDailyRewardRate = (tier) => {
    if (tier.toLowerCase().includes("legendary")) return 200;
    if (tier.toLowerCase().includes("epic")) return 100;
    if (tier.toLowerCase().includes("rare")) return 50;
    return 25; // Common
  };
  
  // Format NFT ID for display
  const formatNftId = (id) => {
    if (!id) return "";
    return String(id).padStart(4, '0');
  };
  
  // This function is no longer used since we're handling errors inline
  // for more consistent behavior and to prevent caching issues
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg animate-pulse">
          <div className="aspect-square w-full bg-gray-700 rounded-t-lg"></div>
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Render empty state with expanded options
  const renderEmptyState = () => (
    <div className="text-center py-16 bg-gray-800/50 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-400 mb-2">No NFTs Found</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {searchTerm || filter !== "all" 
          ? "Try adjusting your search or filter settings" 
          : stats.staked > 0 
            ? `You have ${stats.staked} NFT${stats.staked !== 1 ? 's' : ''} already staked. View them in the Dashboard tab.`
            : "You don't have any SOLARA NFTs in your wallet. Purchase NFTs to stake and earn rewards."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {(searchTerm || filter !== "all") && (
          <GlassButton
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
            }}
          >
            Clear Filters
          </GlassButton>
        )}
        <GlassButton onClick={onRefresh}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh NFTs
        </GlassButton>
        {stats.staked > 0 && (
          <GlassButton
            onClick={() => {
              // Change to Dashboard tab
              document.querySelector('[aria-controls="dashboard"]')?.click();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            View Staked NFTs
          </GlassButton>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Enhanced info banner for first-time users */}
      {showInfoBanner && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30 relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={() => setShowInfoBanner(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-2 rounded-full mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">How Staking Works</h3>
              <p className="text-gray-300 mb-2">
                Select an NFT below to stake it and start earning TESOLA tokens. Higher tier NFTs earn more rewards.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                  <span className="text-yellow-400 font-bold">200</span>
                  <span className="text-gray-400 text-xs ml-1">TESOLA/day</span>
                  <div className="text-xs text-gray-500">(Legendary)</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                  <span className="text-purple-400 font-bold">100</span>
                  <span className="text-gray-400 text-xs ml-1">TESOLA/day</span>
                  <div className="text-xs text-gray-500">(Epic)</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                  <span className="text-blue-400 font-bold">50</span>
                  <span className="text-gray-400 text-xs ml-1">TESOLA/day</span>
                  <div className="text-xs text-gray-500">(Rare)</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-lg text-center">
                  <span className="text-green-400 font-bold">25</span>
                  <span className="text-gray-400 text-xs ml-1">TESOLA/day</span>
                  <div className="text-xs text-gray-500">(Common)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and search with improved UI */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input with clearer placeholder */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, ID or #tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              {searchTerm && (
                <button 
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                  onClick={() => setSearchTerm("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Tier filters with improved visuals */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-900 text-gray-300 hover:bg-gray-700"
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setFilter("legendary")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "legendary"
                  ? "bg-yellow-700 text-white"
                  : "bg-gray-900 text-yellow-300 hover:bg-gray-700"
              }`}
            >
              Legendary
            </button>
            <button
              onClick={() => setFilter("epic")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "epic"
                  ? "bg-purple-700 text-white"
                  : "bg-gray-900 text-purple-300 hover:bg-gray-700"
              }`}
            >
              Epic
            </button>
            <button
              onClick={() => setFilter("rare")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "rare"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-900 text-blue-300 hover:bg-gray-700"
              }`}
            >
              Rare
            </button>
            <button
              onClick={() => setFilter("common")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "common"
                  ? "bg-green-700 text-white"
                  : "bg-gray-900 text-green-300 hover:bg-gray-700"
              }`}
            >
              Common
            </button>
          </div>
        </div>
      </div>
      
      {/* NFT grid or placeholder */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Available NFTs for Staking
          </h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? "s" : ""} available
              {stats.staked > 0 && ` (${stats.staked} already staked)`}
            </span>
            <GlassButton 
              size="small" 
              onClick={onRefresh}
              disabled={isLoading}
              icon={
                isLoading ? (
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )
              }
            >
              Refresh
            </GlassButton>
            
            {stats.staked > 0 && (
              <GlassButton
                size="small"
                onClick={() => {
                  // Change to Dashboard tab
                  document.querySelector('[aria-controls="dashboard"]')?.click();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                View Staked
              </GlassButton>
            )}
          </div>
        </div>
        
        {isLoading ? (
          renderSkeleton()
        ) : filteredNFTs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNFTs.map((nft) => {
              const tier = getTierText(nft);
              const dailyRate = getDailyRewardRate(tier);
              const isHovered = hoveredNFT === nft.mint;
              
              return (
                <div 
                  key={nft.mint || nft.id} 
                  className={`group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 ${isHovered ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => onSelectNFT(nft)}
                  onMouseEnter={() => setHoveredNFT(nft.mint)}
                  onMouseLeave={() => setHoveredNFT(null)}
                >
                  {/* NFT Image with hover effect */}
                  <div className="aspect-square w-full bg-gray-800 relative">
                    <div className="w-full h-full relative">
                      {/* my-collection 페이지 방식으로 변경된 이미지 로딩 로직 */}
                      <EnhancedProgressiveImage
                        src={(() => {
                          // API에서 직접 제공한 이미지 URL 사용
                          let imageUrl = nft.nft_image || nft.image_url || nft.image;

                          // URL이 제공되고 http/https로 시작하는 경우
                          if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                            try {
                              // URL이 유효한지 확인
                              const url = new URL(imageUrl);
                              // 캐시 버스팅 파라미터 추가
                              url.searchParams.set('_t', Date.now().toString());
                              console.log(`✅ NFTGallery: 캐시 버스팅 URL 생성: ${url.toString()}`);
                              return url.toString();
                            } catch (err) {
                              console.log(`⚠️ NFTGallery: URL 파싱 실패, 원본 URL 사용: ${imageUrl}`);
                              // 추가 캐시 버스팅 파라미터
                              return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
                            }
                          }

                          // NFT ID 추출
                          const nftId = nft.id ||
                            (nft.name?.match(/#(\d+)/) ? nft.name?.match(/#(\d+)/)[1] : null);

                          if (nftId) {
                            // IPFS 게이트웨이에서 직접 URL 생성
                            const formattedId = String(nftId).padStart(4, '0');
                            const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                            const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                            const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                            console.log(`🔍 NFTGallery: 직접 IPFS URL 생성: ${gatewayUrl}`);
                            return gatewayUrl;
                          }

                          // 마지막 수단: getNFTImageUrl 사용
                          return getNFTImageUrl({
                            ...nft,
                            id: nftId,
                            mint: nft.mint,
                            name: nft.name,
                            __source: 'NFTGallery-staking',
                            _cacheBust: Date.now() // 강제 캐시 버스팅
                          });
                        })()}
                        alt={getNFTName(nft)}
                        placeholder={createPlaceholder(getNFTName(nft))}
                        className="w-full h-full object-cover"
                        id={nft.id || nft.mint}
                        lazyLoad={true}
                        priority={true} // 우선적으로 로드하도록 변경
                        highQuality={true}
                        preferRemote={true}
                        useCache={false}
                        blur={true}
                        __source="NFTGallery-staking"
                      />
                    </div>
                    
                    {/* Tier badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTierStyles(nft).bg}`}>
                        {getNFTTier(nft)}
                      </span>
                    </div>
                    
                    {/* Hover overlay with reward info */}
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white font-bold mb-1">Stake to Earn</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-yellow-400">{dailyRate}</span>
                        <span className="text-yellow-200 text-sm ml-1">TESOLA/day</span>
                      </div>
                      <span className="text-gray-300 text-xs mt-1">Higher rates for longer staking</span>
                    </div>
                  </div>
                  
                  {/* NFT info */}
                  <div className="p-3">
                    <h4 className="font-medium text-white truncate">{nft.name || `SOLARA #${formatNftId(nft.id)}`}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-400">
                        ID: {formatNftId(nft.id) || nft.mint?.slice(0, 6) || "Unknown"}
                      </div>
                      <PrimaryButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        onSelectNFT(nft);
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        Stake
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
      
      {/* Info Banner - Displayed when NFT list is not empty and user has staked NFTs */}
      {stats.staked > 0 && filteredNFTs.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-blue-300 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium mb-1">Already Staked NFTs</h4>
            <p className="text-sm">
              You currently have {stats.staked} NFT{stats.staked !== 1 ? 's' : ''} staked. 
              View your staked NFTs and earned rewards in the 
              <button 
                className="text-blue-200 font-medium underline mx-1 hover:text-white"
                onClick={() => {
                  // Change to Dashboard tab
                  document.querySelector('[aria-controls="dashboard"]')?.click();
                }}
              >
                Dashboard
              </button> 
              tab.
            </p>
          </div>
        </div>
      )}
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .hover-scale {
          transition: transform 0.2s ease-out;
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default NFTGallery;