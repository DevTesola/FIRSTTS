"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import ErrorMessage from "./ErrorMessage";

// Create context
const NotificationContext = createContext({
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
  showConfirmation: () => Promise.resolve(false)
});

// Notification ID counter
let notificationId = 0;

// Generate the next notification ID
const getNextId = () => {
  return `notification-${notificationId++}`;
};

/**
 * Notification provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info"
  });
  
  // Add notification to the stack
  const addNotification = useCallback((message, options = {}) => {
    const id = getNextId();
    const notification = {
      id,
      message,
      type: options.type || "info",
      autoClose: options.autoClose !== undefined ? options.autoClose : true,
      autoCloseTime: options.autoCloseTime || 5000,
      errorDetails: options.errorDetails,
      ...options
    };
    
    setNotifications(prev => [...prev, notification]);
    
    return id;
  }, []);
  
  // Remove notification from stack
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Convenience methods for different notification types
  const showSuccess = useCallback((message, autoCloseTime = 5000) => {
    return addNotification(message, { type: "success", autoClose: true, autoCloseTime });
  }, [addNotification]);
  
  const showError = useCallback((message, errorDetails = null, autoClose = false) => {
    return addNotification(message, { type: "error", autoClose, errorDetails });
  }, [addNotification]);
  
  const showInfo = useCallback((message, autoCloseTime = 5000) => {
    return addNotification(message, { type: "info", autoClose: true, autoCloseTime });
  }, [addNotification]);
  
  const showWarning = useCallback((message, autoCloseTime = 8000) => {
    return addNotification(message, { type: "warning", autoClose: true, autoCloseTime });
  }, [addNotification]);
  
  // Show confirmation modal (returns a promise)
  const showConfirmation = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        type: options.type || "info"
      });
    });
  }, []);
  
  // Context value
  const contextValue = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirmation
  };
  
  // Cleanup effect for portal root
  useEffect(() => {
    return () => {
      // Cleanup function (optional)
    };
  }, []);
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Portal container for notifications */}
      {typeof window !== 'undefined' &&
        ReactDOM.createPortal(
          <div className="fixed top-0 right-0 left-0 z-50 p-4 pointer-events-none overflow-hidden flex flex-col items-center">
            <div className="max-w-md w-full space-y-2">
              {notifications.map(notification => (
                <div key={notification.id} className="pointer-events-auto">
                  <ErrorMessage
                    message={notification.message}
                    type={notification.type}
                    autoClose={notification.autoClose}
                    autoCloseTime={notification.autoCloseTime}
                    errorDetails={notification.errorDetails}
                    onDismiss={() => removeNotification(notification.id)}
                  />
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      }
      
      {/* Confirmation modal portal */}
      {confirmModal.isOpen && typeof window !== 'undefined' &&
        ReactDOM.createPortal(
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onClose={confirmModal.onCancel}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
            type={confirmModal.type}
          />,
          document.body
        )
      }
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 * @returns {Object} Notification methods
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  
  return context;
}

/**
 * Confirmation modal component
 * @param {Object} props - Component props
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info"
}) {
  if (!isOpen) return null;
  
  // Prevent clicking on the backdrop from closing the modal
  const stopPropagation = (e) => {
    e.stopPropagation();
  };
  
  // Style based on type
  let bgColor, iconColor, icon, buttonBg;
  
  switch (type) {
    case "success":
      bgColor = "bg-green-900/30";
      iconColor = "text-green-500";
      buttonBg = "bg-green-700 hover:bg-green-600";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
    case "warning":
      bgColor = "bg-yellow-900/30";
      iconColor = "text-yellow-500";
      buttonBg = "bg-yellow-700 hover:bg-yellow-600";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case "error":
      bgColor = "bg-red-900/30";
      iconColor = "text-red-500";
      buttonBg = "bg-red-700 hover:bg-red-600";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    default: // info
      bgColor = "bg-blue-900/30";
      iconColor = "text-blue-500";
      buttonBg = "bg-purple-700 hover:bg-purple-600";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4 animate-fade-in" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.90)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className={`${bgColor} border border-${iconColor.replace('text-', '')}/20 p-6 rounded-xl shadow-lg max-w-md w-full animate-fade-down backdrop-blur-md`}
        onClick={stopPropagation}
      >
        <div className="flex items-start mb-4">
          <div className={`${iconColor} flex-shrink-0 mr-3`}>
            <div className="relative animate-bounce-pulse">
              {icon}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        <div className="mb-6 text-gray-300">
          {typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            message
          )}
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm text-white ${buttonBg} transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-600/20`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ConfirmModal is already exported above