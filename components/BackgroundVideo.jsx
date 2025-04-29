"use client";

import React, { useEffect, useRef, useState } from "react";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    // Video loading state handlers
    const handleCanPlay = () => {
      setIsLoaded(true);
      
      // Try to play the video automatically
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silent error handling - no console logs
          });
        }
      } catch (error) {
        // Silent error handling - no console logs
      }
    };
    
    const handleError = () => {
      setHasError(true);
    };
    
    // Register event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // Check if the video has already loaded metadata
    if (video.readyState >= 3) {
      handleCanPlay();
    }
    
    // Cleanup function
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.pause();
    };
  }, []);

  return (
    <>
   <video
  ref={videoRef}
  className={`absolute inset-0 w-full h-full object-cover -z-30 ${isLoaded ? 'opacity-60' : 'opacity-0'} transition-opacity duration-1000`}
  src="/space.mp4"
  autoPlay={true}
  muted={true}
  loop={true}
  playsInline={true}
  preload="auto"
/>
      
      {/* Fallback background - only shown when video fails to load */}
      {hasError && (
        <div 
          className="absolute inset-0 -z-25 bg-gradient-to-b from-purple-900/30 to-black"
        ></div>
      )}
    </>
  );
}