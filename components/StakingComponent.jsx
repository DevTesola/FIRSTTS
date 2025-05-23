"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import ErrorMessage from "./ErrorMessage";
import ErrorBoundary from "./ErrorBoundary";
import LoadingOverlay from "./LoadingOverlay";
import TransactionStatus from "./TransactionStatus";
import ProgressStepper from "./ProgressStepper";
import TokenAccountInitializer from "./staking/TokenAccountInitializer";
import EnhancedStakingButton from "./staking/EnhancedStakingButton";
import { processImageUrl, createPlaceholder, getNftPreviewImage } from "../utils/mediaUtils";

/**
 * NFT Staking Component for SOLARA
 * Allows users to stake their NFTs for TESOLA rewards
 * 
 * @param {Object} nft - The NFT to stake
 * @param {function} onSuccess - Callback for successful staking
 * @param {function} onError - Callback for staking errors
 */
const StakingComponent = React.memo(function StakingComponent({ nft, onSuccess, onError }) {
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
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const connectionAttempts = useRef(0);
  
  // Enhanced transaction state tracking
  const [transactionStatus, setTransactionStatus] = useState("idle"); // idle, preparing, awaiting_approval, submitting, confirming, completed, failed
  const [transactionDetails, setTransactionDetails] = useState({});
  const [transactionProgress, setTransactionProgress] = useState(0);

  // Token account initialization state
  const [showTokenInitializer, setShowTokenInitializer] = useState(false);
  const [tokenAccountStatus, setTokenAccountStatus] = useState(null); // null, 'checking', 'needs_init', 'ready'
  const [userTokenAccount, setUserTokenAccount] = useState(null);
  
  const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
  
  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      setIsOnline(true);
      setError(prev => prev?.includes("offline") ? null : prev);
      connectionAttempts.current = 0;
    };
    
    const handleOffline = () => {
      console.log("Network connection lost");
      setIsOnline(false);
      setError("You appear to be offline. Please check your internet connection.");
      
      // Cancel any in-progress transactions when going offline
      if (transactionInProgress) {
        setTransactionInProgress(false);
        setLoading(false);
      }
    };
    
    // Verify RPC endpoint connectivity
    const checkRpcConnection = async () => {
      try {
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        await connection.getVersion();
        if (!isOnline) {
          console.log("RPC endpoint is responsive");
          setIsOnline(true);
          setError(prev => prev?.includes("offline") ? null : prev);
        }
        connectionAttempts.current = 0;
      } catch (err) {
        console.error("Failed to connect to RPC endpoint:", err);
        connectionAttempts.current += 1;
        
        // Only set offline state after multiple failed attempts
        if (connectionAttempts.current >= 2 && isOnline) {
          setIsOnline(false);
          setError("Cannot connect to Solana network. Please check your internet connection.");
        }
      }
    };
    
    // Register event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Set initial state
      setIsOnline(navigator.onLine);
      
      // Check RPC connection on first load
      checkRpcConnection();
      
      // Set interval to check RPC connection periodically
      const intervalId = setInterval(checkRpcConnection, 30000);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(intervalId);
      };
    }
  }, []);

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
  
  // Check if NFT is already staked and verify ownership with debouncing
  useEffect(() => {
    // Track the current request state to handle component unmount
    let isMounted = true;
    let timeoutId = null;
    
    const checkStakingStatus = async () => {
      if (!connected || !publicKey || !nft?.mint) return;
      
      try {
        setIsCheckingOwnership(true);
        
        // First verify NFT ownership
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        
        // Add timeout protection for token account lookup
        const tokenAccountPromise = connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(nft.mint) }
        );
        
        // Create a timeout promise to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Token account lookup timed out after 10 seconds"));
          }, 10000);
        });
        
        // Race the token account lookup against the timeout
        const tokenAccounts = await Promise.race([
          tokenAccountPromise,
          timeoutPromise
        ]).finally(() => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        });
        
        // Check if the user owns this NFT
        const ownsNFT = tokenAccounts.value.length > 0 && 
                        tokenAccounts.value.some(account => 
                          account.account.data.parsed.info.tokenAmount.uiAmount === 1);
        
        // Update state only if component is still mounted
        if (isMounted) {
          setVerifiedOwnership(ownsNFT);
          
          if (!ownsNFT) {
            console.warn("User does not own this NFT or it's already staked elsewhere");
            setIsCheckingOwnership(false);
            return;
          }
        } else {
          return; // Exit if component unmounted
        }
        
        // Now check if it's already staked in our system with a timeout
        const controller = new AbortController();
        const timeoutId2 = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(
            `/api/getStakingInfo?wallet=${publicKey.toString()}&mintAddress=${nft.mint}`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId2);
          
          // Exit if component was unmounted while waiting
          if (!isMounted) return;
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error checking staking status:", errorData);
            setIsCheckingOwnership(false);
            return;
          }
          
          const data = await response.json();
          
          // Only update state if component is still mounted
          if (isMounted) {
            if (data.isStaked) {
              setIsStaked(true);
              setStakingInfo(data.stakingInfo);
            } else {
              setIsStaked(false);
              setStakingInfo(null);
            }
          }
        } catch (fetchError) {
          // Handle fetch errors or timeouts
          console.error("API request failed:", fetchError);
          if (fetchError.name === 'AbortError') {
            console.warn("API request timed out");
          }
          
          // Only update state if still mounted
          if (isMounted) {
            setError("Failed to check staking status. Please try again.");
          }
        } finally {
          clearTimeout(timeoutId2);
        }
      } catch (err) {
        console.error("Failed to check staking status:", err);
        // Only update state if component is still mounted
        if (isMounted) {
          setError("Failed to verify NFT ownership. Please refresh and try again.");
        }
      } finally {
        // Clean up even if there's an error
        if (isMounted) {
          setIsCheckingOwnership(false);
        }
      }
    };
    
    // Use a small delay before checking status to prevent rapid calls
    const delayId = setTimeout(() => {
      checkStakingStatus();
    }, 100);
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (delayId) clearTimeout(delayId);
      if (timeoutId) clearTimeout(timeoutId);
    };
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

  /**
   * Checks if the token account needs initialization and handles the initialization process.
   * Returns information about whether the account is ready and its address.
   */
  const checkTokenAccount = async () => {
    if (!connected || !publicKey || !nft?.mint) {
      setError("Please connect your wallet and select an NFT to stake.");
      return false;
    }

    if (!verifiedOwnership && !isCheckingOwnership) {
      setError("You don't own this NFT or it might be staked elsewhere.");
      return false;
    }

    try {
      setTokenAccountStatus('checking');
      console.log("Checking if token account needs initialization...");

      const response = await fetch("/api/staking/initializeTokenAccount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check token account status");
      }

      const data = await response.json();
      const needsInitialization = data.data.needsInitialization;

      if (needsInitialization) {
        console.log("Token account needs initialization");
        setTokenAccountStatus('needs_init');

        // Automatically show the initializer component
        setShowTokenInitializer(true);
        return {
          ready: false,
          userTokenAccount: data.data.userTokenAccount,
          diagnosticInfo: data.data.diagnosticInfo
        };
      } else {
        console.log("Token account is already initialized");
        setTokenAccountStatus('ready');
        setUserTokenAccount(data.data.userTokenAccount);
        return {
          ready: true,
          userTokenAccount: data.data.userTokenAccount
        };
      }
    } catch (err) {
      console.error("Error checking token account status:", err);
      setError(`Token account check failed: ${err.message}`);
      setTokenAccountStatus(null);
      return {
        ready: false,
        error: err.message
      };
    }
  };

  /**
   * Handles token account initialization completion
   * Upon successful initialization, automatically proceeds with the appropriate
   * staking method based on user preference or system recommendation
   */
  const handleTokenInitComplete = (initData) => {
    console.log("Token account initialization complete:", initData);
    setTokenAccountStatus('ready');
    setShowTokenInitializer(false);
    setUserTokenAccount(initData.userTokenAccount);

    // Create a toast notification for successful initialization
    try {
      // Use toast if available, otherwise just console.log
      if (typeof toast !== 'undefined') {
        toast.success("Token account successfully initialized");
      }
    } catch (error) {
      console.log("Token account successfully initialized");
    }

    // Ask user which staking method they prefer
    const preferredMethod = window.localStorage.getItem('preferredStakingMethod');

    // Default to 3-phase staking for better reliability unless user has explicitly chosen otherwise
    if (preferredMethod === 'original') {
      // Use the original staking method if user has explicitly chosen it before
      handleStake();
    } else {
      // Default to the more reliable 3-phase staking method
      handleThreePhaseStaking();
    }
  };

  // Handle token account initialization error
  const handleTokenInitError = (error) => {
    console.error("Token account initialization error:", error);
    setError(`Token account initialization failed: ${error.message}`);
    setTokenAccountStatus(null);
    setShowTokenInitializer(false);
  };

  // Handle token account initialization cancellation
  const handleTokenInitCancel = () => {
    setShowTokenInitializer(false);
    setTokenAccountStatus(null);
  };

  // 3단계 초기화 방식으로 스테이킹 실행
  const handleThreePhaseStaking = async () => {
    if (!connected || !publicKey || !nft?.mint) {
      setError("Please connect your wallet and select an NFT to stake.");
      return;
    }

    if (!verifiedOwnership && !isCheckingOwnership) {
      setError("You don't own this NFT or it might be staked elsewhere.");
      return;
    }

    // Check network connectivity
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError("You appear to be offline. Please check your internet connection and try again.");
      return;
    }

    // Prevent multiple simultaneous transactions
    if (transactionInProgress) {
      return;
    }

    setLoading(true);
    setTransactionInProgress(true);
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);
    setTransactionStatus("preparing");
    setTransactionProgress(0);

    try {
      // Get tier attributes from the NFT
      const tierAttr = nft.attributes?.find(attr =>
        attr.trait_type === "Tier" || attr.trait_type === "tier"
      );

      const rawTierValue = tierAttr ? tierAttr.value : null;
      console.log("Staking NFT with tier:", currentTier, "Raw value:", rawTierValue);

      // Step 1: 사용자 NFT 토큰 계정 초기화
      setTransactionStatus("initializing_user_token");
      setTransactionProgress(10);
      console.log("Step 1: Initializing user NFT token account...");

      const userTokenResponse = await fetch("/api/staking/initializeTokenAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint
        })
      });

      if (!userTokenResponse.ok) {
        const errorData = await userTokenResponse.json();
        if (!errorData.error.includes("already properly initialized")) {
          throw new Error(errorData.error || "Failed to initialize user token account");
        }
      }

      const userTokenData = await userTokenResponse.json();
      const userTokenAccount = userTokenData.data.userTokenAccount;
      setTransactionProgress(25);

      // Step 2: Escrow 계정 초기화
      setTransactionStatus("initializing_escrow");
      setTransactionProgress(30);
      console.log("Step 2: Initializing escrow account...");

      const escrowResponse = await fetch("/api/staking/initializeEscrowAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint
        })
      });

      if (!escrowResponse.ok) {
        const errorData = await escrowResponse.json();
        if (!errorData.error.includes("already initialized")) {
          throw new Error(errorData.error || "Failed to initialize escrow account");
        }
      }

      const escrowData = await escrowResponse.json();
      const escrowTokenAccount = escrowData.data.escrowTokenAccount;
      const escrowAuthority = escrowData.data.escrowAuthority;
      setTransactionProgress(50);

      // Step 3: 사용자 스테이킹 정보 초기화
      setTransactionStatus("initializing_staking_info");
      setTransactionProgress(60);
      console.log("Step 3: Initializing user staking info...");

      const stakingInfoResponse = await fetch("/api/staking/initializeUserStakingInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString()
        })
      });

      if (!stakingInfoResponse.ok) {
        const errorData = await stakingInfoResponse.json();
        if (!errorData.error.includes("already initialized")) {
          throw new Error(errorData.error || "Failed to initialize user staking info");
        }
      }

      const stakingInfoData = await stakingInfoResponse.json();
      const userStakingInfo = stakingInfoData.data.userStakingInfo;
      setTransactionProgress(75);

      // Step 4: 실제 스테이킹 트랜잭션 준비 및 실행
      setTransactionStatus("preparing_staking");
      setTransactionProgress(80);
      console.log("Step 4: Preparing actual staking transaction...");

      const prepareResponse = await fetch("/api/staking/prepareStaking-anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingPeriod: parseInt(stakingPeriod, 10),
          nftTier: currentTier,
          rawTierValue: rawTierValue,
          nftName: nft.name,
          accountInfo: {
            userTokenAccount,
            escrowTokenAccount,
            escrowAuthority,
            userStakingInfo
          }
        })
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        // Check if it's already staked
        if (errorData.error && errorData.error.existingStake) {
          setIsStaked(true);
          setStakingInfo(errorData.error.existingStake);
          throw new Error(`This NFT is already staked until ${new Date(errorData.error.existingStake.release_date).toLocaleDateString()}`);
        }
        throw new Error(errorData.error || "Failed to prepare staking transaction");
      }

      const prepareData = await prepareResponse.json();
      const stakeTx = Transaction.from(Buffer.from(prepareData.data.transactions.phase2, "base64"));

      // Step 5: 트랜잭션 서명 및 전송
      setTransactionStatus("awaiting_approval");
      setTransactionProgress(85);
      console.log("Step 5: Signing and sending staking transaction...");

      const signedTx = await signTransaction(stakeTx);
      setTransactionStatus("submitting");
      setTransactionProgress(90);

      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT, "confirmed");
      const txSignature = await connection.sendRawTransaction(signedTx.serialize());

      setTransactionStatus("confirming");
      setTransactionProgress(95);
      console.log("Transaction sent, signature:", txSignature);

      // Step 6: 트랜잭션 확인
      await connection.confirmTransaction(txSignature, "confirmed");

      // Step 7: Record staking completion
      setTransactionStatus("completing");
      setTransactionProgress(98);
      console.log("Step 7: Recording staking completion...");

      const completeResponse = await fetch("/api/staking/completeStaking-anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: txSignature,
          mintAddress: nft.mint,
          stakingPeriod: parseInt(stakingPeriod, 10),
          walletAddress: publicKey.toString(),
          accounts: prepareData.data.accounts
        })
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        console.warn("Warning: Failed to record staking completion, but transaction was successful:", errorData);
      }

      // Success handling
      setTransactionStatus("completed");
      setTransactionProgress(100);
      setIsStaked(true);

      const stakingResult = {
        txSignature,
        mintAddress: nft.mint,
        stakingPeriod: parseInt(stakingPeriod, 10)
      };

      setSuccessMessage(`Staking successful! Transaction: ${txSignature.slice(0, 8)}...`);
      setSuccessData(stakingResult);

      if (onSuccess) {
        onSuccess(stakingResult);
      }

    } catch (error) {
      console.error("Staking error:", error);
      setTransactionStatus("failed");
      setError(error.message);

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
      setTransactionInProgress(false);
    }
  };

  // Original staking method (will be phased out)
  const handleStake = async () => {
    if (!connected || !publicKey || !nft?.mint) {
      setError("Please connect your wallet and select an NFT to stake.");
      return;
    }

    if (!verifiedOwnership && !isCheckingOwnership) {
      setError("You don't own this NFT or it might be staked elsewhere.");
      return;
    }

    // Check network connectivity
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError("You appear to be offline. Please check your internet connection and try again.");
      return;
    }

    // Prevent multiple simultaneous transactions
    if (transactionInProgress) {
      return;
    }

    // First check if token account is initialized or needs initialization
    if (tokenAccountStatus !== 'ready') {
      setTransactionStatus("checking_token_account");
      const tokenAccountResult = await checkTokenAccount();

      if (!tokenAccountResult.ready) {
        // If account needs initialization, TokenAccountInitializer will be shown
        // and we should stop here until that process completes
        console.log("Token account requires initialization before staking", tokenAccountResult);
        return;
      }

      // Set the user token account from the result
      setUserTokenAccount(tokenAccountResult.userTokenAccount);
    }

    setLoading(true);
    setTransactionInProgress(true);
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);
    
    // Clear any existing timeouts
    if (transactionTimeoutId) {
      clearTimeout(transactionTimeoutId);
      setTransactionTimeoutId(null);
    }
    
    try {
      // Get tier attributes from the NFT
      const tierAttr = nft.attributes?.find(attr => 
        attr.trait_type === "Tier" || attr.trait_type === "tier"
      );
      
      const rawTierValue = tierAttr ? tierAttr.value : null;
      console.log("Staking NFT with tier:", currentTier, "Raw value:", rawTierValue);
      
      // Step 1: Prepare staking transaction with timeout protection
      console.log("Preparing staking transaction...");
      const prepareController = new AbortController();
      const prepareTimeoutId = setTimeout(() => prepareController.abort(), 15000);
      
      try {
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
          signal: prepareController.signal
        });
        
        clearTimeout(prepareTimeoutId);
        
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
        
        // Step 2: Sign transaction (with retry logic)
        console.log("Signing transaction...");
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
        
        if (!transaction.feePayer) {
          transaction.feePayer = publicKey;
        }
        
        let signedTransaction;
        let signAttempts = 0;
        const maxSignAttempts = 2;
        
        while (signAttempts < maxSignAttempts) {
          try {
            signedTransaction = await Promise.race([
              signTransaction(transaction),
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Signing timed out after 20 seconds")), 20000);
              })
            ]);
            console.log("Transaction signed successfully");
            break;
          } catch (signError) {
            signAttempts++;
            console.error(`Signing error (attempt ${signAttempts}/${maxSignAttempts}):`, signError);
            
            if (signError.message.includes("User rejected")) {
              throw new Error("Transaction was rejected by the user");
            }
            
            if (signAttempts >= maxSignAttempts) {
              throw new Error(`Failed to sign transaction after ${maxSignAttempts} attempts: ${signError.message}`);
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
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
          
          // More detailed logs
          if (sendError.logs) {
            console.log("Transaction logs:", sendError.logs);
          }
          
          // Extract error code for debugging
          const errorMatch = sendError.message.match(/Error Number: (\d+)/);
          const errorCode = errorMatch ? errorMatch[1] : "unknown";
          
          if (errorCode === "101") {
            throw new Error("Program instruction error: The blockchain program couldn't process this instruction (Error 101)");
          } else if (sendError.message.includes("blockhash")) {
            throw new Error("Transaction blockhash expired. Please try again.");
          } else if (sendError.message.includes("insufficient funds")) {
            throw new Error("Insufficient funds to complete this transaction. Please add SOL to your wallet.");
          } else {
            throw new Error(`Failed to send transaction: ${sendError.message}`);
          }
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
          
          // Check transaction status before giving up - it might have succeeded despite the timeout
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
        
        // Step 6: Record staking in backend with timeout protection
        console.log("Recording staking...");
        const completeController = new AbortController();
        const completeTimeoutId = setTimeout(() => completeController.abort(), 15000);
        
        try {
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
            signal: completeController.signal
          });
          
          clearTimeout(completeTimeoutId);
          
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
              setTransactionInProgress(false);
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
            image: nft.image ? processImageUrl(nft.image) : createPlaceholder(nft.name),
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
        } catch (completeError) {
          console.error("Complete staking error:", completeError);
          
          // Check if it's an abort error (timeout)
          if (completeError.name === 'AbortError') {
            // Even though we couldn't record it in backend, the blockchain transaction succeeded
            // Let's show a partial success
            setSuccessMessage(`Transaction successful but we couldn't verify it on our server. Please contact support with transaction ID: ${txSignature.slice(0, 8)}...`);
            
            // Save debug info
            setDebugInfo({
              txSignature,
              responseStatus: "timeout",
              errorDetails: { message: "Backend request timed out" }
            });
          } else {
            throw completeError;
          }
        } finally {
          clearTimeout(completeTimeoutId);
        }
      } catch (prepareError) {
        console.error("Prepare transaction error:", prepareError);
        
        // Check if it's an abort error (timeout)
        if (prepareError.name === 'AbortError') {
          throw new Error("Server request timed out. Please try again when the network is more responsive.");
        } else {
          throw prepareError;
        }
      } finally {
        clearTimeout(prepareTimeoutId);
      }
    } catch (err) {
      console.error("Staking error:", err);
      
      // Format user-friendly error message
      let errorMessage = "Failed to stake NFT";
      
      if (err.message) {
        if (err.message.includes("blockhash")) {
          errorMessage = "Transaction expired. Please try again.";
        } else if (err.message.includes("insufficient funds") || err.message.includes("0x1")) {
          errorMessage = "Not enough SOL to pay for transaction fees. Please add SOL to your wallet.";
        } else if (err.message.includes("timed out")) {
          errorMessage = "The operation timed out. The network may be congested, please try again later.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Call error callback
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
      setTransactionInProgress(false);
      
      // Ensure timeout is cleared
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId);
        setTransactionTimeoutId(null);
      }
    }
  };
  
  // Unstake NFT function with improved error handling, timeout protection and resilience
  const handleUnstake = async () => {
    if (!connected || !publicKey || !nft?.mint || !isStaked) {
      setError("Unable to unstake. Please check your wallet connection and NFT status.");
      return;
    }
    
    // Check network connectivity
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setError("You appear to be offline. Please check your internet connection and try again.");
      return;
    }
    
    // Prevent multiple simultaneous transactions
    if (transactionInProgress) {
      return;
    }
    
    setLoading(true);
    setTransactionInProgress(true);
    setError(null);
    setSuccessMessage(null);
    setDebugInfo(null);
    
    // Clear any existing timeouts
    if (transactionTimeoutId) {
      clearTimeout(transactionTimeoutId);
      setTransactionTimeoutId(null);
    }
    
    try {
      // Step 1: Prepare unstaking transaction with timeout protection
      console.log("Preparing unstaking transaction...");
      const prepareController = new AbortController();
      const prepareTimeoutId = setTimeout(() => prepareController.abort(), 15000);
      
      try {
        const response = await fetch("/api/prepareUnstaking_v3", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            mintAddress: nft.mint,
            stakingId: stakingInfo.id
          }),
          signal: prepareController.signal
        });
        
        clearTimeout(prepareTimeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to prepare unstaking transaction");
        }
        
        // Get response data with transaction and unstaking details
        const responseData = await response.json();
        console.log("Unstaking response:", responseData);
        
        // Extract key information
        const { transactionBase64, unstakingDetails, warning } = responseData;
        
        // Show warning about potential transaction failure
        if (warning) {
          console.warn("Transaction warning:", warning);
        }
        
        // Check for early unstaking penalty and show detailed warning
        let shouldConfirm = false;
        let confirmMessage = "";
        
        if (unstakingDetails?.isPremature && unstakingDetails?.penaltyPercentage > 0) {
          shouldConfirm = true;
          const { earnedRewards, penaltyAmount, penaltyPercentage, finalReward, daysRemaining } = unstakingDetails;
          
          confirmMessage = `Early Unstaking Penalty\n\n` + 
                           `Days remaining: ${daysRemaining}\n` +
                           `Earned rewards so far: ${earnedRewards} TESOLA\n` +
                           `Penalty: ${penaltyAmount} TESOLA (${penaltyPercentage}%)\n` +
                           `Final reward: ${finalReward} TESOLA\n\n` +
                           `Do you want to proceed with early unstaking?`;
        }
        
        if (shouldConfirm) {
          const confirmed = window.confirm(confirmMessage);
          
          if (!confirmed) {
            setLoading(false);
            setTransactionInProgress(false);
            return;
          }
        }
        
        // Step 2: Sign transaction (with retry logic)
        console.log("Signing unstaking transaction...");
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
        const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
        
        if (!transaction.feePayer) {
          transaction.feePayer = publicKey;
        }
        
        let signedTransaction;
        let signAttempts = 0;
        const maxSignAttempts = 2;
        
        while (signAttempts < maxSignAttempts) {
          try {
            signedTransaction = await Promise.race([
              signTransaction(transaction),
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Signing timed out after 20 seconds")), 20000);
              })
            ]);
            console.log("Transaction signed successfully");
            break;
          } catch (signError) {
            signAttempts++;
            console.error(`Signing error (attempt ${signAttempts}/${maxSignAttempts}):`, signError);
            
            if (signError.message.includes("User rejected")) {
              throw new Error("Transaction was rejected by the user");
            }
            
            if (signAttempts >= maxSignAttempts) {
              throw new Error(`Failed to sign transaction after ${maxSignAttempts} attempts: ${signError.message}`);
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Step 3: Send transaction with error handling
        console.log("Sending unstaking transaction...");
        let signature;
        
        try {
          signature = await connection.sendRawTransaction(
            signedTransaction.serialize(),
            {
              skipPreflight: false,
              preflightCommitment: 'confirmed'
            }
          );
          console.log("Unstaking transaction sent:", signature);
        } catch (sendError) {
          console.error("Send transaction error:", sendError);
          
          // Log detailed error information
          if (sendError.logs) {
            console.log("Transaction logs:", sendError.logs);
          }
          
          // Extract error code for debugging
          const errorMatch = sendError.message.match(/Error Number: (\d+)/);
          const errorCode = errorMatch ? errorMatch[1] : "unknown";
          
          if (errorCode === "101") {
            throw new Error("Program instruction error: The blockchain program couldn't process this instruction (Error 101)");
          } else if (sendError.message.includes("blockhash")) {
            throw new Error("Transaction blockhash expired. Please try again.");
          } else if (sendError.message.includes("insufficient funds")) {
            throw new Error("Insufficient funds to complete this transaction. Please add SOL to your wallet.");
          } else {
            throw new Error(`Failed to send transaction: ${sendError.message}`);
          }
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
          console.log("Confirming unstaking transaction...");
          await Promise.race([
            connection.confirmTransaction(signature, "confirmed"),
            timeoutPromise
          ]);
          
          // Clear timeout if confirmation succeeds
          if (transactionTimeoutId) {
            clearTimeout(transactionTimeoutId);
            setTransactionTimeoutId(null);
          }
          
          console.log("Unstaking transaction confirmed");
        } catch (confirmError) {
          console.error("Confirmation error during unstaking:", confirmError);
          
          // Clear timeout if we got an error
          if (transactionTimeoutId) {
            clearTimeout(transactionTimeoutId);
            setTransactionTimeoutId(null);
          }
          
          // Check transaction status before giving up - it might have succeeded despite the timeout
          try {
            const status = await connection.getSignatureStatus(signature);
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
        
        // Step 6: Complete unstaking in backend with timeout protection
        console.log("Completing unstaking in backend...");
        const completeController = new AbortController();
        const completeTimeoutId = setTimeout(() => completeController.abort(), 15000);
        
        try {
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
            signal: completeController.signal
          });
          
          clearTimeout(completeTimeoutId);
          
          if (!completeResponse.ok) {
            const errorData = await completeResponse.json();
            
            // Save debug info for display
            setDebugInfo({
              txSignature: signature,
              responseStatus: completeResponse.status,
              errorDetails: errorData
            });
            
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
            image: nft.image ? processImageUrl(nft.image) : createPlaceholder(nft.name),
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
        } catch (completeError) {
          console.error("Complete unstaking error:", completeError);
          
          // Check if it's an abort error (timeout)
          if (completeError.name === 'AbortError') {
            // Even though we couldn't record it in backend, the blockchain transaction succeeded
            // Let's show a partial success
            setSuccessMessage(`Transaction successful but we couldn't verify it on our server. Please contact support with transaction ID: ${signature.slice(0, 8)}...`);
            
            // Save debug info
            setDebugInfo({
              txSignature: signature,
              responseStatus: "timeout",
              errorDetails: { message: "Backend request timed out" }
            });
          } else {
            throw completeError;
          }
        } finally {
          clearTimeout(completeTimeoutId);
        }
      } catch (prepareError) {
        console.error("Prepare unstaking error:", prepareError);
        
        // Check if it's an abort error (timeout)
        if (prepareError.name === 'AbortError') {
          throw new Error("Server request timed out. Please try again when the network is more responsive.");
        } else {
          throw prepareError;
        }
      } finally {
        clearTimeout(prepareTimeoutId);
      }
    } catch (err) {
      console.error("Unstaking error:", err);
      
      // Format user-friendly error message
      let errorMessage = "Failed to unstake NFT";
      
      if (err.message) {
        if (err.message.includes("blockhash")) {
          errorMessage = "Transaction expired. Please try again.";
        } else if (err.message.includes("insufficient funds") || err.message.includes("0x1")) {
          errorMessage = "Not enough SOL to pay for transaction fees. Please add SOL to your wallet.";
        } else if (err.message.includes("timed out")) {
          errorMessage = "The operation timed out. The network may be congested, please try again later.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
      setTransactionInProgress(false);
      
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

  // Get optimized image URL for NFT with fallback
  const nftImageUrl = nft.image ? processImageUrl(nft.image) : nft.id ? getNftPreviewImage(nft.id) : createPlaceholder(nft.name);

  return (
    <ErrorBoundary>
      {/* New 3-Phase Staking Banner */}
      <div className="mb-6 p-3 bg-indigo-50 rounded-md border border-indigo-200">
        <h3 className="text-sm font-bold text-indigo-700 mb-1">통합 스테이킹 방식이 적용되었습니다</h3>
        <p className="text-xs text-indigo-600">
          이제 기존에 발생하던 모든 오류가 수정된 단일 스테이킹 방식을 제공합니다.
          계정 초기화 오류와 벡터 파싱 오류가 해결되어 더 안정적인 스테이킹이 가능합니다.
        </p>
      </div>
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
                    e.target.src = createPlaceholder(successData.nftName || "NFT");
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
      
      {/* Network Status Indicator (when offline) */}
      {!isOnline && (
        <div className="mb-4 bg-red-900/30 p-3 rounded-lg border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-300">Network connectivity issue detected</p>
          </div>
          <button 
            onClick={() => {
              // Reset error state and attempt to reconnect
              setError(null);
              setIsOnline(navigator.onLine);
              connectionAttempts.current = 0;
              
              // Try to connect to RPC endpoint
              const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
              connection.getVersion()
                .then(() => {
                  console.log("RPC connection restored");
                  setIsOnline(true);
                })
                .catch(err => {
                  console.error("Failed to reconnect:", err);
                  setIsOnline(false);
                  setError("Still unable to connect. Please check your internet connection.");
                });
            }}
            className="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* NFT Info */}
      <div className="flex items-center mb-4 p-3 bg-gray-700 rounded-lg">
        {nft.image && (
          <img 
            src={nftImageUrl} 
            alt={nft.name} 
            className="w-14 h-14 rounded object-cover mr-3"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = createPlaceholder(nft.name || "NFT");
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
            disabled={loading || transactionInProgress || !isOnline}
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
            ) : !isOnline ? (
              "Network Offline"
            ) : (
              stakingInfo.is_unlocked ? "Claim & Unstake" : "Unstake NFT"
            )}
          </button>
          
          {new Date() < new Date(stakingInfo.release_date) && (
            <div className="mt-2 bg-orange-900/40 p-2 rounded-lg border border-orange-500/20">
              <p className="text-xs text-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Early unstaking now available!</span> A penalty will be applied based on remaining time ({Math.round((new Date(stakingInfo.release_date) - new Date()) / (1000 * 60 * 60 * 24))} days left).
                <br/>
                <span className="text-xs text-orange-300/70 block mt-1">
                  The earlier you unstake, the higher the penalty. Maximum penalty is 50% of earned rewards.
                </span>
              </p>
            </div>
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
              disabled={!verifiedOwnership || loading || transactionInProgress}
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
          
          {/* Account Status Indicator */}
          {tokenAccountStatus && tokenAccountStatus !== 'ready' && (
            <div className={`mb-4 p-3 rounded-lg border ${
              tokenAccountStatus === 'checking' ? 'bg-blue-900/30 border-blue-500/30' :
              tokenAccountStatus === 'needs_init' ? 'bg-yellow-900/30 border-yellow-500/30' :
              'bg-red-900/30 border-red-500/30'
            }`}>
              {tokenAccountStatus === 'checking' && (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-300">Checking token account status...</span>
                </div>
              )}

              {tokenAccountStatus === 'needs_init' && !showTokenInitializer && (
                <div className="text-center">
                  <p className="text-yellow-300 text-sm mb-2">Your token account needs to be initialized before staking</p>
                  <button
                    onClick={() => setShowTokenInitializer(true)}
                    className="px-4 py-2 bg-yellow-600/70 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Initialize Token Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Token account initialization automatically checked before staking */}
          {tokenAccountStatus === 'ready' && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-300">Token account is initialized and ready for staking</span>
              </div>
            </div>
          )}

          {/* Enhanced Staking Button - Using our new unified component */}
          <div className="flex flex-col space-y-3">
            <EnhancedStakingButton
              nft={nft}
              stakingPeriod={stakingPeriod}
              onSuccess={(result) => {
                // Show success message
                setSuccessMessage(`NFT has been successfully staked.`);
                setSuccessData(result);
                setShowSuccessPopup(true);

                if (onSuccess) {
                  onSuccess(result);
                }
              }}
              onError={(err) => {
                // Show error message
                setError(err.message || 'Unknown error during staking');
                if (onError) {
                  onError(err);
                }
              }}
              onStartLoading={() => setLoading(true)}
              onEndLoading={() => setLoading(false)}
              disabled={!verifiedOwnership || transactionInProgress || !isOnline}
            />
          </div>
          
          {/* Minimum staking period warning message */}
          <div className="mt-2 bg-amber-900/40 p-3 rounded-lg border border-amber-500/20">
            <p className="text-xs text-center text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Important Notice:</span> You must wait at least 7 days after staking before unstaking is possible.
              <br/>
              <span className="text-xs text-amber-300/70 block mt-1">
                This minimum period is enforced by the blockchain smart contract and transactions will fail if attempted earlier.
              </span>
            </p>
          </div>

          {/* Show token account status if in checking state */}
          {tokenAccountStatus === 'checking' && (
            <div className="mt-2 bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
              <p className="text-xs text-center text-blue-300 flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking token account status...
              </p>
            </div>
          )}

          {/* Token account initializer modal */}
          {showTokenInitializer && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
              <TokenAccountInitializer
                mintAddress={nft.mint}
                onSuccess={handleTokenInitComplete}
                onError={handleTokenInitError}
                onCancel={handleTokenInitCancel}
              />
            </div>
          )}

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
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Only re-render if NFT data has changed by comparing minimal properties
  // This optimizes performance by preventing unnecessary renders
  if (!prevProps.nft && !nextProps.nft) return true;
  if (!prevProps.nft || !nextProps.nft) return false;
  
  const prevMint = prevProps.nft.mint;
  const nextMint = nextProps.nft.mint;
  
  // If mint address is the same, it's likely the same NFT
  return prevMint === nextMint;
});

export default StakingComponent;