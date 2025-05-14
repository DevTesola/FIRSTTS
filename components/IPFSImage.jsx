"use client";

import React, { useState, useRef, useEffect } from "react";
import { processImageUrl, createPlaceholder } from "../utils/mediaUtils";

/**
 * Simple image component optimized for IPFS loading
 * Uses personal gateway from environment variable for all IPFS images
 * Enhanced with staking context detection for using loading indicators
 */
export default function IPFSImage({ 
  src, 
  alt = "", 
  className = "", 
  width = "auto", 
  height = "auto", 
  onLoad, 
  onError,
  __source, // Source component for context awareness
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadingIndicator, setLoadingIndicator] = useState(false);
  const imageRef = useRef(null);
  
  // Extract ID for placeholder
  const idMatch = alt?.match(/#(\d+)/);
  const id = idMatch ? idMatch[1] : '';
  
  // Detect if being used in staking context
  const isStakingContext = __source && (
    __source.includes('staking') || 
    __source.includes('Staking') || 
    __source.includes('stake') || 
    __source.includes('Stake') ||
    __source.includes('dashboard') || 
    __source.includes('Dashboard') ||
    __source.includes('leaderboard') || 
    __source.includes('Leaderboard')
  );
  
  // Generate placeholder - use loading indicator for staking contexts
  const placeholder = createPlaceholder(alt || `Image${id ? ` #${id}` : ''}`);
  
  // Use separate state for loading indicator in staking contexts
  const [useLoadingIndicator, setUseLoadingIndicator] = useState(isStakingContext);
  
  // Set loading indicator based on context and props
  useEffect(() => {
    // In staking context, use loading indicator
    if (isStakingContext) {
      setLoadingIndicator(true);
    }
  }, [isStakingContext]);
  
  // Handle special loading indicator cases
  useEffect(() => {
    // Special case: source is explicitly set to "loading:indicator"
    if (src === "loading:indicator") {
      setLoadingIndicator(true);
      // Don't try to load actual image
      return;
    }
    
    // Process the source URL to ensure it uses the personal gateway
    const processedSrc = src ? processImageUrl(src, { __source }) : placeholder;
    
    // Set the processed source on the image element if we have a real image ref
    if (imageRef.current && !loadingIndicator) {
      imageRef.current.src = processedSrc;
    }
  }, [src, placeholder, __source, loadingIndicator]);
  
  // Process the source URL to ensure it uses the personal gateway
  const processedSrc = src && src !== "loading:indicator" ? 
    processImageUrl(src, { __source }) : placeholder;

  // Handle image load
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Handle image error with one retry attempt
  const handleError = (e) => {
    // If in staking context, always use loading indicator on errors
    if (isStakingContext) {
      setHasError(true);
      setLoadingIndicator(true);
      if (onError) onError(e);
      return;
    }
    
    if (!e.target.dataset.retryAttempted) {
      // Try once more with a fresh cache buster
      e.target.dataset.retryAttempted = 'true';
      
      // Create a completely new URL with a different timestamp
      const freshUrl = `${processedSrc?.split('?')[0]}?_fresh=${Date.now()}`;
      e.target.src = freshUrl;
    } else {
      // If retry failed, show placeholder
      setHasError(true);
      if (onError) onError(e);
    }
  };

  // If using loading indicator instead of actual image
  if (loadingIndicator) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
        <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder shown during loading or on error */}
      {(!isLoaded || hasError) && !loadingIndicator && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <img 
            src={placeholder} 
            alt={alt} 
            className="w-full h-full object-cover"
          />
          
          {/* Loading spinner */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Main image */}
      {processedSrc && !loadingIndicator && (
        <img
          ref={imageRef}
          src={processedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}