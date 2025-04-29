"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, createContext, useContext } from "react";
import Head from "next/head";
import "../styles/globals.css";
import "../styles/wallet.css"; // 월렛 커스텀 스타일
import "../styles/mobile-responsive.css"; // 모바일 최적화 스타일
import { AnalyticsProvider, PageViewTracker } from "../components/AnalyticsProvider";

// Context for managing application-wide network and error states
export const AppStateContext = createContext({
  isOffline: false,
  hasSlowConnection: false,
  globalError: null,
  setGlobalError: () => {},
  clearGlobalError: () => {},
});

export const useAppState = () => useContext(AppStateContext);

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
  const [networkStatus, setNetworkStatus] = useState({
    isOffline: false,
    hasSlowConnection: false,
  });
  const [globalError, setGlobalError] = useState(null);

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
    
    // 오류 처리를 위한 전역 이벤트 리스너 설정
    const handleUnhandledError = (event) => {
      console.error('Unhandled error:', event.error || event.reason || 'Unknown error');
      setGlobalError({
        message: 'An unexpected error occurred',
        details: event.error?.message || event.reason?.message || 'Application error' 
      });
      
      // 필요한 경우 오류 분석 서비스에 오류 보고
      // ...
      
      // 기본 동작 방지 (브라우저 오류 콘솔에는 계속 표시됨)
      event.preventDefault();
    };
    
    // 전역 오류 이벤트 리스너 등록
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledError);
    
    return () => {
      // 전역 오류 이벤트 리스너 제거
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledError);
    };
  }, []);
  
  // 네트워크 상태 변경 핸들러
  const handleNetworkStatusChange = (status) => {
    setNetworkStatus({
      isOffline: status.isOffline,
      hasSlowConnection: status.slowConnection,
    });
  };
  
  // 전역 오류 지우기
  const clearGlobalError = () => {
    setGlobalError(null);
  };

  // 앱 상태 컨텍스트 값
  const appStateValue = {
    isOffline: networkStatus.isOffline,
    hasSlowConnection: networkStatus.hasSlowConnection,
    globalError,
    setGlobalError,
    clearGlobalError
  };

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
    <AppStateContext.Provider value={appStateValue}>
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
          {/* 개선된 오프라인 감지기 */}
          <OfflineDetector onStatusChange={handleNetworkStatusChange} />
          
          {/* 전역 오류 표시 */}
          {globalError && (
            <div className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4">
              <div className="bg-red-900/80 border border-red-500 text-white p-4 rounded-lg shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-red-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium">{globalError.message}</h3>
                    {globalError.details && (
                      <p className="mt-1 text-xs">{globalError.details}</p>
                    )}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={clearGlobalError}
                        className="bg-red-800 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Component {...pageProps} />
        </WalletWrapper>
      </AnalyticsProvider>
    </AppStateContext.Provider>
  );
}