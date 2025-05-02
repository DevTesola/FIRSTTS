"use client";

import { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Connection } from "@solana/web3.js";
// Make sure we import the styles for wallet adapter
import "@solana/wallet-adapter-react-ui/styles.css";

// 이미 설치된 어댑터
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

// 새로 추가할 어댑터 - 실제 설치된 것만 사용
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { TorusWalletAdapter } from "@solana/wallet-adapter-torus";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { SlopeWalletAdapter } from "@solana/wallet-adapter-slope";

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function WalletWrapper({ children }) {
  if (!SOLANA_RPC_ENDPOINT) {
    console.error("Warning: NEXT_PUBLIC_SOLANA_RPC_ENDPOINT environment variable not set. Using default devnet endpoint.");
  }

  // 설치된 지갑 감지 함수
  const getInstalledWallets = () => {
    const installed = [];
    
    // 각 지갑이 설치되어 있는지 확인
    if (typeof window !== 'undefined') {
      if (window.phantom) installed.push(new PhantomWalletAdapter());
      if (window.solflare) installed.push(new SolflareWalletAdapter());
      
      // 다른 지갑들도 가능한 경우 추가
      try {
        const backpack = new BackpackWalletAdapter();
        if (backpack.readyState === 'Installed') installed.push(backpack);
      } catch (e) {
        console.log('Backpack not available');
      }
      
      try {
        const torus = new TorusWalletAdapter();
        installed.push(torus);
      } catch (e) {
        console.log('Torus not available');
      }
    }
    
    // 적어도 하나의 지갑이 없는 경우 기본 지갑 추가
    if (installed.length === 0) {
      installed.push(new PhantomWalletAdapter());
      installed.push(new SolflareWalletAdapter());
    }
    
    return installed;
  };

  // 설치된 지갑 어댑터만 사용
  const wallets = useMemo(() => getInstalledWallets(), []);

  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  
  // We're now importing the styles directly at the top of the file
  // useEffect(() => {
  //  import('@solana/wallet-adapter-react-ui/styles.css')
  //    .catch(err => console.error('Error loading wallet adapter styles:', err));
  // }, []);

  // 월렛 에러 상태 관리
  const [walletError, setWalletError] = useState(null);
  
  // 월렛 에러 핸들러 개선
  const onWalletError = (error) => {
    console.error("Wallet connection error:", error);
    
    // 특정 에러 유형에 따른 처리
    let errorMessage = '';
    let errorType = 'error';
    
    if (error.name === 'WalletNotReadyError' || 
        (error.message && error.message.includes('not ready'))) {
      errorMessage = 'This wallet is not installed or not ready. Please install the wallet extension and refresh the page.';
      errorType = 'warning';
    } else if (error.name === 'WalletWindowClosedError' ||
               (error.message && error.message.includes('closed'))) {
      errorMessage = 'You closed the wallet connection window. Please try again when you are ready to connect.';
      errorType = 'info';
    } else if (error.name === 'WalletTimeoutError' ||
               (error.message && error.message.includes('timeout'))) {
      errorMessage = 'Wallet connection timed out. Please check your wallet and try again.';
      errorType = 'warning';
    } else if (error.name === 'WalletConnectionError' ||
               (error.message && error.message.includes('connection'))) {
      errorMessage = 'Failed to connect to your wallet. Please check your internet connection and try again.';
      errorType = 'error';
    } else {
      errorMessage = `Wallet connection error: ${error.message || 'Unknown error'}`;
      errorType = 'error';
    }
    
    // 에러 상태 설정
    setWalletError({
      message: errorMessage,
      type: errorType,
      timestamp: Date.now()
    });
    
    // 5초 후 에러 메시지 자동 닫기
    setTimeout(() => {
      setWalletError(null);
    }, 5000);
    
    // 지갑 모달 다시 열 수 있게 상태 리셋
    setTimeout(() => {
      // 모달 리셋을 위한 상태 업데이트가 필요할 수 있음
      // 여기서는 특별한 작업이 필요 없음
    }, 500);
  };

  // 모달 설정에 onlyShowInstalled 추가
  const walletModalProviderConfig = {
    featuredWallets: 5,
    onlyShowInstalled: true, // 설치된 지갑만 표시
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={onWalletError}
      >
        <WalletModalProvider {...walletModalProviderConfig}>
          <>
            {/* Wallet Error Toast Notification */}
            {walletError && (
              <div className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 animate-fade-down">
                <div className={`
                  bg-gradient-to-r backdrop-blur-lg p-4 rounded-lg shadow-xl animate-pulse-slow
                  ${walletError.type === 'error' ? 'from-red-900/90 to-red-800/90 border border-red-500/70' : 
                    walletError.type === 'warning' ? 'from-yellow-900/90 to-amber-800/90 border border-yellow-500/70' : 
                    'from-blue-900/90 to-blue-800/90 border border-blue-500/70'}
                `}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 
                      ${walletError.type === 'error' ? 'text-red-400' : 
                        walletError.type === 'warning' ? 'text-yellow-400' : 
                        'text-blue-400'}
                    `}>
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full blur-xl opacity-70 animate-pulse-slow"
                             style={{ backgroundColor: walletError.type === 'error' ? 'rgba(239,68,68,0.2)' : 
                                                     walletError.type === 'warning' ? 'rgba(245,158,11,0.2)' : 
                                                     'rgba(59,130,246,0.2)' }}>
                        </div>
                        <div className="relative">
                          {walletError.type === 'error' ? (
                            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : walletError.type === 'warning' ? (
                            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : (
                            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-white animate-fade-in">
                        <span className="font-bold">
                          {walletError.type === 'error' ? 'Error: ' : 
                           walletError.type === 'warning' ? 'Warning: ' : 
                           'Info: '}
                        </span>
                        Wallet Connection Issue
                      </h3>
                      <p className="mt-1 text-xs text-gray-200 animate-fade-in delay-100">
                        {walletError.message}
                      </p>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setWalletError(null)}
                          className={`
                            transition-all duration-300 text-white text-xs px-3 py-1.5 rounded-md border
                            hover:scale-105 transform
                            ${walletError.type === 'error' ? 
                              'bg-red-800 hover:bg-red-700 border-red-600/50 hover:border-red-500 hover:shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 
                              walletError.type === 'warning' ? 
                              'bg-yellow-800 hover:bg-yellow-700 border-yellow-600/50 hover:border-yellow-500 hover:shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                              'bg-blue-800 hover:bg-blue-700 border-blue-600/50 hover:border-blue-500 hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]'}
                          `}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {children}
          </>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}