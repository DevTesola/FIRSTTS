import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PrimaryButton } from "../Buttons";

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
          <div className="space-y-2 text-sm">
            {stats.activeStakes.slice(0, 3).map((stake) => (
              <div key={stake.id} className="flex justify-between">
                <div className="text-gray-400">
                  {new Date(stake.staked_at).toLocaleDateString()}
                </div>
                <div className="text-white font-medium">
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