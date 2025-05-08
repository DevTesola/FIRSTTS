import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PrimaryButton } from "../Buttons";
import EnhancedImageWithFallback from "../EnhancedImageWithFallback";
import { createPlaceholder } from "../../utils/mediaUtils";

/**
 * StakingRewards Component
 * Displays staking rewards information and claim interface
 */
const StakingRewards = ({ stats, isLoading }) => {
  const { publicKey, connected } = useWallet();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Calculate rewards for display
  const totalEarned = isLoading ? "--" : (stats?.stats?.earnedToDate || 0);
  const claimableRewards = Math.floor(totalEarned); // Assuming whole numbers for claims
  
  // Handle reward claiming
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
      
      // Call API to claim rewards
      const response = await fetch("/api/claimRewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to claim rewards");
      }
      
      const data = await response.json();
      
      // Show success message
      setSuccessMessage(`Successfully claimed ${data.claim.amount} TESOLA tokens!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error claiming rewards:", err);
      setError(err.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
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
      
      {/* Claim button */}
      <div className="mb-6">
        <PrimaryButton
          onClick={handleClaimRewards}
          loading={isClaiming}
          disabled={isLoading || claimableRewards <= 0}
          fullWidth
          className="py-3"
        >
          Claim TESOLA Rewards
        </PrimaryButton>
        
        {claimableRewards <= 0 && !isLoading && (
          <p className="text-center text-gray-400 text-xs mt-2">
            Stake NFTs or wait for earnings to accrue before claiming.
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
      
      {/* Reward history placeholder */}
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
              <div key={stake.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg p-2">
                {/* NFT 이미지 미리보기 - 모든 컴포넌트와 동일한 로직 사용 */}
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded overflow-hidden mr-3 border border-gray-700">
                    <EnhancedImageWithFallback
                      src={(() => {
                        // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                        let nftId = null;
                        
                        // 1. stake.id에서 숫자 추출 시도 (가장 높은 우선순위)
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
                        
                        // 최후의 수단: 임의의 숫자 생성
                        if (!nftId) {
                          nftId = Math.floor(Math.random() * 999) + 1;
                        }
                        
                        // 모든 상황에서 항상 직접 IPFS URL 생성
                        const formattedId = String(nftId).padStart(4, '0');
                        // 최신 환경 변수 사용 (하드코딩 제거)
                        const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                        const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                        const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_cb=${Date.now()}`;
                        
                        // 로그로 생성된 URL 확인
                        console.log(`❗❗❗ StakingRewards: 강제 생성된 IPFS URL: ${gatewayUrl}`);
                        
                        return gatewayUrl;
                      })()}
                      alt={stake.nft_name || `Staked NFT #${stake.id}`}
                      placeholder={createPlaceholder(`Staked NFT #${stake.id}`)}
                      className="w-full h-full object-cover"
                      id={stake.id || stake.mint_address}
                      placeholderText="Art loading in metaverse"
                      lazyLoad={true}
                      priority={false}
                      highQuality={true}
                      preferRemote={true}
                      useCache={false}
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