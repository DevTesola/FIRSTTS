import React from "react";
import { GlassButton, SecondaryButton } from "../Buttons";
import StakedNFTCard from "./StakedNFTCard";

/**
 * Staking Dashboard Component
 * Displays user's staking statistics and currently staked NFTs
 */
const StakingDashboard = ({ stats, isLoading, onRefresh }) => {
  // Handle case where stats are not loaded yet
  if (!stats && !isLoading) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">No Staking Data Found</h3>
        <p className="text-gray-400 mb-4">
          Your staking information will appear here once you stake your first NFT.
        </p>
        <SecondaryButton onClick={onRefresh}>
          Refresh Data
        </SecondaryButton>
      </div>
    );
  }

  // Calculate stats for display (using placeholders if data is loading)
  const totalStaked = isLoading ? "--" : (stats?.activeStakes?.length || 0);
  const projectedRewards = isLoading ? "--" : (stats?.stats?.projectedRewards || 0).toLocaleString();
  const earnedToDate = isLoading ? "--" : (stats?.stats?.earnedToDate || 0).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-purple-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Staked NFTs</p>
              <p className="text-2xl font-bold text-white">{totalStaked}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Projected Total Rewards</p>
              <p className="text-2xl font-bold text-white">{projectedRewards}</p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 rounded-xl p-5 border border-pink-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-pink-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Earned To Date</p>
              <p className="text-2xl font-bold text-white">{earnedToDate}</p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Staking Section */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Active Staking
          </h3>
          
          <GlassButton 
            size="small" 
            onClick={onRefresh}
            disabled={isLoading}
            icon={
              isLoading ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )
            }
          >
            Refresh
          </GlassButton>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : stats?.activeStakes?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.activeStakes.map((stake) => (
              <StakedNFTCard key={stake.id} stake={stake} onRefresh={onRefresh} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-900/30 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-400 mb-1">No Staked NFTs Found</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              You don't have any staked NFTs yet. Stake your SOLARA NFTs to start earning TESOLA tokens.
            </p>
          </div>
        )}
      </div>

      {/* Staking Tiers Info */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Staking Rewards by NFT Tier</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">NFT Tier</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Daily</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Weekly</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Monthly</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Yearly</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-4">
                  <span className="font-medium text-yellow-300">Legendary</span>
                </td>
                <td className="text-right py-2 px-4 text-white font-medium">200</td>
                <td className="text-right py-2 px-4 text-gray-300">1,400</td>
                <td className="text-right py-2 px-4 text-gray-300">6,000</td>
                <td className="text-right py-2 px-4 text-gray-300">73,000</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-4">
                  <span className="font-medium text-pink-300">Epic</span>
                </td>
                <td className="text-right py-2 px-4 text-white font-medium">100</td>
                <td className="text-right py-2 px-4 text-gray-300">700</td>
                <td className="text-right py-2 px-4 text-gray-300">3,000</td>
                <td className="text-right py-2 px-4 text-gray-300">36,500</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-4">
                  <span className="font-medium text-purple-300">Rare</span>
                </td>
                <td className="text-right py-2 px-4 text-white font-medium">50</td>
                <td className="text-right py-2 px-4 text-gray-300">350</td>
                <td className="text-right py-2 px-4 text-gray-300">1,500</td>
                <td className="text-right py-2 px-4 text-gray-300">18,250</td>
              </tr>
              <tr>
                <td className="py-2 px-4">
                  <span className="font-medium text-blue-300">Common</span>
                </td>
                <td className="text-right py-2 px-4 text-white font-medium">25</td>
                <td className="text-right py-2 px-4 text-gray-300">175</td>
                <td className="text-right py-2 px-4 text-gray-300">750</td>
                <td className="text-right py-2 px-4 text-gray-300">9,125</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Note: Long-term stakers (30+ days) earn additional bonuses on top of these base rates.
        </p>
      </div>
    </div>
  );
};

export default StakingDashboard;