import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { PrimaryButton, SecondaryButton } from "../Buttons";
import EnhancedProgressiveImage from "../EnhancedProgressiveImage";
import { createPlaceholder, processImageUrl } from "../../utils/mediaUtils";
import { getNFTImageUrl, getNFTName, getNFTTier, getTierStyles } from "../../utils/nftImageUtils";

/**
 * StakedNFTCard Component - 개선된 UI/UX
 * Displays information about a staked NFT and allows for unstaking
 */
const StakedNFTCard = ({ stake, onRefresh }) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [animation, setAnimation] = useState(false);
  
  // 디버깅용: 활성화하여 데이터 문제 파악
  useEffect(() => {
    // 실제 NFT 이름 미리 계산
    const localNftName = getNFTName(stake, 'SOLARA');
    
    // 모든 이미지 관련 필드 로깅
    console.log(`DEBUG - StakedNFTCard NFT 데이터:`, {
      id: stake.id,
      mint_address: stake.mint_address,
      name: stake.nft_name || 'Unknown',
      tier: stake.nft_tier || 'Unknown',
      
      // 이미지 필드 로깅
      image: stake.image,
      image_url: stake.image_url,
      nft_image: stake.nft_image,
      ipfs_hash: stake.ipfs_hash,
      original_local_image: stake.original_local_image,
      metadata_image: stake.metadata?.image,
      
      // 이미지 URL 타입 분석
      image_type: stake.image?.startsWith('/') ? 'local' : 
                  stake.image?.startsWith('ipfs://') ? 'ipfs' : 
                  stake.image?.includes('://') ? 'url' : 'unknown',
      
      // 추가 메타데이터
      using_actual_nft_data: stake.using_actual_nft_data
    });
    
    // 통합 유틸리티 함수를 사용한 이미지 URL 선택 로깅
    const nftData = {
      ...stake, 
      id: stake.id || stake.mint_address,
      mint: stake.mint_address,
      name: localNftName,
      __source: 'StakedNFTCard-debug'
    };
    
    const processedImageUrl = getNFTImageUrl(nftData);
    
    console.log(`DEBUG - getNFTImageUrl 처리 결과:`, {
      input: nftData,
      output: processedImageUrl
    });
  }, [stake]);
  
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate days left
  const calculateDaysLeft = (releaseDate) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diffTime = release - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Calculate time left for display
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const release = new Date(stake.release_date);
      let difference = release - now;
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [stake.release_date]);
  
  // Pulse animation for earned rewards
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimation(true);
      setTimeout(() => setAnimation(false), 1000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Success message timer
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Handle unstaking NFT
  const handleUnstake = async () => {
    if (!connected || !publicKey) {
      setError("Wallet not connected");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare unstaking transaction
      const res = await fetch("/api/prepareUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: stake.mint_address,
          stakingId: stake.id
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to prepare unstaking transaction");
      }
      
      const { transactionBase64, penalty } = await res.json();
      
      // Hide confirmation dialog
      setShowUnstakeConfirm(false);
      
      // Get RPC endpoint from environment variable or use default
      const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
      
      // Sign and send transaction
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      
      if (!transaction.feePayer) {
        transaction.feePayer = publicKey;
      }
      
      const signedTransaction = await signTransaction(transaction);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      
      // Complete unstaking in backend
      const completeRes = await fetch("/api/completeUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: stake.mint_address,
          txSignature: signature,
          stakingId: stake.id
        }),
      });
      
      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || "Failed to complete unstaking");
      }
      
      // Get response data
      const data = await completeRes.json();
      
      // Show success message
      setSuccessMessage(`Successfully unstaked! Earned ${data.earnedRewards || stake.earned_so_far} TESOLA tokens.`);
      
      // Refresh data
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Unstaking error:", err);
      setError(err.message || "Failed to unstake NFT");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = stake.progress_percentage || 0;
  
  // Determine NFT tier and apply appropriate styling
  const getTierStyle = (tier) => {
    const lowerTier = (tier || "").toLowerCase();
    if (lowerTier.includes("legendary")) return "bg-yellow-900/30 border-yellow-500/30 text-yellow-300";
    if (lowerTier.includes("epic")) return "bg-purple-900/30 border-purple-500/30 text-purple-300";
    if (lowerTier.includes("rare")) return "bg-blue-900/30 border-blue-500/30 text-blue-300";
    return "bg-green-900/30 border-green-500/30 text-green-300"; // Common default
  };
  
  // Get the appropriate tier badge color
  const getTierBadge = (tier) => {
    const lowerTier = (tier || "").toLowerCase();
    if (lowerTier.includes("legendary")) return "bg-yellow-900 text-yellow-300";
    if (lowerTier.includes("epic")) return "bg-purple-900 text-purple-300";
    if (lowerTier.includes("rare")) return "bg-blue-900 text-blue-300";
    return "bg-green-900 text-green-300"; // Common default
  };
  
  // Use NFT utilities to extract name and info
  const nftName = getNFTName(stake, 'SOLARA');
  
  // Determine if NFT is unlocked (staking period complete)
  const isUnlocked = stake.is_unlocked || calculateDaysLeft(stake.release_date) === 0;
  
  // Format numbers with commas
  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  
  return (
    <div className={`rounded-lg border p-4 ${getTierStyle(stake.nft_tier)} transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10`}>
      {/* Unstake confirmation dialog */}
      {showUnstakeConfirm && (
        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center rounded-lg">
          <div className="bg-gray-900 rounded-lg p-4 max-w-xs mx-auto border border-red-500/30">
            <h4 className="text-lg font-bold text-white mb-2">Confirm Unstaking</h4>
            
            {!isUnlocked && (
              <div className="bg-red-900/30 p-3 rounded-lg mb-3 text-sm">
                <p className="text-red-300 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Early unstaking will result in a penalty. You will lose approximately {Math.round(stake.total_rewards * 0.25)} TESOLA tokens.
                </p>
              </div>
            )}
            
            <p className="text-gray-300 mb-4">
              {isUnlocked 
                ? `You will receive ${formatNumber(stake.earned_so_far)} TESOLA tokens.` 
                : `Are you sure you want to unstake this NFT before the release date?`
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUnstakeConfirm(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnstake}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Unstake"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* NFT Header with image, name and tier */}
      <div className="flex items-start mb-3 relative">
        {/* NFT Image - EnhancedProgressiveImage 컴포넌트로 개선 */}
        <div className="w-16 h-16 rounded-lg overflow-hidden mr-3 border border-white/10 flex-shrink-0">
          {/* NFT 이미지 표시 - 개선된 이미지 로딩으로 실제 NFT 이미지 표시 */}
          {/* 유틸리티 함수를 사용한 이미지 로딩 - /my-collection 페이지와 동일한 패턴 */}
          <EnhancedProgressiveImage 
            src={getNFTImageUrl({
              ...stake, 
              id: stake.id || stake.mint_address,
              mint: stake.mint_address,
              name: nftName,
              image: stake.image,
              image_url: stake.image_url,
              nft_image: stake.nft_image,
              ipfs_hash: stake.ipfs_hash,
              metadata: stake.metadata,
              __source: 'StakedNFTCard-thumbnail',
              _cacheBust: Date.now() // 캐시 버스팅을 위한 타임스탬프
            })}
            alt={getNFTName(stake, 'SOLARA')}
            className="w-full h-full"
            preferRemote={true}
            highQuality={true}
            priority={true}
            useCache={false} // 캐싱 비활성화로 항상 최신 이미지 로딩
            placeholder={createPlaceholder(nftName || "SOLARA NFT")}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start w-full">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">{nftName}</h4>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTierBadge(stake.nft_tier)}`}>
                  {stake.nft_tier || "Common"}
                </span>
                {isUnlocked && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300 font-medium animate-pulse">
                    Unlocked
                  </span>
                )}
              </div>
            </div>
            
            {/* Toggle expanded view button */}
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="text-white/70 hover:text-white transition-colors ml-1 flex-shrink-0"
              aria-label={expandedView ? "Show less" : "Show more"}
            >
              {expandedView ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="absolute top-0 -right-2 transform translate-x-full bg-green-900/90 p-2 rounded-lg shadow-lg z-10 animate-fadeIn">
            <p className="text-sm text-green-300 whitespace-nowrap">{successMessage}</p>
          </div>
        )}
      </div>
      
      {/* Progress bar with enhanced styling */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">Progress</span>
          <span className="text-white">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-transform duration-1000 ease-out"
            style={{width: `${progressPercentage}%`, transform: `translateX(${animation ? '5px' : '0px'})`}}
          ></div>
        </div>
      </div>
      
      {/* Time left and key info */}
      <div className="mb-3">
        {timeLeft ? (
          <div className="bg-black/20 rounded-lg p-2 flex justify-between items-center">
            <span className="text-xs text-white/70">Time Remaining:</span>
            <span className="text-sm font-medium text-white">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        ) : (
          <div className="bg-green-900/20 rounded-lg p-2 flex justify-between items-center">
            <span className="text-xs text-white/70">Status:</span>
            <span className="text-sm font-medium text-green-300">Ready to claim</span>
          </div>
        )}
      </div>
      
      {/* Reward info - always visible */}
      <div className={`bg-black/20 rounded-lg p-3 mb-3 transition-all duration-300 ${animation ? 'scale-105 bg-purple-900/40' : ''}`}>
        <div className="text-center">
          <div className="text-white/70 text-xs mb-1">Earned so far</div>
          <div className="text-xl font-bold text-white">
            <span className="text-yellow-400">{formatNumber(stake.earned_so_far || 0)}</span>{" "}
            <span className="text-sm font-normal text-yellow-500/70">TESOLA</span>
          </div>
          {stake.daily_reward_rate && (
            <div className="text-xs text-green-400 mt-1">
              +{stake.daily_reward_rate} TESOLA/day
            </div>
          )}
        </div>
      </div>
      
      {/* Expandable details */}
      {expandedView && (
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
          {/* Enlarged NFT Image - EnhancedProgressiveImage로 개선 */}
          <div className="aspect-square w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-white/10 mb-4 relative">
            {/* 확대 이미지도 EnhancedProgressiveImage 사용 */}
            <EnhancedProgressiveImage
              src={getNFTImageUrl({
                ...stake, 
                id: stake.id || stake.mint_address,
                mint: stake.mint_address,
                name: nftName,
                __source: 'StakedNFTCard-enlarged',
                _cacheBust: Date.now() // 캐시 버스팅을 위한 타임스탬프
              })}
              alt={getNFTName(stake, 'SOLARA')}
              className="w-full h-full"
              highQuality={true}
              preferRemote={true}
              priority={true}
              useCache={false} // 캐싱 비활성화
              placeholder={createPlaceholder(nftName || "SOLARA NFT")}
            />
            
            {/* 디버깅 정보 표시 */}
            <div className="absolute bottom-0 right-0 bg-black/80 p-1 text-[6px] text-white max-w-full overflow-hidden z-10">
              {JSON.stringify({
                img: stake.image?.substring(0, 12) + '...',
                type: stake.image?.startsWith('/') ? 'local' : 
                      stake.image?.startsWith('ipfs://') ? 'ipfs' : 'other'
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-white/70">Staked On</div>
              <div className="font-medium text-white">{formatDate(stake.staked_at)}</div>
            </div>
            <div>
              <div className="text-white/70">Release Date</div>
              <div className="font-medium text-white">{formatDate(stake.release_date)}</div>
            </div>
            <div>
              <div className="text-white/70">Staking Period</div>
              <div className="font-medium text-white">{stake.staking_period} days</div>
            </div>
            <div>
              <div className="text-white/70">Days Remaining</div>
              <div className="font-medium text-white">{calculateDaysLeft(stake.release_date)} days</div>
            </div>
            <div>
              <div className="text-white/70">Daily Rate</div>
              <div className="font-medium text-white">{stake.daily_reward_rate} TESOLA</div>
            </div>
            <div>
              <div className="text-white/70">Total Rewards</div>
              <div className="font-medium text-white">{formatNumber(stake.total_rewards)} TESOLA</div>
            </div>
          </div>
          
          {/* Additional NFT info */}
          <div className="bg-black/20 rounded-lg p-3 text-sm">
            <div className="font-medium text-white/70 mb-1">NFT Details</div>
            <div className="flex justify-between">
              <span>Mint Address</span>
              <span className="text-white font-mono">{stake.mint_address.substr(0, 6)}...{stake.mint_address.substr(-4)}</span>
            </div>
          </div>
          
          {/* Early unstaking warning if applicable */}
          {!isUnlocked && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              <p className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Early unstaking will result in reward penalties. Wait until the release date for full rewards.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-3 bg-red-900/20 border border-red-500/20 rounded-lg p-2 text-sm text-red-300">
          {error}
        </div>
      )}
      
      {/* Unstake button */}
      <div className="mt-3">
        <PrimaryButton
          onClick={() => setShowUnstakeConfirm(true)}
          loading={loading}
          fullWidth
          className={isUnlocked ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500' : ''}
        >
          {isUnlocked ? 'Claim & Unstake' : 'Unstake NFT'}
        </PrimaryButton>
      </div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StakedNFTCard;