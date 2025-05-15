"use client";

import React from "react";

export function NFTCardSkeleton() {
  return (
    <div className="border border-purple-500/30 rounded-lg overflow-hidden shadow-md transition-all 
                    backdrop-blur-sm relative bg-gray-900/40">
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                      animate-shimmer overflow-hidden"></div>
                      
      {/* Animated loading gradient in the NFT image area */}
      <div className="aspect-square w-full bg-gradient-to-br from-gray-800 to-gray-900 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-t-purple-500/40 border-r-transparent 
                        border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute top-1 left-1 right-1 bottom-1 rounded-full border-4 border-t-transparent 
                        border-r-pink-500/40 border-b-transparent border-l-transparent animate-spin" 
               style={{ animationDelay: '150ms', animationDirection: 'reverse' }}></div>
        </div>
        
        {/* Random glowing dots for visual interest */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse-slow"></div>
        <div className="absolute top-3/4 left-2/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/3 left-3/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse-slow animation-delay-2000"></div>
      </div>
      
      {/* Content skeleton with shimmer effect */}
      <div className="p-4 space-y-3 bg-gradient-to-r from-gray-900/70 to-gray-800/70">
        <div className="h-5 bg-gradient-to-r from-gray-700 to-gray-800 rounded-md w-3/4 animate-pulse-slow"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gradient-to-r from-purple-800/50 to-purple-700/50 rounded-md w-1/3 animate-pulse-slow"></div>
          <div className="h-3 bg-gray-700 rounded-md w-1/4 animate-pulse-slow animation-delay-1000"></div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 text-purple-300 font-mono 
                   text-sm md:text-base rounded-lg px-4 py-3 shadow-md backdrop-blur-sm 
                   border border-purple-500/20 relative overflow-hidden">
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                      animate-shimmer overflow-hidden"></div>
                      
      <div className="flex items-center gap-3">
        {/* Wallet icon placeholder */}
        <div className="w-8 h-8 bg-gradient-to-br from-purple-700/50 to-purple-900/50 rounded-full 
                       flex items-center justify-center animate-pulse-slow">
          <div className="w-4 h-4 border-2 border-purple-400/60 rounded-full"></div>
        </div>
        
        {/* Address content */}
        <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-md w-48 animate-pulse-slow"></div>
        
        {/* Connection indicator */}
        <div className="ml-auto flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-600 animate-pulse-slow"></div>
          <div className="h-3 bg-gray-700 rounded w-12 ml-2 animate-pulse-slow"></div>
        </div>
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <tr className="animate-fade-in relative hover:bg-gray-700/30 transition-colors duration-200">
      {/* Shimmer effect across the entire row */}
      <td className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      </td>
      
      {/* Date column */}
      <td className="px-4 py-3 whitespace-nowrap relative">
        <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-md w-24 animate-pulse-slow"></div>
      </td>
      
      {/* Transaction ID column */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 rounded-full bg-gradient-to-br from-purple-800/40 to-purple-900/40 
                         flex items-center justify-center animate-pulse-slow">
            <div className="w-3 h-3 border border-purple-500/50 rounded-sm transform rotate-45"></div>
          </div>
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-md w-32 animate-pulse-slow"></div>
        </div>
      </td>
      
      {/* Status column */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-6 bg-gradient-to-r from-gray-700/80 to-gray-800/80 rounded-full w-20 
                       animate-pulse-slow border border-gray-600/20"></div>
      </td>
      
      {/* Rewards column */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="h-5 bg-gradient-to-r from-purple-800/30 to-purple-700/30 
                       rounded-md w-16 animate-pulse-slow"></div>
      </td>
      
      {/* Action buttons column */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex space-x-2">
          <div className="h-7 bg-gradient-to-r from-purple-700/50 to-purple-800/50 
                         rounded-md w-16 animate-pulse-slow shadow-sm"></div>
          <div className="h-7 bg-gradient-to-r from-blue-700/50 to-blue-800/50 
                         rounded-md w-16 animate-pulse-slow shadow-sm animation-delay-1000"></div>
          <div className="h-7 bg-gradient-to-r from-gray-700/80 to-gray-800/80 
                         rounded-md w-16 animate-pulse-slow shadow-sm animation-delay-2000"></div>
        </div>
      </td>
    </tr>
  );
}

export default function LoadingSkeleton({ type = "nft", count = 3 }) {
  // 스켈레톤 배열 생성 with staggered animation
  const skeletons = Array(count).fill(null);

  if (type === "nft") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((_, index) => (
          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
            <NFTCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (type === "transaction") {
    return (
      <table className="min-w-full bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-lg overflow-hidden 
                        shadow-lg border border-purple-900/30 backdrop-blur-sm">
        <thead className="bg-gradient-to-r from-purple-900/90 to-purple-800/90">
          <tr className="animate-fade-in">
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Transaction</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Rewards</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {skeletons.map((_, index) => (
            <div key={index} className="contents" style={{ animationDelay: `${index * 150}ms` }}>
              <TransactionSkeleton />
            </div>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "profile") {
    return <ProfileSkeleton />;
  }

  // Default loading animation if no type matches
  return (
    <div className="w-full flex flex-col items-center justify-center py-10">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-purple-500 
                       border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent 
                       border-r-pink-400 border-b-transparent border-l-transparent animate-spin" 
             style={{ animationDelay: '150ms' }}></div>
        <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent 
                       border-r-transparent border-b-blue-400 border-l-transparent animate-spin" 
             style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="mt-4 text-gray-400 animate-pulse-slow">Loading content...</p>
    </div>
  );
}