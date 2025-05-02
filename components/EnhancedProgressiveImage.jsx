"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";

// 함수를 컴포넌트 외부로 이동
const getDefaultPlaceholder = (text) => {
  // 간단한 색상 배경과 텍스트 생성
  const hash = text ? text.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0) : 0;
  const hue = hash % 360;
  const backgroundColor = `hsl(${hue}, 60%, 30%)`;
  const textColor = "white";
  
  // SVG 데이터 URL 사용
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='${encodeURIComponent(backgroundColor)}' /%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' text-anchor='middle' fill='${encodeURIComponent(textColor)}' dominant-baseline='middle'%3ESOLARA%3C/text%3E%3C/svg%3E`;
};

/**
 * Enhanced Progressive Image component with lazy loading and image transformation
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Image alt text
 * @param {string} placeholder - Low-res placeholder image URL (optional)
 * @param {string} ipfsGateway - Custom IPFS gateway (optional)
 * @param {number} quality - Image quality for resizing (optional)
 * @param {boolean} lazyLoad - Whether to lazy load the image (default: true)
 * @param {function} onLoad - Callback function when image loads
 * @param {function} onError - Callback function when image loading fails
 * @param {Object} props - Other image attributes
 */
export default function EnhancedProgressiveImage({
  src,
  alt,
  placeholder = "",
  ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io",
  quality = 90,
  lazyLoad = true,
  onLoad,
  onError,
  className = "",
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [actualSrc, setActualSrc] = useState(placeholder || getDefaultPlaceholder(alt));
  
  // Use intersection observer for lazy loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Start loading image when it's within 200px of viewport
  });
  // Add image size optimization parameters to URLs
 const optimizeImageUrl = (url, width = 400) => {
    if (!url) return url;
    if (url.includes('ipfs://')) {
      const ipfsUrl = `${ipfsGateway}/ipfs/${url.replace('ipfs://', '')}`;
      return `${ipfsUrl}?w=${width}&quality=80`;
    }
    return url;
  };
  // Process the image source URL - handle IPFS and apply resizing if needed
  const processImageUrl = useCallback((url) => {
    if (!url) return getDefaultPlaceholder(alt);
    
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      url = `${ipfsGateway}/ipfs/${url.replace('ipfs://', '')}`;
    }
    
    // Apply image optimization using a service like ImageKit, Cloudinary, etc.
    // This is a simplified example - in production, you'd integrate with an image CDN
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
      // Add quality parameter for JPG/PNG images
      // This is a placeholder - implement with your actual image optimization service
      if (url.includes('?')) {
        url = `${url}&quality=${quality}`;
      } else {
        url = `${url}?quality=${quality}`;
      }
    }
    
    return url;
  }, [alt, ipfsGateway, quality]);
  
  // Try alternative IPFS gateways if the main one fails
  const tryAlternativeGateways = useCallback(async (originalSrc) => {
    // List of fallback IPFS gateways
    const fallbackGateways = [
      "https://cloudflare-ipfs.com",
      "https://ipfs.infura.io",
      "https://dweb.link",
      "https://gateway.pinata.cloud"
    ];
    
    // Only try alternatives for IPFS URLs
    if (!originalSrc.includes('/ipfs/')) return null;
    
    // Extract the IPFS hash/path
    const ipfsPath = originalSrc.split('/ipfs/')[1];
    if (!ipfsPath) return null;
    
    // Try each gateway in sequence
    for (const gateway of fallbackGateways) {
      const gatewayUrl = `${gateway}/ipfs/${ipfsPath}`;
      try {
        // Check if image is accessible from this gateway
        const response = await fetch(gatewayUrl, { method: 'HEAD', timeout: 2000 });
        if (response.ok) {
          console.log(`Using alternative IPFS gateway: ${gateway}`);
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
  
  // Load the image when in view (if lazy loading is enabled)
  useEffect(() => {
    const loadImage = async () => {
      if (error || isLoaded || (lazyLoad && !inView)) return;
      
      const processedSrc = processImageUrl(src);
      
      // Load the actual image
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
  
  // Generate error state placeholder
  const getErrorPlaceholder = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
        <div className="text-center p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs">Image failed to load</p>
        </div>
      </div>
    );
  };

  return (
    <div ref={lazyLoad ? ref : null} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Main image */}
      <img
        src={actualSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Loading spinner */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && getErrorPlaceholder()}
    </div>
  );
}