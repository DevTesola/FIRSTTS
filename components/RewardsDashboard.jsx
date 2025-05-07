"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ErrorMessage from "./ErrorMessage";
import EnhancedProgressiveImage from "./EnhancedProgressiveImage";
import { claimRewards } from "../utils/rewards";
import { createPlaceholder } from "../utils/mediaUtils";
import { fetchAPI, getErrorMessage } from "../utils/apiClient";
import { getNFTImageUrl, getNFTName, getNFTTier, getTierStyles } from "../utils/nftImageUtils";

/**
 * 개선된 TESOLA 리워드 대시보드 컴포넌트
 * 
 * @param {boolean} minimal - 최소화된 보기 모드 (기본: false)
 * @param {function} onClaim - 청구 버튼 클릭 시 호출할 콜백
 * @param {string} className - 추가할 CSS 클래스
 */
export default function RewardsDashboard({ minimal = false, onClaim, className = "" }) {
  const { publicKey, connected } = useWallet();
  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [activeStakes, setActiveStakes] = useState([]);
  const [stakingStats, setStakingStats] = useState({
    totalStaked: 0,
    projectedRewards: 0,
    earnedToDate: 0
  });

  // 리워드 데이터 가져오기
  const fetchRewards = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 표준화된 API 클라이언트 사용
      const data = await fetchAPI('/api/getRewards', { wallet: publicKey.toString() });
      setRewardData(data);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      // 표준화된 에러 메시지 처리
      setError(getErrorMessage(err, 'Failed to fetch rewards data'));
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // 스테이킹 데이터 가져오기
  useEffect(() => {
    const fetchStakingData = async () => {
      if (!connected || !publicKey) return;
      
      try {
        // 캐시 방지 및 표준화된 API 클라이언트 사용
        const data = await fetchAPI('/api/getStakingStats', 
          { wallet: publicKey.toString() }, 
          { noCache: true }
        );
        
        // 응답 구조 로깅 - 디버깅용
        console.log("Raw API response structure:", JSON.stringify(data, null, 2).substring(0, 500) + "...");
        
        // 응답 형식에 맞게 데이터 추출
        // 새 API 응답 형식은 {success: true, data: {activeStakes, stats}} 이거나
        // 이전 형식인 {activeStakes, stats} 일 수 있음
        const responseData = data.success && data.data ? data.data : data;
        
        // 로그 제거 - 콘솔 출력 줄이기
        const { activeStakes, stats } = responseData;
        
        // Enhanced validation to prevent component crashes and ensure image fields with better IPFS handling
        const normalizedStakes = (activeStakes || []).filter(stake => 
          // Ensure basic required fields are present
          stake && typeof stake === 'object' && 
          (stake.id || stake.mint_address) // Must have at least an ID
        ).map(stake => {
          // First, ensure image fields are properly propagated if any exists
          const imageFields = {};
          
          // Determine image type and set proper priority
          const ipfsImages = []; // IPFS protocol URLs (highest priority)
          const gatewayImages = []; // IPFS gateway URLs (medium priority)
          const localImages = []; // Local images (lowest priority)
          const otherImages = []; // Other HTTP URLs
          
          // Process image field - used in RewardsDashboard 
          if (stake.image) {
            if (stake.image.startsWith('ipfs://')) {
              ipfsImages.push(stake.image);
            } else if (stake.image.includes('/ipfs/')) {
              gatewayImages.push(stake.image);
            } else if (stake.image.startsWith('/')) {
              localImages.push(stake.image);
            } else {
              otherImages.push(stake.image);
            }
          }
          
          // Process image_url field
          if (stake.image_url) {
            if (stake.image_url.startsWith('ipfs://')) {
              ipfsImages.push(stake.image_url);
            } else if (stake.image_url.includes('/ipfs/')) {
              gatewayImages.push(stake.image_url);
            } else if (stake.image_url.startsWith('/')) {
              localImages.push(stake.image_url);
            } else {
              otherImages.push(stake.image_url);
            }
          }
          
          // Process nft_image field
          if (stake.nft_image) {
            if (stake.nft_image.startsWith('ipfs://')) {
              ipfsImages.push(stake.nft_image);
            } else if (stake.nft_image.includes('/ipfs/')) {
              gatewayImages.push(stake.nft_image);
            } else if (stake.nft_image.startsWith('/')) {
              localImages.push(stake.nft_image);
            } else {
              otherImages.push(stake.nft_image);
            }
          }
          
          // Process metadata.image field
          if (stake.metadata?.image) {
            if (stake.metadata.image.startsWith('ipfs://')) {
              ipfsImages.push(stake.metadata.image);
            } else if (stake.metadata.image.includes('/ipfs/')) {
              gatewayImages.push(stake.metadata.image);
            } else if (stake.metadata.image.startsWith('/')) {
              localImages.push(stake.metadata.image);
            } else {
              otherImages.push(stake.metadata.image);
            }
          }
          
          // Process ipfs_hash field to create IPFS URL
          if (stake.ipfs_hash) {
            ipfsImages.push(`ipfs://${stake.ipfs_hash}`);
          }
          
          // If no image found, generate IPFS URL from mint address
          if (ipfsImages.length === 0 && gatewayImages.length === 0 && 
              otherImages.length === 0 && stake.mint_address) {
            const ipfsHash = `QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3/${stake.mint_address}`;
            ipfsImages.push(`ipfs://${ipfsHash}`);
          }
          
          // Select best images in order of priority
          if (ipfsImages.length > 0) {
            imageFields.image_url = ipfsImages[0]; // Best IPFS URL
            
            // Also include ipfs_hash if we have it
            if (stake.ipfs_hash) {
              imageFields.ipfs_hash = stake.ipfs_hash;
            } else if (ipfsImages[0].startsWith('ipfs://')) {
              // Extract hash from ipfs:// URL
              imageFields.ipfs_hash = ipfsImages[0].replace('ipfs://', '').split('/')[0];
            }
          } else if (gatewayImages.length > 0) {
            imageFields.image_url = gatewayImages[0]; // Gateway URL
          } else if (otherImages.length > 0) {
            imageFields.image_url = otherImages[0]; // Other HTTP URL
          }
          
          // Still preserve local image as fallback, but with lower priority
          if (localImages.length > 0) {
            imageFields.local_image = localImages[0];
          }
          
          // 디버그 로그는 주석 처리 (필요시 다시 활성화)
          /*
          console.log(`RewardsDashboard - enhanced stake data for ${stake.id || stake.mint_address}:`, {
            ipfsImages: ipfsImages.length > 0 ? ipfsImages[0] : null,
            gatewayImages: gatewayImages.length > 0 ? gatewayImages[0] : null,
            localImages: localImages.length > 0 ? localImages[0] : null,
            otherImages: otherImages.length > 0 ? otherImages[0] : null,
            selectedImage: imageFields.image_url || imageFields.local_image || null,
            mint_address: stake.mint_address,
            original_image_fields: {
              image: stake.image,
              image_url: stake.image_url,
              nft_image: stake.nft_image,
              ipfs_hash: stake.ipfs_hash,
              metadata_image: stake.metadata?.image
            }
          });
          */
          
          // Ensure all required fields have default values + normalize image fields
          return {
            id: stake.id || stake.mint_address || `unknown-${Math.random().toString(36).substr(2, 9)}`,
            mint_address: stake.mint_address || stake.id || 'unknown-mint',
            nft_name: stake.nft_name || stake.name || "SOLARA NFT",
            nft_tier: stake.nft_tier || stake.tier || "Common",
            staked_at: stake.staked_at || new Date().toISOString(),
            release_date: stake.release_date || new Date(Date.now() + 30*86400000).toISOString(), // Default 30 days
            progress_percentage: stake.progress_percentage || 0,
            earned_so_far: stake.earned_so_far || 0,
            total_rewards: stake.total_rewards || 100,
            
            // Add prioritized image fields
            ...imageFields,
            
            // Keep original image properties but rename them to avoid confusion
            // with our normalized fields for components that might still use old field names
            original_image: stake.image,
            
            // Preserve all other original properties
            ...stake
          };
        });
        
        // Set normalized data
        setActiveStakes(normalizedStakes);
        setStakingStats(stats || {
          totalStaked: 0,
          projectedRewards: 0,
          earnedToDate: 0
        });
        
        // 데이터 설정 후 상태 로깅 - 디버깅용
        console.log('RewardsDashboard - activeStakes 상태 설정 완료:', activeStakes?.length || 0);
      } catch (err) {
        console.error('Error fetching staking data:', err);
        setError(getErrorMessage(err, 'Failed to fetch staking data'));
      }
    };
    
    fetchStakingData();
  }, [publicKey, connected]);

  // 지갑 연결 시 리워드 데이터 가져오기
  useEffect(() => {
    if (connected && publicKey) {
      fetchRewards();
    } else {
      // 지갑 연결이 끊기면 데이터 초기화
      setRewardData(null);
    }
  }, [publicKey, connected, fetchRewards]);

  // 리워드 청구 핸들러
  const handleClaimRewards = async () => {
    if (!connected || !publicKey || !rewardData || rewardData.totalRewards <= 0) {
      return;
    }
    
    setClaimLoading(true);
    try {
      // 표준화된 API 클라이언트를 통한 리워드 청구
      await claimRewards(publicKey.toString());
      
      // 리워드 데이터 업데이트
      setRewardData({
        ...rewardData,
        totalRewards: 0,
        claimableRewards: []
      });
      
      // 사용자 정의 콜백 호출
      if (onClaim) {
        onClaim({ 
          claimed: true, 
          amount: rewardData.totalRewards 
        });
      }
      
      // 청구 성공 메시지 표시
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 5000);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      // 표준화된 에러 메시지 처리
      setError(getErrorMessage(error, 'Failed to claim rewards'));
    } finally {
      setClaimLoading(false);
    }
  };

  // 등급별 색상 클래스 매핑
  const getTierColors = (amount) => {
    if (amount >= 50) return "from-yellow-500 to-amber-500";
    if (amount >= 25) return "from-purple-500 to-indigo-500";
    if (amount >= 10) return "from-blue-500 to-cyan-500";
    return "from-green-500 to-emerald-500";
  };
  
  // 다음 등급까지 남은 토큰 계산
  const getNextTierInfo = (amount) => {
    if (amount >= 50) return { next: null, remaining: 0 };
    if (amount >= 25) return { next: 50, remaining: 50 - amount };
    if (amount >= 10) return { next: 25, remaining: 25 - amount };
    return { next: 10, remaining: 10 - amount };
  };

  // 미니멀 모드일 때 간단한 버전 렌더링
  if (minimal) {
    if (!connected) return null;
    
    return (
      <div className={`bg-purple-900/30 p-3 rounded-xl flex items-center ${className}`}>
        <div className="mr-4">
          <p className="text-sm text-gray-300">Available Rewards:</p>
          <p className="text-xl font-bold text-yellow-400">{rewardData?.totalRewards || 0} TESOLA</p>
        </div>
        <button
          onClick={handleClaimRewards}
          disabled={claimLoading || !rewardData?.totalRewards}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg disabled:opacity-50 transition-colors"
          aria-label="Claim all available TESOLA rewards"
        >
          {claimLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : 'Claim All'}
        </button>
      </div>
    );
  }

  // 리워드 대시보드 본문
  return (
    <div className={`bg-gray-900 border border-purple-500/30 rounded-xl overflow-hidden shadow-xl ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          TESOLA Rewards Dashboard
        </h2>
        
        {!connected && (
          <div className="text-center py-8 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300 mb-2">Connect your wallet to view your rewards</p>
          </div>
        )}
        
        {error && (
          <ErrorMessage 
            message={error}
            type="error"
            onRetry={fetchRewards}
            onDismiss={() => setError(null)}
          />
        )}
        
        {loading && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300">Loading your rewards...</p>
          </div>
        )}
        
        {connected && !loading && !error && rewardData && (
          <>
            {/* 청구 성공 메시지 */}
            {justClaimed && (
              <div className="mb-4 bg-green-900/30 border border-green-500/50 p-3 rounded-lg text-green-300 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Rewards claimed successfully!</p>
                  <p className="text-sm">Your TESOLA tokens will be sent to your wallet soon.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 총 보유 토큰 */}
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-3xl font-bold text-yellow-400">
                    {rewardData.rewardHistory ? rewardData.rewardHistory.reduce((sum, r) => sum + r.amount, 0) : 0}
                  </span>
                  <span className="text-yellow-500 ml-1">TESOLA</span>
                </div>
              </div>
              
              {/* 청구 가능한 토큰 */}
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Available to Claim</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-3xl font-bold text-green-400">
                    {rewardData.totalRewards || 0}
                  </span>
                  <span className="text-green-500 ml-1">TESOLA</span>
                </div>
              </div>
              
              {/* 이미 청구한 토큰 */}
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Already Claimed</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-3xl font-bold text-purple-400">
                    {rewardData.rewardHistory ? 
                      rewardData.rewardHistory.filter(r => r.claimed).reduce((sum, r) => sum + r.amount, 0) : 0}
                  </span>
                  <span className="text-purple-500 ml-1">TESOLA</span>
                </div>
              </div>
            </div>
            
            {/* 리워드 진행 상황 */}
            {rewardData.rewardHistory && rewardData.rewardHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Rewards Progress</h3>
                
                {/* 총 토큰 */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Total TESOLA Tokens</span>
                    <span className="text-sm font-medium text-white">
                      {rewardData.rewardHistory.reduce((sum, r) => sum + r.amount, 0)}
                    </span>
                  </div>
                  
                  {/* 프로그레스 바 */}
                  {(() => {
                    const totalAmount = rewardData.rewardHistory.reduce((sum, r) => sum + r.amount, 0);
                    const tierColors = getTierColors(totalAmount);
                    const { next, remaining } = getNextTierInfo(totalAmount);
                    
                    // 최고 등급 달성 여부
                    const isMaxTier = !next;
                    
                    return (
                      <div className="relative">
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${tierColors} rounded-full`}
                            style={{ width: isMaxTier ? '100%' : `${(totalAmount / next) * 100}%` }}
                          ></div>
                        </div>
                        
                        {/* 등급 표시 */}
                        {!isMaxTier ? (
                          <div className="mt-1 text-xs text-gray-400">
                            Next tier: {next} TESOLA ({remaining} more tokens needed)
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-yellow-400">
                            Maximum tier reached! 🎉
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* 스테이킹 섹션 */}
            {activeStakes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">NFT Staking</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Total NFTs Staked */}
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm mb-1">NFTs Staked</p>
                    <div className="flex justify-center items-baseline">
                      <span className="text-3xl font-bold text-indigo-400">
                        {stakingStats.totalStaked}
                      </span>
                      <span className="text-indigo-500 ml-1">NFTs</span>
                    </div>
                  </div>
                  
                  {/* Projected Rewards */}
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm mb-1">Projected Rewards</p>
                    <div className="flex justify-center items-baseline">
                      <span className="text-3xl font-bold text-blue-400">
                        {stakingStats.projectedRewards}
                      </span>
                      <span className="text-blue-500 ml-1">TESOLA</span>
                    </div>
                  </div>
                  
                  {/* Earned To Date */}
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-400 text-sm mb-1">Earned To Date</p>
                    <div className="flex justify-center items-baseline">
                      <span className="text-3xl font-bold text-green-400">
                        {stakingStats.earnedToDate}
                      </span>
                      <span className="text-green-500 ml-1">TESOLA</span>
                    </div>
                  </div>
                </div>
                
                {/* Active Stakes */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="p-4 bg-indigo-900/30 border-b border-indigo-800">
                    <h4 className="font-medium">Active Staking Positions</h4>
                  </div>
                  
                  <div className="divide-y divide-gray-700">
                    {activeStakes.map(stake => {
                      // Calculate days remaining
                      const releaseDate = new Date(stake.release_date);
                      const now = new Date();
                      const daysRemaining = Math.max(0, Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <div key={stake.id} className="p-4 hover:bg-gray-750 transition-colors">
                          <div className="flex items-start mb-2">
                            {/* NFT Image - Always display with placeholder fallback */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden mr-3 border border-gray-700 flex-shrink-0">
                              {/* NFT 이미지 표시 - 개선된 EnhancedProgressiveImage 사용 & 중앙화된 유틸리티 함수 사용 */}
                              <EnhancedProgressiveImage 
                                src={getNFTImageUrl({
                                  ...stake,
                                  id: stake.id || stake.mint_address,
                                  mint: stake.mint_address,
                                  name: getNFTName(stake),
                                  image: stake.image,
                                  image_url: stake.image_url,
                                  ipfs_hash: stake.ipfs_hash,
                                  __source: 'RewardsDashboard-staked-nft'
                                })}
                                alt={getNFTName(stake)}
                                className="w-full h-full"
                                preferRemote={true}
                                highQuality={true}
                                placeholder={createPlaceholder(getNFTName(stake))}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-medium">{getNFTName(stake)}</div>
                                <div className="text-sm text-blue-400">{`${daysRemaining} days remaining`}</div>
                              </div>
                              
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Staking Period:</span>
                                <span>{stake.staking_period} days</span>
                              </div>
                              
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">NFT Tier:</span>
                                <span className={getTierStyles(stake).text}>
                                  {getNFTTier(stake)}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Rewards:</span>
                                <span className="text-yellow-400">{stake.total_rewards} TESOLA</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{stake.progress_percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500" 
                                style={{width: `${stake.progress_percentage}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* 청구 가능한 리워드 목록 */}
            {rewardData.claimableRewards && rewardData.claimableRewards.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Claimable Rewards</h3>
                <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                  {rewardData.claimableRewards.map((reward, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{reward.amount} TESOLA</p>
                        <p className="text-sm text-gray-400">
                          {reward.description || 
                            `Reward for ${reward.reward_type.replace('_', ' ')}`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleClaimRewards}
                    disabled={claimLoading || rewardData.totalRewards <= 0}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center"
                    aria-label="Claim all available TESOLA rewards"
                  >
                    {claimLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Claim All Rewards'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-6 text-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a4 4 0 00-4-4H8.8a4 4 0 00-3.6 2.3A4 4 0 001 6a1 1 0 001 1h1.7a4 4 0 003.6-2.3A4 4 0 0011 2h1a4 4 0 014 4v2h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V10a1 1 0 00-1-1h-1v13h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3" />
                </svg>
                <p className="text-gray-300">No claimable rewards at the moment</p>
                <p className="text-sm text-gray-500 mt-2">Share your NFTs to earn TESOLA tokens!</p>
              </div>
            )}
            
            {/* 리워드 획득 방법 안내 */}
            <div className="bg-purple-900/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-purple-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                How to Earn More TESOLA
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Share your NFTs on Twitter after minting: <strong>+5 TESOLA</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Share from My Collection page: <strong>+5 TESOLA</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Share from Transactions page: <strong>+5 TESOLA</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Share on Telegram: <strong>+5 TESOLA</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Stake your NFTs: <strong>+10 TESOLA per week</strong></span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}