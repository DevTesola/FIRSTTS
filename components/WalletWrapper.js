"use client";

import { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Connection } from "@solana/web3.js";

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
  
  useEffect(() => {
    import('@solana/wallet-adapter-react-ui/styles.css')
      .catch(err => console.error('Error loading wallet adapter styles:', err));
  }, []);

  // 월렛 에러 핸들러 개선
  const onWalletError = (error) => {
    console.error("Wallet connection error:", error);
    
    // 특정 에러 유형에 따른 처리
    if (error.name === 'WalletNotReadyError' || 
        (error.message && error.message.includes('not ready'))) {
      alert('This wallet is not installed or not ready. Please install the wallet extension and refresh the page.');
    } else {
      alert(`Wallet connection error: ${error.message || 'Unknown error'}`);
    }
    
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
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}