import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { GlassButton, SecondaryButton } from "../Buttons";
import StakedNFTCard from "./StakedNFTCard";
import CollectionBonus from "./CollectionBonus";
import useStakingEvents from "../../utils/hooks/useStakingEvents";
import { useWallet } from "@solana/wallet-adapter-react";
import { resolveStakedNftId } from "../../utils/staking-helpers/nft-id-resolver";
import ScrollableTabs from "../common/ScrollableTabs";

// Reducer function definition - located outside the component
const stakingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ANIMATE_STATS':
      return { ...state, animateStats: action.payload };
    case 'SET_WELCOME_GUIDE':
      return { ...state, showWelcomeGuide: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'SET_EXPANDED_VIEW':
      return { ...state, expandedView: action.payload };
    case 'SET_LIVE_UPDATE_ENABLED':
      return { ...state, liveUpdateEnabled: action.payload };
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_STAKES_WITH_IDS':
      return { ...state, stakesWithIds: action.payload };
    case 'ADD_REALTIME_UPDATE':
      const { mintAddress, data } = action.payload;
      // 이전 업데이트가 있는지 확인
      const existingIndex = state.realtimeUpdates.findIndex(item =>
        item.mintAddress === mintAddress
      );

      if (existingIndex >= 0) {
        // 기존 항목 업데이트
        const newUpdates = [...state.realtimeUpdates];
        newUpdates[existingIndex] = {
          ...newUpdates[existingIndex],
          timestamp: Date.now(),
          data: data,
          animateUpdate: true
        };
        return { ...state, realtimeUpdates: newUpdates };
      } else {
        // 새 항목 추가
        return { 
          ...state, 
          realtimeUpdates: [
            {
              mintAddress,
              type: 'stake_update',
              timestamp: Date.now(),
              data,
              animateUpdate: true
            },
            ...state.realtimeUpdates.slice(0, 9) // 마지막 10개 업데이트만 유지
          ]
        };
      }
    case 'ADD_USER_STAKING_UPDATE':
      return { 
        ...state, 
        realtimeUpdates: [
          {
            type: 'user_staking_update',
            timestamp: Date.now(),
            data: action.payload,
            animateUpdate: true
          },
          ...state.realtimeUpdates.slice(0, 9) // 마지막 10개 업데이트만 유지
        ]
      };
    case 'RESET_ANIMATIONS':
      return {
        ...state,
        realtimeUpdates: state.realtimeUpdates.map(update => ({
          ...update,
          animateUpdate: false
        }))
      };
    default:
      return state;
  }
};

// 초기 상태 정의
const initialState = {
  animateStats: false,
  showWelcomeGuide: true,
  sortBy: "newest", // "newest", "oldest", "rewards"
  expandedView: null,
  realtimeUpdates: [],
  liveUpdateEnabled: true,
  stakesWithIds: [], // 비동기 ID 해결을 위한 state
  activeSection: "staked" // Active section for mobile tabs: 'staked', 'stats', 'tiers'
};

/**
 * Enhanced Staking Dashboard Component
 * Displays user's staking statistics and currently staked NFTs with improved UX
 * 
 * Uses useReducer for optimized state management
 */
