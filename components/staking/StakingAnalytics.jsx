import React, { useState, useMemo } from 'react';
import { GlassButton, SecondaryButton } from '../Buttons';
import { 
  calculateProjectedRewards, 
  calculatePerformanceMetrics, 
  getTierDistribution,
  calculateOptimalStrategy,
  generateEarningsTimeSeries
} from '../../utils/staking-helpers/analytics';

/**
 * StakingAnalytics Component
 * 
 * Provides detailed analytics and visualizations for the user's staking portfolio
 * Displays performance metrics, reward projections, and optimization strategies
 */
const StakingAnalytics = ({ stats, unstaked, isLoading, onRefresh }) => {
  const [timeframe, setTimeframe] = useState('yearly'); // Options: weekly, monthly, yearly
  const [includeTimeBonus, setIncludeTimeBonus] = useState(true);
  const [selectedChart, setSelectedChart] = useState('rewards'); // Options: rewards, breakdown, earnings
  
  // Calculate all analytics metrics using memo to prevent recalculations
  const analytics = useMemo(() => {
    if (!stats || !stats.activeStakes || isLoading) {
      return {
        projectedRewards: null,
        performance: null,
        distribution: null,
        strategy: null,
        earnings: null
      };
    }
    
    // Get days for projection based on selected timeframe
    const projectionDays = timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : 365;
    
    return {
      projectedRewards: calculateProjectedRewards(stats.activeStakes, projectionDays, includeTimeBonus),
      performance: calculatePerformanceMetrics(stats.activeStakes),
      distribution: getTierDistribution(stats.activeStakes),
      strategy: calculateOptimalStrategy(stats.activeStakes, unstaked),
      earnings: generateEarningsTimeSeries(stats.activeStakes, 30) // Always 30 days for historical data
    };
  }, [stats, unstaked, isLoading, timeframe, includeTimeBonus]);
  
  // Handle case where stats are not loaded yet
  if (!stats && !isLoading) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data Available</h3>
        <p className="text-gray-400 mb-4">
          Analytics information will appear here once you stake your first NFT.
        </p>
        <div className="flex justify-center space-x-3">
          <SecondaryButton onClick={onRefresh}>
            Refresh Data
          </SecondaryButton>
          <GlassButton
            onClick={() => {
              // Switch to NFTs tab
              document.querySelector('[aria-controls="nfts"]')?.click();
            }}
          >
            Stake Your First NFT
          </GlassButton>
        </div>
      </div>
    );
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Analytics Controls - Mobile Optimized */}
      <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:flex-1">
            <label className="block text-sm text-gray-400 mb-1">Projection Timeframe</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${timeframe === 'weekly' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setTimeframe('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${timeframe === 'monthly' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setTimeframe('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${timeframe === 'yearly' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setTimeframe('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="w-full sm:flex-1">
            <label className="block text-sm text-gray-400 mb-1">View</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${selectedChart === 'rewards' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setSelectedChart('rewards')}
              >
                Rewards
              </button>
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${selectedChart === 'breakdown' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setSelectedChart('breakdown')}
              >
                Breakdown
              </button>
              <button 
                className={`flex-1 py-2 text-xs sm:text-sm ${selectedChart === 'earnings' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setSelectedChart('earnings')}
              >
                History
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center sm:justify-end">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={includeTimeBonus}
              onChange={() => setIncludeTimeBonus(!includeTimeBonus)}
            />
            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-2 text-sm font-medium text-gray-300">Include Time Bonuses</span>
          </label>
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-purple-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Earned To Date</p>
              <p className="text-2xl font-bold text-white">
                {analytics.performance?.totalEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0v3H7V4h6zm-6 8v4h6v-4H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Projected Rewards</p>
              <p className="text-2xl font-bold text-white">
                {analytics.projectedRewards?.totalProjected.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {timeframe === 'weekly' ? '7-day' : timeframe === 'monthly' ? '30-day' : '365-day'} projection
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-xl p-5 border border-green-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-green-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Daily Earning Rate</p>
              <p className="text-2xl font-bold text-white">
                {analytics.projectedRewards?.dailyRate.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts & Visualizations */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-xl font-bold text-white flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {selectedChart === 'rewards' ? 'Projected Rewards' : selectedChart === 'breakdown' ? 'Portfolio Breakdown' : 'Earnings History'}
        </h3>
        
        {selectedChart === 'rewards' && (
          <div>
            {/* Timeline Visualization */}
            <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2 sm:mb-3">Projected Earnings Timeline</h4>
              <div className="relative h-52 sm:h-64">
                {analytics.projectedRewards && analytics.projectedRewards.timeline.length > 0 ? (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-700"></div>
                    
                    {/* Y-axis labels */}
                    <div className="absolute top-0 left-0 bottom-0 w-10 sm:w-12 flex flex-col justify-between text-[10px] sm:text-xs text-gray-500">
                      <span>
                        {Math.ceil(analytics.projectedRewards.timeline[analytics.projectedRewards.timeline.length - 1].cumulative).toLocaleString()}
                      </span>
                      <span>
                        {Math.ceil(analytics.projectedRewards.timeline[Math.floor(analytics.projectedRewards.timeline.length / 2)].cumulative).toLocaleString()}
                      </span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart Bars - Show fewer bars on mobile */}
                    <div className="absolute top-0 left-10 sm:left-14 right-0 bottom-0 flex items-end">
                      {analytics.projectedRewards.timeline
                        // Filter to show fewer bars on mobile
                        .filter((point, i) => {
                          // Always show first and last
                          if (i === 0 || i === analytics.projectedRewards.timeline.length - 1) return true;
                          
                          // Show important milestones
                          if ([7, 30, 90, 180, 365].includes(point.day)) return true;
                          
                          // Only show key points (mobile-friendly default for SSR compatibility)
                          return false;
                        })
                        .map((point, index, filteredArray) => {
                          const maxValue = analytics.projectedRewards.timeline[analytics.projectedRewards.timeline.length - 1].cumulative;
                          const heightPercentage = (point.cumulative / maxValue) * 100;
                          
                          // Calculate widths based on filtered point count
                          const barWidth = 100 / filteredArray.length;
                          
                          return (
                            <div 
                              key={`timeline-${point.day}`} 
                              className="h-full flex flex-col justify-end items-center group relative"
                              style={{width: `${barWidth}%`}}
                            >
                              <div 
                                className="w-3/4 sm:w-full max-w-[40px] mx-auto bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-sm relative" 
                                style={{height: `${heightPercentage}%`}}
                              >
                                {/* Bonus Indicator - smaller on mobile */}
                                {point.multiplier > 1 && (
                                  <div className="absolute -top-1 sm:-top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full border-2 border-gray-900"></div>
                                )}
                              </div>
                              
                              {/* X-axis labels - always show on filtered points */}
                              <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{point.day}d</div>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 w-32 sm:w-36 text-[10px] sm:text-xs">
                                <p className="font-medium">Day {point.day}</p>
                                <p>Cumulative: {point.cumulative.toLocaleString()}</p>
                                <p>Daily: {point.reward.toLocaleString()}</p>
                                {point.multiplier > 1 && (
                                  <p className="text-yellow-400">
                                    {(point.multiplier * 100).toFixed(0)}% Bonus Active
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No projection data available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Daily Rewards by Tier Chart */}
            <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2 sm:mb-3">Daily Rewards by NFT Tier</h4>
              {analytics.projectedRewards && Object.keys(analytics.projectedRewards.byTier).length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(analytics.projectedRewards.byTier).map(([tier, amount]) => {
                    if (amount <= 0) return null;
                    
                    const totalDaily = analytics.projectedRewards.dailyRate;
                    const percentage = totalDaily > 0 ? (amount / totalDaily) * 100 : 0;
                    
                    // Tier-specific colors
                    const bgColor = tier === 'LEGENDARY' ? 'bg-yellow-500' : 
                                    tier === 'EPIC' ? 'bg-purple-500' : 
                                    tier === 'RARE' ? 'bg-blue-500' : 'bg-green-500';
                    
                    return (
                      <div key={`tier-${tier}`} className="relative">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium text-white">{tier}</span>
                          <span className="text-xs sm:text-sm text-gray-400">
                            <span className="hidden xs:inline">{amount.toLocaleString()} / day</span> 
                            <span>({percentage.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5">
                          <div 
                            className={`${bgColor} h-2 sm:h-2.5 rounded-full`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 sm:h-24">
                  <p className="text-gray-500">No tier breakdown available</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedChart === 'breakdown' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NFT Tier Distribution */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">NFT Tier Distribution</h4>
              {analytics.distribution && Object.keys(analytics.distribution.counts).length > 0 ? (
                <div className="h-40 sm:h-48 relative">
                  {Object.entries(analytics.distribution.counts).map(([tier, count], index) => {
                    if (count <= 0) return null;
                    
                    const totalNFTs = stats.activeStakes.length;
                    const percentage = totalNFTs > 0 ? (count / totalNFTs) * 100 : 0;
                    
                    // Tier-specific colors
                    const colorClass = tier === 'LEGENDARY' ? 'bg-yellow-500' : 
                                      tier === 'EPIC' ? 'bg-purple-500' : 
                                      tier === 'RARE' ? 'bg-blue-500' : 'bg-green-500';
                    
                    return (
                      <div key={`dist-${tier}`} className="mb-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
                          <span className="text-xs sm:text-sm text-white">{tier}</span>
                          <span className="ml-auto text-xs sm:text-sm text-gray-400">
                            {count} NFT{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                          <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 sm:h-48">
                  <p className="text-gray-500">No distribution data available</p>
                </div>
              )}
            </div>
            
            {/* Best Performer */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Best Performing NFT</h4>
              {analytics.performance?.bestPerformer ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg mb-3 overflow-hidden bg-gray-800">
                    {analytics.performance.bestPerformer.image ? (
                      <img 
                        src={analytics.performance.bestPerformer.image} 
                        alt={analytics.performance.bestPerformer.name || 'NFT'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <h5 className="text-base sm:text-lg font-medium text-white mb-1 text-center">
                    {analytics.performance.bestPerformer.name || `NFT #${analytics.performance.bestPerformer.id}`}
                  </h5>
                  
                  <div className="px-2 py-0.5 rounded-full text-xs mb-3" style={{
                    backgroundColor: analytics.performance.bestPerformer.tier === 'LEGENDARY' ? 'rgba(234, 179, 8, 0.2)' : 
                                    analytics.performance.bestPerformer.tier === 'EPIC' ? 'rgba(168, 85, 247, 0.2)' : 
                                    analytics.performance.bestPerformer.tier === 'RARE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: analytics.performance.bestPerformer.tier === 'LEGENDARY' ? 'rgb(234, 179, 8)' : 
                          analytics.performance.bestPerformer.tier === 'EPIC' ? 'rgb(168, 85, 247)' : 
                          analytics.performance.bestPerformer.tier === 'RARE' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
                  }}>
                    {analytics.performance.bestPerformer.tier}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full text-center">
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Total Earned</p>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {analytics.performance.bestPerformer.earned.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Daily Rate</p>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {analytics.performance.bestPerformer.dailyRate.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Days Staked</p>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {analytics.performance.bestPerformer.stakingDuration}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-400">Efficiency</p>
                      <p className="text-sm sm:text-base font-medium text-white">
                        {analytics.performance.stakingEfficiency.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 sm:h-56">
                  <p className="text-gray-500">No performance data available</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedChart === 'earnings' && (
          <div>
            {/* Historical Earnings Chart */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">30-Day Earnings History</h4>
              <div className="relative h-52 sm:h-64">
                {analytics.earnings && analytics.earnings.length > 0 ? (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-700"></div>
                    
                    {/* Y-axis labels */}
                    <div className="absolute top-0 left-0 bottom-0 w-10 sm:w-12 flex flex-col justify-between text-[10px] sm:text-xs text-gray-500">
                      <span>
                        {Math.ceil(analytics.earnings[analytics.earnings.length - 1].cumulative).toLocaleString()}
                      </span>
                      <span>
                        {Math.ceil(analytics.earnings[Math.floor(analytics.earnings.length / 2)].cumulative).toLocaleString()}
                      </span>
                      <span>0</span>
                    </div>
                    
                    {/* Line chart */}
                    <div className="absolute top-0 left-10 sm:left-14 right-0 bottom-0">
                      <svg className="w-full h-full" preserveAspectRatio="none">
                        {/* Area fill under the line */}
                        <defs>
                          <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(126, 34, 206, 0.7)" />
                            <stop offset="100%" stopColor="rgba(126, 34, 206, 0)" />
                          </linearGradient>
                        </defs>
                        
                        {/* Generate the area path */}
                        {(() => {
                          const maxValue = analytics.earnings[analytics.earnings.length - 1].cumulative;
                          
                          // Calculate points for the path
                          const width = 100; // percentage width
                          const pointStep = width / (analytics.earnings.length - 1);
                          
                          // Generate points for the line
                          const points = analytics.earnings.map((point, i) => {
                            const x = i * pointStep;
                            const y = 100 - ((point.cumulative / maxValue) * 100);
                            return `${x},${y}`;
                          });
                          
                          // Create area path - add bottom corners
                          const areaPath = `
                            M0,${100 - ((analytics.earnings[0].cumulative / maxValue) * 100)}
                            ${points.map((point, i) => `L${i * pointStep},${100 - ((analytics.earnings[i].cumulative / maxValue) * 100)}`).join(' ')}
                            L100,100 L0,100 Z
                          `;
                          
                          // Create line path
                          const linePath = `
                            M0,${100 - ((analytics.earnings[0].cumulative / maxValue) * 100)}
                            ${points.map((point, i) => `L${i * pointStep},${100 - ((analytics.earnings[i].cumulative / maxValue) * 100)}`).join(' ')}
                          `;
                          
                          return (
                            <>
                              <path d={areaPath} fill="url(#earningsGradient)" />
                              <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2" />
                              
                              {/* Add data points at intervals - use fewer points on mobile */}
                              {analytics.earnings
                                .filter((_, i) => {
                                  // For screens smaller than sm breakpoint, show fewer points
                                  // Fixed interval to avoid SSR issues
                                  const interval = 7; // Mobile-friendly default
                                  return i % interval === 0 || i === analytics.earnings.length - 1;
                                })
                                .map((point, i) => {
                                  // Determine actual index based on screen size
                                  const interval = 7; // Mobile-friendly default
                                  const index = i * interval;
                                  const actualIndex = index >= analytics.earnings.length ? analytics.earnings.length - 1 : index;
                                  const x = (actualIndex / (analytics.earnings.length - 1)) * 100;
                                  const y = 100 - ((analytics.earnings[actualIndex].cumulative / maxValue) * 100);
                                  
                                  // Fixed point size to avoid SSR issues
                                  const pointSize = 2; // Mobile-friendly default
                                  
                                  return (
                                    <circle 
                                      key={`point-${i}`}
                                      cx={`${x}%`} 
                                      cy={`${y}%`} 
                                      r={pointSize}
                                      fill="#a855f7" 
                                      stroke="#1f2937" 
                                      strokeWidth="1"
                                    />
                                  );
                                })
                              }
                            </>
                          );
                        })()}
                      </svg>
                      
                      {/* X-axis labels - show fewer on mobile */}
                      <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
                        {analytics.earnings
                          .filter((_, i) => i === 0 || i === analytics.earnings.length - 1 || i === Math.floor(analytics.earnings.length / 2))
                          .map((point, i) => (
                            <span key={`label-${i}`}>
                              {new Date(point.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No historical data available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Staking Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Average Daily</h5>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {analytics.performance ? analytics.performance.averageDailyEarning.toFixed(1) : '0'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">TESOLA Tokens</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Staking Efficiency</h5>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {analytics.performance ? analytics.performance.stakingEfficiency.toFixed(1) : '0'}%
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">vs theoretical maximum</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <h5 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Avg Staking Period</h5>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {analytics.performance ? Math.round(analytics.performance.averageStakingPeriod) : '0'} days
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">per NFT</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Staking Strategy Recommendations - Mobile Optimized */}
      {analytics.strategy && analytics.strategy.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-xl p-3 sm:p-5 border border-green-500/30">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Optimization Recommendations
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            {analytics.strategy.recommendations.map((recommendation, index) => (
              <div key={`rec-${index}`} className="bg-gray-800/40 rounded-lg p-2 sm:p-3 border border-green-500/20">
                <p className="text-sm sm:text-base text-white mb-2">{recommendation}</p>
                
                {analytics.strategy.suggestedActions[index] && (
                  <div className="flex items-start text-xs sm:text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-1 sm:mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-300">{analytics.strategy.suggestedActions[index]}</span>
                  </div>
                )}
                
                {analytics.strategy.potentialGains > 0 && index === 0 && (
                  <div className="mt-2 text-xs sm:text-sm">
                    <span className="text-gray-400">Potential gain: </span>
                    <span className="text-green-400 font-medium">+{analytics.strategy.potentialGains.toLocaleString()} TESOLA</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingAnalytics;