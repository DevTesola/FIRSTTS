"use client";

import React, { useState, useEffect } from "react";
import ErrorMessage from "./ErrorMessage";

/**
 * 오프라인 상태를 감지하여 알림을 표시하는 컴포넌트
 */
export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 초기 상태 설정
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    // 오프라인 이벤트 핸들러
    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    // 온라인 이벤트 핸들러
    const handleOnline = () => {
      setIsOffline(false);
      
      // 이전에 오프라인이었던 경우에만 재연결 메시지 표시
      if (wasOffline) {
        setShowReconnected(true);
        
        // 5초 후 재연결 메시지 숨기기
        setTimeout(() => {
          setShowReconnected(false);
        }, 5000);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);

  // 오프라인 상태가 아니고 재연결 메시지가 표시되지 않으면 아무것도 렌더링하지 않음
  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4">
      {isOffline && (
        <ErrorMessage
          message="You are currently offline"
          type="warning"
          className="shadow-lg"
        >
          <p className="text-sm text-gray-300 mt-1">
            Please check your internet connection. Some features may not work while offline.
          </p>
        </ErrorMessage>
      )}

      {!isOffline && showReconnected && (
        <ErrorMessage
          message="You're back online!"
          type="info"
          className="shadow-lg"
          onDismiss={() => setShowReconnected(false)}
        />
      )}
    </div>
  );
}