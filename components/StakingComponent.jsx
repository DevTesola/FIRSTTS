"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import ErrorMessage from "./ErrorMessage";

/**
 * NFT Staking Component for SOLARA
 * Allows users to stake their NFTs for TESOLA rewards
 * 
 * @param {Object} nft - The NFT to stake
 * @param {function} onSuccess - Callback for successful staking
 * @param {function} onError - Callback for staking errors
 */
export default function StakingComponent({ nft, onSuccess, onError }) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stakingPeriod, setStakingPeriod] = useState("30"); // Default 30 days
  const [estimatedRewards, setEstimatedRewards] = useState(0);
  const [isStaked, setIsStaked] = useState(false);
  const [stakingInfo, setStakingInfo] = useState(null);
  
  const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

  // Calculate estimated rewards based on NFT tier and staking period
  useEffect(() => {
    if (!nft) return;
    
    // Reward rates per day by tier
    const dailyRewardsByTier = {
      "Legendary": 2.0,  // 2 TESOLA per day
      "Rare": 1.5,       // 1.5 TESOLA per day
      "Uncommon": 1.0,   // 1 TESOLA per day
      "Common": 0.5      // 0.5 TESOLA per day
    };
    
    // Get NFT tier from attributes, default to Common if not found
    const tierAttr = nft.attributes?.find(attr => 
      attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    const tier = (tierAttr && tierAttr.value) || "Common";
    
    // Calculate daily reward rate
    const dailyRate = dailyRewardsByTier[tier] || dailyRewardsByTier.Common;
    
    // Calculate estimated rewards
    const days = parseInt(stakingPeriod, 10);
    setEstimatedRewards(dailyRate * days);
  }, [nft, stakingPeriod]);
  
  // Check if NFT is already staked
  useEffect(() => {
    const checkStakingStatus = async () => {
      if (!connected || !publicKey || !nft?.mint) return;
      
      try {
        const response = await fetch(`/api/getStakingInfo?wallet=${publicKey.toString()}&mintAddress=${nft.mint}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error checking staking status:", errorData);
          return;
        }
        
        const data = await response.json();
        if (data.isStaked) {
          setIsStaked(true);
          setStakingInfo(data.stakingInfo);
        } else {
          setIsStaked(false);
          setStakingInfo(null);
        }
      } catch (err) {
        console.error("Failed to check staking status:", err);
      }
    };
    
    checkStakingStatus();
  }, [connected, publicKey, nft]);

  // Stake NFT function
  const handleStake = async () => {
    if (!connected || !publicKey || !nft?.mint) {
      setError("Please connect your wallet and select an NFT to stake.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Prepare staking transaction
      const response = await fetch("/api/prepareStaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingPeriod: parseInt(stakingPeriod, 10)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to prepare staking transaction");
      }
      
      const { transactionBase64 } = await response.json();
      
      // Step 2: Sign transaction
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      const signedTransaction = await signTransaction(transaction);
      
      // Step 3: Send signed transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Step 4: Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");
      
      // Step 5: Record staking in backend
      const completeResponse = await fetch("/api/completeStaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          txSignature: signature,
          stakingPeriod: parseInt(stakingPeriod, 10)
        }),
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Failed to complete staking");
      }
      
      // Update UI
      const stakingData = await completeResponse.json();
      setIsStaked(true);
      setStakingInfo(stakingData.stakingInfo);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(stakingData);
      }
    } catch (err) {
      console.error("Staking error:", err);
      setError(err.message || "Failed to stake NFT");
      
      // Call error callback
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Unstake NFT function
  const handleUnstake = async () => {
    if (!connected || !publicKey || !nft?.mint || !isStaked) {
      setError("Unable to unstake. Please check your wallet connection and NFT status.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare unstaking transaction
      const response = await fetch("/api/prepareUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingId: stakingInfo.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to prepare unstaking transaction");
      }
      
      const { transactionBase64, penalty } = await response.json();
      
      // Confirm if there's an early unstaking penalty
      if (penalty > 0) {
        const confirmed = window.confirm(
          `Early unstaking will result in a penalty of ${penalty} TESOLA tokens. Do you want to continue?`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      
      // Sign and send transaction
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      const signedTransaction = await signTransaction(transaction);
      
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      await connection.confirmTransaction(signature, "confirmed");
      
      // Complete unstaking in backend
      const completeResponse = await fetch("/api/completeUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          txSignature: signature,
          stakingId: stakingInfo.id
        }),
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Failed to complete unstaking");
      }
      
      // Update UI
      setIsStaked(false);
      setStakingInfo(null);
      
      // Success callback
      if (onSuccess) {
        onSuccess({ unstaked: true });
      }
    } catch (err) {
      console.error("Unstaking error:", err);
      setError(err.message || "Failed to unstake NFT");
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!nft) {
    return (
      <div className="text-center p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Select an NFT to view staking options.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center text-purple-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {isStaked ? "NFT Staking Status" : "Stake Your NFT"}
      </h2>
      
      {/* NFT Info */}
      <div className="flex items-center mb-4 p-3 bg-gray-700 rounded-lg">
        {nft.image && (
          <img 
            src={nft.image} 
            alt={nft.name} 
            className="w-14 h-14 rounded object-cover mr-3"
          />
        )}
        <div>
          <h3 className="font-medium">{nft.name}</h3>
          <p className="text-sm text-gray-300">{nft.mint?.slice(0, 6)}...{nft.mint?.slice(-4)}</p>
        </div>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error}
          type="error"
          className="mb-4"
          onDismiss={() => setError(null)}
        />
      )}
      
      {isStaked ? (
        // Staking info display
        <div className="mb-6">
          <div className="bg-purple-900/30 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-xs text-gray-400">Staked On</p>
                <p className="font-medium">
                  {new Date(stakingInfo.staked_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Staking Period</p>
                <p className="font-medium">{stakingInfo.staking_period} days</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Release Date</p>
                <p className="font-medium">
                  {new Date(stakingInfo.release_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Rewards</p>
                <p className="font-medium text-yellow-400">
                  {stakingInfo.total_rewards} TESOLA
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{stakingInfo.progress_percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                  style={{width: `${stakingInfo.progress_percentage}%`}}
                ></div>
              </div>
            </div>
            
            {/* Earned so far */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">Earned so far</p>
              <p className="text-lg font-bold text-yellow-400">
                {stakingInfo.earned_so_far} TESOLA
              </p>
            </div>
          </div>
          
          <button
            onClick={handleUnstake}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Unstake NFT"
            )}
          </button>
          
          {new Date() < new Date(stakingInfo.release_date) && (
            <p className="text-xs text-center text-red-400 mt-2">
              Warning: Early unstaking will incur a penalty.
            </p>
          )}
        </div>
      ) : (
        // Staking options input
        <div className="mb-6">
          <div className="mb-4">
            <label htmlFor="stakingPeriod" className="block text-sm font-medium text-gray-300 mb-1">
              Staking Period
            </label>
            <select
              id="stakingPeriod"
              value={stakingPeriod}
              onChange={(e) => setStakingPeriod(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">365 days</option>
            </select>
          </div>
          
          <div className="bg-blue-900/30 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Estimated Rewards</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total rewards:</span>
              <span className="text-xl font-bold text-yellow-400">{estimatedRewards} TESOLA</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Rewards are calculated based on NFT tier and staking period.
              Early unstaking may result in penalties.
            </p>
          </div>
          
          <button
            onClick={handleStake}
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Stake for ${stakingPeriod} days`
            )}
          </button>
        </div>
      )}
      
      {/* Help text */}
      <div className="text-xs text-gray-400">
        <p className="mb-1">
          <strong>What is staking?</strong> Staking allows you to earn TESOLA rewards by locking your NFT for a specific period.
        </p>
        <p>
          Higher tier NFTs earn more rewards. Longer staking periods result in higher total rewards.
        </p>
      </div>
    </div>
  );
}