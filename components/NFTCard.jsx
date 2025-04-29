"use client";

import React, { useState } from "react";
import ProgressiveImage from "./ProgressiveImage";

/**
 * NFT card component
 * 
 * @param {Object} nft - NFT data object
 * @param {function} onClick - Click event handler
 * @param {boolean} showActions - Show action buttons (optional)
 */
export default function NFTCard({ nft, onClick, showActions = false }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  return (
    <div 
      className={`border border-purple-500 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 bg-gray-900/50 ${isImageLoaded ? 'loaded' : 'loading'}`}
      onClick={onClick}
    >
      <div className="relative aspect-square">
        <ProgressiveImage 
          src={image} 
          alt={displayName}
          className="w-full h-full object-cover"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageLoaded(true)}
          placeholder="/placeholder-nft.jpg" // Low-res placeholder image (add if needed)
        />
        
        {/* NFT info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <p className="text-white font-semibold truncate">{displayName}</p>
          <div className="flex justify-between items-center">
            <p className="text-purple-300 text-sm">{tier}</p>
            {shortMint && <p className="text-gray-400 text-xs font-mono">{shortMint}</p>}
          </div>
        </div>
      </div>
      
      {/* Action buttons (conditional rendering) */}
      {showActions && (
        <div className="p-3 bg-gray-800 flex justify-between items-center gap-2">
          <button 
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md flex-1"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              window.open(`https://solscan.io/token/${mint}?cluster=devnet`, '_blank');
            }}
          >
            View
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex-1"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              // Implement tweet sharing (using existing logic)
              alert('Tweet sharing will be implemented here');
            }}
          >
            Share
          </button>
        </div>
      )}
    </div>
  );
}