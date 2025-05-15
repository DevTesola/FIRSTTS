"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import EnhancedProgressiveImage from "./EnhancedProgressiveImage";

// Dynamically import the mobile-optimized component to reduce bundle size
const MobileOptimizedImage = dynamic(
  () => import("./staking/MobileOptimizedImage"),
  { 
    ssr: false,
    loading: ({ className, ...props }) => (
      <div className={`bg-gradient-to-r from-purple-900/10 to-blue-900/10 ${className}`} {...props} />
    )
  }
);

/**
 * ResponsiveImageLoader - Automatically selects between desktop and mobile optimized image components
 * Uses mobile-optimized version for small screens and full featured version for larger screens
 */
export default function ResponsiveImageLoader({
  src,
  alt,
  priority = false,
  className = "",
  forceMobile = false,
  forceDesktop = false,
  ...props
}) {
  // Determine if we should use the mobile version based on screen size
  const isMobile = useMemo(() => {
    if (forceDesktop) return false;
    if (forceMobile) return true;
    
    // Only run in browser context
    if (typeof window === 'undefined') return false;
    
    // Use mobile version for screens smaller than 640px
    return window.innerWidth <= 640;
  }, [forceMobile, forceDesktop]);
  
  // Use mobile component for small screens, full component for larger screens
  if (isMobile) {
    return (
      <MobileOptimizedImage
        src={src}
        alt={alt}
        className={className}
        priority={priority}
        {...props}
      />
    );
  }
  
  // Use full-featured component for desktop
  return (
    <EnhancedProgressiveImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      {...props}
    />
  );
}