"use client";

import React, { useState, useEffect } from "react";
import { processImageUrl, createPlaceholder } from "../utils/mediaUtils";

/**
 * Progressive loading image component with custom IPFS gateway
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Image alt text
 * @param {string} placeholder - Low-res placeholder image URL (optional)
 * @param {function} onLoad - Callback function when image loading completes (optional)
 * @param {function} onError - Callback function when image loading fails (optional)
 * @param {Object} props - Other image attributes
 */
export default function ProgressiveImage({
  src,
  alt,
  placeholder = "",
  onLoad,
  onError,
  className = "",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Reset state when src changes
    setIsLoading(true);
    setError(false);

    console.log('ProgressiveImage - Loading image:', src);
    
    // Process source URL with custom gateway
    const processedSrc = processImageUrl(src);
    console.log('ProgressiveImage - Processed URL:', processedSrc);
    
    // Create a placeholder if not provided
    const fallbackSrc = placeholder || createPlaceholder(alt || "SOLARA");
    
    // Use placeholder while loading
    setImgSrc(fallbackSrc);
    
    // Load the image with better error handling
    const img = new Image();
    
    img.onload = () => {
      console.log('ProgressiveImage - Successfully loaded:', processedSrc);
      setImgSrc(processedSrc);
      setIsLoading(false);
      if (onLoad) onLoad();
    };
    
    img.onerror = (e) => {
      console.error(`ProgressiveImage - Failed to load image: ${processedSrc}`, e);
      
      // Try direct URL as fallback if different
      if (processedSrc !== src) {
        console.log('ProgressiveImage - Trying original URL as fallback:', src);
        const directImg = new Image();
        
        directImg.onload = () => {
          console.log('ProgressiveImage - Fallback successful:', src);
          setImgSrc(src);
          setIsLoading(false);
          if (onLoad) onLoad();
        };
        
        directImg.onerror = () => {
          console.error('ProgressiveImage - Fallback also failed:', src);
          setError(true);
          setIsLoading(false);
          if (onError) onError();
        };
        
        directImg.src = src;
      } else {
        setError(true);
        setIsLoading(false);
        if (onError) onError();
      }
    };
    
    img.src = processedSrc;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder, alt, onLoad, onError]);

  // Error fallback
  if (error) {
    return (
      <div className={`relative overflow-hidden ${className}`} {...props}>
        <img
          src={createPlaceholder(alt || "Image unavailable")}
          alt={alt || "Image unavailable"}
          className={`${className} w-full h-full object-cover`}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-white">Unable to load image</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} w-full h-full object-cover ${isLoading ? 'opacity-60' : 'opacity-100'} transition-opacity duration-300`}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}