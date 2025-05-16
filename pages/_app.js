"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, createContext, useContext, useRef } from "react";
import Head from "next/head";

// 스타일 import
import "../styles/globals.css";
import "../styles/wallet.css"; // Wallet custom styles
import "../styles/mobile-responsive.css"; // Mobile optimization styles - re-enabled
import "../styles/community.css"; // Community page styles

// 불필요한 인라인 스타일 제거
import { AnalyticsProvider, PageViewTracker } from "../components/AnalyticsProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import FallbackLoading from "../components/FallbackLoading";
import { NotificationProvider } from "../components/Notifications";

// Context for managing application-wide network and error states
export const AppStateContext = createContext({
  isOffline: false,
  hasSlowConnection: false,
  globalError: null,
  setGlobalError: () => {},
  clearGlobalError: () => {},
});

export const useAppState = () => useContext(AppStateContext);

// Use previously imported fallback component

// Dynamically load offline detector component
const OfflineDetector = dynamic(() => import("../components/OfflineDetector").catch(err => {
  console.error("Failed to load OfflineDetector:", err);
  return () => null; // Return empty component on error
}), {
  ssr: false,
  loading: () => null // No loading state for this component
});

// Preload wallet adapter styles to avoid CSP issues
// Preload stylesheets for parallel loading
import "@solana/wallet-adapter-react-ui/styles.css";

// Dynamic import of wallet wrapper to prevent SSR issues
const WalletWrapperComponent = dynamic(
  () => import("../components/WalletWrapper").catch(err => {
    console.error("Failed to load WalletWrapper:", err);
    return ({ children }) => <>{children}</>; // Fallback component
  }),
  {
    ssr: false, // Critical: ensures component only renders client-side
    loading: () => null // No loading state for this component
  }
);

// Create simple wrapper (including error handling)
const WalletWrapper = ({ children }) => {
  // Only render on client side
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }
  
  try {
    return <WalletWrapperComponent>{children}</WalletWrapperComponent>;
  } catch (err) {
    console.error("Error rendering WalletWrapper:", err);
    // Render only children if error occurs
    return <>{children}</>;
  }
};

// Custom cursor is now implemented in /public/cursor.js
// It's loaded directly from _document.js

export default function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [analyticsDisabled, setAnalyticsDisabled] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    isOffline: false,
    hasSlowConnection: false,
  });
  const [globalError, setGlobalError] = useState(null);

  // Client-side mounting handling
  useEffect(() => {
    setMounted(true);
    
    // Removed font blocking code - we now use direct Google Fonts URLs
    if (typeof window !== 'undefined') {
      console.log('Application initialized');
      
      // 행성 애니메이션 관련 코드 제거
      console.log('Application initialized - custom styles removed');
    }
    
    // Check analytics disable setting
    if (typeof window !== 'undefined') {
      const disableAnalytics = localStorage.getItem('tesola_analytics_disabled') === 'true';
      setAnalyticsDisabled(disableAnalytics);
    }
    
    // Performance measurement
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigationStart = performance.timing ? performance.timing.navigationStart : 0;
      const now = performance.now ? performance.now() : 0;
      const pageLoadTime = now - navigationStart;
      
      console.log(`Page loaded in ${pageLoadTime.toFixed(2)}ms`);
    }
    
    // Setup global event listener for error handling
    const handleUnhandledError = (event) => {
      console.error('Unhandled error:', event.error || event.reason || 'Unknown error');
      setGlobalError({
        message: 'An unexpected error occurred',
        details: event.error?.message || event.reason?.message || 'Application error' 
      });
      
      // Prevent default behavior (error will still be shown in browser console)
      event.preventDefault();
    };
    
    // Register global error event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleUnhandledError);
      window.addEventListener('unhandledrejection', handleUnhandledError);
    }
    
    return () => {
      // Remove global error event listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleUnhandledError);
        window.removeEventListener('unhandledrejection', handleUnhandledError);
      }
    };
  }, []);
  
  // Network status change handler
  const handleNetworkStatusChange = (status) => {
    setNetworkStatus({
      isOffline: status.isOffline,
      hasSlowConnection: status.slowConnection,
    });
  };
  
  // Clear global error
  const clearGlobalError = () => {
    setGlobalError(null);
  };

  // App state context value
  const appStateValue = {
    isOffline: networkStatus.isOffline,
    hasSlowConnection: networkStatus.hasSlowConnection,
    globalError,
    setGlobalError,
    clearGlobalError
  };

  // Show skeleton loading state before client-side mounting
  if (!mounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white font-orbitron">
        <div className="animate-pulse text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-transparent border-r-purple-400 border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-4 border-t-transparent border-r-transparent border-b-purple-300 border-l-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-orbitron">Initializing SOLARA application...</p>
        </div>
      </div>
    );
  }

  return (
    <AppStateContext.Provider value={appStateValue}>
      <Head>
        {/* Mobile optimization meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA support meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        {/* Only keeping essential meta tags - no font preloads */}
        <link rel="preconnect" href="data:" />
        <link rel="dns-prefetch" href="data:" />
      </Head>
      
      <ErrorBoundary>
        <AnalyticsProvider disabled={true}>
          <NotificationProvider>
            <WalletWrapper>
              <OfflineDetector onStatusChange={handleNetworkStatusChange} />
              <PageViewTracker />
              {/* Display global error */}
              {globalError && (
                <div className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 animate-fade-down">
                  <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 backdrop-blur-lg border border-red-500 text-white p-4 rounded-lg shadow-xl animate-pulse-slow">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-red-400 relative">
                        <div className="absolute -inset-1 bg-red-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                        <div className="relative">
                          <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium animate-fade-in">{globalError.message}</h3>
                        {globalError.details && (
                          <p className="mt-1 text-xs opacity-80 animate-fade-in delay-100">{globalError.details}</p>
                        )}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={clearGlobalError}
                            className="bg-red-800 hover:bg-red-700 transition-all duration-300 text-white text-xs px-3 py-1.5 rounded-md border border-red-600/50 hover:border-red-500 hover:shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:scale-105"
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
          </NotificationProvider>
        </AnalyticsProvider>
      </ErrorBoundary>
    </AppStateContext.Provider>
  );
}