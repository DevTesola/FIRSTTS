import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ErrorBoundary from '../ErrorBoundary';

/**
 * 모바일 디바이스용 랜딩 페이지 컨텐츠 
 * - 행성 애니메이션 대신 간단한 정적 이미지와 UI 사용
 * - 성능과 배터리 소모 최적화
 * - 기존 랜딩 페이지와 동일한 배경 및 영상 컨테이너 유지
 */
const MobileLandingContent = () => {
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 w-full h-full overflow-x-hidden overflow-y-auto font-orbitron">
        {/* 배경 비디오 - SPACE.mp4 (원래 랜딩 페이지와 동일) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover filter brightness-100 contrast-110 saturate-105 opacity-100"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/SPACE.mp4" type="video/mp4" />
          </video>
        </div>
      
        {/* 별빛 효과 배경 - 단순화된 버전 */}
        <div className="absolute inset-0 overflow-hidden" style={{zIndex: 1, pointerEvents: 'none'}}>
          {/* 단순화된 별 배경 */}
          <div className="stars-simple"></div>
        </div>

        {/* 비디오 컨테이너 - 모바일용 간소화 버전 */}
        <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm z-20">
          {/* 스타일링된 비디오 프레임 - 간소화 버전 */}
          <div className="relative rounded-lg overflow-visible shadow-[0_0_30px_rgba(100,100,255,0.6)] border-2 border-gray-800/80">
            {/* 비디오 요소 - intro.mp4 */}
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
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                
                video.muted = false;
                video.volume = 1.0;
                video.currentTime = 0;
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log("Video playing with sound");
                      setVideoPlaying(true);
                    })
                    .catch(err => console.error("Video play failed:", err));
                }
              }}
            >
              <source src="/intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* 소리 재생 버튼 - 비디오가 재생 중이지 않을 때만 표시 */}
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 p-3 rounded-full pointer-events-auto cursor-pointer"
                  onClick={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    
                    video.muted = false;
                    video.volume = 1.0;
                    video.currentTime = 0;
                    const playPromise = video.play();
                    
                    if (playPromise !== undefined) {
                      playPromise
                        .then(() => {
                          console.log("Video playing with sound");
                          setVideoPlaying(true);
                        })
                        .catch(err => console.error("Video play failed:", err));
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                    CLICK FOR SOUND
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-start w-full min-h-screen pt-[58%] pb-8 px-4">
          {/* 로고는 이미 비디오 컨테이너 위에 있으므로 상단 로고/제목 생략 */}

          {/* 행성 정적 이미지들 - 크기 증가 및 간격 조정 */}
          <div className="flex justify-between w-full gap-4 mb-16 px-4">
            <Link href="/whitepaper">
              <div className="relative w-24 h-24 animate-[bounce_6s_ease-in-out_infinite]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 shadow-xl shadow-blue-500/30 flex items-center justify-center">
                  {/* 간단한 행성 질감 */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-700"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white relative z-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <p className="text-center text-white text-sm mt-2 font-medium">Whitepaper</p>
              </div>
            </Link>
            
            <Link href="/introduction">
              <div className="relative w-24 h-24 animate-[bounce_6s_ease-in-out_infinite_0.5s]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-yellow-500 shadow-xl shadow-amber-500/30 flex items-center justify-center">
                  {/* 간단한 행성 질감 */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-red-500 to-yellow-600"></div>
                  <svg className="w-10 h-10 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <p className="text-center text-white text-sm mt-2 font-medium">The REAL Story</p>
              </div>
            </Link>
            
            <Link href="/developer-space">
              <div className="relative w-24 h-24 animate-[bounce_6s_ease-in-out_infinite_1s]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-black to-gray-900 shadow-xl shadow-rose-500/30 flex items-center justify-center">
                  {/* 간단한 행성 질감 */}
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-900 to-black"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <p className="text-center text-white text-sm mt-2 font-medium">Dev's Space</p>
              </div>
            </Link>
          </div>

          {/* 메인 내비게이션 메뉴 */}
          <div className="flex flex-col space-y-3 w-full max-w-xs mb-6 mt-4">
            <Link href="/whitepaper">
              <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-center text-white font-semibold shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform">
                Whitepaper
              </div>
            </Link>

            <Link href="/introduction">
              <div className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-amber-500 rounded-lg text-center text-white font-semibold shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-transform">
                The REAL Story
              </div>
            </Link>

            <Link href="/developer-space">
              <div className="w-full py-3 px-4 bg-gradient-to-r from-gray-800 to-gray-900 border border-rose-500/30 rounded-lg text-center text-white font-semibold shadow-lg shadow-rose-500/20 transform hover:scale-105 transition-transform">
                Dev's Space
              </div>
            </Link>
          </div>

          {/* 홈 버튼 - 로켓 대신 간단한 버튼 */}
          <Link href="/home">
            <div className="relative w-full max-w-xs py-4 px-6 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg text-center text-white font-bold shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform mt-4">
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                <div className="absolute bottom-1 left-2 w-2 h-2 bg-white rounded-full animate-ping animation-delay-500"></div>
              </div>
              
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                </svg>
                Enter Home Page
              </div>
            </div>
          </Link>
        </div>
      
        <style jsx>{`
          /* 단순화된 별 애니메이션을 위한 스타일 */
          .stars-simple {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
              radial-gradient(1px 1px at 25% 25%, white 1px, transparent 0),
              radial-gradient(1px 1px at 50% 50%, white 1px, transparent 0),
              radial-gradient(1px 1px at 75% 75%, white 1px, transparent 0),
              radial-gradient(2px 2px at 10% 10%, white 1px, transparent 0),
              radial-gradient(2px 2px at 30% 70%, white 1px, transparent 0),
              radial-gradient(2px 2px at 70% 20%, white 1px, transparent 0),
              radial-gradient(2px 2px at 90% 90%, white 1px, transparent 0);
            background-size: 400px 400px;
            background-position: 0 0;
            animation: starsAnimation 300s linear infinite;
          }
          
          @keyframes starsAnimation {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-400px);
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default MobileLandingContent;