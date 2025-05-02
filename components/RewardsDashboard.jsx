"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import ErrorMessage from "./ErrorMessage";
import { claimRewards } from "../utils/rewards";

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
      const res = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch rewards: ${res.status}`);
      }
      
      const data = await res.json();
      setRewardData(data);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // 스테이킹 데이터 가져오기
  useEffect(() => {
    const fetchStakingData = async () => {
      if (!connected || !publicKey) return;
      
      try {
        const res = await fetch(`/api/getStakingStats?wallet=${publicKey.toString()}`);
        if (!res.ok) {
          console.error('Failed to fetch staking stats');
          return;
        }
        
        const { activeStakes, stats } = await res.json();
        setActiveStakes(activeStakes || []);
        setStakingStats(stats || {
          totalStaked: 0,
          projectedRewards: 0,
          earnedToDate: 0
        });
      } catch (err) {
        console.error('Error fetching staking data:', err);
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
      setError(error.message);
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
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">{stake.nft_name || `SOLARA #${stake.mint_address.slice(0, 4)}`}</div>
                            <div className="text-sm text-blue-400">{`${daysRemaining} days remaining`}</div>
                          </div>
                          
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Staking Period:</span>
                            <span>{stake.staking_period} days</span>
                          </div>
                          
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">NFT Tier:</span>
                            <span className={
                              stake.nft_tier === 'Legendary' ? 'text-yellow-400' :
                              stake.nft_tier === 'Rare' ? 'text-purple-400' :
                              stake.nft_tier === 'Uncommon' ? 'text-blue-400' :
                              'text-green-400'
                            }>{stake.nft_tier}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Rewards:</span>
                            <span className="text-yellow-400">{stake.total_rewards} TESOLA</span>
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