const StakingDashboard = ({ stats, isLoading, onRefresh }) => {
  // useReducer를 사용하여 관련 상태를 하나로 통합
  const [state, dispatch] = useReducer(stakingReducer, initialState);
  
  // 상태 값을 구조 분해 할당으로 쉽게 접근
  const { 
    animateStats, 
    showWelcomeGuide, 
    sortBy, 
    expandedView, 
    realtimeUpdates, 
    liveUpdateEnabled, 
    stakesWithIds,
    activeSection 
  } = state;
  const { publicKey } = useWallet();
  
  // 스테이킹 NFT의 실제 ID 해결을 위한 useEffect - 무한 렌더링 방지를 위해 최적화
  useEffect(() => {
    if (stats?.activeStakes && stats.activeStakes.length > 0 && !isLoading) {
      console.log(`Filtering valid data from ${stats.activeStakes.length} received staking NFTs`);
      
      // Filter only NFTs with mint addresses - maintain data consistency
      const validStakes = stats.activeStakes.filter(stake => 
        stake.mint_address && stake.mint_address.length > 30
      );
      
      if (validStakes.length !== stats.activeStakes.length) {
        console.log(`Excluded ${stats.activeStakes.length - validStakes.length} invalid staking NFTs`);
      }
      
      // 초기 상태 설정: 기존 ID 또는 null로 설정
      const initialStakes = validStakes.map(stake => ({
        ...stake,
        staked_nft_id: stake.staked_nft_id || stake.nft_id || null,
        nft_id: stake.nft_id || stake.staked_nft_id || null
      }));
      
      // 상태 업데이트는 한 번만 수행
      dispatch({ type: 'SET_STAKES_WITH_IDS', payload: initialStakes });
      
      // 비동기 처리를 위한 함수 - useEffect 내부의 함수는 의존성에 포함되지 않음
      const resolveAllIds = () => {
        // 각 스테이킹 항목에 대해 실제 ID 비동기적으로 조회
        // Promise.all 대신 setTimeout으로 비동기 작업 스케줄링하여 렌더링 블로킹 방지
        setTimeout(() => {
          // 이미 처리된 민트 주소 추적
          const processedMints = {};
          
          initialStakes.forEach(async (stake, index) => {
            try {
              // Prevent duplicate processing
              if (processedMints[stake.mint_address]) return;
              processedMints[stake.mint_address] = true;
              
              // 모든 NFT에 대해 민트 주소에서 ID 결정론적으로 추출
              const realId = await resolveStakedNftId(stake);
              
              // NFT ID 해결 로깅 추가
              console.log(`Staking NFT processed: mint=${stake.mint_address}, resolvedID=${realId}`);
              
              // 실제 ID가 조회되면 state 업데이트 - 컴포넌트가 마운트되어 있는지 확인
              if (realId && document.body.contains(document.getElementById('staking-dashboard'))) {
                // 현재 상태 가져와서 업데이트
                const updatedStakes = [...stakesWithIds];
                
                // 인덱스가 유효한지 확인
                if (index < updatedStakes.length) {
                  updatedStakes[index] = {
                    ...updatedStakes[index],
                    staked_nft_id: realId,
                    nft_id: realId
                  };
                  
                  // 상태 업데이트 디스패치
                  dispatch({ 
                    type: 'SET_STAKES_WITH_IDS', 
                    payload: updatedStakes
                  });
                }
              }
            } catch (err) {
              console.error(`Error resolving NFT ID: ${stake.mint_address}`, err);
            }
          });
        }, 100); // 약간의 지연으로 초기 렌더링 완료 후 실행
      };
      
      // 비동기 함수 실행
      resolveAllIds();
    }
  }, [stats?.activeStakes?.length, isLoading]); // 전체 배열 대신 길이만 의존성에 포함

  // Handle real-time updates from staking events
  const handleStakeAccountUpdate = useCallback((update) => {
    if (!liveUpdateEnabled) return;

    // Handle stake account update
    console.log('Stake account update received:', update);

    // Add update to the realtime updates array using the reducer action
    dispatch({
      type: 'ADD_REALTIME_UPDATE',
      payload: {
        mintAddress: update.mintAddress,
        data: update.data
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

    // Handle user staking update

    // Add update to the realtime updates array using reducer action
    dispatch({
      type: 'ADD_USER_STAKING_UPDATE',
      payload: update.data
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

  // Subscribe to all stake accounts when stats change - 무한 렌더링 방지
  useEffect(() => {
    if (stats?.activeStakes && stats.activeStakes.length > 0 && !isLoading) {
      // 비동기 작업을 별도 함수로 분리
      const setupSubscriptions = () => {
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
          // Separate subscription work with setTimeout to separate from rendering cycle
          setTimeout(() => {
            subscribeToMultipleNFTs(newMints);
          }, 100);
        }
      };
      
      // 비동기 함수 실행
      setupSubscriptions();
    }
  }, [stats?.activeStakes?.length, isLoading, subscribeToMultipleNFTs, activeSubscriptions?.length]);

  // Animate updates after a small delay
  useEffect(() => {
    if (realtimeUpdates.some(update => update.animateUpdate)) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_ANIMATIONS' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [realtimeUpdates]);

  // Trigger number animation when stats change
  useEffect(() => {
    if (stats && !isLoading) {
      dispatch({ type: 'SET_ANIMATE_STATS', payload: true });
      const timer = setTimeout(() => 
        dispatch({ type: 'SET_ANIMATE_STATS', payload: false }), 1500);
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
  const projectedRewards = isLoading ? "--" : ((stats?.stats?.projectedRewards || 0) + "").toLocaleString();
  const earnedToDate = isLoading ? "--" : ((stats?.stats?.earnedToDate || 0) + "").toLocaleString();
  
  // Sort staked NFTs based on selection - function definition kept but now called through useMemo
  const getSortedStakes = () => {
    if (!stats?.activeStakes) return [];
    
    // stakesWithIds에 데이터가 있으면 사용하고, 그렇지 않으면 원본 사용
    const stakesToUse = stakesWithIds.length > 0 ? stakesWithIds : (stats.activeStakes || []);
    
    console.log(`Processed staking NFT IDs: ${stakesToUse.map(s => s.nft_id || 'null').join(', ')}`);
    
    // 정렬은 stakesToUse 사용 (최신 ID 정보 포함)
    switch(sortBy) {
      case "newest":
        return stakesToUse.sort((a, b) => new Date(b.staked_at) - new Date(a.staked_at));
      case "oldest":
        return stakesToUse.sort((a, b) => new Date(a.staked_at) - new Date(b.staked_at));
      case "rewards":
        return stakesToUse.sort((a, b) => b.earned_so_far - a.earned_so_far);
      case "tier":
        return stakesToUse.sort((a, b) => {
          const tierValue = {
            "LEGENDARY": 4,
            "EPIC": 3,
            "RARE": 2,
            "COMMON": 1
          };
          return tierValue[b.nft_tier] - tierValue[a.nft_tier];
        });
      case "id":
        // Sort by NFT ID numerically
        return stakesToUse.sort((a, b) => {
          const aId = parseInt(a.nft_id?.replace(/\D/g, '') || '0', 10);
          const bId = parseInt(b.nft_id?.replace(/\D/g, '') || '0', 10);
          return aId - bId;
        });
      default:
        return stakesToUse;
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
  
  // Calculate tier distribution - memoized for performance with fixed dependencies
  const tierDistribution = useMemo(() => {
    // 기본 초기값 설정
    const defaultDistribution = {
      "LEGENDARY": 0,
      "EPIC": 0,
      "RARE": 0,
      "COMMON": 0
    };
    
    // 데이터가 없으면 기본값 반환
    if (!stats?.activeStakes || !stats.activeStakes.length) {
      return defaultDistribution;
    }
    
    // 분포 계산을 위한 객체 복제
    const distribution = { ...defaultDistribution };
    
    try {
      // 배열 복제 후 작업하여 불변성 유지
      [...stats.activeStakes].forEach(stake => {
        const tier = stake.nft_tier?.toUpperCase() || "COMMON";
        
        if (tier.includes("LEGENDARY")) distribution["LEGENDARY"]++;
        else if (tier.includes("EPIC")) distribution["EPIC"]++;
        else if (tier.includes("RARE")) distribution["RARE"]++;
        else distribution["COMMON"]++;
      });
    } catch (err) {
      console.error("Error calculating tier distribution:", err);
      // 오류 발생 시 기본값 반환
      return defaultDistribution;
    }
    
    return distribution;
  }, [stats?.activeStakes?.length]); // activeStakes 배열 전체가 아닌 길이만 의존성에 포함
  
  // Memoized sorted stakes for better performance with optimized dependencies
  const sortedStakes = useMemo(() => getSortedStakes(), [stakesWithIds.length, stats?.activeStakes?.length, sortBy]);
  
  // Mobile section tabs configuration
  const mobileSectionTabs = [
    { 
      id: "staked", 
      label: "Staked",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      ) 
    },
    { 
      id: "stats", 
      label: "Stats",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      ) 
    },
    { 
      id: "tiers", 
      label: "Tiers",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      ) 
    }
  ];
  
  return (
    <div id="staking-dashboard" className="space-y-6">
      {/* Mobile section tabs - only visible on small screens */}
      <div className="md:hidden mb-4">
        <ScrollableTabs
          tabs={mobileSectionTabs}
          activeTab={activeSection}
          onTabChange={(tabId) => dispatch({ type: 'SET_ACTIVE_SECTION', payload: tabId })}
          colorFrom="purple-600"
          colorTo="blue-600"
        />
      </div>
      {/* Welcome guide for first-time users */}
      {showWelcomeGuide && totalStaked > 0 && (activeSection === "staked" || typeof window !== "undefined" && window.innerWidth >= 768) && (
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30 relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={() => dispatch({ type: 'SET_WELCOME_GUIDE', payload: false })}
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
      
      {/* Stats Cards with Animation - visible always on desktop, but only on stats tab for mobile */}
      {(activeSection === "stats" || activeSection === "staked" || typeof window !== "undefined" && window.innerWidth >= 768) && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 card-grid">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-4 sm:p-5 border border-purple-500/20 backdrop-blur-sm stat-card">
          <div className="flex items-start">
            <div className="bg-purple-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Total Staked NFTs</p>
              <p className={`text-xl sm:text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
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

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 sm:p-5 border border-blue-500/20 backdrop-blur-sm stat-card">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Projected Total Rewards</p>
              <p className={`text-xl sm:text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {projectedRewards}
              </p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 rounded-xl p-4 sm:p-5 border border-pink-500/20 backdrop-blur-sm stat-card">
          <div className="flex items-start">
            <div className="bg-pink-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Earned To Date</p>
              <p className={`text-xl sm:text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {earnedToDate}
              </p>
              <p className="text-xs text-gray-500">TESOLA Tokens</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Collection Bonus Component - visible on stats tab on mobile, always on desktop */}
      {(activeSection === "stats" || typeof window !== "undefined" && window.innerWidth >= 768) && (
        <CollectionBonus stats={stats} />
      )}

      {/* Active Staking Section with Enhanced UI - visible on staked tab on mobile, always on desktop */}
      {(activeSection === "staked" || typeof window !== "undefined" && window.innerWidth >= 768) && (
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Active Staking
          </h3>
          
          {/* Controls wrapping properly on mobile */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {/* Sort dropdown */}
            <div className="relative w-full sm:w-auto mb-2 sm:mb-0 select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => dispatch({ type: 'SET_SORT_BY', payload: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-3 pr-8 text-xs sm:text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 w-full min-h-[44px] interactive-element"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rewards">Highest Rewards</option>
                <option value="tier">By Tier</option>
                <option value="id">By NFT ID</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2 scrollable-x">
              <GlassButton
                size="small"
                onClick={onRefresh}
                disabled={isLoading}
                icon={
                  isLoading ? (
                    <svg className="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  )
                }
              >
                <span className="text-xs">Refresh</span>
              </GlassButton>
              
              {/* 스테이킹 동기화 버튼 추가 */}
              <GlassButton
                size="small"
                onClick={async () => {
                  if (!publicKey) return;
                  
                  try {
                    // 동기화 중 로딩 표시 - 항상 내부 상태만 사용
                    dispatch({ type: 'SET_ANIMATE_STATS', payload: true });
                    
                    // 동기화 전 현재 상태 기록
                    console.log('Currently displayed staking NFTs:', stats?.activeStakes?.length || 0);
                    
                    // 현재 표시된 NFT들의 ID 정보 출력
                    if (stats?.activeStakes && stats.activeStakes.length > 0) {
                      console.log('Currently displayed NFT info:', stats.activeStakes.map(stake => ({
                        id: stake.id,
                        mint: stake.mint_address,
                        nft_id: stake.nft_id,
                        staked_nft_id: stake.staked_nft_id,
                        nft_name: stake.nft_name
                      })));
                    }
                    
                    // 새로 추가한 강제 동기화 API 사용
                    console.log('강제 동기화 API 호출 시도...');
                    const response = await fetch("/api/force-sync", {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        wallet: publicKey.toString()
                      })
                    });
                    
                    const data = await response.json();
                    console.log("강제 동기화 결과:", data);
                    
                    if (data.success) {
                      console.log(`Successfully synchronized ${data.stakedCount} NFTs`);
                      console.log('Synchronized NFT info:', data.stakedNFTs);
                    } else {
                      console.error('Error during synchronization:', data.error || 'Unknown error');
                      alert('동기화 중 오류가 발생했습니다. 다시 시도해주세요.');
                    }
                    
                    // 동기화 완료 후 데이터 새로고침
                    if (onRefresh && typeof onRefresh === 'function') {
                      // 약간의 지연 후 새로고침 (DB 업데이트가 완료되도록)
                      setTimeout(() => {
                        onRefresh();
                        console.log('Data refresh completed');
                      }, 1000);
                    }
                  } catch (err) {
                    console.error("Sync error:", err);
                    alert('동기화 중 오류가 발생했습니다. 다시 시도해주세요.');
                  } finally {
                    // 로딩 상태 해제 - 항상 내부 상태만 사용
                    dispatch({ type: 'SET_ANIMATE_STATS', payload: false });
                  }
                }}
                disabled={isLoading || !publicKey}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                  </svg>
                }
              >
                <span className="text-xs">Sync</span>
              </GlassButton>

              {/* Live Updates Toggle */}
              <button
                onClick={() => dispatch({ type: 'SET_LIVE_UPDATE_ENABLED', payload: !liveUpdateEnabled })}
                className={`px-3 py-2 rounded-md text-xs flex items-center border min-h-[38px] ${
                  liveUpdateEnabled
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : 'bg-gray-800/30 border-gray-700/30 text-gray-400'
                }`}
              >
                <div className={`h-2 w-2 rounded-full mr-1 ${liveUpdateEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-xs">{liveUpdateEnabled ? 'Live' : 'Paused'}</span>
              </button>
              
              <GlassButton
                size="small"
                onClick={() => {
                  // Switch to NFTs tab
                  document.querySelector('[aria-controls="nfts"]')?.click();
                }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                }
              >
                <span className="text-xs">Stake More</span>
              </GlassButton>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <div className="text-sm text-gray-400 animate-pulse">Loading staked NFTs...</div>
          </div>
        ) : sortedStakes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 card-grid">
            {sortedStakes.map((stake) => {
              // 정적 값 사용하여 무한 렌더링 방지
              const stakeId = stake.id;
              
              return (
                <StakedNFTCard
                  key={stakeId}
                  stake={{
                    ...stake,
                    // 온체인 데이터 기반 처리 표시
                    _source: 'StakingDashboard-card-onchain',
                    // 캐시 버스팅 추가 - 정적 값 사용 (문자열 접두사 추가로 타입 안정성 확보)
                    _cacheBust: `stake-${stakeId}`,
                    // 메타데이터 전달
                    metadata: stake.metadata,
                    // 실제 NFT 데이터 사용 강제
                    using_actual_nft_data: true,
                    // 해시 기반으로 결정론적으로 생성된 NFT ID 사용
                    staked_nft_id: stake.staked_nft_id,
                    // 환경 변수 전달
                    NEXT_PUBLIC_IMAGES_CID: process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike',
                    NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud'
                  }}
                  onRefresh={onRefresh}
                  isExpanded={expandedView === stakeId}
                  onToggleExpand={() => {
                    dispatch({ type: 'SET_EXPANDED_VIEW', payload: expandedView === stakeId ? null : stakeId });
                  }}
                />
              );
            })}
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
      )}

      {/* Live Updates Feed Section - visible on stats tab on mobile, always on desktop */}
      {(activeSection === "stats" || typeof window !== "undefined" && window.innerWidth >= 768) && (
        <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Real-time Updates
            </h3>
            <div className="flex items-center gap-2 text-xxs sm:text-xs">
              <div className="text-gray-400">
                <span className="font-medium">{activeSubscriptions.length}</span> active subscriptions
              </div>
              {isSubscribing && (
                <div className="text-blue-400 flex items-center">
                  <svg className="animate-spin mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subscribing...
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            {realtimeUpdates.length > 0 ? (
              realtimeUpdates.map((update, index) => {
                // Different styling for different update types
                let color = 'blue';
                let icon = (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                );

                if (update.type === 'stake_update') {
                  color = 'green';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  );
                } else if (update.type === 'user_staking_update') {
                  color = 'purple';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  );
                }

                return (
                  <div
                    key={`${update.type}-${index}`}
                    className={`p-2 sm:p-3 rounded-lg border ${
                      update.animateUpdate
                        ? `animate-highlight-${color} border-${color}-500/40`
                        : `bg-gray-900/40 border-gray-700/30`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className={`text-${color}-400 flex items-center mt-0.5 flex-shrink-0`}>
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-white truncate">
                            {update.type === 'stake_update'
                              ? `NFT Update: ${update.mintAddress.slice(0, 4)}...${update.mintAddress.slice(-4)}`
                              : 'User Staking Update'
                            }
                          </div>
                          <div className="text-xxs sm:text-xs text-gray-400 truncate">
                            {update.type === 'stake_update' && (
                              <>
                                {update.data.isStaked
                                  ? `Staked: ${new Date(update.data.stakedAt * 1000).toLocaleDateString()}`
                                  : 'Not staked'
                                }
                                {update.data.currentTimeMultiplier > 0 &&
                                  ` • +${update.data.currentTimeMultiplier / 100}%`
                                }
                              </>
                            )}
                            {update.type === 'user_staking_update' && (
                              <>
                                Staked NFTs: {update.data.stakedCount}
                                {update.data.collectionBonus > 0 &&
                                  ` • +${update.data.collectionBonus / 100}%`
                                }
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xxs sm:text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-2 sm:py-3 bg-gray-900/30 rounded-lg text-gray-400 text-xs sm:text-sm">
                {liveUpdateEnabled
                  ? 'Waiting for real-time updates...'
                  : 'Updates paused. Enable real-time updates to see changes.'}
              </div>
            )}
          </div>

          <div className="text-xxs sm:text-xs text-gray-400">
            <p>Real-time updates are enabled for your staked NFTs. You'll see live data when values change on the blockchain.</p>
          </div>
        </div>
      )}

      {/* Staking Tiers Info with Visual Enhancement - visible on tiers tab on mobile, always on desktop */}
      {(activeSection === "tiers" || typeof window !== "undefined" && window.innerWidth >= 768) && (
        <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Staking Rewards by NFT Tier
          </h3>
          
          {/* Mobile swipe hint - only shown on small screens */}
          <div className="swipe-hint md:hidden flex items-center text-xs text-gray-400 mb-3 py-2 px-3 bg-gray-800/30 rounded-lg interactive-element">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Swipe horizontally to see all data</span>
          </div>
          
          {/* Mobile card view - visible on mobile only */}
          <div className="block md:hidden space-y-4 mb-4 mobile-cards">
            {/* Legendary Tier Card */}
            <div className="bg-gray-900/40 rounded-lg border border-yellow-500/20 overflow-hidden">
              <div className="bg-yellow-900/30 p-3 border-b border-yellow-500/20">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="font-medium text-yellow-300">Legendary</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Daily:</span>
                  <span className="font-medium text-white">200</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Weekly:</span>
                  <span className="text-gray-300">1,400</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Monthly:</span>
                  <span className="text-gray-300">6,000</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Yearly:</span>
                  <span className="text-gray-300">73,000</span>
                </div>
              </div>
            </div>
            
            {/* Epic Tier Card */}
            <div className="bg-gray-900/40 rounded-lg border border-purple-500/20 overflow-hidden">
              <div className="bg-purple-900/30 p-3 border-b border-purple-500/20">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                  <span className="font-medium text-purple-300">Epic</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Daily:</span>
                  <span className="font-medium text-white">100</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Weekly:</span>
                  <span className="text-gray-300">700</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Monthly:</span>
                  <span className="text-gray-300">3,000</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Yearly:</span>
                  <span className="text-gray-300">36,500</span>
                </div>
              </div>
            </div>
            
            {/* Rare Tier Card */}
            <div className="bg-gray-900/40 rounded-lg border border-blue-500/20 overflow-hidden">
              <div className="bg-blue-900/30 p-3 border-b border-blue-500/20">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <span className="font-medium text-blue-300">Rare</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Daily:</span>
                  <span className="font-medium text-white">50</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Weekly:</span>
                  <span className="text-gray-300">350</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Monthly:</span>
                  <span className="text-gray-300">1,500</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Yearly:</span>
                  <span className="text-gray-300">18,250</span>
                </div>
              </div>
            </div>
            
            {/* Common Tier Card */}
            <div className="bg-gray-900/40 rounded-lg border border-green-500/20 overflow-hidden">
              <div className="bg-green-900/30 p-3 border-b border-green-500/20">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="font-medium text-green-300">Common</span>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Daily:</span>
                  <span className="font-medium text-white">25</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Weekly:</span>
                  <span className="text-gray-300">175</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Monthly:</span>
                  <span className="text-gray-300">750</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-400">Yearly:</span>
                  <span className="text-gray-300">9,125</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop table view - hidden on mobile */}
          <div className="hidden md:block overflow-x-auto table-container scrollable-x">
            <table className="w-full text-sm keep-structure">
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
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-purple-900/20 rounded-lg border border-purple-500/10">
            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Bonus Rewards
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3 scrollable-x">
              <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
                <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">First 7 days</p>
                <div className="text-xs sm:text-sm font-medium text-green-300">+100% (2x rewards)</div>
              </div>
              <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
                <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Long-term (30+ days)</p>
                <div className="text-xs sm:text-sm font-medium text-green-300">+20% to +100% bonus</div>
              </div>
              <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
                <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Monthly airdrops</p>
                <div className="text-xs sm:text-sm font-medium text-green-300">For 30+ day stakers</div>
              </div>
            </div>
          </div>
        </div>
      )}

        <style jsx>{`
          .text-xxs {
            font-size: 0.65rem;
            line-height: 1rem;
          }
          
          /* Mobile touch optimizations */
          @media (max-width: 640px) {
            button, a, select, input {
              min-height: 44px;
              min-width: 44px;
            }
            
            .table-container {
              -webkit-overflow-scrolling: touch;
              scroll-behavior: smooth;
            }
            
            .keep-structure {
              table-layout: fixed;
              min-width: 600px;
            }
          }
        `}</style>

      {/* Staking Tiers Info with Visual Enhancement */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Staking Rewards by NFT Tier
        </h3>
        
        {/* Mobile swipe hint - only shown on small screens */}
        <div className="swipe-hint md:hidden flex items-center text-xs text-gray-400 mb-3 py-2 px-3 bg-gray-800/30 rounded-lg interactive-element">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Swipe horizontally to see all data</span>
        </div>
        
        {/* Mobile card view - visible on mobile only */}
        <div className="block md:hidden space-y-4 mb-4 mobile-cards">
          {/* Legendary Tier Card */}
          <div className="bg-gray-900/40 rounded-lg border border-yellow-500/20 overflow-hidden">
            <div className="bg-yellow-900/30 p-3 border-b border-yellow-500/20">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <span className="font-medium text-yellow-300">Legendary</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Daily:</span>
                <span className="font-medium text-white">200</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Weekly:</span>
                <span className="text-gray-300">1,400</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-gray-300">6,000</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Yearly:</span>
                <span className="text-gray-300">73,000</span>
              </div>
            </div>
          </div>
          
          {/* Epic Tier Card */}
          <div className="bg-gray-900/40 rounded-lg border border-purple-500/20 overflow-hidden">
            <div className="bg-purple-900/30 p-3 border-b border-purple-500/20">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                <span className="font-medium text-purple-300">Epic</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Daily:</span>
                <span className="font-medium text-white">100</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Weekly:</span>
                <span className="text-gray-300">700</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-gray-300">3,000</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Yearly:</span>
                <span className="text-gray-300">36,500</span>
              </div>
            </div>
          </div>
          
          {/* Rare Tier Card */}
          <div className="bg-gray-900/40 rounded-lg border border-blue-500/20 overflow-hidden">
            <div className="bg-blue-900/30 p-3 border-b border-blue-500/20">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="font-medium text-blue-300">Rare</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Daily:</span>
                <span className="font-medium text-white">50</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Weekly:</span>
                <span className="text-gray-300">350</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-gray-300">1,500</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Yearly:</span>
                <span className="text-gray-300">18,250</span>
              </div>
            </div>
          </div>
          
          {/* Common Tier Card */}
          <div className="bg-gray-900/40 rounded-lg border border-green-500/20 overflow-hidden">
            <div className="bg-green-900/30 p-3 border-b border-green-500/20">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="font-medium text-green-300">Common</span>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Daily:</span>
                <span className="font-medium text-white">25</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Weekly:</span>
                <span className="text-gray-300">175</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Monthly:</span>
                <span className="text-gray-300">750</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-400">Yearly:</span>
                <span className="text-gray-300">9,125</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop table view - hidden on mobile */}
        <div className="hidden md:block overflow-x-auto table-container scrollable-x">
          <table className="w-full text-sm keep-structure">
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
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-purple-900/20 rounded-lg border border-purple-500/10">
          <h4 className="text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            Bonus Rewards
          </h4>
          <div className="flex flex-wrap gap-2 sm:gap-3 scrollable-x">
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
              <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">First 7 days</p>
              <div className="text-xs sm:text-sm font-medium text-green-300">+100% (2x rewards)</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
              <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Long-term (30+ days)</p>
              <div className="text-xs sm:text-sm font-medium text-green-300">+20% to +100% bonus</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded flex-1 min-w-[100px] sm:min-w-[140px]">
              <p className="text-xxs sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Monthly airdrops</p>
              <div className="text-xs sm:text-sm font-medium text-green-300">For 30+ day stakers</div>
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
        
        /* Enhanced mobile optimization */
        @media (max-width: 640px) {
          button, a, select, input, .interactive-element {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Not all buttons/links should be flex containers */
          button:not(.no-flex), a:not(.no-flex), .interactive-element:not(.no-flex) {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .table-container {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            overflow-x: auto;
            width: 100%;
            position: relative;
          }
          
          .swipe-hint {
            padding: 8px 12px;
            background: rgba(75, 85, 99, 0.3);
            border-radius: 8px;
            margin-bottom: 12px;
          }
          
          .card-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .stat-card {
            padding: 14px;
          }
          
          /* Improve scrollable containers */
          .scrollable-x {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            margin-bottom: -4px; /* Compensate for padding */
          }
          
          .scrollable-x > * {
            scroll-snap-align: start;
          }
          
          /* Hide scrollbars on mobile for cleaner UI */
          .scrollable-x::-webkit-scrollbar {
            display: none;
          }
          
          .scrollable-x {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default StakingDashboard;