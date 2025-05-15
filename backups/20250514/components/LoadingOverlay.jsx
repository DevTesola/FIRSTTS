"use client";

import React from "react";

/**
 * LoadingOverlay Component
 * Displays a full-screen overlay with animated spinner while processing
 * 
 * @param {string} message - Message to display during loading
 * @returns {JSX.Element} LoadingOverlay component
 */
/**
 * LoadingOverlay Component
 * Enhanced version with progress indication capabilities
 *
 * @param {string} message - Main message to display
 * @param {string} [subMessage] - Optional smaller text under main message
 * @param {number} [progress] - Optional progress percentage (0-100)
 * @param {string} [type] - Type of loading (default, stake, unstake, mint)
 * @param {boolean} [isTransparent] - Whether to use a more transparent background
 * @returns {JSX.Element} LoadingOverlay component
 */
export default function LoadingOverlay({ 
  message = "Processing...", 
  subMessage = "", 
  progress = null,
  type = "default",
  isTransparent = false 
}) {
  // Generate random ID for gradient animation
  const gradientId = React.useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Define animation based on type
  const getTypeSpecificStyles = () => {
    switch (type) {
      case "stake":
        return {
          primaryColor: "purple",
          secondaryColor: "pink",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          )
        };
      case "unstake":
        return {
          primaryColor: "blue",
          secondaryColor: "indigo",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )
        };
      case "mint":
        return {
          primaryColor: "emerald",
          secondaryColor: "teal",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
          )
        };
      default:
        return {
          primaryColor: "purple",
          secondaryColor: "pink",
          icon: null
        };
    }
  };
  
  const { primaryColor, secondaryColor, icon } = getTypeSpecificStyles();
  
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50 modal-overlay animate-fade-in" 
      style={{ 
        backgroundColor: isTransparent ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.90)', 
        backdropFilter: 'blur(8px)' 
      }}
    >
      <div className="relative w-28 h-28">
        {/* Particle effects */}
        <div className={`absolute -top-8 -left-8 w-12 h-12 bg-${primaryColor}-600/30 rounded-full blur-xl animate-pulse-slow`}></div>
        <div className={`absolute -bottom-10 -right-6 w-16 h-16 bg-${secondaryColor}-600/30 rounded-full blur-xl animate-pulse-slow animation-delay-1000`}></div>
        
        {/* Outer spinning ring with glow */}
        <div className={`absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-${primaryColor}-500 border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]`}></div>
        
        {/* Middle spinning ring with delay and glow */}
        <div className={`absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent border-r-${secondaryColor}-400 border-b-transparent border-l-transparent animate-spin shadow-[0_0_10px_rgba(236,72,153,0.5)]`} style={{ animationDelay: '150ms' }}></div>
        
        {/* Inner spinning ring with longer delay and glow */}
        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-400 border-l-transparent animate-spin shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ animationDelay: '300ms' }}></div>
        
        {/* Central icon or pulsing dot */}
        {icon ? (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center animate-bounce-pulse">
            {icon}
          </div>
        ) : (
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-${primaryColor}-500 to-${secondaryColor}-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-bounce-pulse`}></div>
        )}
      </div>
      
      {/* Message container with animation */}
      <div className="mt-8 bg-gray-900/70 py-4 px-8 rounded-xl border border-purple-500/30 shadow-lg animate-fade-up text-center" style={{ animationDelay: '300ms' }}>
        <p className="text-transparent bg-clip-text text-lg font-medium animate-pulse-slow" 
           style={{ 
             backgroundImage: `linear-gradient(90deg, #a855f7, #ec4899, #a855f7)`,
             backgroundSize: '200% 100%',
             animation: 'gradient-x 3s ease infinite'
           }}>
          {message}
        </p>
        
        {subMessage && (
          <p className="text-gray-400 text-sm mt-1">{subMessage}</p>
        )}
        
        {/* Progress bar */}
        {progress !== null && (
          <div className="mt-3 w-full">
            <div className="bg-gray-800 h-1.5 rounded-full w-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
              ></div>
            </div>
            <p className="text-gray-400 text-xs mt-1">{progress}% complete</p>
          </div>
        )}
      </div>
      
      {/* Progress dots */}
      <div className="mt-4 flex space-x-2">
        <div className={`w-2 h-2 rounded-full bg-${primaryColor}-500 animate-bounce-pulse`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 rounded-full bg-${secondaryColor}-500 animate-bounce-pulse`} style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce-pulse" style={{ animationDelay: '400ms' }}></div>
      </div>
      
      {/* Gradient animation styles */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}