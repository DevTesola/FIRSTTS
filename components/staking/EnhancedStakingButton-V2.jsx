/**
 * EnhancedStakingButton-V2.jsx
 * Enhanced NFT Staking Button Component V2
 * 
 * - Implements Anchor discriminator calculation method
 * - Uses correct account order and structure
 * - Enhanced error handling and user feedback
 * - Staking limit verification and notifications
 */
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { GlassButton } from "../Buttons";
import { InfoTooltip } from "../common/InfoTooltip";
import { debugLog, debugError } from "../../utils/debugUtils";

/**
 * Enhanced NFT Staking Button Component
 * Anchor-compatible and account structure optimized version
 */
const EnhancedStakingButtonV2 = ({ 
  nft, 
  stakingPeriod, 
  onSuccess, 
  onError,
  disabled = false,
  onStartLoading,
  onEndLoading,
  className = "",
  showStakingInfo = false,
  autoCompound = false
}) => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [txResults, setTxResults] = useState({
    setup: null,
    stake: null
  });
  const [stakingInfo, setStakingInfo] = useState(null);
  
  // Handle loading effects
  useEffect(() => {
    if (status === "idle" || status === "success" || status === "error") {
      if (onEndLoading) onEndLoading();
    } else {
      if (onStartLoading) onStartLoading();
    }
  }, [status, onStartLoading, onEndLoading]);
  
  // Update progress
  useEffect(() => {
    if (status === "preparing") setProgress(10);
    else if (status === "processing") setProgress(30);
    else if (status === "signing") setProgress(50);
    else if (status === "submitting") setProgress(70);
    else if (status === "confirming") setProgress(90);
    else if (status === "success") setProgress(100);
  }, [status]);
  
  // Process transaction signing and submission
  const processTransaction = async (phase, txBase64, description, nextStatus, skipWhenNull = true) => {
    if (!txBase64 && skipWhenNull) {
      debugLog("EnhancedStakingButtonV2", `${phase} transaction not needed, skipping`);
      return { success: true, signature: null, skipped: true };
    }
    
    try {
      debugLog("EnhancedStakingButtonV2", `Processing ${phase} transaction: ${description}`);
      // Deserialize and sign transaction
      const txBuffer = Buffer.from(txBase64, "base64");
      const transaction = Transaction.from(txBuffer);
      
      setStatus("signing");
      const signedTx = await signTransaction(transaction);
      
      // Serialize signed transaction
      const serializedTx = Buffer.from(signedTx.serialize()).toString("base64");
      
      // Submit transaction
      setStatus("submitting");
      const response = await fetch("/api/staking/submitTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: serializedTx,
          type: `staking_${phase}`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${phase} transaction submission failed`);
      }
      
      const data = await response.json();
      
      // Wait for blockchain state update
      setStatus("confirming");
      const waitTime = phase === "setup" ? 2000 : 2000;
      debugLog("EnhancedStakingButtonV2", `Waiting for ${phase} transaction confirmation... (${waitTime}ms)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Update status
      setStatus(nextStatus);
      
      return { 
        success: true, 
        signature: data.data?.signature || "unknown",
        skipped: false
      };
    } catch (err) {
      debugError("EnhancedStakingButtonV2", `${phase} transaction error:`, err);
      setError(`${description}: ${err.message}`);
      setStatus("error");
      return { success: false, error: err };
    }
  };
  
  // Execute staking process
  const handleStake = async () => {
    if (!connected || !publicKey || !nft || !nft.mint) {
      setError("Wallet connection or NFT information is missing");
      return;
    }
    
    try {
      // Initialize state and error
      setStatus("preparing");
      setError(null);
      setProgress(0);
      setTxResults({
        setup: null,
        stake: null
      });
      
      // Prepare staking through API request
      const tierAttr = nft.attributes?.find(attr => attr.trait_type?.toLowerCase() === "tier");
      debugLog("EnhancedStakingButtonV2", "NFT tier information:", tierAttr);
      
      debugLog("EnhancedStakingButtonV2", "Making enhanced staking preparation API request...");
      // Use enhanced staking API endpoint
      const prepareResponse = await fetch("/api/staking/enhanced-staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingPeriod: stakingPeriod,
          nftTier: tierAttr?.value,
          nftName: nft.name || nft.metadata?.name,
          autoCompound: autoCompound
        })
      });
      
      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.message || "An error occurred during staking preparation");
      }
      
      const prepareData = await prepareResponse.json();
      
      if (!prepareData.success) {
        throw new Error(prepareData.message || "Staking preparation failed");
      }
      
      debugLog("EnhancedStakingButtonV2", "Staking preparation data:", prepareData.data);
      
      // Save staking information (reward details, etc.)
      if (prepareData.data.rewardDetails) {
        setStakingInfo(prepareData.data.rewardDetails);
      }
      
      const { 
        transactions, 
        requiredPhases,
        accountInitialization,
        accounts
      } = prepareData.data;
      
      setStatus("processing");
      
      // Check if all accounts are already initialized
      if (accountInitialization.allReady) {
        debugLog("EnhancedStakingButtonV2", "All accounts are already initialized. Proceeding directly to staking step.");
        setStatus("signing");
      } else {
        // 1. Process account initialization transaction
        if (requiredPhases.phase1) {
          const setupResult = await processTransaction(
            "setup",
            transactions.phase1,
            "Account Initialization",
            "signing" // Proceed directly to signing step
          );
          
          setTxResults(prev => ({ ...prev, setup: setupResult }));
          
          if (!setupResult.success) {
            return; // Stop on failure
          }
        } else {
          debugLog("EnhancedStakingButtonV2", "Account initialization not needed, proceeding to staking");
          setStatus("signing");
        }
      }
      
      // 2. Process staking transaction
      const stakeResult = await processTransaction(
        "stake",
        transactions.phase3,
        "NFT Staking",
        "success",
        false // This step must always be executed
      );
      
      setTxResults(prev => ({ ...prev, stake: stakeResult }));
      
      if (!stakeResult.success) {
        return; // Stop on failure
      }
      
      // 3. Success handling
      setStatus("success");
      
      // 4. Record staking completion
      try {
        debugLog("EnhancedStakingButtonV2", "Recording staking completion...");
        const completeResponse = await fetch("/api/staking/completeStaking-unified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature: stakeResult.signature,
            mintAddress: nft.mint,
            stakingPeriod: stakingPeriod,
            walletAddress: publicKey.toString(),
            accounts: accounts,
            autoCompound: autoCompound
          })
        });
        
        if (!completeResponse.ok) {
          debugLog("EnhancedStakingButtonV2", "Error recording staking completion, but blockchain transaction was successful.");
        }
      } catch (completeError) {
        debugError("EnhancedStakingButtonV2", "Error during staking completion recording:", completeError);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess({
          signature: stakeResult.signature,
          nft: nft,
          stakingPeriod: stakingPeriod,
          accounts: accounts,
          estimatedRewards: prepareData.data.rewardDetails,
          transactionResults: {
            setup: txResults.setup,
            stake: stakeResult
          }
        });
      }
      
    } catch (err) {
      debugError("EnhancedStakingButtonV2", "Staking error:", err);
      setStatus("error");
      setError(err.message || "Unknown error during staking");
      
      // Enhance error message
      let enhancedErrorMessage = err.message;
      
      // Special handling for MaxNftsExceeded error
      if (err.message.includes("MaxNftsExceeded") || err.message.includes("maximum")) {
        enhancedErrorMessage = "Maximum NFT staking limit reached. Please unstake one before staking another.";
      }
      // Special handling for account deserialization error
      else if (err.message.includes("deserialize") || err.message.includes("AccountDidNotDeserialize")) {
        enhancedErrorMessage = "Account structure issue detected. Please try emergency unstaking.";
      }
      
      // Call error callback
      if (onError) {
        onError({
          message: enhancedErrorMessage,
          originalError: err
        });
      }
    }
  };
  
  // Cancel or retry staking
  const handleCancel = () => {
    setStatus("idle");
    setError(null);
    setProgress(0);
    setTxResults({
      setup: null,
      stake: null
    });
  };
  
  // Handle loading state UI
  const renderLoadingState = () => {
    if (status === "idle" || status === "success") return null;
    
    return (
      <div className="mt-4">
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="mt-2 text-sm text-gray-300">
          {status === "preparing" && "Preparing staking..."}
          {status === "processing" && "Processing account initialization..."}
          {status === "signing" && "Signing transaction..."}
          {status === "submitting" && "Submitting transaction..."}
          {status === "confirming" && "Confirming on blockchain..."}
          {status === "error" && "Error occurred"}
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-400">
            Error: {error}
          </div>
        )}
      </div>
    );
  };
  
  // Display transaction result information
  const renderTransactionResults = () => {
    if (status !== "success") return null;
    
    return (
      <div className="mt-3 text-xs text-gray-400">
        <div className="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>NFT has been successfully staked!</span>
        </div>
        
        <div className="text-xxs text-gray-500 space-y-1">
          {txResults.setup && !txResults.setup.skipped && (
            <div>Account initialization: {txResults.setup.signature?.slice(0, 8)}...</div>
          )}
          {txResults.stake && (
            <div>Staking transaction: {txResults.stake.signature?.slice(0, 8)}...</div>
          )}
        </div>
      </div>
    );
  };
  
  // Display staking information
  const renderStakingInfo = () => {
    if (!showStakingInfo || !stakingInfo) return null;
    
    return (
      <div className="mt-3 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Estimated rewards:</span>
          <span className="text-green-400 font-semibold">{stakingInfo.totalRewards} TESOLA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Daily rewards:</span>
          <span className="text-green-400">{Math.round(stakingInfo.averageDailyReward)} TESOLA</span>
        </div>
        {stakingInfo.longTermBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Period bonus:</span>
            <span className="text-blue-400">+{stakingInfo.longTermBonus}%</span>
          </div>
        )}
        {autoCompound && (
          <div className="flex justify-between">
            <span className="text-gray-400">Auto compound:</span>
            <span className="text-blue-400">+10%</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-full">
      <GlassButton
        onClick={handleStake}
        disabled={disabled || !connected || !publicKey || status !== "idle" && status !== "error"}
        className={`w-full py-3 ${autoCompound ? 'bg-gradient-to-r from-blue-700 to-purple-800' : ''} ${className}`}
      >
        {status === "success" ? "Staking Complete!" : "Stake NFT"}
        {autoCompound && (
          <InfoTooltip title="Auto Compound" className="ml-2">
            Auto compound is activated, adding a +10% bonus to your rewards.
          </InfoTooltip>
        )}
      </GlassButton>
      
      {renderLoadingState()}
      {renderTransactionResults()}
      {renderStakingInfo()}
      
      {status === "error" && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={handleCancel}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedStakingButtonV2;