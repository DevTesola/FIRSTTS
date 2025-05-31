"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import Image from "next/image";
import ErrorMessage from "./ErrorMessage";
import WalletGuide from "./WalletGuide";
import { useAnalytics } from "./AnalyticsProvider";
import { mintingConfig } from "../utils/minting-config";

// Use mainnet configuration for minting
const SOLANA_RPC_ENDPOINT = mintingConfig.rpcEndpoint;
const MINT_PRICE = `${mintingConfig.getNftPriceInSol()} SOL`;

/**
 * Enhanced minting section component
 * Improved user experience and error handling
 */
export default function MintSection({ 
  mintPrice = MINT_PRICE, 
  onMintComplete, 
  isClient = false,
  setErrorMessage,
  setErrorDetails,
  setLoading,
  showRefundPolicy,
  mintAttempts = 0
}) {
  const { publicKey, connected, signTransaction } = useWallet() || {};
  const { trackEvent } = useAnalytics();
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [solBalance, setSolBalance] = useState(null);
  const [hasSufficientFunds, setHasSufficientFunds] = useState(true);

  // Check user's SOL balance (using server API)
  const checkBalance = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    try {
      // Use server API to get balance (no CORS issues)
      const response = await fetch('/api/getBalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Balance API error: ${response.status}`);
      }
      
      const data = await response.json();
      const balanceInSol = data.balance;
      setSolBalance(balanceInSol);
      
      // Mint price (convert string to number)
      const mintPriceValue = parseFloat(mintPrice.replace(' SOL', ''));
      
      // Check if user has enough SOL for minting (add 0.01 SOL for transaction fees)
      setHasSufficientFunds(balanceInSol >= (mintPriceValue + 0.01));
    } catch (err) {
      console.error('Error checking balance:', err);
      // Allow minting even if error occurs (will be checked again in actual transaction)
      setHasSufficientFunds(true);
    }
  }, [publicKey, connected, mintPrice]);
  
  // Check balance when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
      
      // Update balance every 10 seconds
      const interval = setInterval(checkBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, checkBalance]);
  
  // Reset UI state when mint attempts change
  useEffect(() => {
    if (mintAttempts > 0) {
      setAgreedToPolicy(false);
      setTransactionPending(false);
    }
  }, [mintAttempts]);

  // Minting handler function
  const handlePurchase = async () => {
    // Analytics event - mint started
    trackEvent('mint_started', { wallet: publicKey?.toString()?.slice(0, 8) });
    
    try {
      setLoading(true);
      setTransactionPending(true);
      setErrorMessage(null);
      setErrorDetails(null);
      
      if (!connected || !publicKey) {
        throw new Error("Please connect a wallet");
      }
      
      // Check balance again
      await checkBalance();
      if (!hasSufficientFunds && solBalance !== null) {
        throw new Error(`Insufficient funds. You need at least ${mintPrice} plus transaction fees. Current balance: ${solBalance.toFixed(4)} SOL`);
      }

      // Step 1: Prepare NFT purchase - NFT reservation and payment transaction creation
      console.log("Preparing purchase...");
      
      // Set 60 second timeout with AbortController
      const purchaseController = new AbortController();
      const purchaseTimeoutId = setTimeout(() => purchaseController.abort(), 60000);
      
      const res = await fetch("/api/purchaseNFT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
        signal: purchaseController.signal
      });
      
      clearTimeout(purchaseTimeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server response error: ${errorText}`);
        }
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const { transaction, mint, filename, mintIndex, lockId, paymentId } = await res.json();
      console.log("Received transaction data:", { mint, filename, mintIndex, lockId });
      
      // Analytics event - transaction created
      trackEvent('mint_transaction_created', { 
        mintIndex: mintIndex, 
        filename: filename 
      });

      // Step 2: Transaction size validation
      const txBuf = Buffer.from(transaction, "base64");
      if (txBuf.length > 1232) {
        throw new Error("Transaction size exceeds Solana limit (1232 bytes)");
      }

      // Step 3: Request transaction signature
      console.log("Signing transaction...");
      const tx = Transaction.from(txBuf);
      if (!tx.feePayer) tx.feePayer = publicKey;

      let signedTx;
      try {
        signedTx = await signTransaction(tx);
      } catch (signError) {
        // Analytics event - signature failed
        trackEvent('mint_signature_rejected', { error: signError.message });
        throw new Error('Transaction signing was cancelled or failed');
      }
      
      console.log("Transaction signed:", signedTx);
      
      // Analytics event - transaction signed
      trackEvent('mint_transaction_signed');

      // Step 4: Send signed transaction via server API
      const rawTx = signedTx.serialize();
      
      console.log("Sending transaction to blockchain...");
      const submitResponse = await fetch('/api/submitTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: Buffer.from(rawTx).toString('base64')
        })
      });
      
      if (!submitResponse.ok) {
        const submitError = await submitResponse.json();
        throw new Error(submitError.error || 'Failed to submit transaction');
      }
      
      const submitData = await submitResponse.json();
      const signature = submitData.signature;
      
      // Analytics event - transaction sent and confirmed
      trackEvent('mint_transaction_sent', { signature: signature });
      trackEvent('mint_transaction_confirmed', { signature: signature });

      // Step 5.5: Refresh lock timestamp
      try {
        console.log("Refreshing lock to prevent timeout...");
        
        // Set 30 second timeout with AbortController (lock refresh should be fast)
        const refreshController = new AbortController();
        const refreshTimeoutId = setTimeout(() => refreshController.abort(), 30000);
        
        const refreshRes = await fetch("/api/refreshLock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: publicKey.toBase58(),
            mintIndex,
            lockId
          }),
          signal: refreshController.signal
        });
        
        clearTimeout(refreshTimeoutId);

        if (!refreshRes.ok) {
          console.warn("Failed to refresh lock, continuing with minting...");
        } else {
          console.log("Lock refreshed successfully");
        }
      } catch (refreshErr) {
        console.warn("Lock refresh error, continuing with minting:", refreshErr);
      }

      // Step 6: Complete minting process
      console.log("Completing minting process...");
      
      // Set 90 second timeout with AbortController (minting completion may take longer)
      const completeController = new AbortController();
      const completeTimeoutId = setTimeout(() => completeController.abort(), 90000);
      
      const completeRes = await fetch("/api/completeMinting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          paymentTxId: signature,
          mintIndex,
          lockId
        }),
        signal: completeController.signal
      });
      
      clearTimeout(completeTimeoutId);

      if (!completeRes.ok) {
        const completeErrData = await completeRes.json();
        throw new Error(completeErrData.error || "Failed to complete minting");
      }

      const completeMintData = await completeRes.json();
      console.log("Minting completed:", completeMintData);
      
      // Analytics event - mint completed
      trackEvent('mint_completed', { 
        mintAddress: completeMintData.mintAddress,
        filename: filename
      });

      // Step 7: UI update and result display
      if (onMintComplete) {
        try {
          // Fetch metadata from IPFS gateway
          const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
          const resourceCID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';
          const metadataUrl = `${ipfsGateway}/ipfs/${resourceCID}/${filename}.json`;
          console.log("Loading metadata from:", metadataUrl);
          
          const metadataRes = await fetch(metadataUrl);
          if (!metadataRes.ok) {
            throw new Error(`Failed to load metadata from IPFS: ${metadataRes.status}`);
          }
          
          const metadata = await metadataRes.json();
          
          // Add mint address if not in metadata
          if (!metadata.mintAddress && completeMintData.mintAddress) {
            metadata.mintAddress = completeMintData.mintAddress;
          }
          
          // Call result callback
          onMintComplete({ metadata, filename });
          
          // Analytics event - metadata loaded
          trackEvent('mint_metadata_loaded', { 
            filename: filename,
            tier: metadata.attributes?.find(a => a.trait_type === 'Tier')?.value || 'Unknown'
          });
        } catch (metadataErr) {
          console.error("Metadata loading error:", metadataErr);
          
          // Analytics event - metadata load failed
          trackEvent('mint_metadata_error', { error: metadataErr.message });
          
          // Minting succeeded even if metadata load failed, so callback with default info
          onMintComplete({
            metadata: {
              name: `SOLARA #${filename}`,
              description: "A unique SOLARA NFT from the GEN:0 collection.",
              image: `https://tesola.mypinata.cloud/ipfs/QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3/${filename}.png`,
              mintAddress: completeMintData.mintAddress
            },
            filename
          });
        }
      }
    } catch (err) {
      console.error("Minting error:", err);
      
      // Analytics event - mint failed
      trackEvent('mint_failed', { error: err.message });
      
      // Generate user-friendly error message
      let userMessage = "Minting failed. Please try again.";
      
      if (err.message.includes("wallet")) userMessage = "Wallet not connected.";
      else if (err.message.includes("No available NFT")) userMessage = "All NFTs are sold out.";
      else if (err.message.includes("metadata")) userMessage = "Failed to load NFT metadata. Please check IPFS connection and try again.";
      else if (err.message.includes("Invalid wallet")) userMessage = "Invalid wallet address.";
      else if (err.message.includes("buffer")) userMessage = "Invalid transaction data from server.";
      else if (err.message.includes("blockhash")) userMessage = "Invalid transaction configuration.";
      else if (err.message.includes("insufficient") || err.message.includes("Insufficient")) userMessage = "Insufficient funds in your wallet.";
      else if (err.message.includes("rejected")) userMessage = "Transaction rejected by wallet.";
      else if (err.message.includes("timeout")) userMessage = "Network timeout. Please try again.";
      else if (err.name === "AbortError") userMessage = "Request timeout. The server is taking too long to respond. Please try again.";
      else if (err.message.includes("Failed to fetch")) userMessage = "Network connection failed. Please check your internet connection and try again.";
      
      setErrorMessage(userMessage);
      setErrorDetails(err.message || err.toString());
    } finally {
      setLoading(false);
      setTransactionPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-10 w-full max-w-sm mx-auto">
      {/* Wallet connection guide */}
      <WalletGuide />
      
      {isClient ? (
        <>
          <div className="wallet-button-container">
            <WalletMultiButton />
          </div>
          
          {connected && publicKey && (
            <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center justify-between">
                <span>Connected Wallet: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
                
                {solBalance !== null && (
                  <span className={`ml-2 font-bold ${hasSufficientFunds ? 'text-green-400' : 'text-red-400'}`}>
                    {solBalance.toFixed(4)} SOL
                  </span>
                )}
              </div>
              
              {/* Insufficient balance warning */}
              {!hasSufficientFunds && solBalance !== null && (
                <div className="mt-1 text-xs text-red-400">
                  Insufficient funds for minting. You need at least {mintPrice} plus fees.
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div>Loading wallet button...</div>
      )}
      
      {isClient && connected && (
        <div className="w-full">
          {/* Refund policy agreement checkbox */}
          <div className="mb-4 flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToPolicy"
              checked={agreedToPolicy}
              onChange={(e) => {
                setAgreedToPolicy(e.target.checked);
                if (e.target.checked) {
                  // Analytics event - refund policy agreed
                  trackEvent('refund_policy_agreed');
                }
              }}
              className="mt-1"
            />
            <label htmlFor="agreeToPolicy" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => {
                  showRefundPolicy();
                  // Analytics event - refund policy viewed
                  trackEvent('refund_policy_viewed');
                }}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                refund policy
              </button>
              {" "}and understand that NFT sales are final.
            </label>
          </div>
          
          <button
            onClick={handlePurchase}
            disabled={!agreedToPolicy || transactionPending || !hasSufficientFunds}
            className={`w-full mint-button inline-flex items-center justify-center ${
              !agreedToPolicy || transactionPending || !hasSufficientFunds ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Mint an NFT"
          >
            {transactionPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Mint Now ({mintPrice})
                <span className="ml-3">
                  <Image src="/logo2.png" alt="SOLARA Logo" width={32} height={32} priority />
                </span>
              </>
            )}
          </button>
          
          {/* Separate insufficient balance warning */}
          {!hasSufficientFunds && solBalance !== null && connected && (
            <div className="mt-2 text-xs text-center text-red-400">
              Please add more SOL to your wallet to mint.
            </div>
          )}
        </div>
      )}
      
      {isClient && !connected && (
        <div className="text-red-500 font-mono text-sm md:text-base">
          Wallet not connected. Please connect a wallet to mint.
        </div>
      )}
    </div>
  );
}