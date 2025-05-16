import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ErrorBoundary from '../ErrorBoundary';

/**
 * 태블릿 디바이스용 랜딩 페이지 컨텐츠
 * - 행성 애니메이션을 단순화하고 크기를 줄임
 * - 모바일보다 더 많은 요소를 표시하지만 PC보다는 제한적
 * - 기존 랜딩 페이지와 동일한 배경 및 영상 컨테이너 유지
 */
const TabletLandingContent = () => {
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 w-full h-full overflow-hidden font-orbitron">
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
      
        {/* 별빛 효과 배경 - 최적화된 버전 */}
        <div className="fixed inset-0 overflow-hidden" style={{zIndex: 1, pointerEvents: 'none'}}>
          <div className="star-field">
            <div className="stars1-tablet"></div>
            <div className="stars2-tablet"></div>
          </div>
        </div>

        {/* 비디오 컨테이너 - 태블릿용 중간 버전 */}
        <div className="absolute top-[22%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl z-20">
          {/* 스타일링된 비디오 프레임 - 태블릿용 버전 */}
          <div className="relative rounded-lg overflow-visible shadow-[0_0_40px_rgba(100,100,255,0.7)] border-3 border-gray-800/80">
            {/* 단순화된 프레임 상단 */}
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 z-20 border-b border-blue-500/30 flex items-center justify-between px-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            
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
            
            {/* 소리 재생 버튼 - 태블릿용 스타일, 비디오가 재생 중이지 않을 때만 표시 */}
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-gradient-to-r from-black/60 to-gray-800/60 p-4 rounded-full pointer-events-auto cursor-pointer border-2 border-blue-500/30 shadow-lg shadow-blue-500/20 animate-pulse"
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded text-xs text-white whitespace-nowrap border border-blue-500/30">
                    CLICK FOR SOUND
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 행성 그룹 - 태블릿용 크기 조정 */}
        <div className="absolute inset-0 z-10 w-full h-full">
          {/* 첫 번째 행성 - 왼쪽 */}
          <div className="absolute left-[10%] top-[45%] z-20">
            <Link href="/whitepaper">
              <div className="group flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-500 relative">
                  {/* 행성 표면 질감 */}
                  <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-blue-500 to-purple-700 absolute">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/80 via-purple-500/80 to-blue-800/80"></div>
                  </div>
                  
                  {/* 간단한 고리 효과 */}
                  <div className="absolute w-[180%] h-8 border-4 border-blue-400/30 rounded-full -rotate-12 animate-spin-slow"></div>
                  
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white relative z-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <span className="text-white text-lg font-bold mt-2">Whitepaper</span>
              </div>
            </Link>
          </div>
          
          {/* 두 번째 행성 - 오른쪽 상단 */}
          <div className="absolute right-[10%] top-[45%] z-20">
            <Link href="/introduction">
              <div className="group flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-500 relative">
                  {/* 행성 표면 질감 */}
                  <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-red-500 to-yellow-600 absolute">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600/80 via-amber-500/80 to-red-700/80"></div>
                  </div>
                  
                  {/* 간단한 고리 효과 */}
                  <div className="absolute w-[170%] h-8 border-4 border-yellow-400/30 rounded-full rotate-12 animate-spin-slow"></div>
                  
                  <svg className="w-10 h-10 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <span className="text-white text-lg font-bold mt-2">The REAL Story</span>
              </div>
            </Link>
          </div>
          
          {/* 세 번째 행성 - 하단 중앙 */}
          <div className="absolute left-[42%] bottom-[15%] z-20">
            <Link href="/developer-space">
              <div className="group flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-500 relative">
                  {/* 행성 표면 질감 */}
                  <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-gray-900 to-black absolute">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-black/80 via-gray-900/80 to-gray-800/80"></div>
                  </div>
                  
                  {/* 간단한 고리 효과 */}
                  <div className="absolute w-[185%] h-8 border-4 border-rose-500/30 rounded-full rotate-6 animate-spin-slow"></div>
                  
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <span className="text-white text-lg font-bold mt-2">Dev's Space</span>
              </div>
            </Link>
          </div>
        </div>

        {/* 간소화된 로켓 - 태블릿용 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-xs mx-auto">
          <Link href="/home">
            <div className="flex flex-col items-center group">
              <div className="relative w-28 h-36">
                {/* 단순화된 로켓 */}
                <div className="absolute w-24 h-36 left-1/2 transform -translate-x-1/2 group-hover:translate-y-[-5px] transition-transform duration-300">
                  {/* 로켓 몸체 */}
                  <div className="absolute w-16 h-28 bg-gradient-to-b from-gray-100 to-gray-300 rounded-xl shadow-xl overflow-hidden left-1/2 transform -translate-x-1/2 z-10">
                    {/* 로켓 상단 */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-6 bg-red-500 rounded-t-full"></div>
                    
                    {/* 로켓 창문 */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-2 border-blue-200"></div>
                    
                    {/* 로고 */}
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-8 h-8">
                      <Image 
                        src="/logo2.png" 
                        alt="SOLARA Logo" 
                        width={32} 
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* 로켓 날개 */}
                  <div className="absolute top-12 left-1 w-4 h-10 bg-red-500 skew-x-[30deg] rounded-md z-20"></div>
                  <div className="absolute top-12 right-1 w-4 h-10 bg-red-500 skew-x-[-30deg] rounded-md z-20"></div>
                  
                  {/* 로켓 하단 */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gray-400 rounded-lg z-10"></div>
                  
                  {/* 간단한 불꽃 효과 */}
                  <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 rounded-b-full blur-sm animate-pulse z-0"></div>
                </div>
              </div>
              
              <span className="text-white text-xl font-bold">Enter Home Page</span>
            </div>
          </Link>
        </div>

        <style jsx>{`
          /* 태블릿용 최적화된 별 애니메이션 */
          .star-field {
            position: fixed;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
          
          .stars1-tablet {
            width: 1px;
            height: 1px;
            background: transparent;
            box-shadow: 
              25px 30px 1px #fff,
              100px 80px 1px #fff,
              180px 130px 1px #fff,
              255px 40px 1px #fff,
              300px 190px 1px #fff,
              375px 90px 1px #fff,
              450px 165px 1px #fff,
              515px 25px 1px #fff,
              590px 180px 1px #fff,
              670px 60px 1px #fff,
              750px 145px 1px #fff,
              820px 30px 1px #fff,
              900px 170px 1px #fff,
              935px 75px 1px #fff,
              1000px 120px 1px #fff;
            animation: animateStar 300s linear infinite;
            will-change: transform;
          }
          
          .stars2-tablet {
            width: 2px;
            height: 2px;
            background: transparent;
            box-shadow: 
              15px 15px 2px #fff,
              85px 70px 2px #fff,
              150px 155px 2px #fff,
              230px 50px 2px #fff,
              280px 170px 2px #fff,
              320px 110px 2px #fff,
              400px 140px 2px #fff,
              480px 40px 2px #fff,
              550px 160px 2px #fff,
              630px 80px 2px #fff,
              720px 130px 2px #fff,
              800px 50px 2px #fff,
              870px 180px 2px #fff,
              975px 90px 2px #fff;
            animation: animateStar 400s linear infinite;
            will-change: transform;
          }
          
          @keyframes animateStar {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-2000px);
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default TabletLandingContent;