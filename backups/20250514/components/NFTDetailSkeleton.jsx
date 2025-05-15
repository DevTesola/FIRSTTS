"use client";

import React from "react";

export default function NFTDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-pulse">
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30">
        <div className="p-6 md:p-8">
          <div className="h-12 bg-gray-800 rounded-lg w-3/4 mb-8"></div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image placeholder */}
            <div className="md:w-1/2">
              <div className="aspect-square w-full bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg border-2 border-purple-500"></div>
            </div>
            
            {/* Details placeholder */}
            <div className="md:w-1/2">
              {/* Properties */}
              <div className="mb-6">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-purple-900/30 rounded p-2 text-center">
                      <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
                      <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Description placeholder */}
              <div className="mb-6">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
              </div>
              
              {/* Links placeholder */}
              <div className="mb-6">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions placeholder */}
          <div className="mt-8 border-t border-gray-700 pt-6">
            <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
              <div className="h-5 bg-gray-800 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-full"></div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="h-10 bg-gray-800 rounded w-32"></div>
              <div className="h-10 bg-gray-800 rounded w-32"></div>
              <div className="h-10 bg-gray-800 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}