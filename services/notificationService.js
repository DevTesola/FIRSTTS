/**
 * Notification Service
 * 
 * Centralizes notification display and management.
 * Provides a consistent interface for showing notifications
 * throughout the application.
 */

import { createContext, useContext, useState, useCallback } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Default notification duration
const DEFAULT_DURATION = 5000; // 5 seconds

// Create context
export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearAllNotifications: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  showConfirmation: () => Promise.resolve(false),
});

/**
 * Use notifications hook
 * 
 * @returns {Object} - Notification methods and state
 */
export function useNotifications() {
  return useContext(NotificationContext);
}

/**
 * Notification Provider component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - Provider component
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
    title: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  /**
   * Add a notification
   * 
   * @param {Object} notification - Notification object
   * @param {string} notification.type - Notification type
   * @param {string} notification.message - Notification message
   * @param {number} notification.duration - Display duration in ms
   * @param {Function} notification.onClose - Close callback
   */
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      type: notification.type || NOTIFICATION_TYPES.INFO,
      message: notification.message,
      duration: notification.duration || DEFAULT_DURATION,
      onClose: notification.onClose,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  /**
   * Remove a notification by ID
   * 
   * @param {string} id - Notification ID
   */
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      
      // Call onClose callback if provided
      if (notification && notification.onClose) {
        notification.onClose();
      }
      
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Show a success notification
   * 
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {string} - Notification ID
   */
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options,
    });
  }, [addNotification]);

  /**
   * Show an error notification
   * 
   * @param {string|Error} message - Error message or Error object
   * @param {Object} options - Additional options
   * @returns {string} - Notification ID
   */
  const showError = useCallback((message, options = {}) => {
    // Handle Error objects
    const errorMessage = message instanceof Error ? message.message : message;
    
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message: errorMessage,
      duration: options.duration || 8000, // Longer duration for errors
      ...options,
    });
  }, [addNotification]);

  /**
   * Show a warning notification
   * 
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {string} - Notification ID
   */
  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      ...options,
    });
  }, [addNotification]);

  /**
   * Show an info notification
   * 
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {string} - Notification ID
   */
  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options,
    });
  }, [addNotification]);

  /**
   * Show a confirmation dialog
   * 
   * @param {Object} options - Confirmation options
   * @param {string} options.message - Confirmation message
   * @param {string} options.title - Dialog title
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.cancelText - Cancel button text
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false otherwise
   */
  const showConfirmation = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        message: options.message || 'Are you sure?',
        title: options.title || 'Confirmation',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  // Context value
  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    confirmationState,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Export default as service
export default {
  useNotifications,
  NotificationProvider,
  NOTIFICATION_TYPES,
};