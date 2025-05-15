"use client";

/**
 * 클라이언트 측 코드를 안전하게 실행하기 위한 유틸리티 함수 모음
 * SSR 환경에서 브라우저 API 사용으로 인한 오류 방지
 */

// 클라이언트 환경 여부 확인
export const isClient = typeof window !== 'undefined';

/**
 * 클라이언트 측에서만 함수를 실행하고 서버 측에서는 기본값 반환
 * @param {Function} fn - 클라이언트 측에서 실행할 함수
 * @param {any} fallbackValue - 서버 측에서 반환할 기본값
 * @returns {any} - 클라이언트 측에서는 fn()의 결과, 서버 측에서는 fallbackValue
 */
export function safeClientSide(fn, fallbackValue = null) {
  if (isClient) {
    try {
      return fn();
    } catch (error) {
      console.error('클라이언트 측 실행 오류:', error);
      return fallbackValue;
    }
  }
  return fallbackValue;
}

/**
 * localStorage 안전하게 접근
 * @param {string} key - 로컬 스토리지 키
 * @param {any} defaultValue - 기본값
 * @returns {any} - 저장된 값 또는 기본값
 */
export function safeLocalStorage(key, defaultValue = null) {
  return safeClientSide(() => {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  }, defaultValue);
}

/**
 * localStorage 안전하게 설정
 * @param {string} key - 로컬 스토리지 키
 * @param {string} value - 저장할 값
 * @returns {boolean} - 성공 여부
 */
export function safeSetLocalStorage(key, value) {
  return safeClientSide(() => {
    localStorage.setItem(key, value);
    return true;
  }, false);
}

/**
 * navigator 속성 안전하게 접근
 * @param {string} property - 네비게이터 속성 이름
 * @param {any} defaultValue - 기본값
 * @returns {any} - 네비게이터 속성 값 또는 기본값
 */
export function safeNavigator(property, defaultValue = null) {
  return safeClientSide(() => {
    return navigator[property] || defaultValue;
  }, defaultValue);
}

/**
 * 연결 정보 안전하게 가져오기
 * @returns {Object} - 연결 정보
 */
export function getConnectionInfo() {
  return safeClientSide(() => {
    const online = navigator.onLine;
    
    // navigator.connection이 없는 브라우저 처리
    if (!navigator.connection) {
      return { online, saveData: false, connectionType: 'unknown' };
    }
    
    return {
      online,
      saveData: navigator.connection.saveData || false,
      connectionType: navigator.connection.effectiveType || 'unknown'
    };
  }, { online: true, saveData: false, connectionType: 'unknown' });
}

/**
 * 윈도우 크기 안전하게 가져오기
 * @returns {Object} - 윈도우 크기
 */
export function getWindowDimensions() {
  return safeClientSide(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }), { width: 1200, height: 800 }); // SSR용 합리적인 기본값
}

/**
 * 이벤트 리스너 안전하게 추가
 * @param {EventTarget} target - 이벤트 대상
 * @param {string} event - 이벤트 이름
 * @param {Function} handler - 핸들러 함수
 * @param {Object} options - 이벤트 옵션
 * @returns {Function} - 이벤트 리스너 제거 함수
 */
export function safeAddEventListener(target, event, handler, options) {
  return safeClientSide(() => {
    target.addEventListener(event, handler, options);
    return () => target.removeEventListener(event, handler, options);
  }, () => {});
}

/**
 * document 참조 안전하게 가져오기
 * @returns {Document|null} - document 객체 또는 null
 */
export function safeDocument() {
  return safeClientSide(() => document, null);
}

/**
 * document.cookie 안전하게 접근
 * @param {string} name - 쿠키 이름
 * @param {string} defaultValue - 기본값
 * @returns {string} - 쿠키 값 또는 기본값
 */
export function safeCookie(name, defaultValue = '') {
  return safeClientSide(() => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : defaultValue;
  }, defaultValue);
}