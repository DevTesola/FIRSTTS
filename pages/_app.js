"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Head from "next/head";
import "../styles/globals.css";
import "../styles/wallet.css"; // 월렛 커스텀 스타일
import "../styles/mobile-responsive.css"; // 모바일 최적화 스타일

// Dynamically import WalletWrapper to avoid SSR issues
const WalletWrapper = dynamic(() => import("../components/WalletWrapper"), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <div className="ml-3">Loading wallet services...</div>
    </div>
  )
});

export default function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for client-side mounting before rendering wallet-dependent components
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <div className="animate-pulse">Initializing application...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        {/* 모바일 최적화를 위한 viewport 설정 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* 모바일 상태바 색상 */}
        <meta name="theme-color" content="#000000" />
        {/* iOS 웹앱 설정 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <WalletWrapper>
        <Component {...pageProps} />
      </WalletWrapper>
    </>
  );
}