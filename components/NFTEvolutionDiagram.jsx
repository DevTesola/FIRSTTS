import React from 'react';

const NFTEvolutionDiagram = () => {
  return (
    <div className="w-full mb-8">
      <div className="bg-gradient-to-br from-orange-900/20 to-pink-900/20 rounded-2xl p-6 border border-orange-500/30">
        <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">NFT Evolution System</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          {/* Base NFT */}
          <div className="relative group">
            <div className="w-24 h-24 bg-gray-800 rounded-xl border-2 border-gray-600 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
              <span className="text-3xl z-10">🎭</span>
            </div>
            <p className="text-xs text-gray-300 text-center mt-2">Base NFT</p>
          </div>
          
          {/* Evolution Arrow */}
          <div className="transform rotate-90 md:rotate-0">
            <svg className="w-12 h-12 text-orange-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </div>
          
          {/* Evolved NFT */}
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-pink-600 rounded-xl border-2 border-orange-400 flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-400/30 animate-pulse"></div>
              <span className="text-3xl z-10">👑</span>
            </div>
            <p className="text-xs text-orange-300 text-center mt-2 font-bold">Evolved NFT</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-black/20 rounded-lg p-4 border border-orange-500/20">
            <p className="text-orange-400 font-bold text-sm mb-1">+50% Rewards</p>
            <p className="text-gray-400 text-xs">Boost staking APY</p>
          </div>
          <div className="bg-black/20 rounded-lg p-4 border border-pink-500/20">
            <p className="text-pink-400 font-bold text-sm mb-1">Rare Traits</p>
            <p className="text-gray-400 text-xs">Unlock special features</p>
          </div>
          <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
            <p className="text-purple-400 font-bold text-sm mb-1">Voting</p>
            <p className="text-gray-400 text-xs">Enhanced DAO power</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTEvolutionDiagram;