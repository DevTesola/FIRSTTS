"use client";

import React from "react";

/**
 * 사용자 친화적인 오류 메시지 컴포넌트
 * @param {string} message - 오류 메시지
 * @param {string} type - 오류 유형 (error, warning, info)
 * @param {function} onRetry - 재시도 콜백 함수 (제공된 경우 재시도 버튼 표시)
 * @param {function} onDismiss - 닫기 콜백 함수 (제공된 경우 닫기 버튼 표시)
 * @param {object} errorDetails - 상세 오류 정보 (개발자 모드에서만 표시)
 */
export default function ErrorMessage({ 
  message, 
  type = "error",
  onRetry,
  onDismiss,
  errorDetails,
  className = ""
}) {
  // 상세 정보 토글 상태
  const [showDetails, setShowDetails] = React.useState(false);
  
  // 유형에 따른 스타일 설정
  let bgColor, borderColor, iconColor, icon;
  
  switch (type) {
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
  
  // 오류 코드에 따른 도움말 및 해결 방법
  const getSolutionText = () => {
    if (message.includes("wallet")) {
      return "Make sure your wallet is connected and unlocked. Try refreshing the page if issues persist.";
    } else if (message.includes("insufficient") || message.includes("balance")) {
      return "Your wallet doesn't have enough SOL to complete this transaction. Please add more funds and try again.";
    } else if (message.includes("network") || message.includes("timeout")) {
      return "Network issues detected. Check your internet connection, wait a moment, and try again.";
    } else if (message.includes("rejected") || message.includes("cancelled")) {
      return "The transaction was rejected or cancelled. Please approve the transaction in your wallet to proceed.";
    } else if (message.includes("Failed to fetch") || message.includes("no response")) {
      return "Server connection issue. Please check your internet connection or try again later.";
    }
    
    return "If this error persists, please contact support via our Telegram channel.";
  };

  return (
    <div className={`rounded-lg ${bgColor} border ${borderColor} p-4 ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-white">
            {type === "error" ? "Error: " : type === "warning" ? "Warning: " : "Info: "}
            {message}
          </h3>
          <div className="mt-2 text-sm text-gray-300">
            <p>{getSolutionText()}</p>
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