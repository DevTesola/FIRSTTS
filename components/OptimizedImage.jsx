"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";

// Default IPFS gateway
const DEFAULT_IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io";
const CUSTOM_IPFS_GATEWAY = process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || "https://tesola.mypinata.cloud";

// Fallback IPFS gateways
const FALLBACK_GATEWAYS = [
  "https://cloudflare-ipfs.com",
  "https://dweb.link",
  "https://gateway.pinata.cloud"
];

// Known IPFS gateway patterns to replace
const KNOWN_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/', 
  'https://dweb.link/ipfs/'
];

/**
 * Generate a placeholder image based on text
 * @param {string} text - Text to generate placeholder from
 * @param {boolean} isNFT - Whether this is an NFT placeholder
 * @returns {string} Data URL for placeholder SVG
 */
const getPlaceholder = (text, isNFT = false) => {
  // Generate consistent color based on text hash
  const hash = text ? text.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0) : 0;
  const hue = hash % 360;
  const backgroundColor = `hsl(${hue}, 60%, 30%)`;
  
  // Text to display in placeholder
  const displayText = isNFT ? `SOLARA ${text}` : "SOLARA";
  
  // SVG data URL for consistent cross-origin support
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='${encodeURIComponent(backgroundColor)}' /%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' text-anchor='middle' fill='white' dominant-baseline='middle'%3E${encodeURIComponent(displayText)}%3C/text%3E%3C/svg%3E`;
};

/**
 * Optimized image component with progressive loading, IPFS support, and fallback mechanisms
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Image alt text
 * @param {string} placeholder - Optional placeholder image URL
 * @param {string} ipfsGateway - Custom IPFS gateway
 * @param {number} quality - Image quality (0-100)
 * @param {boolean} lazyLoad - Whether to lazy load image
 * @param {boolean} useCustomGateway - Whether to use project's custom gateway
 * @param {function} onLoad - Callback when image loads
 * @param {function} onError - Callback when image fails to load
 * @param {string} className - Additional CSS classes
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
export default function OptimizedImage({
  src,
  alt,
  placeholder = "",
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
  quality = 90,
  lazyLoad = true,
  useCustomGateway = false,
  onLoad,
  onError,
  className = "",
  width,
  height,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Extract NFT ID from src for placeholder generation
  const nftId = src ? src.split('/').pop()?.split('.')[0] || alt : alt;
  const defaultPlaceholder = getPlaceholder(nftId, true);
  
  const [actualSrc, setActualSrc] = useState(placeholder || defaultPlaceholder);
  
  // Use intersection observer for lazy loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Start loading when within 200px of viewport
  });

  // Process image URL to use appropriate gateway
  const processImageUrl = useCallback((url) => {
    if (!url) return "";
    
    const gateway = useCustomGateway ? CUSTOM_IPFS_GATEWAY : ipfsGateway;
    
    // Handle IPFS protocol URLs
    if (url.startsWith('ipfs://')) {
      return `${gateway}/ipfs/${url.replace('ipfs://', '')}`;
    }
    
    // Replace any known gateways with the configured one
    for (const knownGateway of KNOWN_GATEWAYS) {
      if (url.includes(knownGateway)) {
        const cid = url.split(knownGateway)[1];
        return `${gateway}/ipfs/${cid}`;
      }
    }
    
    // Add quality parameter for JPG/PNG images when needed
    if ((url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) && quality < 100) {
      url = url.includes('?') ? `${url}&quality=${quality}` : `${url}?quality=${quality}`;
    }
    
    return url;
  }, [ipfsGateway, quality, useCustomGateway]);
  
  // Try alternative IPFS gateways if the main one fails
  const tryAlternativeGateways = useCallback(async (originalSrc) => {
    // Only try alternatives for IPFS URLs
    if (!originalSrc.includes('/ipfs/')) return null;
    
    // Extract the IPFS hash/path
    const ipfsPath = originalSrc.split('/ipfs/')[1];
    if (!ipfsPath) return null;
    
    // Try each gateway in sequence
    for (const gateway of FALLBACK_GATEWAYS) {
      const gatewayUrl = `${gateway}/ipfs/${ipfsPath}`;
      try {
        // Check if image is accessible from this gateway
        const response = await fetch(gatewayUrl, { method: 'HEAD' });
        if (response.ok) {
          return gatewayUrl;
        }
      } catch (e) {
        // Continue to next gateway on failure
        continue;
      }
    }
    
    // All gateways failed
    return null;
  }, []);
  
  // Load the image when appropriate
  useEffect(() => {
    const loadImage = async () => {
      if (error || isLoaded || (lazyLoad && !inView)) return;
      
      const processedSrc = processImageUrl(src);
      
      // Create image element to load the real image
      const img = new Image();
      img.src = processedSrc;
      
      img.onload = () => {
        setActualSrc(processedSrc);
        setIsLoaded(true);
        if (onLoad) onLoad();
      };
      
      img.onerror = async () => {
        // Try alternative gateways for IPFS content
        const alternativeSrc = await tryAlternativeGateways(processedSrc);
        
        if (alternativeSrc) {
          // Try the alternative source
          const altImg = new Image();
          altImg.src = alternativeSrc;
          
          altImg.onload = () => {
            setActualSrc(alternativeSrc);
            setIsLoaded(true);
            if (onLoad) onLoad();
          };
          
          altImg.onerror = () => {
            setError(true);
            if (onError) onError();
          };
        } else {
          setError(true);
          if (onError) onError();
        }
      };
    };
    
    loadImage();
  }, [src, inView, lazyLoad, error, isLoaded, processImageUrl, tryAlternativeGateways, onLoad, onError]);
  
  // Calculate aspect ratio for container
  const aspectRatio = width && height ? `${width} / ${height}` : "1 / 1";
  
  // Container style with aspect ratio to prevent layout shift
  const containerStyle = {
    position: 'relative',
    aspectRatio: aspectRatio,
    overflow: 'hidden',
    ...props.style
  };
  
  // Error state component
  const renderErrorState = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="text-center p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-white">Unable to load image</p>
      </div>
    </div>
  );

  // Render the component
  return (
    <div 
      ref={lazyLoad ? ref : null} 
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
      {...props}
    >
      {/* Main image with smooth transition */}
      <img
        src={actualSrc}
        alt={alt || "Image"}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-60'}`}
      />
      
      {/* Loading spinner */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state overlay */}
      {error && renderErrorState()}
    </div>
  );
}