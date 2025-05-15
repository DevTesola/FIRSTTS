import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function PromotionGallery() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  
  // 비디오 정보 배열
  const videos = [
    {
      id: 0,
      title: "PLEASE CHARGE ME UP!!",
      embedId: "EjJCbHZ3b4U",
      description: "When your Tesla needs a boost but so does your wallet! 🔋💰 Watch how TESOLA tokens are juicing up both your EV and your crypto portfolio. Zero emissions, maximum gains!",
      tag: "MEME"
    },
    {
      id: 1,
      title: "TESOLA = ONLY VALUE",
      embedId: "yg31GPSXl6Y",
      description: "Other tokens go up, down, sideways... TESOLA only knows ONE direction: VALUE! 📈 See why diamond hands and Tesla owners are the ultimate power couple in crypto!",
      tag: "HODL"
    },
    {
      id: 2,
      title: "TESOLA POWER ON THE RIDE",
      embedId: "bEqVPv_hU10",
      description: "When you're earning tokens just by driving your Tesla! 🚗⚡ No mining rigs, just burning rubber! The ultimate ride-to-riches story that's electrifying the Solana community!",
      tag: "DRIVE2EARN"
    }
  ];

  return (
    <>
      <Head>
        <title>TESOLA - Promotion Gallery</title>
        <meta name="description" content="Explore videos showcasing the TESOLA ecosystem, NFT collections, and community." />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header with glowing effect */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-text-shimmer">
              Promotion Gallery
            </h1>
            <div className="h-1 w-40 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6 rounded-full"></div>
          </div>

          {/* Main video showcase */}
          {/* 모바일을 위한 스와이프 방식의 썸네일 선택 (작은 화면에만 보임) */}
          <div className="block lg:hidden mb-4 px-2">
            <h3 className="text-white font-semibold mb-2">Select Video:</h3>
            <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800 snap-x">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`flex-shrink-0 snap-center w-44 cursor-pointer transform transition-all duration-300 ${
                    selectedVideo === video.id 
                      ? "scale-[1.02] ring-2 ring-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                      : "opacity-80"
                  } rounded-lg overflow-hidden`}
                  onClick={() => setSelectedVideo(video.id)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={`https://img.youtube.com/vi/${video.embedId}/mqdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {selectedVideo === video.id && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs truncate">{video.title}</span>
                        <span className={`text-xs px-1.5 text-white rounded-sm ${
                          selectedVideo === video.id 
                            ? "bg-purple-600" 
                            : "bg-gray-700"
                        }`}>
                          {video.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mb-16">
            {/* Video selection sidebar - 데스크탑에서만 보임 */}
            <div className="hidden lg:flex lg:w-1/4 flex-col space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`flex flex-col cursor-pointer transform transition-all duration-300 hover:scale-[1.02] ${
                    selectedVideo === video.id 
                      ? "bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                      : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800"
                  } rounded-xl overflow-hidden border`}
                  onClick={() => setSelectedVideo(video.id)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={`https://img.youtube.com/vi/${video.embedId}/mqdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      selectedVideo === video.id ? "bg-black/30" : "bg-black/50"
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        selectedVideo === video.id 
                          ? "bg-purple-600 scale-110" 
                          : "bg-white/30 group-hover:bg-white/50"
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {selectedVideo === video.id && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1">
                        NOW PLAYING
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-semibold ${selectedVideo === video.id ? "text-purple-300" : "text-white"}`}>
                        {video.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedVideo === video.id 
                          ? "bg-purple-600 text-white" 
                          : "bg-gray-700 text-gray-300"
                      }`}>
                        {video.tag}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20">
                <p className="text-gray-300 text-sm">
                  Explore our featured videos showcasing the TESOLA ecosystem, innovative technology, and vibrant community.
                </p>
              </div>
            </div>
            
            {/* Featured video */}
            <div className="lg:w-3/4 bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-2xl overflow-hidden shadow-xl border border-purple-500/30">
              <div className="w-full aspect-video max-h-[600px]">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videos[selectedVideo].embedId}`}
                  title={videos[selectedVideo].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white">{videos[selectedVideo].title}</h2>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {videos[selectedVideo].tag}
                  </span>
                </div>
                <p className="text-gray-300">{videos[selectedVideo].description}</p>
              </div>
            </div>
          </div>
          
          {/* Extra promotion card - 모바일 최적화 */}
          <div className="mb-16 bg-gradient-to-br from-blue-900/40 to-violet-900/40 rounded-xl p-5 sm:p-6 border border-blue-500/30 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-3">Get More Updates</h3>
            <p className="text-gray-300 mb-4">Follow our social channels for updates and events.</p>
            
            {/* 모바일에서는 아이콘 중심 디자인, 데스크탑에서는 텍스트 포함 */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {/* 모바일 버전 (작은 화면) */}
              <a 
                href="https://twitter.com/TESLAINSOLANA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block sm:hidden bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full text-center transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              
              <a 
                href="https://www.youtube.com/@TE-SOLA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block sm:hidden bg-red-600 hover:bg-red-700 text-white p-3 rounded-full text-center transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              
              <a 
                href="https://t.me/TESLAINSOLANA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block sm:hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-full text-center transition-colors"
                aria-label="Telegram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </a>
              
              {/* 데스크탑 버전 (큰 화면) */}
              <a 
                href="https://twitter.com/TESLAINSOLANA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
                Twitter
              </a>
              
              <a 
                href="https://www.youtube.com/@TE-SOLA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden sm:flex bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
              
              <a 
                href="https://t.me/TESLAINSOLANA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden sm:flex bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Telegram
              </a>
            </div>
          </div>

          {/* Featured highlights section */}
          <div className="mb-16">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Featured Highlights
              </h2>
              <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-2 sm:mt-3 rounded-full"></div>
            </div>
            
            {/* 모바일에서는 스와이프 가능한 카드로 변경 */}
            <div className="overflow-x-auto pb-4 flex md:hidden space-x-4 snap-x">
              {/* Highlight 1 - 모바일 */}
              <div className="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-blue-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-blue-500/30 shadow-lg">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="bg-blue-600/40 w-8 h-8 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="bg-blue-900/60 text-blue-300 text-xs px-2 py-0.5 rounded-full">Technology</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Solana-Powered Ecosystem</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Our platform leverages Solana's lightning-fast blockchain for minimal fees.
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      65,000+ TPS throughput
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sub-second finality
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Energy-efficient consensus
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Highlight 2 - 모바일 */}
              <div className="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-purple-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-purple-500/30 shadow-lg">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="bg-purple-600/40 w-8 h-8 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="bg-purple-900/60 text-purple-300 text-xs px-2 py-0.5 rounded-full">Tokenomics</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Sustainable Tokenomics</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Our tokenomics model ensures long-term value and growth.
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Strategic token burn
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Long-term vesting schedules
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Multi-phase rewards
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Highlight 3 - 모바일 */}
              <div className="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-pink-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-pink-500/30 shadow-lg">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="bg-pink-600/40 w-8 h-8 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="bg-pink-900/60 text-pink-300 text-xs px-2 py-0.5 rounded-full">Community</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Community Governance</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Our DAO empowers holders with decentralized governance.
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Proposal & voting system
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Treasury management
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Community initiatives
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 태블릿과 데스크탑용 그리드 레이아웃 */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {/* Highlight 1 - 데스크탑 */}
              <div className="bg-gradient-to-br from-blue-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-blue-500/30 shadow-lg transform transition hover:scale-[1.02] hover:shadow-blue-500/20">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-blue-600/40 w-10 h-10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="bg-blue-900/60 text-blue-300 text-xs px-3 py-1 rounded-full">Technology</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Solana-Powered Ecosystem</h3>
                  <p className="text-gray-300 mb-4">
                    Our platform leverages Solana's lightning-fast blockchain for minimal fees and maximum scalability.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      65,000+ TPS throughput
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sub-second transaction finality
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Energy-efficient consensus
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Highlight 2 - 데스크탑 */}
              <div className="bg-gradient-to-br from-purple-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-purple-500/30 shadow-lg transform transition hover:scale-[1.02] hover:shadow-purple-500/20">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-purple-600/40 w-10 h-10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="bg-purple-900/60 text-purple-300 text-xs px-3 py-1 rounded-full">Tokenomics</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Sustainable Tokenomics</h3>
                  <p className="text-gray-300 mb-4">
                    Our carefully designed tokenomics model ensures long-term value and sustainable growth.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Strategic token burn mechanism
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Long-term vesting schedules
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Multi-phase reward distribution
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Highlight 3 - 데스크탑 */}
              <div className="bg-gradient-to-br from-pink-900/30 to-gray-900/30 rounded-xl overflow-hidden border border-pink-500/30 shadow-lg transform transition hover:scale-[1.02] hover:shadow-pink-500/20">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-pink-600/40 w-10 h-10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="bg-pink-900/60 text-pink-300 text-xs px-3 py-1 rounded-full">Community</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Community Governance</h3>
                  <p className="text-gray-300 mb-4">
                    Our DAO empowers token holders to guide project development through decentralized governance.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Proposal submission & voting
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Treasury management
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Community-driven initiatives
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action - 모바일 최적화 */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-6 sm:p-8 border border-purple-500/30 shadow-xl text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Join the TESOLA Revolution?</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto">
              Be part of our growing ecosystem of NFT collectors and token holders building the future of Drive-to-Earn.
            </p>
            
            {/* 모바일에서는 전체 너비 버튼 */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
              <a href="/presale" className="block w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-pink-500/30">
                PRESALE JOIN 🚀
              </a>
              
              {/* 모바일에서 메인 버튼 아래에 작은 버튼 추가 */}
              <a href="/staking" className="block w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/30">
                STAKE NFTs 💎
              </a>
            </div>
            
            {/* 모바일에서만 표시되는 작은 추가 정보 */}
            <div className="mt-4 text-xs text-gray-400 sm:hidden">
              스와이프하여 더 많은 비디오를 확인하세요 👆
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}