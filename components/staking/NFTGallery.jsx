// components/staking/NFTGallery.jsx - 단순화된 버전
import React, { useState } from "react";
import { GlassButton, PrimaryButton } from "../Buttons";

/**
 * NFTGallery Component - My Collection과 동일한 방식으로 NFT 표시
 * Displays user's NFTs and allows for selection for staking
 */
const NFTGallery = ({ nfts = [], isLoading, onSelectNFT, onRefresh }) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  console.log("NFTGallery received nfts:", nfts); // 디버깅용 로그
  
  // Filter NFTs based on tier and search term
  const filteredNFTs = nfts.filter((nft) => {
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
    if (tier.includes("epic")) return "bg-pink-900 text-pink-300";
    if (tier.includes("rare")) return "bg-purple-900 text-purple-300";
    return "bg-blue-900 text-blue-300"; // Common default
  };
  
  // Get NFT tier text
  const getTierText = (nft) => {
    const tierAttribute = nft.attributes?.find(
      (attr) => attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    return tierAttribute ? tierAttribute.value : "Common";
  };
  
  // Format NFT ID for display
  const formatNftId = (id) => {
    if (!id) return "";
    return String(id).padStart(4, '0');
  };
  
  // Process image URL to use custom IPFS gateway (from NFTCard.jsx)
  const processImageUrl = (url) => {
    if (!url) return "/placeholder-nft.jpg";
    
    // Use environment variable or default gateway
    const CUSTOM_IPFS_GATEWAY = process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || "https://tesola.mypinata.cloud";
    
    // Handle IPFS URLs with custom gateway
    if (url.startsWith('ipfs://')) {
      return `${CUSTOM_IPFS_GATEWAY}/ipfs/${url.replace('ipfs://', '')}`;
    }
    
    // Replace any other IPFS gateways with custom one
    const knownGateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/', 
      'https://ipfs.infura.io/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    
    for (const gateway of knownGateways) {
      if (url.includes(gateway)) {
        const cid = url.split(gateway)[1];
        return `${CUSTOM_IPFS_GATEWAY}/ipfs/${cid}`;
      }
    }
    
    return url;
  };
  
  // Handle image error
  const handleImageError = (e) => {
    console.error("Image failed to load:", e.target.src);
    e.target.src = "/placeholder-nft.jpg";
  };
  
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
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-16 bg-gray-800/50 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-400 mb-2">No NFTs Found</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {searchTerm || filter !== "all" 
          ? "Try adjusting your search or filter settings" 
          : "You don't have any SOLARA NFTs in your wallet. Purchase NFTs to stake and earn rewards."}
      </p>
      <div className="flex justify-center space-x-4">
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
        <GlassButton onClick={onRefresh}>Refresh NFTs</GlassButton>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Tier filters */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-900 text-gray-300 hover:bg-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("legendary")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === "legendary"
                  ? "bg-yellow-700 text-white"
                  : "bg-gray-900 text-yellow-300 hover:bg-gray-700"
              }`}
            >
              Legendary
            </button>
            <button
              onClick={() => setFilter("epic")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === "epic"
                  ? "bg-pink-700 text-white"
                  : "bg-gray-900 text-pink-300 hover:bg-gray-700"
              }`}
            >
              Epic
            </button>
            <button
              onClick={() => setFilter("rare")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === "rare"
                  ? "bg-purple-700 text-white"
                  : "bg-gray-900 text-purple-300 hover:bg-gray-700"
              }`}
            >
              Rare
            </button>
            <button
              onClick={() => setFilter("common")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === "common"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-900 text-blue-300 hover:bg-gray-700"
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
            My SOLARA NFTs
          </h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? "s" : ""}
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
          </div>
        </div>
        
        {isLoading ? (
          renderSkeleton()
        ) : filteredNFTs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNFTs.map((nft) => (
              <div 
                key={nft.mint || nft.id} 
                className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer transform hover:scale-[1.02] duration-200"
                onClick={() => onSelectNFT(nft)}
              >
                {/* NFT Image - 단순화 및 IPFS 처리 */}
                <div className="aspect-square w-full bg-gray-800 relative">
                  <img 
                    src={processImageUrl(nft.image)} 
                    alt={nft.name || `NFT #${nft.id}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  
                  {/* Tier badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTierBadge(nft)}`}>
                      {getTierText(nft)}
                    </span>
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
                      Stake
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default NFTGallery;