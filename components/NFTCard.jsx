"use client";

import React, { useState, useEffect, memo, useRef } from "react";
import { 
  processImageUrl, 
  createPlaceholder, 
  getOptimalImageSize, 
  getNftPreviewImage,
  extractIPFSCid, 
  getGatewayUrls, 
  isIPFSUrl,
  getDirectGatewayUrl,
  fixIPFSUrl
} from "../utils/mediaUtils";
import { getNFTImageUrl, getNFTName, getNFTTier } from "../utils/nftImageUtils";
import EnhancedProgressiveImage from "./EnhancedProgressiveImage";

// Video file extensions for type detection
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

/**
 * NFT card component with optimized image loading and IPFS gateway support
 * 
 * @param {Object} nft - NFT data object
 * @param {function} onClick - Click event handler
 * @param {boolean} showActions - Show action buttons (optional)
 */
const NFTCard = ({ nft, onClick, showActions = false }) => {
  const [loadState, setLoadState] = useState({
    loading: true,
    error: false,
    url: ''
  });
  const containerRef = useRef(null);
  
  // Extract needed info from NFT data
  const { image, name, mint, tier = "Unknown" } = nft;
  
  // Format name (truncate if too long)
  const formattedName = name && name.length > 25 
    ? `${name.substring(0, 22)}...` 
    : name || "SOLARA NFT";
  
  // Format mint address (show only first and last 4 chars)
  const shortMint = mint 
    ? `${mint.slice(0, 4)}...${mint.slice(-4)}` 
    : "";
    
  // Format NFT ID with padding
  const formatNftId = (name) => {
    if (!name) return "";
    const match = name.match(/#(\d+)/);
    if (match && match[1]) {
      return name.replace(/#\d+/, `#${String(match[1]).padStart(4, '0')}`);
    }
    return name;
  };
  
  // Apply padding to display name
  const displayName = formatNftId(formattedName);
  
  // Determine if image is video based on extension
  const isVideo = image && VIDEO_EXTENSIONS.some(ext => image.toLowerCase().endsWith(ext));
  
  // Generate placeholder for failed images
  const placeholderImage = createPlaceholder(displayName);

  // Simplified loading logic - only handling videos
  useEffect(() => {
    if (!image) {
      // No image provided
      setLoadState({
        loading: false,
        error: true,
        url: placeholderImage 
      });
      return;
    }
    
    // For videos, optimize the loading
    if (isVideo) {
      // Process URL but load directly
      const videoUrl = processImageUrl(image);
      setLoadState({
        loading: false,
        error: false,
        url: videoUrl
      });
      return;
    }
    
    // Images are handled by EnhancedProgressiveImage component
    setLoadState({
      loading: false,
      error: false,
      url: '' // Will be handled by the EnhancedProgressiveImage
    });
  }, [image, displayName, placeholderImage, isVideo]);

  // Handle image error with fallback
  const handleImageError = () => {
    setLoadState({
      loading: false,
      error: true,
      url: placeholderImage
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`border border-purple-500/70 rounded-lg overflow-hidden 
                  hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border-purple-300 
                  transition-all cursor-pointer transform hover:scale-[1.03] 
                  duration-300 ease-in-out bg-gray-900/50 backdrop-blur-sm 
                  animate-fade-in ${loadState.loading ? 'loading' : 'loaded'}`}
      onClick={onClick}
    >
      <div className="relative aspect-square group">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                        bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
        
        {/* Media rendering for video or image */}
        {isVideo ? (
          // Video media
          <video
            src={loadState.url}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setLoadState(prev => ({ ...prev, loading: false }))}
            onError={handleImageError}
            poster={placeholderImage}
            loading="lazy"
          />
        ) : (
          // Image media - Using EnhancedProgressiveImage for performance
          <div className="w-full h-full">
            <EnhancedProgressiveImage
              src={getNFTImageUrl({
                id: mint || displayName,
                name: displayName,
                image: image,
                __source: nft.__source || 'NFTCard'  // Pass through source context if available
              })}
              alt={displayName}
              placeholder={placeholderImage}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.05]"
              onLoad={() => setLoadState(prev => ({ ...prev, loading: false }))}
              onError={(e) => {
                // For staking context, use loading indicator instead of local preview
                // In staking context, don't use local fallbacks
                if (nft.__source?.includes('staking') || 
                    nft.__source?.includes('Staking') ||
                    nft.__source?.includes('Dashboard') ||
                    nft.__source?.includes('dashboard') ||
                    nft.__source?.includes('Leaderboard')) {
                  // Return an IPFS URL that will be handled by our component system
                  return `ipfs://placeholder/${Math.random().toString(36).substring(2, 10)}`;
                }
                // Try local preview if remote image fails (for non-staking contexts)
                const localPreview = getNftPreviewImage(displayName);
                return localPreview;
              }}
              __source={nft.__source || 'NFTCard'}  // Also pass source to EnhancedProgressiveImage
              lazyLoad={true}
              blur={true}
              highQuality={false}
            />
          </div>
        )}
        
        {/* EnhancedProgressiveImage handles loading internally */}
        
        {/* NFT info overlay with animated reveal */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4
                        transform translate-y-2 group-hover:translate-y-0 opacity-90 group-hover:opacity-100
                        transition-all duration-300 backdrop-blur-sm">
          <p className="text-white font-semibold truncate text-lg text-shadow-sm group-hover:text-transparent
                        group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300
                        transition-all duration-500">{displayName}</p>
          <div className="flex justify-between items-center mt-1">
            <p className={`text-sm font-medium transition-colors duration-300 ${
              tier.toLowerCase().includes('legendary') ? 'text-yellow-300 group-hover:text-yellow-200' :
              tier.toLowerCase().includes('epic') ? 'text-purple-300 group-hover:text-purple-200' :
              tier.toLowerCase().includes('rare') ? 'text-blue-300 group-hover:text-blue-200' :
              'text-green-300 group-hover:text-green-200'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse-slow ${
                tier.toLowerCase().includes('legendary') ? 'bg-yellow-400' :
                tier.toLowerCase().includes('epic') ? 'bg-purple-400' :
                tier.toLowerCase().includes('rare') ? 'bg-blue-400' :
                'bg-green-400'
              }`}></span>
              {tier}
            </p>
            {shortMint && (
              <p className="text-gray-400 text-xs font-mono group-hover:text-gray-300 transition-colors duration-300">
                {shortMint}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="p-3 bg-gradient-to-r from-gray-800/90 to-gray-900/90 flex justify-between items-center gap-2 backdrop-blur-sm">
          <button 
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 
                      hover:from-purple-500 hover:to-purple-600 text-white text-sm rounded-md flex-1
                      transition-all duration-300 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]
                      hover:scale-105 transform border border-purple-500/30 hover:border-purple-400/50"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              window.open(`https://solscan.io/token/${mint}?cluster=devnet`, '_blank');
            }}
          >
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View
            </span>
          </button>
          <button 
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 
                      hover:from-blue-500 hover:to-blue-600 text-white text-sm rounded-md flex-1
                      transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]
                      hover:scale-105 transform border border-blue-500/30 hover:border-blue-400/50"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              alert('Tweet sharing will be implemented here');
            }}
          >
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(NFTCard);