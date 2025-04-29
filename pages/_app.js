"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Head from "next/head";
import "../styles/globals.css";
import "../styles/wallet.css"; // 월렛 커스텀 스타일
import "../styles/mobile-responsive.css"; // 모바일 최적화 스타일
import { AnalyticsProvider, PageViewTracker } from "../components/AnalyticsProvider";

// 오프라인 감지 컴포넌트 동적 로드
const OfflineDetector = dynamic(() => import("../components/OfflineDetector"), {
  ssr: false
});

// 월렛 래퍼 동적 로드
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
  const [analyticsDisabled, setAnalyticsDisabled] = useState(false);

  // 클라이언트 측 마운팅 처리
  useEffect(() => {
    setMounted(true);
    
    // 분석 비활성화 설정 확인
    const disableAnalytics = localStorage.getItem('tesola_analytics_disabled') === 'true';
    setAnalyticsDisabled(disableAnalytics);
    
    // 성능 측정
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigationStart = performance.timing ? performance.timing.navigationStart : 0;
      const now = performance.now ? performance.now() : 0;
      const pageLoadTime = now - navigationStart;
      
      console.log(`Page loaded in ${pageLoadTime.toFixed(2)}ms`);
    }
  }, []);

  // 클라이언트 측 마운팅 전에는 스켈레톤 로딩 상태 표시
  if (!mounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white">
        <div className="animate-pulse text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent border-r-purple-400 border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-purple-300 border-l-transparent animate-spin"></div>
          </div>
          <p className="text-lg">Initializing SOLARA application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
  <Head>
        {/* 모바일 최적화 메타 태그 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA 지원 메타 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>
      
      <AnalyticsProvider disabled={true}>
        <PageViewTracker />
        <WalletWrapper>
          <OfflineDetector />
          <Component {...pageProps} />
        </WalletWrapper>
      </AnalyticsProvider>
    </>
  );
}