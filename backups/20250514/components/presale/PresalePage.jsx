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
  const [userTier, setUserTier] = useState(null);
  const [maxTokens, setMaxTokens] = useState(0);
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
  
  // Check if wallet is whitelisted and get tier information
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
      
      // Store tier information
      if (data.tier) {
        setUserTier(data.tier);
        console.log("User tier:", data.tier);
        
        // Store maximum token purchase amount
        if (data.maxTokens) {
          setMaxTokens(data.maxTokens);
          console.log("Max token purchase:", data.maxTokens);
          
          // If max tokens is lower than current selection, adjust
          if (data.maxTokens < purchaseAmount) {
            setPurchaseAmount(data.maxTokens);
          }
        }
      }
    } catch (err) {
      console.error("Error checking whitelist status:", err);
      setIsWhitelisted(false);
      setWhitelistChecked(true);
      setUserTier(null);
      setMaxTokens(0);
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
  
  // NavTabs 컴포넌트를 화살표 함수로 직접 정의하여 스코프 문제 해결
  const NavTabs = () => {
    // Define tabs state
    const tabs = [
      { id: 'presale', label: 'Presale' },
      { id: 'tokenomics', label: 'Tokenomics' },
      { id: 'roadmap', label: 'Roadmap' },
      { id: 'utility', label: 'Utility' },
      { id: 'faq', label: 'FAQ' }
    ];
    
    // Basic button click handler that sets activeTab
    const clickTab = (id) => {
      console.log(`Tab clicked: ${id}`);
      setActiveTab(id);
    };
    
    return (
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 border border-purple-500/20 shadow-lg">
        <div className="flex flex-wrap md:flex-nowrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => clickTab(tab.id)}
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
  };

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
    <div className="relative z-20 mx-auto w-full max-w-4xl px-4 font-orbitron">
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
            <div className="video-wrapper-square relative mx-auto max-w-2xl mb-4">
              {/* 중앙 정렬된 1:1 비디오 컨테이너 */}
              <div className="video-container-square relative overflow-hidden rounded-xl shadow-2xl border border-purple-500/30">
                <iframe 
                  src="https://www.youtube.com/embed/AdkBE0cOxds?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&loop=1&playlist=AdkBE0cOxds&modestbranding=1"
                  className="w-full h-full aspect-square"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="TESOLA Promo Video"
                ></iframe>
              </div>
              
              {/* 구독 혜택 강조 & 영문 버튼 */}
              <div className="flex flex-col items-center mt-4">
                <div className="flex flex-wrap justify-center gap-3">
                  <a 
                    href="https://www.youtube.com/@TE-SOLA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center transition-all shadow-md hover:shadow-xl neon-glow-purple"
                    style={{transition: "all 0.3s ease"}}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                    Subscribe
                  </a>
                  
                  <a 
                    href="https://www.youtube.com/shorts/AdkBE0cOxds" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg flex items-center transition-all shadow-md hover:shadow-xl neon-glow-purple"
                    style={{transition: "all 0.3s ease"}}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Watch on YouTube
                  </a>
                </div>
                
                {/* 구독 혜택 텍스트 - 간결하고 세련되게 */}
                <p className="text-sm text-gray-300 mt-2 text-center max-w-md">
                  <span className="text-yellow-400">✨</span> Subscribe for exclusive events and early access to TESOLA updates
                </p>
              </div>
            </div>
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
                    
                    {/* Whitelist status & Tier information */}
                    {whitelistChecked && (
                      <div className="mt-2 space-y-1">
                        {userTier ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className={
                                userTier.tier_id === 'LEGENDARY' ? 'text-yellow-500' :
                                userTier.tier_id === 'EPIC' ? 'text-purple-400' :
                                userTier.tier_id === 'RARE' ? 'text-blue-400' :
                                userTier.tier_id === 'COMMON' ? 'text-green-400' :
                                'text-gray-400'
                              }>
                                {isWhitelisted ? '✓' : '○'} {userTier.tier_name} Tier
                              </span>
                            </div>
                            <div className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                              {userTier.exchange_rate.toLocaleString()} TESOLA/SOL
                            </div>
                          </div>
                        ) : (
                          <div className="text-yellow-400">
                            {isWhitelisted ? '✓ Whitelisted' : 'Public Presale'}
                          </div>
                        )}
                        
                        {maxTokens > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-300">Max Purchase:</span>
                            <span className="font-bold text-white">{maxTokens.toLocaleString()} TESOLA</span>
                          </div>
                        )}
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
                              // Enforce tier-based max token limit if available
                              const maxAllowed = maxTokens > 0 ? maxTokens : 10000000;
                              setPurchaseAmount(Math.min(value, maxAllowed));
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
                        ].map(option => {
                          // Disable button if option value exceeds tier limit
                          const isDisabled = maxTokens > 0 && option.value > maxTokens;
                          
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => !isDisabled && setPurchaseAmount(option.value)}
                              className={`px-2 py-1 text-xs rounded-md ${
                                purchaseAmount === option.value 
                                  ? 'bg-purple-600 text-white' 
                                  : isDisabled
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                              disabled={isDisabled}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                        
                        {/* MAX button */}
                        {maxTokens > 0 && (
                          <button
                            type="button"
                            onClick={() => setPurchaseAmount(maxTokens)}
                            className={`px-2 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700`}
                          >
                            MAX
                          </button>
                        )}
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
                      {maxTokens > 0 
                        ? `Minimum purchase: 1,000 tokens. Maximum for your tier: ${maxTokens.toLocaleString()} tokens.`
                        : "Minimum purchase: 1,000 tokens. Maximum: 10,000,000 tokens."
                      }
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
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 border border-purple-500/20 shadow-lg presale-tabs">
              <div className="flex flex-wrap md:flex-nowrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Setting activeTab to: presale');
                    setActiveTab('presale');
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'presale' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif !important" }}
                >
                  Presale
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Setting activeTab to: tokenomics');
                    setActiveTab('tokenomics');
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'tokenomics' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif !important" }}
                >
                  Tokenomics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Setting activeTab to: roadmap');
                    setActiveTab('roadmap');
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'roadmap' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif !important" }}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Setting activeTab to: utility');
                    setActiveTab('utility');
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'utility' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif !important" }}
                >
                  Utility
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Setting activeTab to: faq');
                    setActiveTab('faq');
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'faq' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:shadow'
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif !important" }}
                >
                  FAQ
                </button>
              </div>
            </div>
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
    
      
      {/* Additional Documents & Links */}

      
      {/* Documents section removed as they are now in Layout.jsx */}
    </div>
  );
}