"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnalytics } from "./AnalyticsProvider";

/**
 * 개선된 지갑 연결 가이드 컴포넌트
 * 사용자 친화적인 안내와 단계별 지침 제공
 */
export default function WalletGuide({ forceShow, onClose }) {
  const { publicKey, connected, wallet } = useWallet();
  const { trackEvent } = useAnalytics();
  const [showGuide, setShowGuide] = useState(false);
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [solBalance, setSolBalance] = useState(null);
  
  // 사용자의 SOL 잔액 조회
  const getBalance = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    try {
      // 환경 변수에서 RPC 엔드포인트 가져오기
      const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
      
      // 잔액 조회 API 호출
      const response = await fetch(`${rpcEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [publicKey.toString()]
        })
      });
      
      const data = await response.json();
      
      if (data.result && data.result.value !== undefined) {
        // lamports를 SOL로 변환 (1 SOL = 10^9 lamports)
        const balanceInSol = data.result.value / 1_000_000_000;
        setSolBalance(balanceInSol);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, [publicKey, connected]);
  
  // 잔액 조회 주기적 업데이트
  useEffect(() => {
    if (connected && publicKey) {
      getBalance();
      
      // 15초마다 잔액 업데이트
      const interval = setInterval(getBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, getBalance]);
  
  // 첫 방문 확인 및 강제 표시 처리
  useEffect(() => {
    if (forceShow) {
      // 강제 표시 옵션이 활성화된 경우 항상 표시
      setShowGuide(true);
      // 애널리틱스 이벤트 추적
      trackEvent('wallet_guide_shown', { forced: true });
    } else {
      // 기존 로직: 첫 방문 시에만 표시
      const hasSeenGuide = localStorage.getItem("hasSeenWalletGuide");
      
      if (!hasSeenGuide && !connected) {
        // 애널리틱스 이벤트 추적
        trackEvent('wallet_guide_shown', { first_visit: true });
        setShowGuide(true);
      }
    }
  }, [connected, trackEvent, forceShow]);
  
  // 연결 시 상태 업데이트
  useEffect(() => {
    if (connected && showGuide) {
      // 연결 성공 시 단계 변경 및 애니메이션 효과
      setAnimating(true);
      setTimeout(() => {
        setStep(4);
        setAnimating(false);
        
        // 애널리틱스 이벤트 추적
        trackEvent('wallet_connected', { wallet_type: wallet?.name || 'unknown' });
      }, 500);
    }
  }, [connected, showGuide, wallet, trackEvent]);
  
  // 가이드 닫기 핸들러
  const closeGuide = useCallback(() => {
    setShowGuide(false);
    localStorage.setItem("hasSeenWalletGuide", "true");
    
    // 애널리틱스 이벤트 추적
    trackEvent('wallet_guide_closed', { step });
    
    // 외부에서 전달받은 onClose 콜백 실행
    if (onClose) {
      onClose();
    }
  }, [step, trackEvent, onClose]);
  
  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showGuide) {
        closeGuide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuide, closeGuide]);
  
  // 단계 변경 핸들러
  const goToStep = (newStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
      
      // 애널리틱스 이벤트 추적
      trackEvent('wallet_guide_step_changed', { from: step, to: newStep });
    }, 300);
  };
  
  if (!showGuide) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
      aria-labelledby="wallet-guide-title"
      role="dialog"
    >
      <div 
        className={`bg-gray-900 rounded-xl max-w-md w-full p-6 relative shadow-2xl ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-300`}
      >
        {/* 닫기 버튼 */}
        <button 
          onClick={closeGuide}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="Close wallet guide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* 진행 상태 표시기 */}
        <div className="flex mb-6 justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`h-2 w-14 mx-1 rounded-full transition-colors duration-300 ${
                i < step ? 'bg-purple-500' : 
                i === step ? 'bg-purple-400' : 
                'bg-gray-700'
              }`}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin="1"
              aria-valuemax="4"
            ></div>
          ))}
        </div>
        
        {/* 단계별 콘텐츠 */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <h2 id="wallet-guide-title" className="text-2xl font-bold text-center mb-4">Welcome to SOLARA!</h2>
              <p className="text-gray-300">
                To mint NFTs on Solana, you'll need a compatible wallet. This quick guide will help you get started.
              </p>
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-800">
                <h3 className="font-bold text-purple-300 mb-1">What is a Wallet?</h3>
                <p className="text-sm text-gray-300">
                  A crypto wallet is a secure digital tool that allows you to store, send, and receive cryptocurrencies like SOL, and interact with NFTs.
                </p>
              </div>
              <div className="mt-4 text-gray-300">
                <p className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Easy to set up (takes less than 2 minutes)
                </p>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure and user-friendly
                </p>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-4">Choose a Wallet</h2>
              <p className="text-gray-300 mb-4">
                SOLARA supports several popular Solana wallets. Here are our recommendations:
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-3 rounded-lg text-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <img src="/optimized/phantom.webp" alt="Phantom Logo" className="h-12 mx-auto mb-2" />
                  <h3 className="font-medium">Phantom</h3>
                  <div className="flex justify-center mt-1">
                    <span className="text-xs px-2 py-0.5 bg-green-900 text-green-400 rounded-full">Recommended</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Popular & easy to use</p>
                </div>
                
                <div className="bg-gray-800 p-3 rounded-lg text-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <img src="/optimized/solflare.webp" alt="Solflare Logo" className="h-12 mx-auto mb-2" />
                  <h3 className="font-medium">Solflare</h3>
                  <p className="text-xs text-gray-400 mt-2">Feature-rich wallet</p>
                </div>
              </div>
              
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800">
                <h3 className="font-bold text-blue-300 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Pro Tip:
                </h3>
                <p className="text-sm text-gray-300">
                  You can easily install Phantom by visiting <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">phantom.app</a> and following the instructions.
                </p>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-4">
                Now, click the button below to connect your wallet. If you don't have one yet, you'll be prompted to install it.
              </p>
              
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-800 mb-4">
                <h3 className="font-bold text-purple-300 mb-1">Important:</h3>
                <p className="text-sm text-gray-300">
                  Make sure your wallet is funded with SOL before minting. The current mint price is 1.5 SOL.
                </p>
              </div>
              
              <div className="flex justify-center mb-6">
                <WalletMultiButton />
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-300">
                  <li>A popup will appear asking you to choose a wallet</li>
                  <li>Select your preferred wallet from the list</li>
                  <li>Follow the wallet's instructions to connect</li>
                  <li>Once connected, you'll see your wallet address here</li>
                </ol>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-4">Wallet Connected!</h2>
              <div className="flex justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <p className="text-gray-300 mb-6 text-center">
                Great! Your wallet is now connected. You're ready to mint your SOLARA NFT.
              </p>
              
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-700 mb-4">
                <h3 className="font-bold text-green-400 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connected Wallet:
                </h3>
                <p className="text-sm font-mono text-gray-300 break-all">
                  {publicKey?.toString()}
                </p>
                
                {solBalance !== null && (
                  <div className="mt-2 flex items-center">
                    <span className="text-gray-400 text-sm">Balance:</span>
                    <span className="ml-2 font-bold text-yellow-400">{solBalance.toFixed(4)} SOL</span>
                    
                    {solBalance < 1.6 && (
                      <span className="ml-2 text-xs bg-red-900/70 text-red-300 px-2 py-0.5 rounded-full">
                        Low balance for minting
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Next Steps:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                  <li>Scroll down to the mint section</li>
                  <li>Accept the refund policy by checking the box</li>
                  <li>Click the "Mint Now" button</li>
                  <li>Approve the transaction in your wallet</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* 네비게이션 버튼 */}
        <div className="mt-6 flex justify-between">
          {step > 1 && step < 4 && (
            <button 
              onClick={() => goToStep(step - 1)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          
          {step === 1 && (
            <button 
              onClick={closeGuide}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Skip
            </button>
          )}
          
          {step < 3 && (
            <button 
              onClick={() => goToStep(step + 1)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors ml-auto"
            >
              Next
            </button>
          )}
          
          {step === 3 && !connected && (
            <button 
              onClick={closeGuide}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors ml-auto"
            >
              Skip
            </button>
          )}
          
          {step === 4 && (
            <button 
              onClick={closeGuide}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full"
            >
              Start Minting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}