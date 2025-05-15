"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { safeLocalStorage, safeSetLocalStorage, isClient } from "../utils/clientSideUtils";

// 익명 사용자 ID 생성 함수
const generateAnonymousId = () => {
  if (!isClient) return 'no-id';
  
  try {
    const storedId = safeLocalStorage('tesola_anonymous_id');
    if (storedId) return storedId;
    
    // UUID v4 간단 구현
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    safeSetLocalStorage('tesola_anonymous_id', uuid);
    return uuid;
  } catch (e) {
    console.error("Error generating anonymous ID:", e);
    return 'error-id';
  }
};

// Analytics 컨텍스트 생성
const AnalyticsContext = createContext({
  trackEvent: () => {},
  trackPageView: () => {},
  isOptedOut: false,
  optOut: () => {},
  optIn: () => {},
});

/**
 * 익명 분석 데이터 제공 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 * @param {boolean} props.disabled - 분석 기능 비활성화 여부
 */
export function AnalyticsProvider({ children, disabled = true }) { // 기본값을 true로 변경
  const [isOptedOut, setIsOptedOut] = useState(true); // 기본값을 true로 변경
  const [anonymousId, setAnonymousId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [lastPageView, setLastPageView] = useState('');
  const [lastEventTime, setLastEventTime] = useState(0);
  
  // 초기화 및 옵트아웃 상태 확인
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const optedOut = safeLocalStorage('tesola_analytics_opt_out') === 'true';
      setIsOptedOut(optedOut || disabled);
      
      // 익명 ID 설정
      if (!optedOut && !disabled) {
        const id = generateAnonymousId();
        setAnonymousId(id);
      }
    } catch (e) {
      console.error("Error initializing analytics:", e);
      setIsOptedOut(true);
    }
  }, [disabled]);
  
  // 이벤트 추적 함수 - 중복 이벤트 방지 로직 추가
  const trackEvent = (eventName, properties = {}) => {
    if (isOptedOut || disabled || !isClient) return;
    
    // 동일한 이벤트가 짧은 시간 내에 반복되는 것 방지
    const now = Date.now();
    if (now - lastEventTime < 1000) { // 1초 내 중복 이벤트 무시
      return;
    }
    
    setLastEventTime(now);
    
    const event = {
      type: 'event',
      event: eventName,
      anonymousId,
      properties,
      timestamp: new Date().toISOString(),
    };
    
    // 이벤트를 큐에 추가
    setQueue(prev => [...prev, event]);
    
    // 개발 모드에서만 로그 출력 (더 제한적인 로깅)
    if (process.env.NODE_ENV === 'development' && event.event !== 'page_view') {
      console.log('Analytics event:', event.event);
    }
  };
  
  // 페이지 뷰 추적 함수 - 중복 페이지뷰 방지
  const trackPageView = (path) => {
    if (isOptedOut || disabled || !isClient) return;
    
    const currentPath = path || (isClient ? window.location.pathname : '');
    
    // 동일한 페이지 뷰 반복 방지
    if (currentPath === lastPageView) {
      return;
    }
    
    setLastPageView(currentPath);
    
    trackEvent('page_view', {
      path: currentPath,
      referrer: isClient ? document.referrer : '',
      title: isClient ? document.title : '',
    });
  };
  
  // 옵트아웃 함수
  const optOut = () => {
    if (!isClient) return;
    
    try {
      safeSetLocalStorage('tesola_analytics_opt_out', 'true');
      setIsOptedOut(true);
    } catch (e) {
      console.error("Error opting out:", e);
    }
  };
  
  // 옵트인 함수
  const optIn = () => {
    if (!isClient) return;
    
    try {
      safeSetLocalStorage('tesola_analytics_opt_out', 'false');
      setIsOptedOut(false);
      
      // 익명 ID 재설정
      if (!disabled) {
        const id = generateAnonymousId();
        setAnonymousId(id);
      }
    } catch (e) {
      console.error("Error opting in:", e);
    }
  };
  
  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        trackPageView,
        isOptedOut,
        optOut,
        optIn,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Analytics 컨텍스트를 사용하기 위한 훅
 */
export function useAnalytics() {
  return useContext(AnalyticsContext);
}

/**
 * 페이지 조회 추적을 위한 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.path - 추적할 페이지 경로 (생략 시 현재 URL 사용)
 */
export function PageViewTracker({ path }) {
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    // 클라이언트 측에서만 페이지 뷰 추적
    if (isClient) {
      trackPageView(path);
    }
  }, [path, trackPageView]);
  
  return null;
}