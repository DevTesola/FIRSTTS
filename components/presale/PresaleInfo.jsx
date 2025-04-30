import React from "react";

export default function PresaleInfo({ 
  soldAmount = 0, 
  totalAllocation = 100000000, 
  tokenPrice = "0.000005 SOL",
  presaleConfig = null
}) {
  // Calculate percentage sold
  const percentageSold = Math.min(100, Math.round((soldAmount / totalAllocation) * 100));
  
  // Format numbers for display
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Dynamic tiers based on progress
  const getTier = () => {
    if (percentageSold < 25) return { name: "Tier 1", bonus: "20% bonus", color: "text-green-400" };
    if (percentageSold < 50) return { name: "Tier 2", bonus: "15% bonus", color: "text-blue-400" };
    if (percentageSold < 75) return { name: "Tier 3", bonus: "10% bonus", color: "text-purple-400" };
    return { name: "Tier 4", bonus: "5% bonus", color: "text-pink-400" };
  };
  
  const tier = getTier();
  
  return (
    <div className="mt-6 bg-gray-800 bg-opacity-40 rounded-xl p-6 border border-purple-500 border-opacity-20 shadow-xl">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-5">
        TESOLA Token Presale
      </h2>
      
      {/* Current tier */}
      <div className="mb-5 flex justify-center">
        <div className="bg-gray-900 px-5 py-2 rounded-full inline-flex items-center">
          <span className="mr-2 text-gray-300">Current Price Tier:</span>
          <span className={`font-bold ${tier.color}`}>{tier.name}</span>
          <span className="ml-2 bg-gray-800 text-xs px-2 py-1 rounded-full">
            {tier.bonus}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{percentageSold}% Sold</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${percentageSold}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">{formatNumber(soldAmount)} TESOLA</span>
          <span className="text-gray-400">{formatNumber(totalAllocation)} TESOLA</span>
        </div>
      </div>
      
      {/* Token information grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Token Price</div>
          <div className="text-white font-bold">{tokenPrice}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Min Purchase</div>
          <div className="text-white font-bold">1,000 TESOLA</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Max Purchase</div>
          <div className="text-white font-bold">10,000,000 TESOLA</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Total Supply</div>
          <div className="text-white font-bold">1,000,000,000</div>
        </div>
      </div>
      
      {/* Additional presale details */}
      {presaleConfig && (
        <div className="border-t border-gray-700 pt-4 mt-4">
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
      
      {/* Token utilities */}
      <div className="mt-5 pt-5 border-t border-gray-700">
        <h3 className="text-center text-lg font-semibold text-gray-200 mb-3">Token Utilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-gray-900 p-3 rounded-lg flex flex-col items-center">
            <div className="text-purple-400 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-center text-sm">Platform Fees</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg flex flex-col items-center">
            <div className="text-pink-400 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="text-center text-sm">Governance</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg flex flex-col items-center">
            <div className="text-blue-400 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center text-sm">Staking Rewards</div>
          </div>
        </div>
      </div>
    </div>
  );
}