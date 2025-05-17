import React, { useState, useEffect, useRef } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Optimized video component with fallback and quality selection
 */
export default function VideoOptimizer({ 
  src, 
  lowQualitySrc,
  poster,
  className = '',
  autoPlay = false,
  muted = true,
  loop = true,
  controls = true,
  onLoadStart,
  onLoadedData,
  onClick,
  priority = false,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quality, setQuality] = useState('high');
  const [connectionSpeed, setConnectionSpeed] = useState('fast');
  const videoRef = useRef(null);
  
  // Detect connection speed on mount
  useEffect(() => {
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        // Set quality based on connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setConnectionSpeed('slow');
          setQuality('low');
        } else if (effectiveType === '3g') {
          setConnectionSpeed('medium');
          setQuality('low');
        } else {
          setConnectionSpeed('fast');
          setQuality('high');
        }
      }
    };
    
    checkConnectionSpeed();
    
    // Listen for connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', checkConnectionSpeed);
      return () => {
        navigator.connection.removeEventListener('change', checkConnectionSpeed);
      };
    }
  }, []);
  
  const videoSrc = quality === 'high' ? src : (lowQualitySrc || src);
  
  
  const handleLoadStart = () => {
    setLoading(true);
    if (onLoadStart) onLoadStart();
  };
  
  const handleLoadedData = () => {
    setLoading(false);
    setError(false);
    if (onLoadedData) onLoadedData();
  };
  
  const handleError = () => {
    setError(true);
    setLoading(false);
    
    // Try fallback quality if high quality fails
    if (quality === 'high' && lowQualitySrc) {
      setQuality('low');
    }
  };
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
  };
  
  // Quality toggle button for manual control
  const renderQualityToggle = () => {
    if (!lowQualitySrc || error) return null;
    
    return (
      <button
        className="absolute top-2 left-2 bg-black/70 text-white rounded px-2 py-1 text-xs font-medium z-10 hover:bg-black/80 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          setQuality(quality === 'high' ? 'low' : 'high');
        }}
      >
        {quality === 'high' ? 'HD' : 'SD'}
      </button>
    );
  };
  
  return (
    <div className={`relative ${className}`} onClick={handleClick}>
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800">
          <LoadingSkeleton height="100%" width="100%" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/80 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <span className="text-white text-sm">Loading video...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white">Failed to load video</p>
            <button 
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              onClick={() => {
                setError(false);
                setLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {renderQualityToggle()}
      
      {connectionSpeed !== 'fast' && (
        <div className="absolute top-2 right-2 bg-yellow-600/80 text-white rounded px-2 py-1 text-xs font-medium z-10">
          {connectionSpeed === 'slow' ? '🐌 Slow Connection' : '⚡ Limited Bandwidth'}
        </div>
      )}
      
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${error ? 'hidden' : ''}`}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload={priority ? 'auto' : 'metadata'}
        playsInline
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}