"use client";

import React, { useState, useEffect } from "react";
import { useNotification } from "./Notifications";

/**
 * Offline detector component
 * Monitors connection status and shows notifications when offline
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} props.showIndicator - Whether to show visual connection indicator
 * @param {boolean} props.showNotifications - Whether to show notifications when connection changes
 * @param {function} props.onStatusChange - Callback when connection status changes
 */
export default function OfflineDetector({
  children,
  showIndicator = true,
  showNotifications = true,
  onStatusChange = null
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState("good"); // "good", "poor", "offline"
  const { showWarning, showSuccess, showInfo } = useNotification();
  
  // Offline/online event handlers
  useEffect(() => {
    // Check initial state
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    
    // Define event handlers
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionQuality("offline");
      if (onStatusChange) onStatusChange("offline");
      if (showNotifications) {
        showWarning("You are offline. Some features may not work correctly until your connection is restored.", 0);
      }
    };
    
    const handleOnline = () => {
      setIsOffline(false);
      checkConnectionQuality();
      if (onStatusChange) onStatusChange("online");
      if (showNotifications) {
        showSuccess("You are back online!", 5000);
      }
    };
    
    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
      
      // Initial connection quality check after a short delay
      // Prevents immediate API flooding on page load
      const timeoutId = setTimeout(checkConnectionQuality, 5000);
      
      // Setup periodic connection quality checks with longer interval
      const intervalId = setInterval(checkConnectionQuality, 300000); // Check every 5 minutes
      
      // Cleanup
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }
    
    // Empty cleanup function if window is undefined
    return () => {};
  }, [showNotifications, onStatusChange]);
  
  // Simple connection quality check that doesn't depend on external endpoints
  const checkConnectionQuality = async () => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      setConnectionQuality("offline");
      return;
    }
    
    // If we're online, just check for window.performance
    try {
      setConnectionQuality("good");
      if (onStatusChange) onStatusChange("good");
      
      // No need for API requests which can fail and cause errors
    } catch (error) {
      // Navigator still thinks we're online, but something went wrong
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setConnectionQuality("poor");
        if (onStatusChange) onStatusChange("poor");
        
        if (connectionQuality !== "poor" && showNotifications) {
          showWarning("Your connection appears to be unstable. Check your network if you experience issues.", 7000);
        }
      } else {
        setConnectionQuality("offline");
        if (onStatusChange) onStatusChange("offline");
      }
    }
  };
  
  // If we don't show indicator, just return children
  if (!showIndicator) return children;
  
  // Otherwise, wrap children with connection indicator
  return (
    <>
      {children}
      
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`
          flex items-center px-3 py-2 rounded-full shadow-md transition-all duration-300
          ${connectionQuality === "offline" 
            ? "bg-red-900/70 text-white" 
            : connectionQuality === "poor" 
              ? "bg-yellow-900/70 text-white" 
              : connectionQuality === "fair"
                ? "bg-blue-900/70 text-white"
                : "bg-green-900/70 text-white"}
          ${isOffline ? "animate-pulse" : ""}
          backdrop-blur-sm border border-white/10
        `}>
          <div className={`
            h-2.5 w-2.5 rounded-full mr-2
            ${connectionQuality === "offline" 
              ? "bg-red-500" 
              : connectionQuality === "poor" 
                ? "bg-yellow-500" 
                : connectionQuality === "fair"
                  ? "bg-blue-500"
                  : "bg-green-500"}
            ${isOffline ? "" : "animate-ping-slow"}
          `}></div>
          <span className="text-xs font-medium">
            {connectionQuality === "offline" 
              ? "Offline" 
              : connectionQuality === "poor" 
                ? "Poor Connection" 
                : connectionQuality === "fair"
                  ? "Fair Connection"
                  : "Connected"}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Higher-order component that enhances a component with offline detection
 * @param {Component} Component - Component to enhance
 * @param {Object} options - Options for offline detector
 * @returns {Component} - Enhanced component
 */
export function withOfflineDetection(Component, options = {}) {
  return function WrappedComponent(props) {
    return (
      <OfflineDetector {...options}>
        <Component {...props} />
      </OfflineDetector>
    );
  };
}