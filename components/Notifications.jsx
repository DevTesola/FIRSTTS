// components/Notifications.jsx
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// 알림 컨텍스트 생성
export const NotificationContext = createContext();

// 알림 타입
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// 알림 제공자 컴포넌트
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // 알림 추가
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);
  
  // 알림 제거
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // 성공 알림
  const showSuccess = useCallback((message, duration) => 
    addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration), [addNotification]);
  
  // 에러 알림
  const showError = useCallback((message, duration) => 
    addNotification(message, NOTIFICATION_TYPES.ERROR, duration), [addNotification]);
  
  // 경고 알림
  const showWarning = useCallback((message, duration) => 
    addNotification(message, NOTIFICATION_TYPES.WARNING, duration), [addNotification]);
  
  // 정보 알림
  const showInfo = useCallback((message, duration) => 
    addNotification(message, NOTIFICATION_TYPES.INFO, duration), [addNotification]);

  // 알림 자동 제거를 위한 타이머 설정
  useEffect(() => {
    const timers = notifications.map(notification => {
      if (notification.duration > 0) {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
      return null;
    });
    
    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [notifications, removeNotification]);
  
  // 값 제공
  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// 알림 컨테이너 컴포넌트
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
};

// 개별 알림 아이템 컴포넌트
const NotificationItem = ({ notification, onClose }) => {
  const { id, message, type } = notification;
  
  // 타입에 따른 스타일 설정
  const getTypeStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-600/90 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-600/90 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-500/90 border-yellow-400 text-white shadow-[0_0_15px_rgba(202,138,4,0.3)]';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]';
    }
  };
  
  // 타입에 따른 아이콘 설정
  const getTypeIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case NOTIFICATION_TYPES.ERROR:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case NOTIFICATION_TYPES.WARNING:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case NOTIFICATION_TYPES.INFO:
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg shadow-xl min-w-[280px] backdrop-blur-sm transform transition-all duration-300 ease-in-out ${getTypeStyles()} animate-slide-in-right border-l-4 z-[9999]`}
      style={{ animationDuration: '0.3s' }}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {getTypeIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-3 text-white/80 focus:outline-none hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// 커스텀 확인 모달 컴포넌트
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel' 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-purple-500/30 shadow-xl animate-fade-in">
        <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 훅 사용을 위한 유틸리티
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};