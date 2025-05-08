"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { isClient, getConnectionInfo, safeAddEventListener } from "../utils/clientSideUtils";

// 미디어 옵션을 위한 상수
const VIDEO_OPTIONS = {
  LOW_BANDWIDTH: {
    src: "/SPACE_lowres.webm",
    type: "video/webm",
  },
  HIGH_QUALITY: {
    src: "/SPACE.mp4",
    type: "video/mp4",
  },
};

const BackgroundVideo = () => {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const playAttemptRef = useRef(null);

  // 1. 네트워크 상태 감지 및 최적 비디오 소스 선택
  useEffect(() => {
    if (!isClient) return;
    
    // 느린 연결 감지 (navigator.connection API 사용)
    const detectConnectionSpeed = () => {
      const connectionInfo = getConnectionInfo();
      
      // 2G, 3G 연결 또는 데이터 절약 모드인 경우 저화질 비디오 사용
      if (
        connectionInfo.saveData || 
        ['slow-2g', '2g', '3g'].includes(connectionInfo.connectionType)
      ) {
        setIsLowBandwidth(true);
      }
    };

    detectConnectionSpeed();

    // 연결 상태 변경 리스너 (지원되는 경우)
    let cleanup = () => {};
    if (isClient && navigator.connection) {
      cleanup = safeAddEventListener(
        navigator.connection, 
        'change', 
        detectConnectionSpeed
      );
    }
    
    return cleanup;
  }, []);

  // 2. 비디오 재생 관리 (최적화됨)
  useEffect(() => {
    if (!isClient) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    // 브라우저 자동 재생 설정
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    
    // 메모리 누수 방지를 위한 타이머 참조 관리
    const timers = [];
    
    // 개선된 재생 시도 함수
    const attemptAutoplay = () => {
      // 인터벌 클리어
      if (playAttemptRef.current) {
        clearInterval(playAttemptRef.current);
      }
      
      // 최대 3번만 재생 시도 (성능 개선)
      let attempts = 0;
      
      playAttemptRef.current = setInterval(() => {
        if (attempts >= 3) {
          clearInterval(playAttemptRef.current);
          return;
        }
        
        attempts++;
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            clearInterval(playAttemptRef.current);
          }).catch(error => {
            // 사용자 상호작용 필요한 경우 자동 재생 중단 (모바일)
            if (error.name === 'NotAllowedError') {
              clearInterval(playAttemptRef.current);
            }
          });
        }
      }, 1000);
      
      // 타이머 추적
      timers.push(playAttemptRef.current);
      
      // 3초 후 시도 중단 (성능 개선)
      const timeout = setTimeout(() => {
        if (playAttemptRef.current) {
          clearInterval(playAttemptRef.current);
        }
      }, 3000);
      
      timers.push(timeout);
    };
    
    // 비디오 이벤트 핸들러
    const handleCanPlay = () => {
      setIsLoaded(true);
      attemptAutoplay();
    };
    
    const handleError = () => {
      setHasError(true);
      if (playAttemptRef.current) {
        clearInterval(playAttemptRef.current);
      }
    };
    
    // 이벤트 리스너 등록
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // 이미 로드된 경우 즉시 재생
    if (video.readyState >= 2) {
      handleCanPlay();
    }
    
    // 가시성 변경 처리
    const handleVisibilityChange = () => {
      if (document && !document.hidden && video.paused) {
        video.play().catch(() => {});
      }
    };
    
    const visibilityCleanup = safeAddEventListener(
      document, 
      'visibilitychange', 
      handleVisibilityChange
    );
    
    // 클린업
    return () => {
      if (video) {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        visibilityCleanup();
        
        // 모든 타이머 정리
        timers.forEach(timer => clearTimeout(timer));
        if (playAttemptRef.current) {
          clearInterval(playAttemptRef.current);
        }
        
        video.pause();
      }
    };
  }, []);

  // 3. Fallback timer (optimized: reduced time)
  useEffect(() => {
    if (!isClient) return;
    
    const timer = setTimeout(() => {
      if (!isLoaded && !hasError) {
        setIsLoaded(true);
      }
    }, 3000); // 3초로 단축
    
    return () => clearTimeout(timer);
  }, [isLoaded, hasError]);

  // 4. 비디오 소스 선택 및 렌더링
  const videoSrc = isLowBandwidth ? VIDEO_OPTIONS.LOW_BANDWIDTH.src : VIDEO_OPTIONS.HIGH_QUALITY.src;
  const videoType = isLowBandwidth ? VIDEO_OPTIONS.LOW_BANDWIDTH.type : VIDEO_OPTIONS.HIGH_QUALITY.type;

  return (
    <>
      {/* 페이드인을 위한 이미지 빠른 표시 */}
      {!isLoaded && (
        <div className="fixed inset-0 -z-29">
          <Image
            src="/stars.jpg"
            alt="Space background"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
    
      <video
        ref={videoRef}
        className={`fixed inset-0 min-w-full min-h-full max-w-none object-cover -z-30 ${isLoaded ? 'opacity-60' : 'opacity-0'} transition-opacity duration-700`}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        poster="/video-poster.png"
        preload="metadata"
        style={{
          width: '120vw', 
          height: '120vh',
          left: '-10vw',
          top: '-10vh',
          objectPosition: 'center'
        }}
      >
        <source src={videoSrc} type={videoType} />
      </video>
      
      {/* Fallback background */}
      {hasError && (
        <div className="absolute inset-0 -z-25 bg-gradient-to-b from-purple-900/30 to-black"></div>
      )}
    </>
  );
};

// memo로 감싸 불필요한 리렌더링 방지
export default memo(BackgroundVideo);