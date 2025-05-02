"use client";

import React from "react";

/**
 * LoadingOverlay Component
 * Displays a full-screen overlay with animated spinner while processing
 * 
 * @param {string} message - Message to display during loading
 * @returns {JSX.Element} LoadingOverlay component
 */
export default function LoadingOverlay({ message = "Processing..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-28 h-28">
        {/* Particle effects */}
        <div className="absolute -top-8 -left-8 w-12 h-12 bg-purple-600/30 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute -bottom-10 -right-6 w-16 h-16 bg-pink-600/30 rounded-full blur-xl animate-pulse-slow animation-delay-1000"></div>
        
        {/* Outer spinning ring with glow */}
        <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
        
        {/* Middle spinning ring with delay and glow */}
        <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent border-r-pink-400 border-b-transparent border-l-transparent animate-spin shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ animationDelay: '150ms' }}></div>
        
        {/* Inner spinning ring with longer delay and glow */}
        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-400 border-l-transparent animate-spin shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ animationDelay: '300ms' }}></div>
        
        {/* Central pulsing dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-bounce-pulse"></div>
      </div>
      
      {/* Message container with animation */}
      <div className="mt-8 bg-gray-900/70 py-4 px-8 rounded-xl border border-purple-500/30 shadow-lg animate-fade-up" style={{ animationDelay: '300ms' }}>
        <p className="text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-lg font-medium animate-pulse-slow">{message}</p>
      </div>
      
      {/* Progress dots */}
      <div className="mt-4 flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce-pulse" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
}