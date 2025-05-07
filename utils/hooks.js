/**
 * Custom React Hooks
 * 
 * Collection of reusable React hooks for the application.
 * These hooks encapsulate common functionality and state logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { STORAGE_KEYS } from './constants';

/**
 * Custom hook to handle loading state with a minimum duration
 * Prevents flickering for fast operations
 * 
 * @param {number} minimumLoadingTime - Minimum loading time in ms
 * @returns {Array} - [loading, setLoading, startLoading] tuple
 */
export function useLoadingState(minimumLoadingTime = 500) {
  const [loading, setLoading] = useState(false);
  const loadingTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  const startLoading = useCallback(() => {
    // Clear any existing timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    
    setLoading(true);
    startTimeRef.current = Date.now();
  }, []);

  const stopLoading = useCallback(() => {
    const elapsedTime = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

    // If enough time has passed, stop loading immediately
    if (remainingTime === 0) {
      setLoading(false);
      return;
    }

    // Otherwise, set a timer to stop loading after the remaining time
    loadingTimerRef.current = setTimeout(() => {
      setLoading(false);
    }, remainingTime);
  }, [minimumLoadingTime]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  return [loading, stopLoading, startLoading];
}

/**
 * Custom hook to handle async operations with loading state and error handling
 * 
 * @returns {Object} - Object with async handling methods
 */
export function useAsyncHandler() {
  const [loading, setLoadingComplete, startLoading] = useLoadingState();
  const [error, setError] = useState(null);

  /**
   * Execute an async function with loading state and error handling
   * 
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Options
   * @returns {Promise} - Promise that resolves to the result
   */
  const execute = useCallback(async (asyncFn, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      loadingMessage,
      successMessage,
      errorMessage
    } = options;

    try {
      startLoading();
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      console.error(err);
      setError(err);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoadingComplete();
    }
  }, [startLoading, setLoadingComplete]);

  return {
    loading,
    error,
    setError,
    execute,
    clearError: () => setError(null),
  };
}

/**
 * Custom hook for handling media queries
 * 
 * @param {string} query - Media query string
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } 
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [query]);

  return matches;
}

/**
 * Custom hook for persisting state to localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial state value
 * @returns {Array} - [storedValue, setStoredValue] tuple
 */
export function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Function to update stored value
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Custom hook to detect wallet connection changes
 * 
 * @returns {Object} - Wallet connection state and methods
 */
export function useWalletConnection() {
  const wallet = useWallet();
  const [connectHistory, setConnectHistory] = useLocalStorage(STORAGE_KEYS.WALLET_HISTORY, []);
  const { connected, publicKey, disconnect } = wallet;

  // Save connection to history
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const walletName = wallet.wallet?.adapter?.name || 'Unknown Wallet';
      
      setConnectHistory((prevHistory) => {
        // Check if wallet already exists in history
        const existingIndex = prevHistory.findIndex((w) => w.address === walletAddress);
        
        if (existingIndex >= 0) {
          // Update existing entry
          const updatedHistory = [...prevHistory];
          updatedHistory[existingIndex] = {
            ...updatedHistory[existingIndex],
            lastConnected: Date.now(),
            name: walletName,
          };
          return updatedHistory;
        } else {
          // Add new entry
          return [
            ...prevHistory,
            {
              address: walletAddress,
              name: walletName,
              firstConnected: Date.now(),
              lastConnected: Date.now(),
            },
          ];
        }
      });
    }
  }, [connected, publicKey, wallet, setConnectHistory]);

  return {
    connected,
    publicKey,
    connectionHistory: connectHistory,
    walletName: wallet.wallet?.adapter?.name || '',
    disconnect,
    clearConnectionHistory: () => setConnectHistory([]),
  };
}

/**
 * Custom hook for tracking page views
 */
export function usePageViewTracking() {
  const router = useRouter();

  useEffect(() => {
    // Disable analytics if user has opted out
    if (typeof window !== 'undefined' && 
        localStorage.getItem(STORAGE_KEYS.ANALYTICS_DISABLED) === 'true') {
      return;
    }

    const handleRouteChange = (url) => {
      // Track page view
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_path: url,
        });
      }
    };

    // Track initial page load
    handleRouteChange(router.asPath);

    // Track page changes
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.asPath, router.events]);
}

/**
 * Custom hook for handling window resize events
 * 
 * @returns {Object} - Window dimensions
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

/**
 * Custom hook for detecting if element is in viewport
 * 
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} - [ref, isIntersecting] tuple
 */
export function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isIntersecting];
}

// Export all hooks
export default {
  useLoadingState,
  useAsyncHandler,
  useMediaQuery,
  useLocalStorage,
  useWalletConnection,
  usePageViewTracking,
  useWindowSize,
  useIntersectionObserver,
};