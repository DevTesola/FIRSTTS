"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction } from "@solana/web3.js";
import PresaleSection from "./PresaleSection";
import FooterLinks from "../FooterLinks";
import ErrorMessage from "../ErrorMessage";
import LoadingOverlay from "../LoadingOverlay";
import WalletGuide from "../WalletGuide";
import PresaleInfo from "./PresaleInfo";
import PresaleTimer from "./PresaleTimer";
import PurchaseResultModal from "./PurchaseResultModal";
import Tokenomics from "./Tokenomics";
import Roadmap from "./Roadmap";
import TokenUtility from "./TokenUtility";
import FAQ from "./FAQ";

// 클라이언트 전용 컴포넌트 래퍼
const ClientOnly = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? children : null;
};

// Dynamic import for better performance - 수정된 방식
const VideoPlayer = dynamic(
  () => import("../VideoPlayer").then(mod => mod.default), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }
);

const TOTAL_SUPPLY = 1000000000; // 1 billion tokens
const PRESALE_ALLOCATION = 100000000; // 100 million tokens for presale (10%)
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

// Default purchase amount
const DEFAULT_PURCHASE_AMOUNT = 20000;

export default function PresalePage({ initialSupply = 0 }) {
  const { publicKey, connected, signTransaction } = useWallet() || {};
  
  // State management
  const [loading, setLoading] = useState(false);
  const [soldAmount, setSoldAmount] = useState(initialSupply);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [presalePrice] = useState("0.000005 SOL"); // Price per token
  const [isClient, setIsClient] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [presaleEnds, setPresaleEnds] = useState(null);
  const [presaleConfig, setPresaleConfig] = useState(null);
  const [activeTab, setActiveTab] = useState("presale");
  const [solBalance, setSolBalance] = useState(null);
  const [hasSufficientFunds, setHasSufficientFunds] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [whitelistChecked, setWhitelistChecked] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(DEFAULT_PURCHASE_AMOUNT);
  const [totalCost, setTotalCost] = useState(0);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    fetchPresaleConfig();
    
    // Calculate initial total cost
    const price = parseFloat(presalePrice.replace(' SOL', ''));
    setTotalCost(DEFAULT_PURCHASE_AMOUNT * price);
  }, []);
  
  // Recalculate total cost when purchase amount changes
  useEffect(() => {
    const price = parseFloat(presalePrice.replace(' SOL', ''));
    setTotalCost(purchaseAmount * price);
  }, [purchaseAmount, presalePrice]);
  
  // Check whitelist status
  useEffect(() => {
    if (connected && publicKey) {
      checkWhitelistStatus();
      checkBalance();
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
      setHasSufficientFunds(true);
    }
  }, [publicKey, connected, totalCost]);

  // Fetch presale configuration
  const fetchPresaleConfig = async () => {
    try {
      const res = await fetch("/api/presale/getStats");
      if (!res.ok) {
        throw new Error(`Failed to fetch presale stats: ${res.statusText}`);
      }
      const data = await res.json();
      setPresaleConfig(data);
      setSoldAmount(data.soldAmount || initialSupply);
      
      // Set presale end time
      if (data.end_time) {
        setPresaleEnds(new Date(data.end_time));
      } else {
        // Default: 7 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        setPresaleEnds(endDate);
      }
    } catch (err) {
      console.error("Failed to fetch presale configuration:", err);
    }
  };

  // Fetch sold amount on load and periodically
  useEffect(() => {
    const fetchSoldAmount = async () => {
      try {
        const res = await fetch("/api/presale/getStats");
        if (!res.ok) {
          throw new Error(`Failed to fetch presale stats: ${res.statusText}`);
        }
        const { soldAmount } = await res.json();
        setSoldAmount(soldAmount);
      } catch (err) {
        console.error("Failed to fetch sold amount:", err);
      }
    };
    
    fetchSoldAmount();
    
    // Set up interval to refresh sold amount periodically
    const countInterval = setInterval(fetchSoldAmount, 60000); // Refresh every minute
    
    return () => clearInterval(countInterval);
  }, []);

  // ESC key handler for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowWalletGuide(false);
        setShowTerms(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Callback for when purchase is complete
  const handlePurchaseComplete = (result) => {
    // Update sold amount
    const fetchUpdatedAmount = async () => {
      try {
        const statsRes = await fetch("/api/presale/getStats");
        if (statsRes.ok) {
          const { soldAmount } = await statsRes.json();
          setSoldAmount(soldAmount);
        }
      } catch (error) {
        console.error("Error updating sold amount:", error);
      }
    };
    
    fetchUpdatedAmount();
    setPurchaseResult(result);
  };

  // Terms modal
  const TermsModal = () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">Terms & Conditions</h3>
          
          <div className="space-y-4 text-gray-300">
            <h4 className="font-bold text-white">1. Acceptance of Terms</h4>
            <p>By participating in the TESOLA token presale, you accept and agree to these terms and conditions.</p>
            
            <h4 className="font-bold text-white">2. Token Purchase</h4>
            <p>All token purchases are final and non-refundable. Tokens will be distributed after the presale concludes and the token officially launches.</p>
            
            <h4 className="font-bold text-white">3. Risks</h4>
            <p>You understand that digital assets involve risk, and you could lose your entire contribution. You accept the risks of participating in this presale.</p>
            
            <h4 className="font-bold text-white">4. Compliance</h4>
            <p>You confirm that you are not a citizen or resident of a country where participation in token sales is prohibited or restricted.</p>
            
            <h4 className="font-bold text-white">5. Token Utility</h4>
            <p>TESOLA tokens are utility tokens designed for use within the TESOLA ecosystem and do not represent ownership, shares, or securities.</p>
            
            <h4 className="font-bold text-white">6. Limitation of Liability</h4>
            <p>The TESOLA team shall not be liable for any indirect, incidental, or consequential damages arising out of or in connection with your participation.</p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowTerms(false)}
              className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const NavTabs = () => (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 border border-purple-500/20 shadow-lg">
      <div className="flex space-x-1">
        {[
          { id: 'presale', label: 'Presale' },
          { id: 'tokenomics', label: 'Tokenomics' },
          { id: 'roadmap', label: 'Roadmap' },
          { id: 'utility', label: 'Utility' },
          { id: 'faq', label: 'FAQ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  // 표시 전에 VideoPlayer 유효성 확인
  const isVideoPlayerValid = typeof VideoPlayer === 'function' || 
                             (typeof VideoPlayer === 'object' && VideoPlayer !== null);

  // Terms 모달을 열기 위한 함수
  const handleShowTerms = () => {
    setShowTerms(true);
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
        throw new Error('Transaction signing was cancelled or failed');
      }
      
      console.log("Transaction signed:", signedTx);

      // Step 4: Send signed transaction
      const rawTx = signedTx.serialize();
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      
      console.log("Sending transaction to blockchain...");
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Step 5: Wait for transaction confirmation
      console.log("Waiting for transaction confirmation...");
      await connection.confirmTransaction(signature, 'confirmed');

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

      // Step 7: Update UI and call completion callback
      handlePurchaseComplete({
        tokenAmount: tokenAmount,
        totalCost: totalCost,
        txSignature: signature
      });
      
      // Reset form after successful purchase
      setPurchaseAmount(DEFAULT_PURCHASE_AMOUNT);
      setAgreedToPolicy(false);
      
    } catch (err) {
      console.error("Purchase error:", err);
      
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
    <div className="relative z-20 mx-auto w-full max-w-4xl px-4">
      {/* Loading overlay */}
      {loading && <LoadingOverlay message="Processing transaction..." />}
      
      {/* Modals */}
      {showTerms && <TermsModal />}
      {purchaseResult && <PurchaseResultModal result={purchaseResult} onClose={() => setPurchaseResult(null)} />}
      {showWalletGuide && <WalletGuide forceShow={showWalletGuide} onClose={() => setShowWalletGuide(false)} />}
      
      {/* Hero Section */}
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-2">
          <Image 
            src="/logo2.png" 
            alt="TESOLA Logo" 
            width={80} 
            height={80} 
            className="animate-pulse"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent mb-2">
          TESOLA Token Presale
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Join the future of Solana with TESOLA - the community-driven utility token powering next-generation DeFi solutions
        </p>
        
        {/* Audited by & KYC badges */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="bg-gray-800 px-4 py-2 rounded-full flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            <span className="text-sm text-gray-300">Audited by CertiK</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-full flex items-center">
            <span className="text-green-400 mr-2">✓</span>
            <span className="text-sm text-gray-300">KYC Verified</span>
          </div>
        </div>
      </div>
      
      {/* Main Video - 클라이언트 측에서만 렌더링 */}
      <div className="rounded-xl overflow-hidden shadow-2xl mb-8 border border-purple-500/20">
        <ClientOnly>
          {isClient && isVideoPlayerValid && (
            <VideoPlayer src="/TESOLA.mp4" />
          )}
          {isClient && !isVideoPlayerValid && (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-500">
              <div>비디오를 로드할 수 없습니다</div>
            </div>
          )}
        </ClientOnly>
        {!isClient && (
          <div className="w-full h-64 bg-gray-800 animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>
      
      {/* Presale Timer */}
      <div className="relative">
        {presaleEnds && (
          <PresaleTimer endDate={presaleEnds} />
        )}
      </div>
      
      {/* Combined Section: Presale Info and Purchase Form */}
      <div className="mt-6 bg-gray-800/50 rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
        {/* Wallet Info & Purchase Form at the top */}
        <div className="border-b border-purple-500/20 p-6">
          <ClientOnly>
            {isClient && (
              <div className="flex flex-col items-center">
                {/* Wallet button first */}
                <div className="wallet-container mb-4">
                  <WalletMultiButton />
                </div>
                
                {/* Connected wallet info */}
                {connected && publicKey && (
                  <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md w-full max-w-sm">
                    <div className="flex items-center justify-between">
                      <span className="truncate">Wallet: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
                      
                      {solBalance !== null && (
                        <span className={`ml-2 font-bold ${hasSufficientFunds ? 'text-green-400' : 'text-red-400'}`}>
                          {solBalance.toFixed(4)} SOL
                        </span>
                      )}
                    </div>
                    
                    {/* Whitelist status */}
                    {whitelistChecked && (
                      <div className="mt-1 text-xs flex items-center">
                        <span className={isWhitelisted ? 'text-green-400' : 'text-yellow-400'}>
                          {isWhitelisted ? '✓ Whitelisted' : 'Public Presale'}
                        </span>
                      </div>
                    )}
                    
                    {/* Insufficient funds warning */}
                    {!hasSufficientFunds && solBalance !== null && (
                      <div className="mt-1 text-xs text-red-400">
                        Insufficient funds. You need at least {totalCost.toFixed(6)} SOL plus fees.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Purchase Form */}
                {connected && (
                  <div className="w-full max-w-sm mt-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-purple-500 border-opacity-30">
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
                          onChange={(e) => {
                            const value = parseInt(e.target.value.replace(/\D/g, ''));
                            if (!isNaN(value) && value >= 1000) {
                              setPurchaseAmount(Math.min(value, 10000000)); // Cap at 10 million tokens
                            } else {
                              setPurchaseAmount(1000); // Minimum 1000 tokens
                            }
                          }}
                          className="block w-full rounded-md border-gray-700 bg-gray-900 text-white px-4 py-3 pr-24 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Enter amount"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <span className="text-gray-400 px-3">TESOLA</span>
                        </div>
                      </div>
                      
                      {/* Quick amount buttons */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { label: "5K", value: 5000 },
                          { label: "10K", value: 10000 },
                          { label: "20K", value: 20000 },
                          { label: "50K", value: 50000 },
                          { label: "100K", value: 100000 }
                        ].map(option => (
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
                        <span className="font-medium text-white">{presalePrice}</span>
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
                  <div className="text-center py-4 px-6 bg-gray-800 bg-opacity-50 rounded-lg border border-purple-500 border-opacity-30 w-full max-w-sm mt-4">
                    <p className="text-yellow-400 mb-3">Connect your wallet to participate in the presale</p>
                    <p className="text-gray-300 text-sm">
                      Current price: <span className="font-bold text-white">{presalePrice} per token</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </ClientOnly>
        </div>
        
        {/* Navigation tabs at the top */}
        <div className="p-6">
          {/* Navigation tabs at the top of presale info box */}
          <div className="mb-6">
            <NavTabs />
          </div>
          
          {activeTab === 'presale' ? (
            <>
              <PresaleInfo 
                soldAmount={soldAmount} 
                totalAllocation={PRESALE_ALLOCATION} 
                tokenPrice={presalePrice}
                presaleConfig={presaleConfig}
                isClient={isClient}
              />
              
              {/* Error message display */}
              {errorMessage && (
                <div className="mt-4">
                  <ErrorMessage 
                    message={errorMessage} 
                    type="error" 
                    errorDetails={errorDetails}
                    onDismiss={() => {
                      setErrorMessage(null);
                      setErrorDetails(null);
                    }}
                  />
                </div>
              )}
            </>
          ) : activeTab === 'tokenomics' ? (
            <Tokenomics />
          ) : activeTab === 'roadmap' ? (
            <Roadmap />
          ) : activeTab === 'utility' ? (
            <TokenUtility />
          ) : (
            <FAQ />
          )}
        </div>
      </div>
      
      {/* Social Links */}
      <div className="flex justify-center space-x-4 mb-8">
        <a 
          href="https://twitter.com/teslainsolana" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
          aria-label="Twitter"
        >
          <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
          </svg>
        </a>
        <a 
          href="https://t.me/tesola_community" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
          aria-label="Telegram"
        >
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-3.5 8c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"></path>
          </svg>
        </a>
        <a 
          href="https://discord.gg/tesola" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
          aria-label="Discord"
        >
          <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
          </svg>
        </a>
        <a 
          href="https://github.com/tesola-project" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
          aria-label="GitHub"
        >
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
          </svg>
        </a>
      </div>
      
      {/* Additional Documents & Links */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <a 
          href="/whitepaper.pdf" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Whitepaper
        </a>
        <a 
          href="/audit-report.pdf" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Audit Report
        </a>
        <a 
          href="/team.html" 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Team
        </a>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-800 pt-6 pb-10 text-center">
        <p className="text-gray-400 text-sm mb-2">© 2025 TESOLA. All rights reserved.</p>
        <div className="flex justify-center space-x-4 text-sm text-gray-500">
          <button onClick={() => setShowTerms(true)} className="hover:text-gray-300">Terms & Conditions</button>
          <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact</Link>
        </div>
      </div>
    </div>
  );
}