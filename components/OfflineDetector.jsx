"use client";

import React, { useState, useEffect, useCallback } from "react";
import ErrorMessage from "./ErrorMessage";

/**
 * Network status detector component
 * - Detects offline state
 * - Detects reconnection
 * - Provides automatic retry functionality
 */
export default function OfflineDetector({ onStatusChange }) {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Check network connection status
  const checkConnection = useCallback(() => {
    if (navigator.onLine) {
      // Browser reports online status
      if (isOffline) {
        setIsOffline(false);
        setWasOffline(true);
        setShowReconnected(true);
        setLastOnlineTime(Date.now());
        setRetryAttempts(0);
        
        // Hide reconnection message after 5 seconds
        setTimeout(() => {
          setShowReconnected(false);
        }, 5000);
      }
      
      // No slow connection detection needed
      setSlowConnection(false);
    } else {
      // Browser reports offline status
      if (!isOffline) {
        setIsOffline(true);
        setLastOnlineTime(Date.now());
      }
    }
    
    // Execute status change callback
    if (onStatusChange) {
      onStatusChange({
        isOffline,
        wasOffline,
        reconnected: showReconnected,
        slowConnection
      });
    }
  }, [isOffline, onStatusChange, showReconnected, slowConnection, wasOffline]);

  // Automatic retry functionality - longer backoff time
  useEffect(() => {
    let retryTimer = null;
    
    if (isOffline) {
      // Retry logic when offline
      // Apply longer backoff time (up to 5 minutes)
      const retryDelay = Math.min(300, Math.pow(2, retryAttempts) * 5) * 1000;
      
      // Update retry countdown
      const countdownInterval = setInterval(() => {
        setRetryCountdown(prev => {
          const newVal = prev - 1;
          return newVal <= 0 ? 0 : newVal;
        });
      }, 1000);
      
      // Set retry timer
      retryTimer = setTimeout(() => {
        setRetryAttempts(prev => prev + 1);
        setRetryCountdown(Math.floor(retryDelay / 1000));
        checkConnection();
      }, retryDelay);
      
      return () => {
        clearTimeout(retryTimer);
        clearInterval(countdownInterval);
      };
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isOffline, retryAttempts, checkConnection]);

  // Initial state setup and event listener registration
  useEffect(() => {
    // Initial state setup
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    // Offline event handler
    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setLastOnlineTime(Date.now());
    };

    // Online event handler
    const handleOnline = () => {
      checkConnection();
    };

    // Register event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Disable periodic connection checks in development mode
    let connectionCheckInterval = null;
    if (process.env.NODE_ENV !== 'development') {
      // Check connection every 5 minutes in production mode
      connectionCheckInterval = setInterval(checkConnection, 300000);
    }

    // Remove event listeners on component unmount
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, [checkConnection]);

  // Manual retry handler
  const handleManualRetry = useCallback(() => {
    if (isOffline) {
      setRetryCountdown(0);
      checkConnection();
    }
  }, [isOffline, checkConnection]);

  // Don't render anything if not offline and not showing reconnected message
  if (!isOffline && !showReconnected && !slowConnection) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 space-y-2">
      {isOffline && (
        <ErrorMessage
          message="You are currently offline"
          type="warning"
          className="shadow-lg"
        >
          <div className="text-sm text-gray-300 mt-1">
            <p>Please check your internet connection. Some features may not work while offline.</p>
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleManualRetry}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </ErrorMessage>
      )}

      {!isOffline && showReconnected && (
        <ErrorMessage
          message="You're back online!"
          type="success"
          className="shadow-lg"
          autoClose={true}
          autoCloseTime={3000}
          onDismiss={() => setShowReconnected(false)}
        />
      )}
      
      {!isOffline && !showReconnected && slowConnection && (
        <ErrorMessage
          message="Your connection is unstable"
          type="info"
          className="shadow-lg"
          autoClose={true}
          autoCloseTime={5000}
          onDismiss={() => setSlowConnection(false)}
        >
          <p className="text-sm text-gray-300 mt-1">
            Some features may not work properly due to slow network speed.
          </p>
        </ErrorMessage>
      )}
    </div>
  );
}