import React, { useState, useEffect, useCallback } from "react";
import { GlassButton, SecondaryButton } from "../Buttons";
import StakedNFTCard from "./StakedNFTCard";
import CollectionBonus from "./CollectionBonus";
import useStakingEvents from "../../utils/hooks/useStakingEvents";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Enhanced Staking Dashboard Component
 * Displays user's staking statistics and currently staked NFTs with improved UX
 */
const StakingDashboard = ({ stats, isLoading, onRefresh }) => {
  const [animateStats, setAnimateStats] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "rewards"
  const [expandedView, setExpandedView] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);
  const [liveUpdateEnabled, setLiveUpdateEnabled] = useState(true);
  const { publicKey } = useWallet();

  // Handle real-time updates from staking events
  const handleStakeAccountUpdate = useCallback((update) => {
    if (!liveUpdateEnabled) return;

    console.log('Stake account update received:', update);

    // Add update to the realtime updates array
    setRealtimeUpdates(prev => {
      // Check if we already have an update for this mint address
      const existingIndex = prev.findIndex(item =>
        item.mintAddress === update.mintAddress
      );

      if (existingIndex >= 0) {
        // Update existing entry
        const newUpdates = [...prev];
        newUpdates[existingIndex] = {
          ...newUpdates[existingIndex],
          timestamp: Date.now(),
          data: update.data,
          animateUpdate: true
        };
        return newUpdates;
      } else {
        // Add new entry
        return [
          {
            mintAddress: update.mintAddress,
            type: 'stake_update',
            timestamp: Date.now(),
            data: update.data,
            animateUpdate: true
          },
          ...prev.slice(0, 9) // Keep only last 10 updates
        ];
      }
    });

    // Request a data refresh to update the UI with latest data
    if (onRefresh && typeof onRefresh === 'function') {
      // Use a debounced refresh to avoid too many API calls
      if (window.stakingRefreshTimeout) {
        clearTimeout(window.stakingRefreshTimeout);
      }
      window.stakingRefreshTimeout = setTimeout(() => {
        onRefresh();
      }, 2000); // Wait 2 seconds before refreshing to batch multiple updates
    }
  }, [onRefresh, liveUpdateEnabled]);

  // Handle user staking info updates
  const handleUserStakingUpdate = useCallback((update) => {
    if (!liveUpdateEnabled) return;

    console.log('User staking update received:', update);

    // Add update to the realtime updates array
    setRealtimeUpdates(prev => [
      {
        type: 'user_staking_update',
        timestamp: Date.now(),
        data: update.data,
        animateUpdate: true
      },
      ...prev.slice(0, 9) // Keep only last 10 updates
    ]);

    // Request a data refresh to update the UI with latest data
    if (onRefresh && typeof onRefresh === 'function') {
      // Use a debounced refresh to avoid too many API calls
      if (window.stakingRefreshTimeout) {
        clearTimeout(window.stakingRefreshTimeout);
      }
      window.stakingRefreshTimeout = setTimeout(() => {
        onRefresh();
      }, 2000); // Wait 2 seconds before refreshing to batch multiple updates
    }
  }, [onRefresh, liveUpdateEnabled]);

  // Configure staking event subscriptions
  const {
    subscribeToNFT,
    subscribeToMultipleNFTs,
    activeSubscriptions,
    isSubscribing,
    eventUpdates
  } = useStakingEvents({
    autoSubscribeUserAccount: true,
    onStakeAccountUpdate: handleStakeAccountUpdate,
    onUserStakingUpdate: handleUserStakingUpdate
  });

  // Subscribe to all stake accounts when stats change
  useEffect(() => {
    if (stats?.activeStakes && stats.activeStakes.length > 0 && !isLoading) {
      // Extract mint addresses
      const mintAddresses = stats.activeStakes
        .filter(stake => stake.mint_address)
        .map(stake => stake.mint_address);

      // Subscribe to all mint addresses that aren't already subscribed
      const currentMints = activeSubscriptions
        .filter(sub => sub.type === 'stake_account')
        .map(sub => sub.key);

      const newMints = mintAddresses.filter(mint => !currentMints.includes(mint));

      if (newMints.length > 0) {
        subscribeToMultipleNFTs(newMints);
      }
    }
  }, [stats, isLoading, subscribeToMultipleNFTs, activeSubscriptions]);

  // Animate updates after a small delay
  useEffect(() => {
    if (realtimeUpdates.some(update => update.animateUpdate)) {
      const timer = setTimeout(() => {
        setRealtimeUpdates(updates =>
          updates.map(update => ({ ...update, animateUpdate: false }))
        );
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [realtimeUpdates]);

  // Trigger number animation when stats change
  useEffect(() => {
    if (stats && !isLoading) {
      setAnimateStats(true);
      const timer = setTimeout(() => setAnimateStats(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [stats, isLoading]);

  // Handle case where stats are not loaded yet
  if (!stats && !isLoading) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No Staking Data Found</h3>
        <p className="text-gray-400 mb-4">
          Your staking information will appear here once you stake your first NFT.
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

  // Calculate stats for display (using placeholders if data is loading)
  const totalStaked = isLoading ? "--" : (stats?.activeStakes?.length || 0);
  const projectedRewards = isLoading ? "--" : (stats?.stats?.projectedRewards || 0).toLocaleString();
  const earnedToDate = isLoading ? "--" : (stats?.stats?.earnedToDate || 0).toLocaleString();
  
  // Sort staked NFTs based on selection
  const getSortedStakes = () => {
    if (!stats?.activeStakes) return [];
    
    // 디버그 - 항상 활성화하여 NFT 이미지 필드 정보 확인
    if (stats.activeStakes.length > 0) {
      console.log("DEBUG - Sample stake object:", JSON.stringify(stats.activeStakes[0], null, 2));
      
      // 실제 NFT 이미지 URL 확인용 로그 추가
      const firstStake = stats.activeStakes[0];
      
      // IPFS URL을 추출하기 위해 모든 필드 심층 분석
      console.log("DEBUG - Image fields in stake (VERBOSE):", firstStake);
      
      // 주요 이미지 필드만 간략히 출력
      console.log("DEBUG - Image fields in stake:", {
        image: firstStake.image,
        image_url: firstStake.image_url,
        nft_image: firstStake.nft_image,
        ipfs_hash: firstStake.ipfs_hash,
        metadata_image: firstStake.metadata?.image,
        metadata_full: firstStake.metadata,
        using_actual_nft_data: firstStake.using_actual_nft_data,
        __source: 'StakingDashboard-debug'
      });
      
      // 모든 스테이킹 NFT 데이터 확인
      stats.activeStakes.forEach((stake, index) => {
        console.log(`NFT #${index} 이미지 필드:`, {
          id: stake.id || stake.mint_address,
          image: stake.image,
          image_url: stake.image_url,
          nft_image: stake.nft_image,
          ipfs_hash: stake.ipfs_hash,
          metadata_image: stake.metadata?.image
        });
      });
    }
    
    const stakes = [...stats.activeStakes];
    
    switch(sortBy) {
      case "newest":
        return stakes.sort((a, b) => new Date(b.staked_at) - new Date(a.staked_at));
      case "oldest":
        return stakes.sort((a, b) => new Date(a.staked_at) - new Date(b.staked_at));
      case "rewards":
        return stakes.sort((a, b) => b.earned_so_far - a.earned_so_far);
      case "tier":
        return stakes.sort((a, b) => {
          const tierValue = {
            "LEGENDARY": 4,
            "EPIC": 3,
            "RARE": 2,
            "COMMON": 1
          };
          return tierValue[b.nft_tier] - tierValue[a.nft_tier];
        });
      default:
        return stakes;
    }
  };
  
  // Get tier badge color for summary
  const getTierColor = (tier) => {
    if (!tier) return "text-green-400"; // Default to common
    
    const normalizedTier = tier.toUpperCase();
    if (normalizedTier.includes("LEGENDARY")) return "text-yellow-400";
    if (normalizedTier.includes("EPIC")) return "text-purple-400";
    if (normalizedTier.includes("RARE")) return "text-blue-400";
    return "text-green-400"; // Common
  };
  
  // Calculate tier distribution
  const calculateTierDistribution = () => {
    if (!stats?.activeStakes || !stats.activeStakes.length) return {};
    
    const distribution = {
      "LEGENDARY": 0,
      "EPIC": 0,
      "RARE": 0,
      "COMMON": 0
    };
    
    stats.activeStakes.forEach(stake => {
      const tier = stake.nft_tier?.toUpperCase() || "COMMON";
      
      if (tier.includes("LEGENDARY")) distribution["LEGENDARY"]++;
      else if (tier.includes("EPIC")) distribution["EPIC"]++;
      else if (tier.includes("RARE")) distribution["RARE"]++;
      else distribution["COMMON"]++;
    });
    
    return distribution;
  };
  
  const tierDistribution = calculateTierDistribution();
  const sortedStakes = getSortedStakes();
  
  return (
    <div className="space-y-6">
      {/* Welcome guide for first-time users */}
      {showWelcomeGuide && totalStaked > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30 relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={() => setShowWelcomeGuide(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-start">
            <div className="bg-green-500/20 p-2 rounded-full mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Congratulations on Staking!</h3>
              <p className="text-gray-300 mb-2">
                Your NFTs are now earning TESOLA tokens. Here's how it works:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-2">
                <li>Tokens are earned continuously as time passes</li>
                <li>Early unstaking may result in a penalty</li>
                <li>The longer you stake, the higher your bonus multiplier</li>
                <li>Check back regularly to see your accumulated rewards</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards with Animation */}
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
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {totalStaked}
              </p>
              {totalStaked > 0 && (
                <div className="flex flex-wrap mt-1 gap-1">
                  {tierDistribution["LEGENDARY"] > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-900/50 text-yellow-300 rounded-full">
                      {tierDistribution["LEGENDARY"]} Legendary
                    </span>
                  )}
                  {tierDistribution["EPIC"] > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded-full">
                      {tierDistribution["EPIC"]} Epic
                    </span>
                  )}
                  {tierDistribution["RARE"] > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                      {tierDistribution["RARE"]} Rare
                    </span>
                  )}
                  {tierDistribution["COMMON"] > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                      {tierDistribution["COMMON"]} Common
                    </span>
                  )}
                </div>
              )}
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
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {projectedRewards}
              </p>
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
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {earnedToDate}
              </p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Bonus Component */}
      <CollectionBonus stats={stats} />

      {/* Active Staking Section with Enhanced UI */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Active Staking
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rewards">Highest Rewards</option>
                <option value="tier">By Tier</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
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

            {/* Live Updates Toggle */}
            <button
              onClick={() => setLiveUpdateEnabled(!liveUpdateEnabled)}
              className={`px-2 py-1 rounded-md text-xs flex items-center border ${
                liveUpdateEnabled
                  ? 'bg-green-900/20 border-green-500/30 text-green-300'
                  : 'bg-gray-800/30 border-gray-700/30 text-gray-400'
              }`}
            >
              <div className={`h-2 w-2 rounded-full mr-1 ${liveUpdateEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              {liveUpdateEnabled ? 'Live Updates' : 'Updates Paused'}
            </button>
            
            <GlassButton
              size="small"
              onClick={() => {
                // Switch to NFTs tab
                document.querySelector('[aria-controls="nfts"]')?.click();
              }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              }
            >
              Stake More
            </GlassButton>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : sortedStakes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStakes.map((stake) => (
              <StakedNFTCard
                key={stake.id}
                stake={{
                  ...stake,
                  // Add source property for component identification
                  __source: 'StakingDashboard-card',
                  // Add cache busting with timestamp
                  _cacheBust: Date.now(),
                  // Explicit metadata transfer
                  metadata: stake.metadata,
                  // Force using actual NFT data
                  using_actual_nft_data: true,
                  // Pass environment variables explicitly
                  NEXT_PUBLIC_IMAGES_CID: process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike',
                  NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud'
                }}
                onRefresh={onRefresh}
                isExpanded={expandedView === stake.id}
                onToggleExpand={() => {
                  setExpandedView(expandedView === stake.id ? null : stake.id);
                }}
              />
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
            <div className="mt-4">
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
        )}
      </div>

      {/* Live Updates Feed Section - 항상 표시 */}
        <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Real-time Updates
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">
                <span className="font-medium">{activeSubscriptions.length}</span> active subscriptions
              </div>
              {isSubscribing && (
                <div className="text-xs text-blue-400 flex items-center">
                  <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subscribing...
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {realtimeUpdates.length > 0 ? (
              realtimeUpdates.map((update, index) => {
                // Different styling for different update types
                let color = 'blue';
                let icon = (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                );

                if (update.type === 'stake_update') {
                  color = 'green';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  );
                } else if (update.type === 'user_staking_update') {
                  color = 'purple';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  );
                }

                return (
                  <div
                    key={`${update.type}-${index}`}
                    className={`p-3 rounded-lg border ${
                      update.animateUpdate
                        ? `animate-highlight-${color} border-${color}-500/40`
                        : `bg-gray-900/40 border-gray-700/30`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className={`text-${color}-400 flex items-center mt-0.5`}>
                          {icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {update.type === 'stake_update'
                              ? `NFT Update: ${update.mintAddress.slice(0, 4)}...${update.mintAddress.slice(-4)}`
                              : 'User Staking Update'
                            }
                          </div>
                          <div className="text-xs text-gray-400">
                            {update.type === 'stake_update' && (
                              <>
                                {update.data.isStaked
                                  ? `Staked: ${new Date(update.data.stakedAt * 1000).toLocaleDateString()}`
                                  : 'Not staked'
                                }
                                {update.data.currentTimeMultiplier > 0 &&
                                  ` • Multiplier: +${update.data.currentTimeMultiplier / 100}%`
                                }
                              </>
                            )}
                            {update.type === 'user_staking_update' && (
                              <>
                                Staked NFTs: {update.data.stakedCount}
                                {update.data.collectionBonus > 0 &&
                                  ` • Collection Bonus: +${update.data.collectionBonus / 100}%`
                                }
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-3 bg-gray-900/30 rounded-lg text-gray-400 text-sm">
                {liveUpdateEnabled
                  ? 'Waiting for real-time updates...'
                  : 'Updates paused. Enable real-time updates to see changes.'}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            <p>Real-time updates are enabled for your staked NFTs. You'll see live data when values change on the blockchain.</p>
          </div>
        </div>

      {/* Staking Tiers Info with Visual Enhancement */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Staking Rewards by NFT Tier
        </h3>
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
              <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    <span className="font-medium text-yellow-300">Legendary</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-white font-medium">200</td>
                <td className="text-right py-3 px-4 text-gray-300">1,400</td>
                <td className="text-right py-3 px-4 text-gray-300">6,000</td>
                <td className="text-right py-3 px-4 text-gray-300">73,000</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                    <span className="font-medium text-purple-300">Epic</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-white font-medium">100</td>
                <td className="text-right py-3 px-4 text-gray-300">700</td>
                <td className="text-right py-3 px-4 text-gray-300">3,000</td>
                <td className="text-right py-3 px-4 text-gray-300">36,500</td>
              </tr>
              <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    <span className="font-medium text-blue-300">Rare</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-white font-medium">50</td>
                <td className="text-right py-3 px-4 text-gray-300">350</td>
                <td className="text-right py-3 px-4 text-gray-300">1,500</td>
                <td className="text-right py-3 px-4 text-gray-300">18,250</td>
              </tr>
              <tr className="hover:bg-gray-700/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    <span className="font-medium text-green-300">Common</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-white font-medium">25</td>
                <td className="text-right py-3 px-4 text-gray-300">175</td>
                <td className="text-right py-3 px-4 text-gray-300">750</td>
                <td className="text-right py-3 px-4 text-gray-300">9,125</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/10">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            Bonus Rewards
          </h4>
          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[140px]">
              <p className="text-xs text-gray-400 mb-1">First 7 days</p>
              <div className="font-medium text-green-300">+100% (2x rewards)</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[140px]">
              <p className="text-xs text-gray-400 mb-1">Long-term (30+ days)</p>
              <div className="font-medium text-green-300">+20% to +100% bonus</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[140px]">
              <p className="text-xs text-gray-400 mb-1">Monthly airdrops</p>
              <div className="font-medium text-green-300">For 30+ day stakers</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes countUp {
          from { opacity: 0.5; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-count {
          animation: countUp 0.5s ease-out forwards;
        }

        @keyframes highlightGreen {
          0% { background-color: rgba(16, 185, 129, 0.2); }
          70% { background-color: rgba(16, 185, 129, 0.2); }
          100% { background-color: transparent; }
        }

        @keyframes highlightBlue {
          0% { background-color: rgba(59, 130, 246, 0.2); }
          70% { background-color: rgba(59, 130, 246, 0.2); }
          100% { background-color: transparent; }
        }

        @keyframes highlightPurple {
          0% { background-color: rgba(168, 85, 247, 0.2); }
          70% { background-color: rgba(168, 85, 247, 0.2); }
          100% { background-color: transparent; }
        }

        .animate-highlight-green {
          animation: highlightGreen 5s ease-out forwards;
        }

        .animate-highlight-blue {
          animation: highlightBlue 5s ease-out forwards;
        }

        .animate-highlight-purple {
          animation: highlightPurple 5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StakingDashboard;