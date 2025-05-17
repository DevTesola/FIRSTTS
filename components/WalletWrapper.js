"use client";

import { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Connection } from "@solana/web3.js";
// First import wallet adapter styles, then override them with our custom styles
import "@solana/wallet-adapter-react-ui/styles.css";
// Custom wallet overrides (must come after the original styles)
import Head from "next/head";

// Only use adapters that aren't provided by standard adapters
// Removed Phantom and Solflare as they're now available as standard adapters
// Include wallet adapters needed for metamask compatibility
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { TorusWalletAdapter } from "@solana/wallet-adapter-torus";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { SlopeWalletAdapter } from "@solana/wallet-adapter-slope";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";

export default function WalletWrapper({ children }) {
  // State for wallets
  const [wallets, setWallets] = useState([]);
  
  // Add debugging for production
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[WalletWrapper] Environment check:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- RPC Endpoint:', SOLANA_RPC_ENDPOINT);
      console.log('- Is Production:', process.env.NODE_ENV === 'production');
      console.log('- Window location:', window.location.href);
      console.log('- Available wallets:', wallets ? wallets.length : 0);
      
      // Set wallets when window is available
      setWallets(getInstalledWallets());
    }
  }, []);

  // Get all installed wallets including metamask ones
  const getInstalledWallets = () => {
    const installed = [];
    
    // Always include these wallets for MetaMask compatibility
    if (typeof window !== 'undefined') {
      // Explicitly add Phantom and Solflare for MetaMask compatibility
      installed.push(new PhantomWalletAdapter());
      installed.push(new SolflareWalletAdapter());
      
      // Add other wallets if they're installed
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
    
    return installed;
  };

  // Use installed wallet adapters with state
  const memoizedWallets = useMemo(() => {
    return wallets;
  }, [wallets]);

  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  
  // We're now importing the styles directly at the top of the file
  // useEffect(() => {
  //  import('@solana/wallet-adapter-react-ui/styles.css')
  //    .catch(err => console.error('Error loading wallet adapter styles:', err));
  // }, []);

  // Wallet error state management
  const [walletError, setWalletError] = useState(null);
  const [walletStatus, setWalletStatus] = useState({
    status: 'idle', // idle, connecting, connected, disconnecting, error
    lastConnected: null,
    connectionAttempts: 0,
    message: null
  });
  
  // Wallet state change handler
  const onWalletStateChange = (walletState) => {
    const { connecting, connected, disconnecting } = walletState;
    
    if (connecting) {
      setWalletStatus(prev => ({
        ...prev,
        status: 'connecting',
        message: 'Connecting to wallet...',
        connectionAttempts: prev.connectionAttempts + 1
      }));
    } else if (connected) {
      setWalletStatus({
        status: 'connected',
        lastConnected: new Date().toISOString(),
        connectionAttempts: 0,
        message: 'Wallet connected successfully'
      });
      
      // Show success notification
      const notification = {
        message: 'Wallet Connected Successfully',
        type: 'success',
        timestamp: Date.now()
      };
      
      // Display success notification briefly
      setWalletError(notification);
      setTimeout(() => {
        if (setWalletError) setWalletError(null);
      }, 3000);
      
    } else if (disconnecting) {
      setWalletStatus(prev => ({
        ...prev,
        status: 'disconnecting',
        message: 'Disconnecting wallet...'
      }));
    } else if (!connected && walletStatus.status === 'connected') {
      // Wallet was connected but now it's not
      setWalletStatus(prev => ({
        ...prev,
        status: 'idle',
        message: 'Wallet disconnected'
      }));
    }
  };
  
  // Enhanced wallet error handler
  const onWalletError = (error) => {
    console.error("Wallet connection error:", error);
    
    // Process based on specific error types
    let errorMessage = '';
    let errorType = 'error';
    let fixSuggestion = '';
    
    if (error.name === 'WalletNotReadyError' || 
        (error.message && error.message.includes('not ready'))) {
      errorMessage = 'This wallet is not installed or not ready.';
      fixSuggestion = 'Please install the wallet extension and refresh the page.';
      errorType = 'warning';
    } else if (error.name === 'WalletWindowClosedError' ||
               (error.message && error.message.includes('closed'))) {
      errorMessage = 'You closed the wallet connection window.';
      fixSuggestion = 'Please try again when you are ready to connect.';
      errorType = 'info';
    } else if (error.name === 'WalletTimeoutError' ||
               (error.message && error.message.includes('timeout'))) {
      errorMessage = 'Wallet connection timed out.';
      fixSuggestion = 'Please check your wallet extension is responding and try again.';
      errorType = 'warning';
    } else if (error.name === 'WalletConnectionError' ||
               (error.message && error.message.includes('connection'))) {
      errorMessage = 'Failed to connect to your wallet.';
      fixSuggestion = 'Please check your internet connection and try again.';
      errorType = 'error';
    } else if (error.name === 'WalletAccountError' ||
               (error.message && error.message.includes('account'))) {
      errorMessage = 'There was an issue with your wallet account.';
      fixSuggestion = 'Please ensure your wallet is unlocked and has a valid Solana account.';
      errorType = 'warning';
    } else if (error.name === 'WalletNetworkError' ||
               (error.message && error.message.includes('network'))) {
      errorMessage = 'Network mismatch detected.';
      fixSuggestion = 'Please ensure your wallet is connected to the correct Solana network (Mainnet or Devnet).';
      errorType = 'warning';
    } else if (error.name === 'WalletDisconnectedError' ||
               (error.message && error.message.includes('disconnect'))) {
      errorMessage = 'Your wallet disconnected unexpectedly.';
      fixSuggestion = 'Please check your wallet extension and reconnect.';
      errorType = 'warning';
    } else if (error.name === 'WalletSignTransactionError' ||
               (error.message && error.message.includes('sign transaction'))) {
      errorMessage = 'Transaction signing was rejected or failed.';
      fixSuggestion = 'Please try again and approve the transaction in your wallet.';
      errorType = 'error';
    } else {
      errorMessage = `Wallet error: ${error.message || 'Unknown error'}`;
      fixSuggestion = 'Please try again or use a different wallet.';
      errorType = 'error';
    }
    
    // Update wallet status
    setWalletStatus(prev => ({
      ...prev,
      status: 'error',
      message: errorMessage
    }));
    
    // Set error state with more detailed info
    setWalletError({
      message: errorMessage,
      suggestion: fixSuggestion,
      type: errorType,
      timestamp: Date.now()
    });
    
    // Auto-dismiss error after 6 seconds
    setTimeout(() => {
      setWalletError(null);
    }, 6000);
    
    // Reset wallet modal state after a slight delay to prevent immediate reopening
    setTimeout(() => {
      setWalletStatus(prev => ({
        ...prev,
        status: 'idle',
        message: null
      }));
    }, 500);
  };

  // Modal configuration - more restrictive to prevent issues
  const walletModalProviderConfig = {
    featuredWallets: 5, // Show fewer wallets to avoid UI issues
    onlyShowInstalled: true, // Only show installed wallets for better experience
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={memoizedWallets}
        autoConnect={false}
        onError={onWalletError}
      >
        <WalletModalProvider {...walletModalProviderConfig}>
          <>
            {/* Custom font override styles - added inline to ensure they're applied after wallet styles */}
            <style jsx global>{`
              /* Force font application to wallet adapter (highest priority) */
              .wallet-adapter-button,
              .wallet-adapter-button *,
              button.wallet-adapter-button,
              .wallet-adapter-button span,
              .wallet-adapter-dropdown-list-item,
              .wallet-adapter-dropdown-list-item *,
              .wallet-adapter-modal-title,
              .wallet-adapter-modal-wrapper,
              .wallet-adapter-modal-button-close,
              .wallet-adapter-modal-list .wallet-adapter-button,
              .wallet-adapter-modal-wrapper *,
              .wallet-adapter-modal *,
              .wallet-adapter-dropdown-list,
              .wallet-adapter-dropdown-list *,
              [class*="wallet-adapter"] {
                font-family: 'Orbitron', sans-serif !important;
                font-weight: 600 !important;
                letter-spacing: -0.02em !important;
              }
              
              /* Direct font override without URL references */
              :root {
                --font-dm-sans: 'Orbitron', sans-serif !important;
              }
              
              * {
                font-family: 'Orbitron', sans-serif !important;
              }
            `}</style>
            {/* Wallet Status & Error Toast Notification */}
            {walletError && (
              <div className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 animate-fade-down">
                <div className={`
                  bg-gradient-to-r backdrop-blur-lg p-4 rounded-lg shadow-xl 
                  ${walletError.type === 'error' ? 'from-red-900/90 to-red-800/90 border border-red-500/70 animate-pulse-slow' : 
                    walletError.type === 'warning' ? 'from-yellow-900/90 to-amber-800/90 border border-yellow-500/70 animate-pulse-slow' : 
                    walletError.type === 'success' ? 'from-green-900/90 to-emerald-800/90 border border-green-500/70' :
                    'from-blue-900/90 to-blue-800/90 border border-blue-500/70 animate-pulse-slow'}
                `}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 
                      ${walletError.type === 'error' ? 'text-red-400' : 
                        walletError.type === 'warning' ? 'text-yellow-400' : 
                        walletError.type === 'success' ? 'text-green-400' :
                        'text-blue-400'}
                    `}>
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full blur-xl opacity-70 animate-pulse-slow"
                             style={{ backgroundColor: walletError.type === 'error' ? 'rgba(239,68,68,0.2)' : 
                                                     walletError.type === 'warning' ? 'rgba(245,158,11,0.2)' : 
                                                     walletError.type === 'success' ? 'rgba(34,197,94,0.2)' :
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
                          ) : walletError.type === 'success' ? (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                           walletError.type === 'success' ? 'Success: ' :
                           'Info: '}
                        </span>
                        {walletError.type === 'success' ? 'Wallet Connected' : 'Wallet Connection Issue'}
                      </h3>
                      <p className="mt-1 text-xs text-gray-200 animate-fade-in delay-100">
                        {walletError.message}
                      </p>
                      {walletError.suggestion && (
                        <p className="mt-1 text-xs text-gray-300 animate-fade-in delay-200 italic">
                          {walletError.suggestion}
                        </p>
                      )}
                      
                      <div className="mt-2 flex justify-between items-center">
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
                              walletError.type === 'success' ?
                              'bg-green-800 hover:bg-green-700 border-green-600/50 hover:border-green-500 hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                              'bg-blue-800 hover:bg-blue-700 border-blue-600/50 hover:border-blue-500 hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]'}
                          `}
                        >
                          {walletError.type === 'success' ? 'OK' : 'Dismiss'}
                        </button>
                        
                        {walletError.type !== 'success' && (
                          <a 
                            href="https://t.me/tesolachat" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/70 hover:text-white transition-colors ml-4"
                          >
                            Need help?
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet Connecting Indicator */}
            {walletStatus.status === 'connecting' && !walletError && (
              <div className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 animate-fade-down">
                <div className="bg-gradient-to-r from-purple-900/90 to-blue-800/90 backdrop-blur-lg p-4 rounded-lg shadow-xl border border-purple-500/50">
                  <div className="flex items-center">
                    <div className="mr-3 relative">
                      <div className="h-8 w-8 rounded-full border-2 border-t-purple-500 border-r-blue-500 border-b-indigo-500 border-l-transparent animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Connecting to wallet...</p>
                      <p className="text-xs text-gray-300 mt-1">Please confirm the connection in your wallet extension</p>
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