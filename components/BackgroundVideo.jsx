"use client";

import React, { useEffect, useRef, useState } from "react";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const playAttemptRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    // 브라우저 자동 재생을 위한 추가 설정
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    // 재생 시도 함수
    const attemptAutoplay = () => {
     
      
      // 반복적으로 재생 시도
      playAttemptRef.current = setInterval(() => {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            
            clearInterval(playAttemptRef.current);
          }).catch(error => {
            console.warn("Background: autoplay failed:", error);
            // 인터벌이 계속됨
          });
        }
      }, 1000);
      
      // 10초 후에는 시도 중단
      setTimeout(() => {
        if (playAttemptRef.current) {
          clearInterval(playAttemptRef.current);
        }
      }, 10000);
    };
    
    // 비디오 로딩 상태 핸들러
    const handleCanPlay = () => {
      
      setIsLoaded(true);
      attemptAutoplay();
    };
    
    const handleMetadataLoaded = () => {
     
      // 메타데이터 로드 시에도 재생 시도
      attemptAutoplay();
    };
    
    const handleError = (e) => {
      console.error("Background video error:", e);
      setHasError(true);
      if (playAttemptRef.current) {
        clearInterval(playAttemptRef.current);
      }
    };
    
    // 이벤트 리스너 등록
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleMetadataLoaded);
    video.addEventListener('error', handleError);
    
    // 이미 로드되어 있는 경우 즉시 재생 시도
    if (video.readyState >= 2) {
     
      handleCanPlay();
    }
    
    // 페이지 가시성 변경 처리 (사용자가 탭을 변경하고 돌아올 때)
    const handleVisibilityChange = () => {
      if (!document.hidden && video.paused) {
        video.play().catch(err => console.warn("Visibility play failed:", err));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 클린업 함수
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
      video.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (playAttemptRef.current) {
        clearInterval(playAttemptRef.current);
      }
      
      video.pause();
    };
  }, []);

  // 추가: 페이지 로드 후 일정 시간 지나면 강제로 로드 상태로 변경
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded && !hasError) {
        setIsLoaded(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isLoaded, hasError]);

  return (
    <>
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover -z-30 ${isLoaded ? 'opacity-60' : 'opacity-0'} transition-opacity duration-1000`}
        src="/space.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      
      {/* Fallback background - shown when video fails to load */}
      {hasError && (
        <div 
          className="absolute inset-0 -z-25 bg-gradient-to-b from-purple-900/30 to-black"
        ></div>
      )}
    </>
  );
}