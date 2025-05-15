/**
 * InfoTooltip.jsx
 * 정보 툴팁 컴포넌트
 * 
 * 마우스를 올리면 추가 정보를 보여주는 간단한 툴팁 컴포넌트입니다.
 */
import React, { useState } from 'react';

/**
 * 정보 툴팁 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {React.ReactNode} props.children - 툴팁 내용
 * @param {string} props.title - 툴팁 제목 (선택 사항)
 * @param {string} props.className - 추가 CSS 클래스 (선택 사항)
 * @param {string} props.position - 툴팁 위치 (top, bottom, left, right) (기본값: top)
 * @param {number} props.delay - 툴팁 표시 지연 시간 (ms) (기본값: 0)
 * @returns {React.ReactElement} 툴팁 컴포넌트
 */
export const InfoTooltip = ({
  children,
  title,
  className = "",
  position = "top",
  delay = 0
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [timer, setTimer] = useState(null);

  // 툴팁 표시 처리
  const handleMouseEnter = () => {
    if (delay > 0) {
      const newTimer = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
      setTimer(newTimer);
    } else {
      setShowTooltip(true);
    }
  };

  // 툴팁 숨김 처리
  const handleMouseLeave = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setShowTooltip(false);
  };

  // 툴팁 위치에 따른 클래스 계산
  const getPositionClass = () => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "top":
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className={`relative inline-block text-left cursor-help ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-xs font-bold">
        ?
      </div>
      
      {showTooltip && (
        <div
          className={`absolute z-10 w-48 max-w-xs bg-gray-800 text-white text-xs rounded-md shadow-lg p-2 ${getPositionClass()}`}
        >
          {title && <div className="font-bold mb-1">{title}</div>}
          <div>{children}</div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;