"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/solid";

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true); // 기본값을 true로 설정
  const [prevVolume, setPrevVolume] = useState(0.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);
  
  // 비디오 초기화 및 자동 재생 시도
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log("Initializing video with source:", src);
    
    // 브라우저에서 자동 재생을 위한 설정
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    const attemptPlay = () => {
     
      
      // 여러 번 재생 시도
      const playAttempt = setInterval(() => {
        const promise = video.play();
        
        if (promise !== undefined) {
          promise.then(() => {
          
            setPlaying(true);
            clearInterval(playAttempt);
          }).catch(error => {
            console.warn("Autoplay failed:", error);
            // 계속 시도 (인터벌이 계속됨)
          });
        }
      }, 1000); // 1초마다 시도
      
      // 10초 후에는 시도 멈춤
      setTimeout(() => {
        clearInterval(playAttempt);
      }, 10000);
    };
    
    // 비디오 메타데이터 로드 완료 후 재생 시도
    const handleLoadedMetadata = () => {

      attemptPlay();
    };
    
    // 비디오가 재생 가능한 상태가 되면 재생 시도
    const handleCanPlay = () => {
     
      setIsLoaded(true);
      attemptPlay();
    };
    
    const handleError = (e) => {
      console.error("Video error:", e);
      if (video.error) {
        console.error("Error details:", video.error);
      }
      setHasError(true);
    };
    
    const handlePlay = () => {
    
      setPlaying(true);
    };
    
    const handlePause = () => {
  
      setPlaying(false);
    };
    
    // 이벤트 리스너 추가
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    // 이미 로드되어 있는 경우 즉시 재생 시도
    if (video.readyState >= 2) {
      console.log("Video already loaded, current readyState:", video.readyState);
      handleCanPlay();
    }
    
    // 클린업 함수
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      
      // 비디오 재생 중이면 중단
      if (!video.paused) {
        video.pause();
      }
    };
  }, [src]);

  // 여기에 기존 코드 유지 (volume, controls, etc.)
  
  // Handle volume and mute state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-hide controls
  useEffect(() => {
    if (playing) {
      // Show controls initially, then hide after 3 seconds
      setControlsVisible(true);
      const hideControls = () => setControlsVisible(false);
      
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
      return () => clearTimeout(controlsTimeoutRef.current);
    } else {
      // Always show controls when paused
      setControlsVisible(true);
    }
  }, [playing]);

  // Control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playing) {
      video.pause();
    } else {
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing video:", error);
          });
        }
      } catch (error) {
        console.error("Error in play method:", error);
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const decreaseVolume = () => {
    setVolume((v) => {
      const newVolume = Math.max(0, v - 0.1);
      if (newVolume <= 0.1) setIsMuted(true);
      return newVolume;
    });
  };

  const increaseVolume = () => {
    setVolume((v) => {
      const newVolume = Math.min(1, v + 0.1);
      setIsMuted(false);
      return newVolume;
    });
  };

  // Show controls when mouse enters
  const handleMouseEnter = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  // Start hiding timer when mouse leaves
  const handleMouseLeave = () => {
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1500);
    }
  };

  return (
    <div 
      className="mt-8 w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-xl relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className={`w-full h-auto ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        // poster는 없으면 제거해도 됩니다
      />
          {/* 항상 보이는 음소거 해제 버튼 (새로 추가) */}
    {isMuted && playing && (
      <div className="absolute top-4 right-4 z-10 bg-black/50 rounded-full p-2 animate-pulse">
        <button
          onClick={toggleMute}
          className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-500 transition-colors"
          aria-label="Unmute video"
        >
          <SpeakerWaveIcon className="h-6 w-6" />
          <span className="sr-only">소리 켜기</span>
        </button>
      </div>
    )}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white flex-col">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-center">Video playback error</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Reload
          </button>
        </div>
      )}
      
      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 inset-x-0 flex justify-between items-center p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left side - play/pause */}
        <button
          onClick={togglePlay}
          className="group bg-purple-700 p-3 rounded-full hover:bg-purple-600 transition-colors"
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {playing ? (
            <PauseIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <PlayIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
        
        {/* Right side - volume controls */}
        <div className="flex space-x-2">
          <button
            onClick={decreaseVolume}
            className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors"
            aria-label="Decrease volume"
          >
            <MinusIcon className="h-5 w-5 text-white" />
          </button>
          
          <button
            onClick={toggleMute}
            className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-5 w-5 text-white" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5 text-white" />
            )}
          </button>
          
          <button
            onClick={increaseVolume}
            className="bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60 transition-colors"
            aria-label="Increase volume"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}