import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function PresaleInfo({ 
  soldAmount = 0, 
  totalAllocation = 100000000, 
  tokenPrice = "0.000005 SOL",
  presaleConfig = null,
  isClient = false
}) {
  // Calculate percentage sold
  const percentageSold = Math.min(100, Math.round((soldAmount / totalAllocation) * 100));
  
  // Format numbers for display
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Dynamic tiers based on progress
  const getTier = () => {
    if (percentageSold < 25) return { 
      name: "Early Bird Tier", 
      bonus: "25% Bonus", 
      color: "from-emerald-400 to-teal-500"
    };
    if (percentageSold < 50) return { 
      name: "Growth Tier", 
      bonus: "20% Bonus", 
      color: "from-blue-400 to-indigo-500"
    };
    if (percentageSold < 75) return { 
      name: "Acceleration Tier", 
      bonus: "15% Bonus", 
      color: "from-purple-400 to-indigo-500"
    };
    return { 
      name: "Launch Tier", 
      bonus: "10% Bonus", 
      color: "from-pink-400 to-purple-500"
    };
  };
  
  const tier = getTier();
  
  // Token metrics with shortened display versions for better presentation
  const tokenMetrics = [
    { label: "Token Price", value: "0.000006 SOL" },
    { label: "Presale Target", value: "10% of Supply" },
    { label: "Minimum Purchase", value: "1,000 TESOLA" },
    { label: "Total Supply", value: "1B TESOLA", fullValue: "1,000,000,000" }
  ];
  
  // Presale Benefits
  const benefits = [
    {
      title: "Early Access",
      description: "Special opportunity to participate from the early stages",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "from-blue-400 to-indigo-500"
    },
    {
      title: "Special Bonus",
      description: "Additional token bonus rewards per presale tier",
      icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Price Advantage",
      description: "Acquire tokens at lower price than post-launch exchange rates",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
      color: "from-green-400 to-emerald-500"
    },
    {
      title: "Community Priority",
      description: "Special community benefits for early investors",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      color: "from-red-400 to-orange-500"
    }
  ];
  
  // Token allocations
  const allocations = [
    { name: "Presale", percentage: 10, color: "bg-blue-500" },
    { name: "Ecosystem Rewards", percentage: 40, color: "bg-purple-500" },
    { name: "Team & Advisors", percentage: 15, color: "bg-pink-500" },
    { name: "Liquidity & Exchanges", percentage: 20, color: "bg-teal-500" },
    { name: "Development & Marketing", percentage: 10, color: "bg-indigo-500" },
    { name: "Reserve", percentage: 5, color: "bg-orange-500" }
  ];
  
  // TESOLA 3-Phase Strategy
  const strategies = [
    {
      name: "HOLD-TO-EARN",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "bg-gradient-to-r from-blue-400 to-indigo-500"
    },
    {
      name: "GAME DRIVE-TO-EARN",
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
      color: "bg-gradient-to-r from-purple-400 to-pink-500"
    },
    {
      name: "REAL DRIVE-TO-EARN",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      color: "bg-gradient-to-r from-teal-400 to-green-500"
    }
  ];
  
  return (
    <div className="mt-6 bg-gray-800/50 rounded-xl p-6 border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden backdrop-blur-sm">
      {/* Animated background elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      <div className="absolute top-40 left-1/2 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      
      <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-shimmer">
        TESOLA Token Presale
      </h2>
      
      {/* Current tier - enhanced */}
      <div className="mb-6 flex justify-center">
        <div className={`bg-gradient-to-r ${tier.color} px-5 py-3 rounded-xl inline-flex items-center shadow-lg transform transition-all duration-300 hover:scale-105`}>
          <div className="mr-3 bg-white/20 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold">{tier.name}</div>
            <div className="text-white/80 text-xs">{tier.bonus}</div>
          </div>
        </div>
      </div>
      
      {/* Progress bar - enhanced */}
      <div className="mb-8 bg-gray-900/70 p-5 rounded-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-indigo-900/5"></div>
        <div className="flex justify-between text-sm mb-2 relative z-10">
          <span className="text-indigo-300">Progress</span>
          <span className="text-white font-medium bg-purple-800/60 px-3 py-0.5 rounded-full text-xs">
            {percentageSold}% Sold
          </span>
        </div>
        <div className="w-full bg-gray-800/80 rounded-full h-5 overflow-hidden p-0.5 relative z-10">
          <div 
            className={`h-full bg-gradient-to-r ${tier.color} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${percentageSold}%` }}
          >
            <div className="w-full h-full opacity-30 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] animate-stripe"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs mt-2 relative z-10">
          <span className="text-indigo-300/80">{formatNumber(soldAmount)} TESOLA</span>
          <span className="text-indigo-300/80">{formatNumber(totalAllocation)} TESOLA</span>
        </div>
      </div>
      
      {/* Token metrics grid - enhanced with glow and better styling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tokenMetrics.map((metric, index) => (
          <div 
            key={index} 
            className="bg-gray-900/80 p-4 rounded-lg border border-purple-500/20 transform transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] group"
          >
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-3 shadow-md group-hover:shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors">{metric.label}</div>
            </div>
            <div 
              className="text-white font-bold ml-11 text-lg group-hover:text-purple-100 transition-colors" 
              title={metric.fullValue || metric.value}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional presale details */}
      {presaleConfig && (
        <div className="border-t border-gray-700 pt-4 mt-4 mb-6">
          <h3 className="text-lg font-semibold text-center text-white mb-3">Presale Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {presaleConfig.whitelist_only && (
              <div className="col-span-2 bg-yellow-900/30 text-yellow-300 p-2 rounded text-center">
                <span className="font-medium">Whitelist Only Phase</span>
              </div>
            )}
            {presaleConfig.min_sol && (
              <div className="flex justify-between px-3 py-1">
                <span className="text-gray-400">Min SOL:</span>
                <span className="text-white">{presaleConfig.min_sol} SOL</span>
              </div>
            )}
            {presaleConfig.max_sol && (
              <div className="flex justify-between px-3 py-1">
                <span className="text-gray-400">Max SOL:</span>
                <span className="text-white">{presaleConfig.max_sol} SOL</span>
              </div>
            )}
            {presaleConfig.max_per_wallet && (
              <div className="flex justify-between px-3 py-1 col-span-2">
                <span className="text-gray-400">Max per wallet:</span>
                <span className="text-white">{formatNumber(presaleConfig.max_per_wallet)} TESOLA</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* TESOLA 3-Phase Strategy - enhanced with better visual effects */}
      <div className="mb-8 bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-[0_5px_15px_rgba(139,92,246,0.15)]">
        <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">TESOLA 3-Phase Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {strategies.map((strategy, index) => (
            <div 
              key={index} 
              className="bg-gray-800/60 p-5 rounded-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_10px_25px_rgba(139,92,246,0.2)] border border-purple-500/20 hover:border-purple-500/40 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className={`w-16 h-16 rounded-xl ${strategy.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all duration-300 z-10`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={strategy.icon} />
                </svg>
              </div>
              <div className="text-white font-semibold text-center text-lg group-hover:text-purple-200 transition-colors">{strategy.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Token allocations - enhanced with animation and style */}
      <div className="mb-8 bg-gray-900/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20">
        <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-5">Token Allocation</h3>
        <div className="space-y-3">
          {allocations.map((allocation, index) => (
            <div key={index} className="flex items-center group relative overflow-hidden">
              <div className="w-32 text-sm text-purple-300 font-medium group-hover:text-white transition-colors">{allocation.name}</div>
              <div className="flex-1 mx-2">
                <div className="h-8 bg-gray-800/60 rounded-lg overflow-hidden border border-gray-700 group-hover:border-purple-500/30 transition-colors">
                  <div 
                    className={`h-full ${allocation.color} rounded-lg flex items-center transition-all duration-500 ease-out`}
                    style={{ width: `${allocation.percentage}%` }}
                  >
                    <span className="px-3 text-xs text-white font-medium">{allocation.percentage}%</span>
                  </div>
                </div>
              </div>
              <div className="w-12 text-right text-white font-medium">{allocation.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Presale Benefits - enhanced with cards and effects */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-5">Presale Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-4 border border-purple-500/10 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-purple-500/30">
              <div className={`w-12 h-12 mb-3 rounded-lg bg-gradient-to-r ${benefit.color} flex items-center justify-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={benefit.icon} />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-1">{benefit.title}</h4>
              <p className="text-indigo-200/70 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Call to action */}
      <div className="mt-6 text-center">
        <div className="inline-block px-6 py-2 border border-purple-500/40 rounded-full bg-gradient-to-r from-purple-900/30 to-indigo-900/30 text-purple-300 text-sm backdrop-blur-sm animate-pulse">
          <span className="bg-purple-500 w-2 h-2 rounded-full inline-block mr-2"></span>
          Presale in progress - {100 - percentageSold}% remaining
        </div>
      </div>
    </div>
  );
}