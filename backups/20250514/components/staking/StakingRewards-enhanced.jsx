import React, { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { PrimaryButton } from "../Buttons";
import EnhancedProgressiveImage from "../EnhancedProgressiveImage";
import { createPlaceholder } from "../../utils/mediaUtils";
import { prepareClaimRewards, completeClaimRewards } from "../../services/stakingService";
import { REWARD_MULTIPLIERS, STAKING_PERIOD_BONUS } from "../../utils/staking-helpers/constants";

/**
 * StakingRewards Component
 * Displays staking rewards information and claim interface
 */
const StakingRewards = ({ stats, isLoading }) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [selectedStake, setSelectedStake] = useState(null);

  // Calculate rewards for display
  const totalEarned = isLoading ? "--" : (stats?.stats?.earnedToDate || 0);
  const claimableRewards = Math.floor(totalEarned); // Assuming whole numbers for claims

  // Get the first NFT for display if none selected
  useEffect(() => {
    if (!selectedStake && stats?.activeStakes?.length > 0) {
      setSelectedStake(stats.activeStakes[0]);
    }
  }, [stats, selectedStake]);
  
  // Calculate boost information for dynamic reward booster
  const boostInfo = useMemo(() => {
    if (!selectedStake) return null;
    
    // Calculate days staked
    const stakedDate = new Date(selectedStake.staked_at);
    const currentDate = new Date();
    const daysStaked = Math.floor((currentDate - stakedDate) / (1000 * 60 * 60 * 24));
    
    // Time-based multiplier periods (30-day periods)
    const multiplierPeriods = Math.floor(daysStaked / 30);
    
    // Each period gives 5% boost, up to 50% max (10 periods)
    const timeMultiplier = Math.min(multiplierPeriods * 5, 50);
    
    // Calculate base tier multiplier
    let tierMultiplier = 1; // Default multiplier for Common tier
    
    if (selectedStake.nft_tier === "Legendary" || selectedStake.tier === 3) {
      tierMultiplier = REWARD_MULTIPLIERS.LEGENDARY / 100;
    } else if (selectedStake.nft_tier === "Epic" || selectedStake.tier === 2) {
      tierMultiplier = REWARD_MULTIPLIERS.EPIC / 100;
    } else if (selectedStake.nft_tier === "Rare" || selectedStake.tier === 1) {
      tierMultiplier = REWARD_MULTIPLIERS.RARE / 100;
    } else {
      tierMultiplier = REWARD_MULTIPLIERS.COMMON / 100;
    }
    
    // Calculate next milestone
    const milestoneDays = [30, 90, 180, 365];
    const nextMilestone = milestoneDays.find(days => daysStaked < days) || 0;
    const daysToNextMilestone = nextMilestone > 0 ? nextMilestone - daysStaked : 0;
    
    // Calculate milestones achieved
    const achievedMilestones = milestoneDays.filter(days => daysStaked >= days);
    
    // Collection bonus if available
    const collectionBonus = stats?.stats?.collectionBonus || 0;
    
    // Calculate total effective multiplier
    const totalMultiplier = (1 + (timeMultiplier / 100)) * tierMultiplier * (1 + (collectionBonus / 100));
    
    return {
      daysStaked,
      timeMultiplier,
      nextMilestone,
      daysToNextMilestone,
      achievedMilestones,
      tierMultiplier,
      collectionBonus,
      totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
      projectedDailyRewards: (10 * totalMultiplier).toFixed(1) // Base rate of 10 TESOLA per day
    };
  }, [selectedStake, stats]);

  // Handle reward claiming with on-chain transaction
  const handleClaimRewards = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet to claim rewards");
      return;
    }

    if (claimableRewards <= 0) {
      setError("No rewards available to claim");
      return;
    }

    try {
      setIsClaiming(true);
      setError(null);
      setSuccessMessage(null);

      // Select the first NFT for claiming rewards
      if (!stats.activeStakes || stats.activeStakes.length === 0) {
        throw new Error("No staked NFTs found to claim rewards from");
      }

      const nftToClaim = stats.activeStakes[0];
      const mintAddress = nftToClaim.mint_address;

      if (!mintAddress) {
        throw new Error("Failed to get NFT mint address");
      }

      console.log("Preparing claim rewards transaction for NFT:", mintAddress);

      // Step 1: Prepare transaction
      setTransactionInProgress(true);
      const prepareResponse = await prepareClaimRewards({
        wallet: publicKey.toString(),
        mintAddress
      });

      if (!prepareResponse || !prepareResponse.transactionBase64) {
        throw new Error("Failed to prepare claim rewards transaction");
      }

      console.log("Transaction prepared successfully");

      // Step 2: Deserialize and sign transaction
      const transactionBuffer = Buffer.from(prepareResponse.transactionBase64, "base64");
      const transaction = Transaction.from(transactionBuffer);

      // Step 3: Send transaction
      console.log("Sending transaction to wallet for signing...");
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction sent, signature:", signature);

      // Step 4: Complete claim process on server
      console.log("Completing claim process...");
      const completeResponse = await completeClaimRewards({
        wallet: publicKey.toString(),
        signature,
        mintAddress,
        claimId: prepareResponse.claimDetails?.claimId
      });

      console.log("Claim completed:", completeResponse);

      // Step 5: Show success message
      setSuccessMessage(`Successfully claimed ${claimableRewards} TESOLA tokens!`);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error claiming rewards:", err);
      setError(err.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
      setTransactionInProgress(false);
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-5 border border-purple-500/20 h-full">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
        TESOLA Rewards
      </h3>
      
      {/* Token icon and amount */}
      <div className="bg-black/30 rounded-xl p-6 mb-6">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-gray-400 text-sm mb-1">Claimable Rewards</h4>
          <div className="text-3xl font-bold text-white">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-pulse bg-gray-700 h-10 w-28 rounded"></div>
              </div>
            ) : (
              <>{claimableRewards} TESOLA</>
            )}
          </div>
        </div>
      </div>
      
      {/* Dynamic Reward Booster Visualization - 항상 표시 */}
      {!isLoading && (
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Dynamic Reward Booster
          </h4>
          
          {boostInfo ? (
            // boostInfo가 있을 때 기존 UI 표시
            <>
              {/* Time-based Multiplier */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-xs">Time Multiplier</span>
                  <span className="text-green-400 text-xs font-medium">+{boostInfo.timeMultiplier}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(boostInfo.timeMultiplier * 2, 100)}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  +5% every 30 days, up to 50% maximum
                </p>
              </div>
              
              {/* Next Milestone */}
              {boostInfo.daysToNextMilestone > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-xs">
                      Next Milestone: {boostInfo.nextMilestone} Days
                    </span>
                    <span className="text-blue-400 text-xs font-medium">
                      {boostInfo.daysToNextMilestone} days left
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full" 
                      style={{ width: `${(boostInfo.daysStaked / boostInfo.nextMilestone) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Keep staking to reach the {boostInfo.nextMilestone}-day milestone!
                  </p>
                </div>
              )}
              
              {/* Total Effective Multiplier */}
              <div className="flex justify-between items-center py-2 px-3 bg-black/20 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Total Reward Boost</span>
                  <span className="text-gray-400 text-xs">Daily rewards: {boostInfo.projectedDailyRewards} TESOLA</span>
                </div>
                <div className="text-green-400 font-bold">
                  {boostInfo.totalMultiplier}x
                </div>
              </div>
              
              {/* Tooltip explaining the boost calculation */}
              <div className="mt-2 text-gray-400 text-xs">
                <div className="flex justify-between">
                  <span>Base Tier Multiplier:</span>
                  <span className="text-white">{boostInfo.tierMultiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Boost:</span>
                  <span className="text-white">+{boostInfo.timeMultiplier}%</span>
                </div>
                {boostInfo.collectionBonus > 0 && (
                  <div className="flex justify-between">
                    <span>Collection Bonus:</span>
                    <span className="text-white">+{boostInfo.collectionBonus}%</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            // boostInfo가 없을 때 대체 UI 표시
            <div className="p-3 bg-gray-900/30 rounded-lg flex flex-col gap-2">
              <div className="text-gray-400 text-sm text-center py-2">
                <p>스테이킹 시작 후 보상 부스터 정보가 표시됩니다.</p>
                <p className="mt-2">30일마다 5%의 보상 부스트가 추가되며 최대 50%까지 적용됩니다.</p>
                <div className="mt-3 bg-black/20 p-3 rounded-lg">
                  <p className="text-xs text-purple-300 font-medium">주요 보상 부스트 요소:</p>
                  <ul className="mt-1 text-xs text-gray-300 space-y-1">
                    <li>• 시간 기반 멀티플라이어: 스테이킹 기간에 따라 증가</li>
                    <li>• 컬렉션 보너스: 여러 NFT 스테이킹 시 추가 보상</li>
                    <li>• 마일스톤 보너스: 30, 90, 180, 365일 달성 시 특별 보상</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Claim button */}
      <div className="mb-6">
        <PrimaryButton
          onClick={handleClaimRewards}
          loading={isClaiming}
          disabled={isLoading || transactionInProgress}
          fullWidth
          className="py-3"
        >
          {transactionInProgress ? "Transaction In Progress..." : "Claim TESOLA Rewards"}
        </PrimaryButton>

        {!isLoading && (
          <p className="text-center text-gray-400 text-xs mt-2">
            {claimableRewards <= 0
              ? "Stake NFTs or wait for earnings to accrue before claiming."
              : `${claimableRewards} TESOLA available to claim.`}
          </p>
        )}
      </div>
      
      {/* Success or error message */}
      {successMessage && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}
      
      {/* Milestones Achieved */}
      {!isLoading && boostInfo && boostInfo.achievedMilestones.length > 0 && (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Milestones Achieved
          </h4>
          
          <div className="grid grid-cols-4 gap-2">
            {[30, 90, 180, 365].map(days => {
              const achieved = boostInfo.achievedMilestones.includes(days);
              return (
                <div 
                  key={days}
                  className={`text-center p-2 rounded ${achieved ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-gray-800/40 border border-gray-700/20'}`}
                >
                  <div className={`text-sm font-bold ${achieved ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {days} Days
                  </div>
                  {achieved && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto mt-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Reward history */}
      <div className="bg-black/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Recent Activity
        </h4>
        
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex justify-between">
                <div className="bg-gray-700 h-4 w-24 rounded"></div>
                <div className="bg-gray-700 h-4 w-16 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats?.activeStakes?.length > 0 ? (
          <div className="space-y-3 text-sm">
            {stats.activeStakes.slice(0, 3).map((stake) => (
              <div 
                key={stake.id} 
                className={`flex items-center justify-between bg-gray-800/40 rounded-lg p-2 cursor-pointer 
                  ${selectedStake && selectedStake.id === stake.id ? 'border border-purple-500/50' : 'border border-transparent'}`}
                onClick={() => setSelectedStake(stake)}
              >
                {/* NFT Image preview */}
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-700">
                    <EnhancedProgressiveImage
                      src={(() => {
                        // Use image URL directly provided by the API
                        let imageUrl = stake.nft_image || stake.image_url || stake.image;

                        // If URL is provided and starts with http/https
                        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                          try {
                            // Verify URL validity
                            const url = new URL(imageUrl);
                            // 캐시 버스팅 파라미터 추가
                            url.searchParams.set('_t', Date.now().toString());
                            return url.toString();
                          } catch (err) {
                            console.log(`⚠️ StakingRewards: URL 파싱 실패, 원본 URL 사용: ${imageUrl}`);
                            // 추가 캐시 버스팅 파라미터
                            return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
                          }
                        }

                        // Extract NFT ID
                        let nftId = null;

                        // 1. stake.id에서 숫자 추출 시도
                        if (stake.id) {
                          const match = String(stake.id).match(/(\d+)/);
                          if (match && match[1]) {
                            nftId = match[1];
                          }
                        }

                        // 2. stake.nft_name에서 숫자 추출 시도
                        if (!nftId && stake.nft_name) {
                          const match = stake.nft_name.match(/#(\d+)/);
                          if (match && match[1]) {
                            nftId = match[1];
                          }
                        }

                        // 3. mint_address 해시로 숫자 생성
                        if (!nftId && stake.mint_address) {
                          let hash = 0;
                          for (let i = 0; i < stake.mint_address.length; i++) {
                            hash = ((hash << 5) - hash) + stake.mint_address.charCodeAt(i);
                            hash = hash & hash;
                          }
                          nftId = Math.abs(hash) % 999 + 1;
                        }

                        // 숫자 ID가 있으면 IPFS URL 생성
                        if (nftId) {
                          // 4자리 ID 형식으로 패딩
                          const formattedId = String(nftId).padStart(4, '0');
                          // 최신 환경 변수 사용 (하드코딩 제거)
                          const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                          const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                          const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                          return gatewayUrl;
                        }

                        // 최후의 수단: 임의의 IPFS URL 생성
                        const randomId = Math.floor(Math.random() * 999) + 1;
                        const formattedId = String(randomId).padStart(4, '0');
                        const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                        const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                        const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                        return gatewayUrl;
                      })()}
                      alt={stake.nft_name || `Staked NFT #${stake.id}`}
                      placeholder={createPlaceholder(stake.nft_name || `NFT #${stake.id}`)}
                      className="w-full h-full object-cover"
                      lazyLoad={true}
                      priority={false}
                      highQuality={true}
                      blur={true}
                      preferRemote={true}
                      useCache={false}
                      id={stake.id || stake.mint_address}
                      __source="StakingRewards-thumbnail"
                      maxRetries={1}
                      retryInterval={1000}
                    />
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium">
                      {stake.nft_name || `SOLARA #${stake.id}`}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(stake.staked_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-green-400 font-medium">
                  +{stake.earned_so_far} TESOLA
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center text-sm py-2">
            No recent staking activity
          </div>
        )}
      </div>
    </div>
  );
};

export default StakingRewards;