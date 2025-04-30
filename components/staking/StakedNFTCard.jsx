import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { PrimaryButton, SecondaryButton } from "../Buttons";

/**
 * StakedNFTCard Component
 * Displays information about a staked NFT and allows for unstaking
 */
const StakedNFTCard = ({ stake, onRefresh }) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [error, setError] = useState(null);
  
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
  
  // Handle unstaking NFT
  const handleUnstake = async () => {
    if (!connected || !publicKey) {
      setError("Wallet not connected");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
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
      alert(`Successfully unstaked NFT! You earned ${data.earnedRewards} TESOLA tokens.`);
      
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
    if (lowerTier.includes("epic")) return "bg-pink-900/30 border-pink-500/30 text-pink-300";
    if (lowerTier.includes("rare")) return "bg-purple-900/30 border-purple-500/30 text-purple-300";
    return "bg-blue-900/30 border-blue-500/30 text-blue-300"; // Common default
  };
  
  // Get the appropriate tier badge color
  const getTierBadge = (tier) => {
    const lowerTier = (tier || "").toLowerCase();
    if (lowerTier.includes("legendary")) return "bg-yellow-900 text-yellow-300";
    if (lowerTier.includes("epic")) return "bg-pink-900 text-pink-300";
    if (lowerTier.includes("rare")) return "bg-purple-900 text-purple-300";
    return "bg-blue-900 text-blue-300"; // Common default
  };
  
  // Extract NFT name or use placeholder
  const nftName = stake.nft_name || `SOLARA NFT #${stake.id}`;
  
  // Determine if NFT is unlocked (staking period complete)
  const isUnlocked = stake.is_unlocked || calculateDaysLeft(stake.release_date) === 0;
  
  return (
    <div className={`rounded-lg border p-4 ${getTierStyle(stake.nft_tier)}`}>
      {/* NFT Header with name and tier */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-white">{nftName}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTierBadge(stake.nft_tier)}`}>
              {stake.nft_tier || "Common"}
            </span>
            {isUnlocked && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300 font-medium">
                Unlocked
              </span>
            )}
          </div>
        </div>
        
        {/* Toggle expanded view button */}
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="text-white/70 hover:text-white"
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
      
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">Progress</span>
          <span className="text-white">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
            style={{width: `${progressPercentage}%`}}
          ></div>
        </div>
      </div>
      
      {/* Basic info - always visible */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <div className="text-white/70">Staked On</div>
          <div className="font-medium text-white">{formatDate(stake.staked_at)}</div>
        </div>
        <div>
          <div className="text-white/70">Release Date</div>
          <div className="font-medium text-white">{formatDate(stake.release_date)}</div>
        </div>
      </div>
      
      {/* Reward info - always visible */}
      <div className="bg-black/20 rounded-lg p-3 mb-3">
        <div className="text-center">
          <div className="text-white/70 text-xs">Earned so far</div>
          <div className="text-xl font-bold text-white">{stake.earned_so_far || 0} TESOLA</div>
        </div>
      </div>
      
      {/* Expandable details */}
      {expandedView && (
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
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
              <div className="font-medium text-white">{stake.total_rewards} TESOLA</div>
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
              <p>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
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
          onClick={handleUnstake}
          loading={loading}
          fullWidth
          className={isUnlocked ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500' : ''}
        >
          {isUnlocked ? 'Claim & Unstake' : 'Unstake NFT'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default StakedNFTCard;