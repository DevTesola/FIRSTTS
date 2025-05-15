"use client";

import React from 'react';

const FallbackLoading = ({ message = "Loading application..." }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black">
      <div className="relative w-24 h-24 mb-8">
        {/* Animated spinner rings */}
        <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 
                       border-t-purple-500 border-r-transparent border-b-transparent 
                       border-l-transparent animate-spin"></div>
        <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 
                       border-t-transparent border-r-purple-400 border-b-transparent 
                       border-l-transparent animate-spin" 
             style={{ animationDelay: '150ms', animationDirection: 'reverse' }}></div>
        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 
                       border-t-transparent border-r-transparent border-b-purple-300 
                       border-l-transparent animate-spin" 
             style={{ animationDelay: '300ms' }}></div>
             
        {/* Pulsing center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full 
                       shadow-[0_0_15px_rgba(168,85,247,0.7)] animate-pulse"></div>
      </div>
      
      {/* Message */}
      <div className="text-center px-4">
        <p className="text-xl text-white font-medium mb-2">{message}</p>
        <p className="text-sm text-gray-400">Please wait while we initialize components...</p>
      </div>
      
      {/* Loading dots */}
      <div className="mt-6 flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" 
             style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" 
             style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" 
             style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
};

export default FallbackLoading;