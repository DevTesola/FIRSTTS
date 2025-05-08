import React, { useState, useEffect } from 'react';
import EnhancedProgressiveImage from './EnhancedProgressiveImage';
import { createPlaceholder } from '../utils/mediaUtils';

/**
 * 향상된 이미지 로딩 컴포넌트
 * - 로딩 상태 표시
 * - 실패 시 자동 재시도
 * - 최종 실패 시 그라데이션 배경으로 대체
 */
const EnhancedImageWithFallback = ({ 
  src,
  alt,
  className,
  id, // NFT ID
  placeholderText,
  maxRetries = 1,
  retryInterval = 1000,
  onLoad,
  onError,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState(src);

  // ID에 기반한 그라데이션 색상 생성
  const generateGradient = (id) => {
    const idNum = parseInt(String(id || '0').replace(/\D/g, '') || '0');
    const hue1 = (idNum * 137) % 360; // 황금비로 색상 분포
    const hue2 = (hue1 + 40) % 360; // 보색에 가까운 색상
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 40%), hsl(${hue2}, 80%, 30%))`;
  };

  // 컴포넌트 마운트 시 또는 src가 변경될 때 로딩 상태 초기화
  useEffect(() => {
    setLoading(true);
    setLoadFailed(false);
    setRetryCount(0);
    setImageSrc(src);
  }, [src]);

  // 로딩 실패 시 재시도 로직 - 기존에는 3번, 지금은 1번만 재시도 (빠른 처리를 위해)
  useEffect(() => {
    // 로딩 중이고 재시도 횟수가 있고, 최대 재시도 횟수보다 적은 경우
    if (loading && retryCount > 0 && retryCount < maxRetries) {
      // 재시도 카운트 로깅
      console.log(`🔄 이미지 재시도 중 (${retryCount}/${maxRetries}): ${src}`);
      
      // 지정된 간격(retryInterval) 후에 재시도
      const timer = setTimeout(() => {
        // 캐시 버스팅을 위해 URL에 타임스탬프 추가
        const newSrc = src.includes('?') 
          ? `${src}&_retry=${Date.now()}` 
          : `${src}?_retry=${Date.now()}`;
        setImageSrc(newSrc);
        console.log(`🔄 새 URL로 재시도: ${newSrc}`);
      }, retryInterval);
      
      // 컴포넌트 unmount 시 타이머 정리
      return () => clearTimeout(timer);
    }
    
    // 모든 재시도 실패한 경우
    if (retryCount >= maxRetries && loading) {
      console.log(`❌ 이미지 로딩 실패 (${maxRetries}회 시도): ${src}`);
      // 즉시 로딩 실패 상태로 전환하고 그라데이션 배경 표시
      setLoadFailed(true);
      setLoading(false);
    }
  }, [loading, retryCount, maxRetries, src, retryInterval]);

  // 이미지 로드 성공 핸들러
  const handleLoad = () => {
    setLoading(false);
    setLoadFailed(false);
    if (onLoad) onLoad();
  };

  // 이미지 로드 실패 핸들러
  const handleError = () => {
    setRetryCount(prevCount => prevCount + 1);
    if (onError) onError();
  };

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      {/* 로딩 인디케이터 */}
      {loading && !loadFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10">
          <div className="w-8 h-8 border-4 border-t-purple-500 border-purple-300/30 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 로딩 실패 시 그라데이션 배경과 메시지 */}
      {loadFailed && (
        <div 
          style={{ background: generateGradient(id) }}
          className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-center font-medium">
            {placeholderText || '404: JPEG not found'}
          </span>
        </div>
      )}
      
      {/* 실제 이미지 */}
      <EnhancedProgressiveImage
        src={imageSrc}
        alt={alt || `NFT ${id || ''}`}
        placeholder={createPlaceholder(alt || `NFT ${id || ''}`)}
        className="w-full h-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
        priority={props.priority || false}
        lazyLoad={props.lazyLoad || true}
        highQuality={props.highQuality || true}
        preferRemote={props.preferRemote || true}
        useCache={props.useCache || false}
        {...props}
      />
    </div>
  );
};

export default EnhancedImageWithFallback;