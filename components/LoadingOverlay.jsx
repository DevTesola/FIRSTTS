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
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="relative w-24 h-24">
        {/* Outer spinning ring */}
        <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        
        {/* Middle spinning ring with delay */}
        <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent border-r-purple-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDelay: '150ms' }}></div>
        
        {/* Inner spinning ring with longer delay */}
        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-purple-300 border-l-transparent animate-spin" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      {/* Message container */}
      <div className="mt-6 bg-black bg-opacity-50 py-3 px-6 rounded-lg">
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}