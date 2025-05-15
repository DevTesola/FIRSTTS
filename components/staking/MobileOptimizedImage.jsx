"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { 
  processImageUrl, 
  createPlaceholder, 
  getOptimalImageSize, 
  isIPFSUrl
} from "../../utils/mediaUtils";

/**
 * Mobile-optimized image component for staking pages
 * Provides a more lightweight implementation specifically designed for mobile devices
 */
export default function MobileOptimizedImage({
  src,
  alt,
  className = "",
  quality = 60,
  lazyLoad = true,
  priority = false,
  ...props
}) {
  // Handle loading indicator special case
  if (src === "loading:indicator") {
    return (
      <div className={`relative overflow-hidden ${className}`} {...props}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Generate placeholder
  const placeholder = useMemo(() => createPlaceholder(alt || "NFT", null, { 
    gradient: true, 
    blur: true 
  }), [alt]);
  
  // Simple loading state tracking
  const [imgState, setImgState] = useState({
    loading: true,
    error: false,
    src: placeholder
  });

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  
  // Optimized intersection observer config
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: !lazyLoad,
    rootMargin: '150px 0px',
    threshold: 0.01
  });
  
  // Merge refs
  const setRefs = useCallback(node => {
    if (node !== null) {
      containerRef.current = node;
      inViewRef(node);
    }
  }, [inViewRef]);
  
  // Simplified image loading logic for mobile
  useEffect(() => {
    if (!src || (lazyLoad && !inView && !priority)) return;
    
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        const containerWidth = containerRef.current?.clientWidth || 300;
        const isIpfs = isIPFSUrl(src);
        
        // IPFS URL handling
        let processedSrc = src;
        if (isIpfs) {
          const hashAndPath = src.replace('ipfs://', '');
          processedSrc = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
          
          // Add cache busting for staking related images
          if (props._cacheBust || props.__source?.includes('staking')) {
            const cacheBuster = `?_cb=${props._cacheBust || Date.now()}`;
            processedSrc += cacheBuster;
          }
        }
        
        // Mobile-optimized size and quality
        const imageUrl = processImageUrl(processedSrc, { 
          width: getOptimalImageSize(containerWidth, { 
            screenType: 'mobile',
            isHighQuality: false
          }),
          quality: quality,
          optimizeFormat: true,
          preferRemote: true
        });
        
        imgRef.current = new Image();
        
        imgRef.current.onload = () => {
          if (!isMounted) return;
          
          setImgState({
            loading: false,
            error: false,
            src: imageUrl
          });
          
          if (props.onLoad) props.onLoad();
        };
        
        imgRef.current.onerror = () => {
          if (!isMounted) return;
          
          setImgState({
            loading: false,
            error: true,
            src: placeholder
          });
          
          if (props.onError) props.onError();
        };
        
        imgRef.current.src = imageUrl;
      } catch (err) {
        if (!isMounted) return;
        
        setImgState({
          loading: false,
          error: true,
          src: placeholder
        });
        
        if (props.onError) props.onError();
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
        imgRef.current.src = '';
        imgRef.current = null;
      }
    };
  }, [src, inView, lazyLoad, priority, quality, placeholder, props]);
  
  // Simplified loading indicator for mobile
  const LoadingIndicator = useMemo(() => {
    if (!imgState.loading) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }, [imgState.loading]);
  
  // Simplified error overlay for mobile
  const ErrorOverlay = useMemo(() => {
    if (!imgState.error) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }, [imgState.error]);
  
  return (
    <div 
      ref={setRefs} 
      className={`relative overflow-hidden ${className}`} 
      {...props}
    >
      <img
        src={imgState.src}
        alt={alt || "Image"}
        className={`w-full h-full object-cover transition-opacity duration-200
                    ${imgState.loading ? 'opacity-0' : 'opacity-100'}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      
      {LoadingIndicator}
      {ErrorOverlay}
    </div>
  );
}