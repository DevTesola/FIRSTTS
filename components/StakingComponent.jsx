"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [stakingPeriod, setStakingPeriod] = useState("30"); // Default 30 days
  const [estimatedRewards, setEstimatedRewards] = useState(0);
  const [isStaked, setIsStaked] = useState(false);
  const [stakingInfo, setStakingInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
  const [verifiedOwnership, setVerifiedOwnership] = useState(false);
  const [transactionTimeoutId, setTransactionTimeoutId] = useState(null);
  const [currentTier, setCurrentTier] = useState("COMMON");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

  // Extract NFT tier from attributes
  useEffect(() => {
    if (!nft) return;
    
    const tierAttr = nft.attributes?.find(attr => 
      attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    
    if (tierAttr && tierAttr.value) {
      // Standardize tier format
      let tier = tierAttr.value.trim().toUpperCase();
      if (tier.includes("LEGEND")) {
        tier = "LEGENDARY";
      } else if (tier.includes("EPIC")) {
        tier = "EPIC";
      } else if (tier.includes("RARE")) {
        tier = "RARE";
      } else {
        tier = "COMMON";
      }
      
      console.log('NFT Tier detected:', tier, 'Original:', tierAttr.value);
      setCurrentTier(tier);
    }
  }, [nft]);

  // Calculate estimated rewards based on NFT tier and staking period
  useEffect(() => {
    if (!nft) return;
    
    // Reward rates per day by tier
    const dailyRewardsByTier = {
      "LEGENDARY": 200,  // 200 TESOLA per day
      "EPIC": 100,       // 100 TESOLA per day
      "RARE": 50,        // 50 TESOLA per day
      "COMMON": 25       // 25 TESOLA per day
    };
    
    // Calculate daily reward rate
    const dailyRate = dailyRewardsByTier[currentTier] || dailyRewardsByTier.COMMON;
    
    // Apply long-term staking bonus
    let multiplier = 1.0;
    const days = parseInt(stakingPeriod, 10);
    
    // Long-term staking bonus
    if (days >= 365) multiplier = 2.0;      // 365+ days: 2x
    else if (days >= 180) multiplier = 1.7; // 180+ days: 1.7x
    else if (days >= 90) multiplier = 1.4;  // 90+ days: 1.4x
    else if (days >= 30) multiplier = 1.2;  // 30+ days: 1.2x
    
    // Calculate total estimated rewards
    const totalRewards = dailyRate * days * multiplier;
    
    // Update estimated rewards state
    setEstimatedRewards(totalRewards);
  }, [nft, stakingPeriod, currentTier]);
  
  // Check if NFT is already staked and verify ownership
  useEffect(() => {
    const checkStakingStatus = async () => {
      if (!connected || !publicKey || !nft?.mint) return;
      
      try {
        setIsCheckingOwnership(true);
        
        // First verify NFT ownership
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(nft.mint) }
        );
        
        // Check if the user owns this NFT
        const ownsNFT = tokenAccounts.value.length > 0 && 
                        tokenAccounts.value.some(account => 
                          account.account.data.parsed.info.tokenAmount.uiAmount === 1);
        
        setVerifiedOwnership(ownsNFT);
        
        if (!ownsNFT) {
          console.warn("User does not own this NFT or it's already staked elsewhere");
          setIsCheckingOwnership(false);
          return;
        }
        
        // Now check if it's already staked in our system
        const response = await fetch(`/api/getStakingInfo?wallet=${publicKey.toString()}&mintAddress=${nft.mint}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error checking staking status:", errorData);
          setIsCheckingOwnership(false);
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
        
        setIsCheckingOwnership(false);
      } catch (err) {
        console.error("Failed to check staking status:", err);
        setIsCheckingOwnership(false);
      }
    };
    
    checkStakingStatus();
  }, [connected, publicKey, nft]);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId);
      }
    };
  }, [transactionTimeoutId]);

  // Hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Hide success popup after 8 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  // Stake NFT function with improved error handling and timeout management
  const handleStake = async () => {
    if (!connected || !publicKey || !nft?.mint) {
      setError("Please connect your wallet and select an NFT to stake.");
      return;
    }
    
    if (!verifiedOwnership && !isCheckingOwnership) {
      setError("You don't own this NFT or it might be staked elsewhere.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);
    
    // Clear any existing timeouts
    if (transactionTimeoutId) {
      clearTimeout(transactionTimeoutId);
    }
    
    try {
      // Get tier attributes from the NFT
      const tierAttr = nft.attributes?.find(attr => 
        attr.trait_type === "Tier" || attr.trait_type === "tier"
      );
      
      const rawTierValue = tierAttr ? tierAttr.value : null;
      console.log("Staking NFT with tier:", currentTier, "Raw value:", rawTierValue);
      
      // Step 1: Prepare staking transaction
      console.log("Preparing staking transaction...");
      const prepareResponse = await fetch("/api/prepareStaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingPeriod: parseInt(stakingPeriod, 10),
          nftTier: currentTier,
          rawTierValue: rawTierValue,
          nftName: nft.name
        }),
      });
      
      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        console.error("Prepare staking error:", errorData);
        
        // Check if it's already staked
        if (errorData.existingStake) {
          setIsStaked(true);
          setStakingInfo(errorData.existingStake);
          throw new Error(`This NFT is already staked until ${new Date(errorData.existingStake.release_date).toLocaleDateString()}`);
        }
        
        throw new Error(errorData.error || "Failed to prepare staking transaction");
      }
      
      const { transactionBase64, stakingMetadata, rewardDetails } = await prepareResponse.json();
      console.log("Got transaction base64, length:", transactionBase64.length);
      console.log("Staking with tier:", rewardDetails.nftTier, "Original value:", rewardDetails.rawTierValue);
      
      // Step 2: Sign transaction
      console.log("Signing transaction...");
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      
      if (!transaction.feePayer) {
        transaction.feePayer = publicKey;
      }
      
      let signedTransaction;
      try {
        signedTransaction = await signTransaction(transaction);
        console.log("Transaction signed successfully");
      } catch (signError) {
        console.error("Signing error:", signError);
        throw new Error(`Failed to sign transaction: ${signError.message}`);
      }
      
      // Step 3: Send signed transaction with timeout
      console.log("Sending transaction...");
      const rawTransaction = signedTransaction.serialize();
      let txSignature;
      
      try {
        txSignature = await connection.sendRawTransaction(
          rawTransaction,
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
          }
        );
        console.log("Transaction sent:", txSignature);
      } catch (sendError) {
        console.error("Send transaction error:", sendError);
        throw new Error(`Failed to send transaction: ${sendError.message}`);
      }
      
      // Step 4: Set a timeout for transaction confirmation
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          reject(new Error("Transaction confirmation timed out after 30 seconds"));
        }, 30000);
        setTransactionTimeoutId(id);
      });
      
      // Step 5: Confirm transaction with timeout
      try {
        console.log("Confirming transaction...");
        await Promise.race([
          connection.confirmTransaction(txSignature, "confirmed"),
          timeoutPromise
        ]);
        
        // Clear timeout if confirmation succeeds
        if (transactionTimeoutId) {
          clearTimeout(transactionTimeoutId);
          setTransactionTimeoutId(null);
        }
        
        console.log("Transaction confirmed");
      } catch (confirmError) {
        console.error("Confirmation error:", confirmError);
        
        // Clear timeout if we got an error
        if (transactionTimeoutId) {
          clearTimeout(transactionTimeoutId);
          setTransactionTimeoutId(null);
        }
        
        // Check transaction status before giving up
        try {
          const status = await connection.getSignatureStatus(txSignature);
          console.log("Transaction status:", status);
          
          if (status.value && !status.value.err) {
            console.log("Transaction appears successful despite confirmation error");
          } else if (status.value && status.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
          } else {
            throw new Error("Transaction confirmation failed");
          }
        } catch (statusError) {
          console.error("Error checking transaction status:", statusError);
          throw confirmError; // Throw the original error
        }
      }
      
      // Step 6: Record staking in backend
      console.log("Recording staking...");
      const completeResponse = await fetch("/api/completeStaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          txSignature: txSignature,
          stakingPeriod: parseInt(stakingPeriod, 10),
          nftTier: currentTier,
          rawTierValue: rawTierValue,
          nftName: nft.name
        }),
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.error("Complete staking error:", errorData);
        
        // Save debug info for display
        setDebugInfo({
          txSignature,
          responseStatus: completeResponse.status,
          errorDetails: errorData
        });
        
        // Check if it's a duplicate staking error but with success
        if (errorData.stakingInfo) {
          setIsStaked(true);
          setStakingInfo(errorData.stakingInfo);
          
          // Still report success even though there was an error response
          if (onSuccess) {
            onSuccess(errorData.stakingInfo);
          }
          
          // Just show warning but don't throw
          setLoading(false);
          setError(`Note: ${errorData.error || "This NFT appears to be already staked"}`);
          return;
        }
        
        throw new Error(errorData.error || "Failed to complete staking");
      }
      
      // Get staking data from response
      const stakingData = await completeResponse.json();
      
      // Update UI
      setIsStaked(true);
      setStakingInfo(stakingData.stakingInfo);
      
      // Show success message
      setSuccessMessage(`Successfully staked your NFT! You will earn ${rewardDetails.totalRewards} TESOLA tokens over ${stakingPeriod} days.`);
      
      // Prepare success data for popup
      setSuccessData({
        nftName: nft.name,
        image: nft.image,
        tier: currentTier,
        period: stakingPeriod,
        rewards: rewardDetails.totalRewards,
        releaseDate: new Date(Date.now() + parseInt(stakingPeriod, 10) * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
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
      
      // Ensure timeout is cleared
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId);
        setTransactionTimeoutId(null);
      }
    }
  };
  
  // Unstake NFT function with improved error handling
  const handleUnstake = async () => {
    if (!connected || !publicKey || !nft?.mint || !isStaked) {
      setError("Unable to unstake. Please check your wallet connection and NFT status.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
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
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      
      if (!transaction.feePayer) {
        transaction.feePayer = publicKey;
      }
      
      const signedTransaction = await signTransaction(transaction);
      
      // Set a timeout for transaction confirmation
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          reject(new Error("Transaction confirmation timed out after 30 seconds"));
        }, 30000);
        setTransactionTimeoutId(id);
      });
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );
      
      // Confirm transaction with timeout
      try {
        await Promise.race([
          connection.confirmTransaction(signature, "confirmed"),
          timeoutPromise
        ]);
        
        // Clear timeout if confirmation succeeds
        if (transactionTimeoutId) {
          clearTimeout(transactionTimeoutId);
          setTransactionTimeoutId(null);
        }
      } catch (confirmError) {
        console.error("Confirmation error during unstaking:", confirmError);
        
        // Clear timeout if we got an error
        if (transactionTimeoutId) {
          clearTimeout(transactionTimeoutId);
          setTransactionTimeoutId(null);
        }
        
        // Check transaction status
        const status = await connection.getSignatureStatus(signature);
        if (!(status.value && !status.value.err)) {
          throw new Error("Failed to confirm unstaking transaction");
        }
      }
      
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
      
      // Get response data
      const data = await completeResponse.json();
      
      // Update UI
      setIsStaked(false);
      setStakingInfo(null);
      
      // Prepare success data for popup
      const earnedRewards = data.earnedRewards || stakingInfo.earned_so_far;
      setSuccessData({
        nftName: nft.name,
        image: nft.image,
        tier: currentTier,
        action: "unstaked",
        rewards: earnedRewards
      });
      
      // Show success message
      setSuccessMessage(`Successfully unstaked your NFT! You earned ${earnedRewards} TESOLA tokens.`);
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Success callback
      if (onSuccess) {
        onSuccess({ unstaked: true, earnedRewards: data.earnedRewards });
      }
    } catch (err) {
      console.error("Unstaking error:", err);
      setError(err.message || "Failed to unstake NFT");
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
      
      // Ensure timeout is cleared
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId);
        setTransactionTimeoutId(null);
      }
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
    <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-6 shadow-lg relative">
      {/* Success popup overlay */}
      {showSuccessPopup && successData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 max-w-md mx-auto shadow-2xl animate-fadeIn transform transition-all">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className="mx-auto bg-green-600/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {successData.action === "unstaked" ? "Unstaking Complete!" : "Staking Complete!"}
              </h3>
              <p className="text-green-400 mt-1">Transaction successfully processed</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center">
              {successData.image && (
                <img 
                  src={successData.image} 
                  alt={successData.nftName} 
                  className="w-20 h-20 rounded object-cover mr-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder-nft.jpg";
                  }}
                />
              )}
              <div>
                <h4 className="font-bold text-white">{successData.nftName}</h4>
                <span className={`inline-block px-2 py-0.5 mt-1 text-xs rounded ${
                  successData.tier === "LEGENDARY" ? "bg-yellow-900 text-yellow-300" :
                  successData.tier === "EPIC" ? "bg-pink-900 text-pink-300" :
                  successData.tier === "RARE" ? "bg-purple-900 text-purple-300" :
                  "bg-blue-900 text-blue-300"
                }`}>
                  {successData.tier}
                </span>
              </div>
            </div>
            
            {successData.action === "unstaked" ? (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-center text-yellow-400">
                  {successData.rewards} TESOLA
                </h4>
                <p className="text-center text-gray-300 text-sm">Tokens earned</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Staking Period:</span>
                    <span className="text-white font-medium">{successData.period} days</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Rewards:</span>
                    <span className="text-yellow-400 font-bold">{successData.rewards} TESOLA</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Release Date:</span>
                    <span className="text-white font-medium">{successData.releaseDate}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  // Redirect to dashboard tab
                  document.querySelector('[aria-controls="dashboard"]')?.click();
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      
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
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-nft.jpg";
            }}
          />
        )}
        <div>
          <h3 className="font-medium">{nft.name}</h3>
          <p className="text-sm text-gray-300">{nft.mint?.slice(0, 6)}...{nft.mint?.slice(-4)}</p>
          <div className="mt-1">
            <span className={`px-2 py-0.5 text-xs rounded ${
              currentTier === "LEGENDARY" ? "bg-yellow-900 text-yellow-300" :
              currentTier === "EPIC" ? "bg-pink-900 text-pink-300" :
              currentTier === "RARE" ? "bg-purple-900 text-purple-300" :
              "bg-blue-900 text-blue-300"
            }`}>
              {currentTier}
            </span>
          </div>
        </div>
      </div>
      
      {/* Verification Status */}
      {isCheckingOwnership && (
        <div className="mb-4 bg-blue-900/30 p-3 rounded-lg flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <p className="text-sm text-blue-300">Verifying NFT ownership...</p>
        </div>
      )}
      
      {!isCheckingOwnership && !verifiedOwnership && !isStaked && (
        <div className="mb-4 bg-yellow-900/30 p-3 rounded-lg">
          <p className="text-sm text-yellow-300">
            We couldn't verify your ownership of this NFT. It might be staked elsewhere or not in your wallet.
          </p>
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 bg-green-900/30 p-3 rounded-lg border border-green-500/30">
          <p className="text-sm text-green-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <ErrorMessage 
          message={error}
          type={error.includes("Note:") ? "info" : "error"}
          className="mb-4"
          onDismiss={() => setError(null)}
        />
      )}
      
      {debugInfo && (
        <div className="bg-gray-700/70 p-3 rounded-lg mb-4 text-xs font-mono overflow-auto">
          <h4 className="font-medium text-yellow-400 mb-1">Debug Information</h4>
          <p>Transaction Signature: {debugInfo.txSignature}</p>
          <p>Response Status: {debugInfo.responseStatus}</p>
          <p>Error Details: {JSON.stringify(debugInfo.errorDetails, null, 2)}</p>
        </div>
      )}
      
      {isStaked ? (
        // Staking info display
        <div className="mb-6 animate-fadeIn">
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
                <span>{stakingInfo.progress_percentage?.toFixed(1) || 0}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                  style={{width: `${stakingInfo.progress_percentage || 0}%`}}
                ></div>
              </div>
            </div>
            
            {/* Earned so far */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">Earned so far</p>
              <p className="text-lg font-bold text-yellow-400">
                {stakingInfo.earned_so_far || 0} TESOLA
              </p>
            </div>
          </div>
          
          <button
            onClick={handleUnstake}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
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
              stakingInfo.is_unlocked ? "Claim & Unstake" : "Unstake NFT"
            )}
          </button>
          
          {new Date() < new Date(stakingInfo.release_date) && (
            <p className="text-xs text-center text-red-400 mt-2">
              Warning: Early unstaking will incur a penalty of approximately {Math.round(stakingInfo.total_rewards * 0.25)} TESOLA tokens.
            </p>
          )}
        </div>
      ) : (
        // Staking options input
        <div className="mb-6 animate-fadeIn">
          <div className="mb-4">
            <label htmlFor="stakingPeriod" className="block text-sm font-medium text-gray-300 mb-1">
              Staking Period
            </label>
            <select
              id="stakingPeriod"
              value={stakingPeriod}
              onChange={(e) => setStakingPeriod(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
              disabled={!verifiedOwnership || loading}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">365 days</option>
            </select>
          </div>
          
          <div className="bg-blue-900/30 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">Estimated Rewards</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total rewards:</span>
              <span className="text-xl font-bold text-yellow-400">{estimatedRewards} TESOLA</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Rewards are calculated based on NFT tier ({currentTier}: {
                currentTier === "LEGENDARY" ? "200" :
                currentTier === "EPIC" ? "100" :
                currentTier === "RARE" ? "50" : "25"
              } TESOLA/day) and staking period.
              Early unstaking may result in penalties.
            </p>
            
            {/* Preview staking rewards */}
            <div className="mt-4 pt-3 border-t border-blue-500/20">
              <h4 className="text-sm font-medium mb-2">Reward Preview</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-900/20 p-2 rounded">
                  <p className="text-xs text-gray-400 mb-1">First 7 days</p>
                  <p className="text-sm font-bold text-white">
                    +{currentTier === "LEGENDARY" ? "400" : currentTier === "EPIC" ? "200" : currentTier === "RARE" ? "100" : "50"}/day
                  </p>
                  <p className="text-xs text-green-400">2x bonus</p>
                </div>
                {parseInt(stakingPeriod) >= 30 && (
                  <div className="bg-blue-900/20 p-2 rounded">
                    <p className="text-xs text-gray-400 mb-1">30+ days</p>
                    <p className="text-sm font-bold text-white">
                      +{currentTier === "LEGENDARY" ? "240" : currentTier === "EPIC" ? "120" : currentTier === "RARE" ? "60" : "30"}/day
                    </p>
                    <p className="text-xs text-green-400">+20% bonus</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleStake}
            disabled={loading || !verifiedOwnership}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
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
          
          {!verifiedOwnership && !isCheckingOwnership && (
            <p className="text-xs text-center text-red-400 mt-2">
              You cannot stake this NFT because we couldn't verify your ownership.
            </p>
          )}
        </div>
      )}
      
      {/* Help text */}
      <div className="text-xs text-gray-400 mt-2">
        <p className="mb-1">
          <strong>What is staking?</strong> Staking allows you to earn TESOLA rewards by locking your NFT for a specific period.
        </p>
        <p>
          Higher tier NFTs earn more rewards. Longer staking periods result in higher total rewards.
        </p>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}