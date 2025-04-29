"use client";

import React, { useState } from "react";
import { useAppState } from "../pages/_app";

/**
 * 사용자 친화적인 오류 메시지 컴포넌트
 * - 다양한 오류 유형 지원 (error, warning, info, success)
 * - 자동 해결 방법 제안
 * - 상세 정보 토글 기능
 * - 재시도 및 해제 기능
 * - 자동 타임아웃 옵션
 * 
 * @param {string} message - 오류 메시지
 * @param {string} type - 오류 유형 (error, warning, info, success)
 * @param {function} onRetry - 재시도 콜백 함수 (제공된 경우 재시도 버튼 표시)
 * @param {function} onDismiss - 닫기 콜백 함수 (제공된 경우 닫기 버튼 표시)
 * @param {object} errorDetails - 상세 오류 정보 (개발자 모드에서만 표시)
 * @param {boolean} autoClose - 자동으로 닫힐지 여부
 * @param {number} autoCloseTime - 자동으로 닫히는 시간 (밀리초)
 * @param {string} className - 추가 CSS 클래스
 * @param {React.ReactNode} children - 추가 컨텐츠
 */
export default function ErrorMessage({ 
  message, 
  type = "error",
  onRetry,
  onDismiss,
  errorDetails,
  autoClose = false,
  autoCloseTime = 5000,
  className = "",
  children
}) {
  // 상세 정보 토글 상태
  const [showDetails, setShowDetails] = useState(false);
  // 자동 닫기 타이머 상태
  const [autoCloseProgress, setAutoCloseProgress] = useState(autoClose ? 100 : 0);
  // 앱 상태 컨텍스트 사용
  const { isOffline } = useAppState();
  
  // 자동 닫기 효과
  React.useEffect(() => {
    if (!autoClose || !onDismiss) return;
    
    const startTime = Date.now();
    const endTime = startTime + autoCloseTime;
    
    // 진행 상태 업데이트 인터벌
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const progress = (remaining / autoCloseTime) * 100;
      setAutoCloseProgress(progress);
    }, 100);
    
    // 자동 닫기 타이머
    const timer = setTimeout(() => {
      onDismiss();
    }, autoCloseTime);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [autoClose, autoCloseTime, onDismiss]);
  
  // 유형에 따른 스타일 설정
  let bgColor, borderColor, iconColor, icon;
  
  switch (type) {
    case "success":
      bgColor = "bg-green-900/30";
      borderColor = "border-green-500/50";
      iconColor = "text-green-500";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
    case "warning":
      bgColor = "bg-yellow-900/30";
      borderColor = "border-yellow-500/50";
      iconColor = "text-yellow-500";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case "info":
      bgColor = "bg-blue-900/30";
      borderColor = "border-blue-500/50";
      iconColor = "text-blue-500";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    default: // error
      bgColor = "bg-red-900/30";
      borderColor = "border-red-500/50";
      iconColor = "text-red-500";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
  
  // 오류 코드 및 메시지에 따른 도움말 및 해결 방법
  const getSolutionText = () => {
    // 오프라인 상태에서의 특별 처리
    if (isOffline) {
      return "인터넷 연결을 확인한 후 다시 시도해보세요.";
    }
    
    // 오류 메시지 패턴에 따른 해결책
    if (typeof message === 'string') {
      if (message.includes("wallet") || message.includes("지갑")) {
        return "지갑이 연결되어 있고 잠금 해제되어 있는지 확인하세요. 문제가 지속되면 페이지를 새로고침하세요.";
      } else if (message.includes("insufficient") || message.includes("balance") || message.includes("잔액")) {
        return "지갑에 이 트랜잭션을 완료하기에 충분한 SOL이 없습니다. 더 많은 자금을 추가하고 다시 시도하세요.";
      } else if (message.includes("network") || message.includes("timeout") || message.includes("네트워크") || message.includes("시간 초과")) {
        return "네트워크 문제가 감지되었습니다. 인터넷 연결을 확인하고 잠시 후 다시 시도해보세요.";
      } else if (message.includes("rejected") || message.includes("cancelled") || message.includes("거부") || message.includes("취소")) {
        return "트랜잭션이 거부되거나 취소되었습니다. 계속하려면 지갑에서 트랜잭션을 승인하세요.";
      } else if (message.includes("Failed to fetch") || message.includes("no response") || message.includes("가져오기 실패") || message.includes("응답 없음")) {
        return "서버 연결 문제가 발생했습니다. 인터넷 연결을 확인하거나 나중에 다시 시도하세요.";
      } else if (message.includes("mint") || message.includes("NFT") || message.includes("민팅")) {
        return "NFT 민팅 중 문제가 발생했습니다. 지갑 잔액을 확인하고 다시 시도하세요. 문제가 지속되면 다른 지갑을 사용해보세요.";
      }
    }
    
    return "이 오류가 계속되면 Telegram 채널을 통해 지원팀에 문의하세요.";
  };

  return (
    <div className={`rounded-lg ${bgColor} border ${borderColor} p-4 ${className}`}>
      {/* 자동 닫기 진행 표시줄 */}
      {autoClose && onDismiss && (
        <div className="absolute top-0 left-0 right-0">
          <div 
            className="h-1 bg-white/30 rounded-t-lg transition-all duration-100"
            style={{ width: `${autoCloseProgress}%` }}
          ></div>
        </div>
      )}
      
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-white">
            {type === "error" ? "Error: " : type === "warning" ? "Warning: " : type === "success" ? "Success: " : "Info: "}
            {message}
          </h3>
          <div className="mt-2 text-sm text-gray-300">
            <p>{getSolutionText()}</p>
            {children}
          </div>
          
          {/* 상세 오류 정보 (개발자용) */}
          {errorDetails && (
            <div className="mt-3">
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-300 flex items-center"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span>{showDetails ? "Hide" : "Show"} technical details</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`ml-1 h-4 w-4 transform ${showDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDetails && (
                <pre className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                  {typeof errorDetails === 'object' 
                    ? JSON.stringify(errorDetails, null, 2) 
                    : errorDetails}
                </pre>
              )}
            </div>
          )}
          
          {/* 재시도 또는 닫기 버튼 */}
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-3">
              {onRetry && (
                <button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={onRetry}
                >
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={onDismiss}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}