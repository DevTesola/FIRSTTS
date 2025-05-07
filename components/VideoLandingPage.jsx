import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/router';

const VideoLandingPage = () => {
  const videoRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const router = useRouter();

  // 3초 시점에 버튼 표시 
  useEffect(() => {
    // 3초 후 버튼 표시 시작
    const timer = setTimeout(() => {
      setShowButtons(true);
      console.log("Buttons showing at 3 second mark");
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // 비디오 재생 시작 함수
  const startVideo = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        console.error("Video element not found");
        return;
      }

      console.log("Attempting to play video with sound");
      
      // 비디오 옵션 설정
      video.muted = false;
      video.volume = 1.0;
      video.currentTime = 0;
      
      // 직접 비디오 재생시키기
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video successfully playing with sound");
            setVideoPlaying(true);
          })
          .catch(error => {
            console.error("Video play failed:", error);
            
            // 실패 시 다른 방법 시도
            setTimeout(() => {
              video.muted = false;
              video.play().catch(innerError => {
                console.error("Even retry play failed:", innerError);
              });
            }, 300);
          });
      } else {
        console.log("Play promise is undefined, cannot track success/failure");
        // 일단 재생 시작된 것으로 간주
        setVideoPlaying(true);
      }
    } catch (e) {
      console.error("Error in startVideo function:", e);
    }
  };

  // 비디오 이벤트 핸들러 설정
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // 영상의 6~7초 구간에서 버튼을 표시 (6초에 "Who are you?" 대사가 나온다고 가정)
      if (video.currentTime >= 6 && video.currentTime <= 7 && !showButtons) {
        console.log("Video timeupdate trigger at:", video.currentTime);
        setShowButtons(true);
      }
    };

    const handleCanPlay = () => {
      console.log("Video can play now");
    };

    const handleVideoPlay = () => {
      console.log("Video started playing");
    };

    const handleError = (e) => {
      console.error("Video error:", e);
    };

    // 이벤트 리스너 등록
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('error', handleError);

    // 클린업 함수
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('error', handleError);
    };
  }, [showButtons, videoPlaying]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden font-orbitron bg-black">
      {/* 배경 비디오 - SPACE.mp4 */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-120 saturate-100 opacity-95"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/SPACE.mp4" type="video/mp4" />
        </video>
        
        {/* 어두운 필터 오버레이 - 더 투명하게 조정 */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* 은은한 그라데이션 필터 - 더 투명하게 조정 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40 mix-blend-multiply"></div>
      </div>
      
      {/* 별빛 효과 배경 - 비디오 위에 겹침 (투명도 크게 감소) */}
      <div className="absolute inset-0 z-1 bg-black/30">
        {/* stars3.jpg 배경 이미지 오버레이 - 투명도 크게 감소 */}
        <div className="absolute inset-0 bg-[url('/stars3.jpg')] bg-cover bg-center opacity-5 mix-blend-lighten"></div>
        
        {/* CSS 별 애니메이션 - 밝기 더 감소 */}
        <div className="stars1 opacity-40"></div>
        <div className="stars2 opacity-40"></div>
        <div className="stars3 opacity-50"></div>
      </div>
      
      {/* 재생 버튼 - 화면 중앙에 큰 크기로 표시 (z-index 높임) */}
      {!videoPlaying && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[100]" style={{ pointerEvents: 'none' }}>
          <div className="absolute top-[32%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
            <div className="text-white text-4xl font-bold bg-black/90 px-10 py-5 rounded-xl border-[3px] border-red-500 mb-8 shadow-[0_0_35px_rgba(255,0,100,0.8)]">
              CLICK TO PLAY WITH SOUND
            </div>
            <div 
              className="bg-gradient-to-r from-red-600 to-purple-800 p-10 rounded-full shadow-[0_0_40px_rgba(255,60,60,0.8)] animate-pulse border-[6px] border-white/70 cursor-pointer"
              onClick={startVideo}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-28 w-28 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* 비디오 컨테이너 - 더 크게 키우고 더 위로 올림 */}
      <div className="absolute top-[28%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-6xl z-20">
        {/* 스타일링된 비디오 프레임 */}
        <div className="relative rounded-lg overflow-visible shadow-[0_0_50px_rgba(100,100,255,0.8)] border-4 border-gray-800/80">
          {/* 프레임 장식 요소 */}
          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 z-20 border-b-2 border-blue-500/30 flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-blue-300 font-bold tracking-wider text-sm">TESOLA INITIALIZATION</div>
            <div className="w-24 h-5 bg-gray-800 rounded-md border border-gray-700"></div>
          </div>
          
          {/* 사이드 패널 - 왼쪽 */}
          <div className="absolute left-0 top-12 bottom-0 w-16 bg-gradient-to-b from-gray-900 to-blue-900/40 z-20 border-r border-blue-500/20 flex flex-col items-center justify-start pt-4 space-y-6">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-600/80 animate-pulse"></div>
            </div>
            <div className="w-10 h-1 bg-blue-500/30 rounded-full"></div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20"></div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20"></div>
            <div className="w-10 h-1 bg-blue-500/30 rounded-full"></div>
            <div className="w-8 h-20 bg-gradient-to-b from-blue-500/10 to-blue-500/30 rounded-lg"></div>
          </div>
          
          {/* 사이드 패널 - 오른쪽 */}
          <div className="absolute right-0 top-12 bottom-0 w-16 bg-gradient-to-b from-gray-900 to-blue-900/40 z-20 border-l border-blue-500/20 flex flex-col items-center justify-start pt-4 space-y-6">
            <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-red-600/80 animate-pulse"></div>
            </div>
            <div className="w-10 h-1 bg-blue-500/30 rounded-full"></div>
            <div className="w-8 h-20 bg-gradient-to-b from-red-500/10 to-red-500/30 rounded-lg"></div>
            <div className="w-10 h-1 bg-blue-500/30 rounded-full"></div>
            <div className="w-8 h-8 rounded-full bg-red-500/20"></div>
            <div className="w-8 h-8 rounded-full bg-red-500/20"></div>
          </div>
          
          {/* 하단 패널 */}
          <div className="absolute bottom-0 left-16 right-16 h-10 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 z-20 border-t border-blue-500/30 flex items-center justify-around">
            <div className="w-20 h-2 bg-blue-500/30 rounded-full"></div>
            <div className="w-32 h-4 bg-gray-800 rounded-md border border-blue-500/20"></div>
            <div className="w-20 h-2 bg-blue-500/30 rounded-full"></div>
          </div>
          
          {/* 비디오 요소 - 컨테이너 안에 intro.mp4만 표시 */}
          <video
            ref={videoRef}
            id="mainVideo"
            className="w-full aspect-video object-cover z-10 cursor-pointer"
            playsInline
            loop={false}
            poster="/video-poster.png"
            preload="auto"
            autoPlay
            muted
            controls={false}
            onClick={startVideo}
            onError={(e) => console.error("Video tag error:", e)}
          >
            <source src="/intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      
      {/* 오버레이 콘텐츠 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        {/* 구슬 버튼들 - 타이밍에 맞춰 페이드인 */}
        {showButtons && (
          <div className="relative flex flex-wrap justify-between items-start w-full px-32 mb-20">
            {/* 왼쪽 행성 - 화이트페이퍼 - 움직임 추가 */}
            <Link href="/whitepaper">
              <div className="group cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-105 relative" style={{animation: 'planetEntryLeft 3s forwards ease-out, bounce 9s ease-in-out infinite 6s'}}>
                {/* 행성 진입 트레일 효과 */}
                <div className="absolute top-[50%] right-[20%] h-3 rounded-full bg-gradient-to-r from-transparent via-blue-400/70 to-purple-500/70 blur-sm z-0 animate-planetTrail"></div>
                <div className="absolute w-56 h-56 rounded-full bg-purple-500/20 blur-md opacity-0 animate-[fadeIn_2s_ease-in-out_3s_forwards]"></div>
                {/* 행성 도착 이펙트 */}
                <div className="absolute w-full h-full rounded-full bg-blue-400/40 blur-md opacity-0 animate-[planetArrival_1.5s_ease-out_5s_forwards]"></div>
                
                {/* 별빛 스파클 효과 */}
                <div className="absolute top-[-20px] left-[10px] w-8 h-8 opacity-0 animate-[sparkle_0.8s_ease-out_5.1s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-blue-200 drop-shadow-[0_0_10px_rgba(120,120,255,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute top-[10px] right-[-10px] w-6 h-6 opacity-0 animate-[sparkle_0.8s_ease-out_5.2s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-purple-200 drop-shadow-[0_0_10px_rgba(180,120,255,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute bottom-[0px] left-[0px] w-7 h-7 opacity-0 animate-[sparkle_0.8s_ease-out_5.3s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-200 drop-shadow-[0_0_10px_rgba(150,150,255,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                {/* 화이트페이퍼 툴팁 */}
                <div className="absolute top-[-70px] left-[80px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform group-hover:translate-y-2">
                  <div className="bg-gradient-to-br from-blue-900 via-blue-600 to-purple-800 text-white px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(100,100,255,0.7)] border-2 border-blue-400/50 relative overflow-hidden">
                    {/* 배경 효과 */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,120,255,0.2)_0%,transparent_60%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(180,120,255,0.2)_0%,transparent_60%)]"></div>
                    
                    {/* 텍스트 */}
                    <div className="flex flex-col items-center relative">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-200 font-black text-sm tracking-widest uppercase mr-1">THE</span>
                        <span className="text-white font-black text-sm tracking-widest uppercase">DIAMOND</span>
                        <span className="ml-1 font-bold">💎</span>
                      </div>
                      <div className="text-sm font-bold tracking-wider text-blue-200 uppercase">
                        <span className="animate-pulse">HODL</span>
                        <span className="mx-1">•</span>
                        <span className="text-white">HANDS</span>
                        <span className="mx-1">•</span>
                        <span className="animate-pulse">CLUB</span>
                      </div>
                      <div className="w-full h-0.5 mt-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                    </div>
                    
                    <div className="absolute left-6 bottom-[-6px] w-3 h-3 bg-blue-700 transform rotate-45 border-r-2 border-b-2 border-blue-400/50"></div>
                  </div>
                </div>
                
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/50 hover:shadow-blue-500/80 transition-all duration-500 group-hover:scale-110 transform-gpu relative overflow-visible">
                  {/* 행성 표면 질감 */}
                  <div className="w-44 h-44 rounded-full bg-gradient-to-br from-blue-500 to-purple-700 flex items-center justify-center overflow-hidden absolute">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/80 via-purple-500/80 to-blue-800/80 backdrop-blur-sm relative">
                      {/* 행성 표면 크레이터 */}
                      <div className="absolute top-3 left-5 w-4 h-4 rounded-full bg-blue-300/20"></div>
                      <div className="absolute bottom-6 right-8 w-6 h-6 rounded-full bg-purple-300/20"></div>
                      <div className="absolute top-12 right-4 w-5 h-5 rounded-full bg-indigo-300/20"></div>
                      <div className="absolute top-20 left-10 w-7 h-7 rounded-full bg-violet-300/20"></div>
                      
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-lg animate-pulse-slow" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* 행성 고리 - 속도 통일 */}
                  <div className="absolute w-[160%] h-16 border-4 border-blue-400/30 rounded-full -rotate-12 animate-spin-reverse" style={{animationDuration: '10s'}}></div>
                  <div className="absolute w-[180%] h-6 border border-blue-300/30 rounded-full -rotate-5 animate-spin" style={{animationDuration: '12s'}}></div>
                  <div className="absolute w-[170%] h-12 border-2 border-purple-500/20 rounded-full rotate-12 animate-spin" style={{animationDuration: '15s'}}></div>
                </div>
                <div className="flex flex-col items-center mt-6">
                  <span className="text-white text-2xl font-bold opacity-90 group-hover:opacity-100 group-hover:text-blue-300 transition-all flex items-center">
                    Whitepaper
                    <span className="animate-bounce ml-2 relative">
                      <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(100,150,255,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1">
                        <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </span>
                  </span>
                  <span className="text-blue-300/70 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500">Technical Vision</span>
                </div>
              </div>
            </Link>
            
            {/* 개발자 공간 행성 - 검은색과 빨간색 테마 - 더 아래쪽 왼쪽에 위치 - 빠른 등장 애니메이션 */}
            <Link href="/developer-space" className="absolute left-[15%] bottom-[-350px] z-20">
              <div className="group cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-105 relative" style={{animation: 'devPlanetEntry 2.5s cubic-bezier(0.25, 0.1, 0.25, 1.4) forwards, bounce 6s ease-in-out infinite 3s'}}>
                {/* 곡선 트레일 효과 - 우측 상단에서 진입 */}
                <div className="absolute top-[30%] right-[-80%] h-3 w-64 rounded-full bg-gradient-to-l from-transparent via-red-400/70 to-rose-500/70 blur-sm z-0" 
                  style={{animation: 'devPlanetEntry 2.5s forwards ease-out, fadeOut 1s ease-in 2.5s forwards', transformOrigin: 'center center'}}></div>
                <div className="absolute w-56 h-56 rounded-full bg-rose-500/20 blur-md opacity-0"
                  style={{animation: 'fadeIn 0.5s ease-in 2s forwards'}}></div>
                {/* 행성 도착 이펙트 */}
                <div className="absolute w-full h-full rounded-full bg-red-400/40 blur-md opacity-0"
                  style={{animation: 'planetArrival 1s ease-out 2.5s forwards'}}></div>
                
                {/* 별빛 스파클 효과 */}
                <div className="absolute top-[-15px] left-[5px] w-8 h-8 opacity-0" style={{animation: 'sparkle 0.8s ease-out 2.7s forwards'}}>
                  <svg viewBox="0 0 24 24" className="w-full h-full text-rose-200 drop-shadow-[0_0_10px_rgba(255,50,80,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute top-[5px] right-[-5px] w-6 h-6 opacity-0" style={{animation: 'sparkle 0.8s ease-out 2.8s forwards'}}>
                  <svg viewBox="0 0 24 24" className="w-full h-full text-red-200 drop-shadow-[0_0_10px_rgba(255,50,50,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute bottom-[5px] left-[10px] w-7 h-7 opacity-0" style={{animation: 'sparkle 0.8s ease-out 2.9s forwards'}}>
                  <svg viewBox="0 0 24 24" className="w-full h-full text-rose-200 drop-shadow-[0_0_10px_rgba(255,80,100,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                {/* 개발자 공간 툴팁 - 왼쪽 아래에 표시 */}
                <div className="absolute bottom-[-120px] left-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform group-hover:translate-y-[-5px]">
                  <div className="bg-gradient-to-br from-gray-900 via-red-900 to-black text-white px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(255,50,80,0.7)] border-2 border-rose-500/50 relative overflow-hidden">
                    {/* 배경 효과 */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,50,80,0.2)_0%,transparent_60%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(220,50,50,0.2)_0%,transparent_60%)]"></div>
                    
                    {/* 텍스트 */}
                    <div className="flex flex-col items-center relative">
                      <div className="flex items-center mb-1">
                        <span className="text-rose-300 font-black text-sm tracking-widest uppercase mr-1">DEV</span>
                        <span className="text-white font-black text-sm tracking-widest uppercase">MODE</span>
                        <span className="ml-1 font-bold">🧑‍💻</span>
                      </div>
                      <div className="text-xs font-bold tracking-wider text-red-200 uppercase flex items-center">
                        <span className="animate-pulse">CODING</span>
                        <span className="mx-1">•</span>
                        <span className="text-white">LIVE</span>
                        <span className="mx-1">•</span>
                        <span className="animate-pulse">SESSION</span>
                      </div>
                      <div className="w-full h-0.5 mt-1 bg-gradient-to-r from-transparent via-rose-300 to-transparent"></div>
                    </div>
                    
                    <div className="absolute left-6 top-[-6px] w-3 h-3 bg-gray-900 transform rotate-45 border-l-2 border-t-2 border-rose-500/50"></div>
                  </div>
                </div>
                
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center shadow-xl shadow-rose-500/50 hover:shadow-red-500/80 transition-all duration-500 group-hover:scale-110 transform-gpu relative overflow-visible">
                  {/* 행성 표면 질감 */}
                  <div className="w-44 h-44 rounded-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden absolute">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black/80 via-gray-900/80 to-gray-800/80 backdrop-blur-sm relative">
                      {/* 행성 표면 디테일 - 코드 패턴 */}
                      <div className="absolute top-4 left-7 w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center overflow-hidden">
                        <span className="text-[8px] text-rose-300/50 font-mono">{'{'}</span>
                      </div>
                      <div className="absolute bottom-5 right-6 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-[8px] text-rose-300/50 font-mono">=&gt;</span>
                      </div>
                      <div className="absolute top-15 right-8 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-[8px] text-rose-300/50 font-mono">if()</span>
                      </div>
                      <div className="absolute bottom-12 left-10 w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <span className="text-[8px] text-rose-300/50 font-mono animate-pulse">.</span>
                      </div>
                      <div className="absolute top-[45%] right-[25%] w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-[7px] text-rose-300/50 font-mono">const</span>
                      </div>
                      <div className="absolute bottom-[35%] left-[20%] w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <span className="text-[8px] text-rose-300/50 font-mono rotate-[15deg]">()</span>
                      </div>
                      
                      {/* DEV 아이콘 */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-red-600 opacity-50 animate-pulse blur-sm"></div>
                        <div className="z-10 flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-rose-400 drop-shadow-[0_0_8px_rgba(255,50,80,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 행성 고리 - 속도 통일 */}
                  <div className="absolute w-[165%] h-14 border-4 border-rose-500/30 rounded-full rotate-6 animate-spin" style={{animationDuration: '11s'}}></div>
                  <div className="absolute w-[175%] h-8 border border-red-400/30 rounded-full rotate-12 animate-spin-reverse" style={{animationDuration: '14s'}}></div>
                  <div className="absolute w-[155%] h-10 border-2 border-rose-500/20 rounded-full -rotate-8 animate-spin" style={{animationDuration: '17s'}}></div>
                </div>
                <div className="flex flex-col items-center mt-6">
                  <span className="text-white text-2xl font-bold opacity-90 group-hover:opacity-100 group-hover:text-rose-300 transition-all flex items-center">
                    Dev's Space
                    <span className="animate-bounce ml-2 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-rose-400 drop-shadow-[0_0_8px_rgba(255,50,80,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1">
                        <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </span>
                  </span>
                  <span className="text-rose-300/70 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="font-mono text-red-300/90">src=</span>
                    <span className="text-rose-300/90">{`{ reality }`}</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* 오른쪽 행성 - 진짜 이야기 - 위쪽에 위치하고 움직임 추가 */}
            <Link href="/introduction" className="absolute right-[13%] top-[-120px] z-20">
              <div className="group cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-105 relative" style={{animation: 'planetEntryRight 3s forwards ease-out, bounce 8s ease-in-out infinite 6s'}}>
                {/* 행성 진입 트레일 효과 */}
                <div className="absolute top-[50%] left-[20%] h-3 rounded-full bg-gradient-to-l from-transparent via-orange-400/70 to-red-500/70 blur-sm z-0 animate-planetTrail"></div>
                <div className="absolute w-56 h-56 rounded-full bg-amber-500/20 blur-md opacity-0 animate-[fadeIn_2s_ease-in-out_3s_forwards]"></div>
                {/* 행성 도착 이펙트 */}
                <div className="absolute w-full h-full rounded-full bg-orange-400/40 blur-md opacity-0 animate-[planetArrival_1.5s_ease-out_5s_forwards]"></div>
                
                {/* 별빛 스파클 효과 */}
                <div className="absolute top-[-20px] right-[10px] w-8 h-8 opacity-0 animate-[sparkle_0.8s_ease-out_5.1s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-amber-200 drop-shadow-[0_0_10px_rgba(255,180,80,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute top-[10px] left-[-10px] w-6 h-6 opacity-0 animate-[sparkle_0.8s_ease-out_5.2s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-red-200 drop-shadow-[0_0_10px_rgba(255,120,100,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                <div className="absolute bottom-[0px] right-[0px] w-7 h-7 opacity-0 animate-[sparkle_0.8s_ease-out_5.3s_forwards]">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-200 drop-shadow-[0_0_10px_rgba(255,230,100,0.8)]">
                    <path fill="currentColor" d="M12,2L14.2,9.2H22L16,13.9L18.2,21L12,16.3L5.8,21L8,13.9L2,9.2H9.8L12,2"/>
                  </svg>
                </div>
                {/* 진짜 이야기 툴팁 */}
                <div className="absolute top-[-70px] right-[80px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 transform group-hover:translate-y-2">
                  <div className="bg-gradient-to-br from-amber-600 via-red-600 to-orange-700 text-white px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(255,150,50,0.7)] border-2 border-yellow-400/50 relative overflow-hidden">
                    {/* 배경 효과 */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,50,0.3)_0%,transparent_60%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,100,50,0.2)_0%,transparent_60%)]"></div>
                    
                    {/* 텍스트 */}
                    <div className="flex flex-col items-center relative">
                      <div className="flex items-center justify-center mb-1">
                        <span className="animate-pulse mr-1">🤪</span>
                        <span className="text-white font-black text-base tracking-widest uppercase drop-shadow-[0_0_8px_rgba(255,200,0,0.7)]">FULL DEGEN</span>
                        <span className="animate-pulse ml-1">⚡</span>
                      </div>
                      <div className="text-sm font-black tracking-wider uppercase flex items-center justify-center">
                        <span className="text-white/80">WEN</span>
                        <span className="text-yellow-300 mx-1 animate-pulse">LAMBO?</span>
                        <span className="text-red-300 mx-1 rotate-3 inline-block">GMI!</span>
                      </div>
                      <div className="flex items-center text-[10px] font-black mt-1">
                        <span className="text-white/70">TRUST ME</span>
                        <span className="text-red-300 ml-1 animate-pulse">BRO!</span>
                      </div>
                      <div className="w-full h-0.5 mt-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent"></div>
                    </div>
                    
                    <div className="absolute right-6 bottom-[-6px] w-3 h-3 bg-orange-600 transform rotate-45 border-r-2 border-b-2 border-yellow-400/50"></div>
                  </div>
                </div>
                
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-red-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/50 hover:shadow-amber-500/80 transition-all duration-500 group-hover:scale-110 transform-gpu relative overflow-visible">
                  {/* 행성 표면 질감 */}
                  <div className="w-44 h-44 rounded-full bg-gradient-to-br from-red-500 to-yellow-600 flex items-center justify-center overflow-hidden absolute">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600/80 via-amber-500/80 to-red-700/80 backdrop-blur-sm relative">
                      {/* 밈스러운 행성 표면 디테일 */}
                      <div className="absolute top-6 left-7 w-12 h-12 rounded-full bg-orange-300/20 flex items-center justify-center overflow-hidden">
                        <span className="text-[10px] text-white/40 font-bold animate-spin-reverse" style={{animationDuration: '20s'}}>TO THE MOON</span>
                      </div>
                      <div className="absolute bottom-4 right-5 w-8 h-8 rounded-full bg-yellow-300/20 flex items-center justify-center">
                        <span className="text-[8px] text-white/40 rotate-45">HODL</span>
                      </div>
                      <div className="absolute top-14 right-10 w-6 h-6 rounded-full bg-red-300/20 flex items-center justify-center">
                        <span className="text-[6px] text-white/40 -rotate-12">WAGMI</span>
                      </div>
                      <div className="absolute bottom-14 left-12 w-10 h-10 rounded-full bg-amber-300/20 flex items-center justify-center">
                        <span className="text-[8px] text-white/40 animate-pulse">APE</span>
                      </div>
                      <div className="absolute top-[50%] right-[20%] w-7 h-7 rounded-full bg-orange-400/30 flex items-center justify-center">
                        <span className="text-[7px] text-white/40">FOMO</span>
                      </div>
                      <div className="absolute bottom-[30%] left-[25%] w-9 h-9 rounded-full bg-red-300/20 flex items-center justify-center">
                        <span className="text-[8px] text-white/40 rotate-[20deg]">ALPHA</span>
                      </div>
                      
                      {/* DEGEN 스타일 아이콘 - 세련된 SVG 아이콘 */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 opacity-50 animate-pulse blur-sm"></div>
                        <div className="animate-pulse z-10 flex flex-col items-center">
                          <div className="relative">
                            <svg className="w-14 h-14 text-amber-300 drop-shadow-[0_0_8px_rgba(255,150,0,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            <div className="absolute -top-1 -right-1 animate-[bounce_1.5s_ease-in-out_infinite_alternate]">
                              <svg className="w-7 h-7 text-red-400 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 행성 고리 - 속도 통일 */}
                  <div className="absolute w-[150%] h-14 border-4 border-amber-400/30 rounded-full rotate-[20deg] animate-spin" style={{animationDuration: '11s'}}></div>
                  <div className="absolute w-[170%] h-5 border border-yellow-300/30 rounded-full rotate-[10deg] animate-spin-reverse" style={{animationDuration: '13s'}}></div>
                  <div className="absolute w-[160%] h-10 border-2 border-red-500/20 rounded-full -rotate-[15deg] animate-spin-reverse" style={{animationDuration: '16s'}}></div>
                </div>
                <div className="flex flex-col items-center mt-6">
                  <span className="text-white text-2xl font-bold opacity-90 group-hover:opacity-100 group-hover:text-yellow-300 transition-all flex items-center">
                    The REAL Story
                    <span className="animate-bounce ml-2 relative">
                      <svg className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(255,200,0,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <div className="absolute -bottom-1 -right-1">
                        <svg className="w-4 h-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                    </span>
                  </span>
                  <div className="flex items-center">
                    <span className="text-yellow-300/70 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-pulse">DEGEN</span>
                    <span className="text-red-400/80 text-xs mt-1 mx-1 opacity-0 group-hover:opacity-100 transition-all duration-500">AF</span>
                    <span className="text-amber-300/70 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500">EDITION</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 로켓 버튼 - 화면 하단에 배치 */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-1000 animate-fadeIn">
          <Link href="/home">
            <div className="group cursor-pointer flex flex-col items-center relative">
              {/* 로켓 툴팁 - 더 오른쪽으로 이동 */}
              <div className="absolute right-[-350px] top-10 opacity-0 group-hover:opacity-100 transition-all duration-500 z-50 transform scale-0 group-hover:scale-100 origin-left">
                <div className="bg-gradient-to-r from-black via-red-800 to-black text-white px-6 py-4 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(255,30,30,0.8)] border-2 border-red-500/60 min-w-[230px] relative overflow-hidden">
                  {/* 배경 파티클 효과 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[10%] left-[10%] w-1 h-1 bg-red-500 rounded-full animate-ping" style={{animationDuration: '1.5s'}}></div>
                    <div className="absolute top-[30%] left-[80%] w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" style={{animationDuration: '2s'}}></div>
                    <div className="absolute top-[80%] left-[20%] w-1 h-1 bg-orange-500 rounded-full animate-ping" style={{animationDuration: '1.8s'}}></div>
                    <div className="absolute top-[60%] left-[70%] w-1 h-1 bg-yellow-500 rounded-full animate-ping" style={{animationDuration: '2.2s'}}></div>
                  </div>
                  
                  {/* 텍스트 */}
                  <div className="flex flex-col items-center justify-center relative">
                    <div className="flex items-center mb-1">
                      <span className="animate-pulse mr-2 text-base">🔥</span>
                      <span className="text-base font-black tracking-wider text-red-500 uppercase animate-[pulse_1s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(255,0,0,0.7)]">WHATEVER!</span>
                    </div>
                    <span className="font-black text-sm tracking-wider uppercase relative">
                      <span className="text-white/90">JUST SEND IT</span>
                      <span className="text-yellow-300 ml-1 animate-pulse"> TO THE MOON!</span>
                    </span>
                    <div className="w-full h-0.5 mt-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                  </div>
                  
                  {/* 화살표 팁 */}
                  <div className="absolute left-[-6px] top-[50%] transform -translate-y-1/2 w-3 h-3 bg-black rotate-45 border-l-2 border-t-2 border-red-500/60"></div>
                </div>
              </div>
              
              {/* 로켓 전체 컨테이너 */}
              <div className="relative w-32 h-60" style={{animation: 'rocketFloat 4s ease-in-out infinite'}}>
                {/* 불꽃 효과 - 로켓 아래에 배치 */}
                <div className="absolute top-[180px] inset-x-0 mx-auto z-0">
                  <div className="relative w-20 h-60 mx-auto">
                    {/* 주 불꽃 */}
                    <div className="absolute top-0 inset-x-0 transform -translate-x-1/2 w-15 h-70
                        bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent
                        rounded-t-full blur-[2px]" style={{animation: 'flameDown 0.7s ease-in-out infinite alternate'}}></div>
                    
                    {/* 중앙 불꽃 */}
                    <div className="absolute top-0 inset-x-0 transform -translate-x-1/2 w-12 h-75
                        bg-gradient-to-b from-yellow-200 via-orange-400 to-transparent
                        rounded-t-full blur-[3px]" style={{animation: 'flameDown 0.9s ease-in-out infinite alternate'}}></div>
                    
                    {/* 내부 밝은 불꽃 */}
                    <div className="absolute top-0 inset-x-4 transform -translate-x-1/2 w-12 h-60
                        bg-gradient-to-b from-white via-yellow-300 to-transparent
                        rounded-t-full blur-[1px]" style={{animation: 'flameDown 0.5s ease-in-out infinite alternate'}}></div>
                    
                    {/* 호버 시 불꽃 강화 */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-0
                        opacity-0 group-hover:opacity-100 group-hover:h-60
                        bg-gradient-to-b from-yellow-200 via-orange-500 to-transparent
                        rounded-t-full blur-[4px] transition-all duration-700"></div>
                    
                    {/* 불꽃 입자 효과 */}
                    <div className="absolute top-20 w-full h-60">
                      <div className="absolute top-0 left-[20%] w-3 h-3 rounded-full bg-orange-300 opacity-80 animate-fireParticle"></div>
                      <div className="absolute top-8 left-[70%] w-3 h-3 rounded-full bg-orange-300 opacity-80 animate-fireParticle" style={{animationDelay: '0.2s'}}></div>
                      <div className="absolute top-16 left-[40%] w-2 h-2 rounded-full bg-yellow-300 opacity-80 animate-fireParticle" style={{animationDelay: '0.4s'}}></div>
                      <div className="absolute top-12 left-[60%] w-2 h-2 rounded-full bg-yellow-300 opacity-80 animate-fireParticle" style={{animationDelay: '0.6s'}}></div>
                      <div className="absolute top-20 left-[30%] w-4 h-4 rounded-full bg-red-300 opacity-70 animate-fireParticle" style={{animationDelay: '0.1s'}}></div>
                      <div className="absolute top-24 left-[80%] w-2 h-2 rounded-full bg-red-300 opacity-70 animate-fireParticle" style={{animationDelay: '0.3s'}}></div>
                      
                      {/* 추가 파티클 */}
                      <div className="absolute top-4 left-[50%] w-2.5 h-2.5 rounded-full bg-yellow-200 opacity-80 animate-fireParticle" style={{animationDelay: '0.7s'}}></div>
                      <div className="absolute top-10 left-[15%] w-3 h-3 rounded-full bg-orange-200 opacity-80 animate-fireParticle" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute top-18 left-[85%] w-2 h-2 rounded-full bg-red-200 opacity-70 animate-fireParticle" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute top-26 left-[45%] w-3 h-3 rounded-full bg-yellow-300 opacity-80 animate-fireParticle" style={{animationDelay: '0.9s'}}></div>
                      <div className="absolute top-22 left-[25%] w-2 h-2 rounded-full bg-orange-300 opacity-70 animate-fireParticle" style={{animationDelay: '0.8s'}}></div>
                      <div className="absolute top-30 left-[55%] w-3 h-3 rounded-full bg-red-300 opacity-80 animate-fireParticle" style={{animationDelay: '1.1s'}}></div>
                      <div className="absolute top-28 left-[75%] w-2 h-2 rounded-full bg-yellow-200 opacity-80 animate-fireParticle" style={{animationDelay: '1.0s'}}></div>
                      <div className="absolute top-32 left-[35%] w-2.5 h-2.5 rounded-full bg-orange-200 opacity-70 animate-fireParticle" style={{animationDelay: '1.2s'}}></div>
                    </div>
                  </div>
                </div>

                {/* 빨간 뚜껑 - 몸체 밖에 배치 */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-12 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-t-full shadow-md z-20">
                  <div className="absolute left-1/2 top-1 transform -translate-x-1/2 w-4 h-1 bg-white/20 rounded-full"></div>
                  <div className="absolute bottom-0 inset-x-0 mx-auto w-6 h-0.5 bg-red-900/80 rounded-full"></div>
                </div>
                
                {/* 로켓 몸체 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-40 bg-gradient-to-b from-gray-100 to-gray-300 rounded-xl shadow-xl overflow-hidden group-hover:shadow-blue-500/30 transition-all duration-700 z-10" style={{clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'}}>
                  {/* 로켓 상단 노즈콘 */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-14 h-10 bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-full shadow-md"></div>
                  
                  {/* 로고 배경 */}
                  <div className="absolute top-4 inset-x-0 mx-auto w-18 h-18 rounded-full bg-gradient-to-br from-blue-600/40 to-purple-600/40 flex items-center justify-center shadow-inner animate-pulse" style={{animationDuration: '2s'}}>
                    {/* 로고 빛나는 효과 */}
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{animationDuration: '4s'}}></div>
                    
                    {/* 로고 빛나는 링 */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/60 animate-pulse" style={{animationDuration: '1.5s'}}></div>
                    
                    <Image 
                      src="/logo2.png" 
                      alt="TESOLA Logo" 
                      width={70} 
                      height={70}
                      className="object-contain z-10 relative animate-logo-pulse"
                    />
                  </div>
                  
                  {/* 로켓 창문 */}
                  <div className="absolute top-24 inset-x-0 mx-auto w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-200 shadow-inner group-hover:shadow-blue-400/50 transition-all duration-700">
                    <div className="absolute inset-1 rounded-full bg-blue-300/50"></div>
                    <div className="absolute inset-2 rounded-full bg-white/70 animate-pulse-slow"></div>
                  </div>
                  
                  {/* 로켓 본체 디테일 */}
                  <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-400/30"></div>
                  <div className="absolute top-32 left-0 w-full h-0.5 bg-gray-400/30"></div>
                  
                  {/* 반사광 효과 */}
                  <div className="absolute top-2 left-3 w-2 h-36 bg-white opacity-20 rounded-full blur-[1px] rotate-12"></div>
                  <div className="absolute top-2 right-3 w-1 h-30 bg-white opacity-15 rounded-full blur-[1px] -rotate-6"></div>
                </div>
                
                {/* 로켓 하단 엔진 부분 */}
                <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gradient-to-b from-gray-400 to-gray-600 rounded-b-lg shadow-md overflow-hidden z-20">
                  {/* 엔진 노즐 */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-700 rounded-b-lg shadow-inner"></div>
                </div>
                
                {/* 로켓 날개 - 메인 */}
                <div className="absolute top-28 left-0 w-8 h-20 bg-gradient-to-b from-red-400 to-red-600 skew-x-[30deg] rounded-md shadow-md group-hover:-translate-x-1 group-hover:rotate-2 transition-all duration-500 z-30">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/10 to-white/20"></div>
                  <div className="absolute top-2 left-1 w-1 h-14 bg-white opacity-20 rounded-full"></div>
                </div>
                <div className="absolute top-28 right-0 w-8 h-20 bg-gradient-to-b from-red-400 to-red-600 skew-x-[-30deg] rounded-md shadow-md group-hover:translate-x-1 group-hover:-rotate-2 transition-all duration-500 z-30">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/10 to-white/20"></div>
                  <div className="absolute top-2 right-1 w-1 h-14 bg-white opacity-20 rounded-full"></div>
                </div>
                
                {/* 보조 날개 */}
                <div className="absolute top-[120px] left-[2px] w-4 h-16 bg-gradient-to-b from-red-500 to-red-700 skew-x-[30deg] rounded-md shadow-sm group-hover:-translate-x-1 transition-all duration-500 z-40"></div>
                <div className="absolute top-[120px] right-[2px] w-4 h-16 bg-gradient-to-b from-red-500 to-red-700 skew-x-[-30deg] rounded-md shadow-sm group-hover:translate-x-1 transition-all duration-500 z-40"></div>
                
              </div>
              
              {/* "Enter" 텍스트 */}
              <div className="mt-32 text-center">
                <span className="text-white text-2xl font-bold opacity-90 group-hover:opacity-100 transition-all">Enter</span>
                <div className="text-gray-400/80 text-sm mt-1 group-hover:text-white/80 transition-all">Home Page</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes animateStar {
          0% { transform: translateY(0); }
          100% { transform: translateY(-2000px); }
        }
        
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes flameDown {
          0% { height: 70px; opacity: 0.8; transform: scaleY(0.9); }
          50% { height: 80px; opacity: 1; transform: scaleY(1.1); }
          100% { height: 75px; opacity: 0.9; transform: scaleY(1); }
        }
        
        @keyframes fireParticle {
          0% { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
          25% { opacity: 0.8; transform: translateY(15px) translateX(-5px) scale(0.9); }
          50% { opacity: 0.6; transform: translateY(30px) translateX(5px) scale(0.7); }
          75% { opacity: 0.3; transform: translateY(45px) translateX(-3px) scale(0.5); }
          100% { opacity: 0; transform: translateY(60px) translateX(2px) scale(0.2); }
        }
        
        @keyframes devPlanetEntry {
          0% { opacity: 0; transform: translate(400px, -200px) scale(0.2) rotate(20deg); }
          30% { opacity: 0.5; transform: translate(250px, -100px) scale(0.4) rotate(15deg); }
          60% { opacity: 0.8; transform: translate(150px, 80px) scale(0.7) rotate(5deg); }
          80% { opacity: 1; transform: translate(50px, 30px) scale(0.8) rotate(2deg); }
          100% { opacity: 1; transform: translate(0, 0) scale(0.85) rotate(0deg); }
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0px) scale(0.85); }
          50% { transform: translateY(-20px) scale(0.85); }
        }
        
        @keyframes planetEntryLeft {
          0% { opacity: 0; transform: translate(-300px, 100px) scale(0.3); }
          70% { opacity: 0.7; transform: translate(-50px, 30px) scale(0.7); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        
        @keyframes planetEntryRight {
          0% { opacity: 0; transform: translate(300px, 100px) scale(0.3); }
          70% { opacity: 0.7; transform: translate(50px, 30px) scale(0.7); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        
        .stars1 {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${generateStars(700)};
          animation: animateStar 50s linear infinite;
        }
        
        .stars1:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${generateStars(700)};
        }
        
        .stars2 {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${generateStars(200)};
          animation: animateStar 100s linear infinite;
        }
        
        .stars2:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${generateStars(200)};
        }
        
        .stars3 {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${generateStars(100)};
          animation: animateStar 150s linear infinite;
        }
        
        .stars3:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${generateStars(100)};
        }
      `}</style>
    </div>
  );
};

// 별 효과를 위한 랜덤 좌표 생성 함수
function generateStars(count) {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    stars += `${x}px ${y}px #fff${i % 5 === 0 ? ', ' : i === count - 1 ? '' : ', '}`;
  }
  return stars;
}

export default VideoLandingPage;