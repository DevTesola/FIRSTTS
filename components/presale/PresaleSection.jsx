import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction } from "@solana/web3.js";
import Image from "next/image";
import ErrorMessage from "../ErrorMessage";
import { toast } from "react-toastify";

// Environment variables and defaults
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
const TOKEN_PRICE = process.env.NEXT_PUBLIC_TOKEN_PRICE || "0.000005 SOL";

/**
 * Improved presale section component for token purchases
 * With enhanced user experience and error handling
 */
export default function PresaleSection({ 
  tokenPrice = TOKEN_PRICE, 
  onPurchaseComplete, 
  isClient = false,
  setErrorMessage,
  setErrorDetails,
  setLoading,
  showTerms 
}) {
  const { publicKey, connected, signTransaction } = useWallet() || {};
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [solBalance, setSolBalance] = useState(null);
  const [hasSufficientFunds, setHasSufficientFunds] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(20000); // Default 20k tokens
  const [totalCost, setTotalCost] = useState(0);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [whitelistChecked, setWhitelistChecked] = useState(false);

  // Calculate total cost based on token amount
  useEffect(() => {
    const price = parseFloat(tokenPrice.replace(' SOL', ''));
    setTotalCost(purchaseAmount * price);
  }, [purchaseAmount, tokenPrice]);

  // Check whitelist status
  useEffect(() => {
    if (connected && publicKey) {
      checkWhitelistStatus();
    } else {
      setIsWhitelisted(false);
      setWhitelistChecked(false);
    }
  }, [connected, publicKey]);

  // Check if wallet is whitelisted
  const checkWhitelistStatus = async () => {
    try {
      const res = await fetch("/api/presale/checkWhitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      
      const data = await res.json();
      setIsWhitelisted(data.isWhitelisted);
      setWhitelistChecked(true);
    } catch (err) {
      console.error("Error checking whitelist status:", err);
      setIsWhitelisted(false);
      setWhitelistChecked(true);
    }
  };

  // Check user's SOL balance
  const checkBalance = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      const balance = await connection.getBalance(publicKey);
      
      // Convert lamports to SOL (1 SOL = 10^9 lamports)
      const balanceInSol = balance / 1_000_000_000;
      setSolBalance(balanceInSol);
      
      // Check if user has enough SOL for the transaction + fees
      setHasSufficientFunds(balanceInSol >= (totalCost + 0.01));
    } catch (err) {
      console.error('Error checking balance:', err);
      // Allow purchases even on balance check failure (will be checked again during transaction)
      setHasSufficientFunds(true);
    }
  }, [publicKey, connected, totalCost]);
  
  // Check balance when wallet connects or purchase amount changes
  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
      
      // Update balance every 10 seconds
      const interval = setInterval(checkBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, checkBalance, totalCost]);
  
  // Handle amount inputs
  const handleAmountChange = (e) => {
    const value = parseInt(e.target.value.replace(/\D/g, ''));
    if (!isNaN(value) && value >= 1000) {
      setPurchaseAmount(Math.min(value, 10000000)); // Cap at 10 million tokens
    } else {
      setPurchaseAmount(1000); // Minimum 1000 tokens
    }
  };

  // Quick amount selection buttons
  const quickAmounts = [
    { label: "5K", value: 5000 },
    { label: "10K", value: 10000 },
    { label: "20K", value: 20000 },
    { label: "50K", value: 50000 },
    { label: "100K", value: 100000 },
  ];

  // Safe handling of showTerms function
  const handleShowTerms = () => {
    if (typeof showTerms === 'function') {
      showTerms();
    } else {
      console.error("showTerms is not defined or not a function");
      // Fallback method
      toast?.error?.("Terms and conditions not available", { autoClose: 3000 });
    }
  };

  // Token purchase function
  const handlePurchase = async () => {
    try {
      setLoading(true);
      setTransactionPending(true);
      setErrorMessage(null);
      setErrorDetails(null);
      
      if (!connected || !publicKey) {
        throw new Error("Please connect a wallet");
      }
      
      // Validate minimum purchase amount
      if (purchaseAmount < 1000) {
        throw new Error("Minimum purchase amount is 1,000 TESOLA tokens");
      }
      
      // Check balance again
      await checkBalance();
      if (!hasSufficientFunds && solBalance !== null) {
        throw new Error(`Insufficient funds. You need at least ${totalCost.toFixed(6)} SOL plus transaction fees. Current balance: ${solBalance.toFixed(4)} SOL`);
      }

      // Show toast notification
      toast.info("Preparing purchase transaction...", { autoClose: 3000 });

      // Step 1: Prepare token purchase
      console.log("Preparing token purchase...");
      const res = await fetch("/api/presale/purchaseTESOLA", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          wallet: publicKey.toBase58(),
          amount: purchaseAmount
        }),
      });

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

      const { transaction, paymentId, tokenAmount } = await res.json();
      console.log("Received transaction data:", { paymentId, tokenAmount });
      
      toast.info("Transaction created. Please sign with your wallet...", { autoClose: 3000 });

      // Step 2: Validate transaction size
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
        toast.error("Transaction signing cancelled", { autoClose: 3000 });
        throw new Error('Transaction signing was cancelled or failed');
      }
      
      console.log("Transaction signed:", signedTx);
      
      toast.info("Transaction signed. Submitting to blockchain...", { autoClose: 3000 });

      // Step 4: Send signed transaction
      const rawTx = signedTx.serialize();
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      
      console.log("Sending transaction to blockchain...");
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      toast.info("Transaction submitted. Waiting for confirmation...", { autoClose: 3000 });

      // Step 5: Wait for transaction confirmation
      console.log("Waiting for transaction confirmation...");
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success("Transaction confirmed!", { autoClose: 5000 });

      // Step 6: Complete token purchase
      console.log("Completing token purchase process...");
      const completeRes = await fetch("/api/presale/completePresale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          paymentTxId: signature,
          paymentId
        }),
      });

      if (!completeRes.ok) {
        const completeErrData = await completeRes.json();
        throw new Error(completeErrData.error || "Failed to complete purchase");
      }

      const purchaseData = await completeRes.json();
      console.log("Purchase completed:", purchaseData);
      
      toast.success(`Successfully purchased ${tokenAmount.toLocaleString()} TESOLA tokens!`, { autoClose: 5000 });

      // Step 7: Update UI and call completion callback
      if (onPurchaseComplete) {
        onPurchaseComplete({
          tokenAmount: tokenAmount,
          totalCost: totalCost,
          txSignature: signature
        });
      }
      
      // Reset form after successful purchase
      setPurchaseAmount(20000);
      setAgreedToPolicy(false);
      
    } catch (err) {
      console.error("Purchase error:", err);
      
      toast.error("Purchase failed. Please try again.", { autoClose: 5000 });
      
      // Create user-friendly error message
      let userMessage = "Purchase failed. Please try again.";
      
      if (err.message.includes("wallet")) userMessage = "Wallet not connected.";
      else if (err.message.includes("insufficient") || err.message.includes("Insufficient")) userMessage = "Insufficient funds in your wallet.";
      else if (err.message.includes("rejected")) userMessage = "Transaction rejected by wallet.";
      else if (err.message.includes("timeout")) userMessage = "Network timeout. Please try again.";
      else if (err.message.includes("whitelist")) userMessage = "Your wallet is not whitelisted for this presale.";
      else if (err.message.includes("sold out")) userMessage = "Presale allocation sold out.";
      else if (err.message.includes("not active")) userMessage = "Presale is not currently active.";
      
      setErrorMessage(userMessage);
      setErrorDetails(err.message || err.toString());
    } finally {
      setLoading(false);
      setTransactionPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto">
      {isClient ? (
        <>
        </>
      ) : (
        <div>Loading...</div>
      )}
      
      {isClient && connected && (
        <div className="w-full bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-purple-500 border-opacity-30">
          {/* Token amount selection */}
          <div className="mb-4">
            <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-300 mb-1">
              TESOLA Token Amount
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="tokenAmount"
                id="tokenAmount"
                value={purchaseAmount.toLocaleString()}
                onChange={handleAmountChange}
                className="block w-full rounded-md border-gray-700 bg-gray-900 text-white px-4 py-3 pr-24 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter amount"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <span className="text-gray-400 px-3">TESOLA</span>
              </div>
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPurchaseAmount(option.value)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    purchaseAmount === option.value 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Total cost display */}
          <div className="mb-4 p-3 bg-gray-900 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Price per token:</span>
              <span className="font-medium text-white">{tokenPrice}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-300">Total cost:</span>
              <span className="font-bold text-lg text-white">{totalCost.toFixed(6)} SOL</span>
            </div>
          </div>
          
          {/* Policy agreement checkbox */}
          <div className="mb-4 flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToPolicy"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="agreeToPolicy" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={handleShowTerms}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                terms and conditions
              </button>
              {" "}and understand that token sales are final.
            </label>
          </div>
          
          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            disabled={!agreedToPolicy || transactionPending || !hasSufficientFunds || purchaseAmount < 1000}
            className={`w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xl font-bold ${
              !agreedToPolicy || transactionPending || !hasSufficientFunds || purchaseAmount < 1000
                ? "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50" 
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            }`}
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
                Buy TESOLA Tokens
                <span className="ml-3">
                  <Image src="/logo2.png" alt="TESOLA Logo" width={32} height={32} priority />
                </span>
              </>
            )}
          </button>
          
          {/* Additional guidance */}
          <p className="text-xs text-gray-400 text-center mt-2">
            Minimum purchase: 1,000 tokens. Maximum: 10,000,000 tokens.
          </p>
        </div>
      )}
      
      {isClient && !connected && (
        <div className="text-center py-4 px-6 bg-gray-800 bg-opacity-50 rounded-lg border border-purple-500 border-opacity-30 w-full">
          <p className="text-yellow-400 mb-3">Connect your wallet to participate in the presale</p>
          <p className="text-gray-300 text-sm">
            Current price: <span className="font-bold text-white">{tokenPrice} per token</span>
          </p>
        </div>
      )}
    </div>
  );
}