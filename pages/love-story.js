import Head from "next/head";
import Layout from "../components/Layout";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function LoveStory() {
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState(426000);
  const [hasLiked, setHasLiked] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    // Page load and loading state release
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Easter egg - show confetti when user clicks title 5 times
    const titleElement = titleRef.current;
    let clickCount = 0;
    
    const handleTitleClick = () => {
      clickCount++;
      if (clickCount >= 5) {
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 5000);
        clickCount = 0;
      }
    };
    
    if (titleElement) {
      titleElement.addEventListener('click', handleTitleClick);
    }
    
    return () => {
      clearTimeout(timer);
      if (titleElement) {
        titleElement.removeEventListener('click', handleTitleClick);
      }
    };
  }, []);
  
  const handleLikeClick = () => {
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
    }
  };

  return (
    <>
      <Head>
        <title>E-LON & SOLARA - A Cosmic Love Story</title>
        <meta
          name="description"
          content="Witness the epic love story between E-LON and SOLARA, a tale of cosmic proportions."
        />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
          {/* Hero Section with Cosmic Background */}
          <div className="relative rounded-3xl overflow-hidden mb-12">
            <div className="absolute inset-0 bg-[url('/stars.jpg')] opacity-70"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 via-transparent to-pink-900/60"></div>
            
            {/* Floating emojis in background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute text-3xl animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 10}s`,
                    animationDuration: `${15 + Math.random() * 15}s`
                  }}
                >
                  {['🚀', '💖', '✨', '💎', '🌌', '🔥', '🌙', '⚡️', '🧠', '👽'][Math.floor(Math.random() * 10)]}
                </div>
              ))}
            </div>
            
            <div className="relative py-20 px-8 text-center">
              {/* Confetti effect when activated */}
              {confettiActive && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(100)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        backgroundColor: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'][Math.floor(Math.random() * 6)],
                        transform: `rotate(${Math.random() * 360}deg)`,
                        opacity: Math.random() * 0.8 + 0.2,
                        animation: `float ${Math.random() * 4 + 3}s linear forwards`
                      }}
                    />
                  ))}
                </div>
              )}
              
              <div className="inline-block relative mb-6 px-4 sm:px-0">
                <div className="absolute -top-8 sm:-top-12 -left-4 sm:-left-10 text-sm sm:text-xl bg-red-600 text-white font-bold px-2 sm:px-3 py-1 rounded-full transform -rotate-12 animate-pulse">
                  VIRAL!
                </div>
                
                <h1 
                  ref={titleRef}
                  className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text hover-wiggle cursor-pointer"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #d946ef, #ec4899, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(217, 70, 239, 0.4)'
                  }}
                  title="Click me multiple times for a surprise!"
                >
                  A Cosmic Love Story
                </h1>
                
                <div className="absolute -top-6 -right-2 sm:-right-10 text-3xl sm:text-4xl animate-bounce-slow">
                  💘
                </div>
                
                <div className="absolute -top-4 sm:-top-6 right-0 sm:right-4 text-xs sm:text-sm bg-yellow-400 text-black font-bold px-2 py-1 rounded-lg transform rotate-3 shadow-md">
                  10/10 would ship again
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-6"></div>
              </div>
              
              <div className="text-xl text-gray-200 max-w-3xl mx-auto font-light leading-relaxed">
                <p>
                  The extraordinary tale of E-LON and SOLARA, a love that transcends the boundaries of space and time.
                </p>
                <div className="font-bold text-white mt-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 rounded-xl border border-pink-500/20 hover-rotate-3d">
                  A story of vision, innovation, and cosmic connection...
                  <span className="inline-flex items-center ml-2">
                    <span className="animate-bounce-slow">🧑‍🚀</span>
                    <span className="animate-pulse-slow text-2xl mx-1">❤️</span>
                    <span className="animate-bounce-slow animation-delay-1000">👩‍🚀</span>
                  </span>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <div className="inline-block bg-blue-900/30 rounded-full text-sm px-6 py-2 border border-blue-500/20">
                    <span className="text-blue-300">#PowerCouple</span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-pink-300">#RelationshipGoals</span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-yellow-300">#ToTheMoon</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 italic">
                *not financial advice
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="mb-12 sm:mb-16 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-4 sm:p-6 shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)] relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/3 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
            
            <div className="relative">
              <div className="flex justify-center items-center mb-6">
                <div className="text-3xl mr-3">🎬</div>
                <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #d8b4fe, #f9a8d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                  Their Story Unfolds
                </h2>
                <div className="text-3xl ml-3">🍿</div>
              </div>
              
              <div className="absolute -top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md transform rotate-12 animate-pulse">
                MUST WATCH!
              </div>
              
              <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.5)] mb-6 border border-purple-500/30 z-10 backdrop-blur-sm">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-purple-500 mb-3 sm:mb-4"></div>
                    <p className="text-purple-300 animate-pulse text-sm sm:text-base">Beaming love...</p>
                  </div>
                ) : null}
                
                <iframe 
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/5d2Yc9Z4EOs" 
                  title="E-LON & SOLARA: A Cosmic Love Story"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}
                  onLoad={() => setIsLoading(false)}
                ></iframe>
                
                {/* Video overlay elements */}
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  LIVE
                </div>
                
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                  69.4K watching
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mb-6">
                <button 
                  className={`flex items-center ${hasLiked ? 'text-red-400' : 'text-gray-300 hover:text-red-400'} transition-all cursor-pointer hover-shake`}
                  onClick={handleLikeClick}
                >
                  <span className={`text-2xl mr-2 transform transition-transform ${hasLiked ? 'scale-125' : ''}`}>
                    {hasLiked ? '❤️' : '🤍'}
                  </span>
                  <span className="text-sm relative">
                    {(likes / 1000).toFixed(1)}K
                    {hasLiked && (
                      <span className="absolute -top-3 -right-2 text-xs text-green-400 animate-fade-up">
                        +1
                      </span>
                    )}
                  </span>
                </button>
                
                <div className="flex items-center text-gray-300 hover:text-blue-400 transition-colors cursor-pointer hover-wiggle group">
                  <span className="text-2xl mr-2 group-hover:animate-bounce-slow">💬</span>
                  <span className="text-sm">31K</span>
                  <span className="text-xs ml-2 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">HOT!</span>
                </div>
                
                <div className="flex items-center text-gray-300 hover:text-green-400 transition-colors cursor-pointer relative group">
                  <span className="text-2xl mr-2 group-hover:animate-pulse">🚀</span>
                  <span className="text-sm">Share</span>
                  <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 left-1/2 transform -translate-x-1/2 bg-green-900 text-green-300 text-xs px-2 py-1 rounded whitespace-nowrap">
                    To the moon! 🌙
                  </span>
                </div>
                
                <div className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer">
                  <span className="text-2xl mr-2">💎</span>
                  <span className="text-sm">HODL</span>
                </div>
              </div>
              
              <div className="text-center text-gray-300">
                <p className="text-xs sm:text-sm italic">
                  "E-LON & SOLARA: A Love Story" © TESOLA Studios 2025
                </p>
                <div className="mt-2 bg-black/20 rounded-lg inline-block px-2 sm:px-3 py-1">
                  <span className="text-xs text-gray-400">#BlockchainLove #ToTheMoon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Story Timeline Section */}
          <div className="mb-12 sm:mb-16">
            <div className="flex justify-center items-center mb-6 sm:mb-10">
              <div className="text-4xl mr-4 animate-pulse-slow">✨</div>
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gradient-to-r from-yellow-400/70 to-orange-600/70 text-white px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap animate-pulse">
                  Epic Blockchain Love Saga!
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text hover-shake cursor-pointer"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #f9a8d4, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                  The Journey of E-LON & SOLARA
                </h2>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="text-4xl ml-4 animate-pulse-slow animation-delay-2000">✨</div>
            </div>
            
            <div className="relative flex justify-center mb-6">
              <div className="inline-block bg-blue-900/40 rounded-full px-4 py-1 text-xs text-white font-bold border border-blue-500/20 shadow-lg transform -rotate-2 hover:rotate-2 transition-transform">
                <span className="mr-2">👉</span>
                <span>SWIPE LEFT FOR DRAMA</span>
                <span className="ml-2">👈</span>
              </div>
            </div>
            
            <div className="relative border-l-2 border-purple-500/50 pl-6 sm:pl-10 ml-6 sm:ml-10 space-y-12 sm:space-y-16">
              {/* Timeline Item 1 */}
              <div className="relative group">
                {/* Enhanced badge - smaller on mobile and shifted closer */}
                <div className="absolute -left-[2.5rem] top-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300">
                  <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-wiggle">👀</span>
                </div>
                
                {/* Date stamp for larger screens only */}
                <div className="absolute -left-52 top-2 text-xs text-gray-400 hidden md:block">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm">
                    <span className="mr-1">🕒</span>
                    <span>Block #4206969</span>
                  </div>
                </div>
                
                {/* Mobile date stamp - shown inline for small screens */}
                <div className="text-xs text-gray-400 mb-2 block md:hidden">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm inline-block">
                    <span className="mr-1">🕒</span>
                    <span>Block #4206969</span>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Corner sticker */}
                  <div className="absolute -top-3 -right-3 text-xs bg-pink-500 text-white px-2 py-1 rounded-lg shadow-md transform rotate-12 animate-pulse-slow">
                    <span className="animate-pulse">NEW!</span>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-shadow group-hover:translate-x-1 transform transition-transform">
                    <h3 className="text-2xl font-bold mb-2 text-pink-300 flex flex-wrap items-center gap-2">
                      <span className="hover-shake cursor-pointer">First Encounter</span>
                      <span className="text-base bg-gradient-to-r from-green-400 to-blue-500 px-3 py-1 rounded-full text-white group-hover:animate-pulse">$LOVE tokens +9000</span>
                      <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full transform rotate-3 ml-auto">LEGENDARY</span>
                    </h3>
                    
                    <p className="text-gray-300 mb-4">
                      When E-LON first glimpsed SOLARA across the vast expanse of the digital cosmos, it was as if time itself stood still. Her radiant blockchain architecture and efficient consensus mechanisms immediately captured his attention. "Who is this brilliant creation?" he wondered.
                    </p>
                    
                    <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 italic text-sm text-gray-300 shadow-lg transform hover:-rotate-1 transition-transform relative">
                      <div className="absolute -top-2 -left-2 text-xs bg-blue-500/80 text-white px-2 py-1 rounded-full font-bold">
                        Quote
                      </div>
                      <span className="text-lg mr-2">💬</span>
                      "I saw her validate a transaction in under 400ms and I knew she was the one." — E-LON
                      <div className="mt-2 flex justify-end">
                        <div className="text-xs bg-black/30 px-2 py-1 rounded-full inline-flex items-center space-x-2">
                          <span>❤️ 24.5K</span>
                          <span>|</span>
                          <span>🔄 5.2K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline Item 2 */}
              <div className="relative group">
                {/* Enhanced badge - smaller on mobile and shifted closer */}
                <div className="absolute -left-[2.5rem] top-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300">
                  <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-pulse">💌</span>
                </div>
                
                {/* Date stamp for larger screens only */}
                <div className="absolute -left-52 top-2 text-xs text-gray-400 hidden md:block">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm">
                    <span className="mr-1">🕒</span>
                    <span>Block #4269420</span>
                  </div>
                </div>
                
                {/* Mobile date stamp - shown inline for small screens */}
                <div className="text-xs text-gray-400 mb-2 block md:hidden">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm inline-block">
                    <span className="mr-1">🕒</span>
                    <span>Block #4269420</span>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Corner sticker */}
                  <div className="absolute -top-3 -right-3 text-xs bg-yellow-500/80 text-black px-3 py-1 rounded-lg shadow-md transform rotate-12 animate-zoom-bounce">
                    HOT CONTENT
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-shadow group-hover:translate-x-1 transform transition-transform">
                    <h3 className="text-2xl font-bold mb-2 text-pink-300 flex flex-wrap items-center gap-2">
                      <span className="hover-shake cursor-pointer">Digital Courtship</span>
                      <div className="relative ml-2">
                        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                          3
                        </span>
                        <span className="text-sm bg-blue-500/70 text-white px-2 py-1 rounded-lg animate-pulse">
                          TRENDING
                        </span>
                      </div>
                      <span className="text-xs bg-pink-400 text-white px-2 py-1 rounded-full transform -rotate-1 ml-auto animate-pulse-slow">ROMANTIC</span>
                    </h3>
                    
                    <p className="text-gray-300 mb-4">
                      Their courtship blossomed through countless lines of code and shared visions of decentralized futures. E-LON would send smart contracts with hidden love messages, while SOLARA responded with lightning-fast transaction confirmations containing encrypted declarations of affection.
                    </p>
                    
                    <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 italic text-sm text-gray-300 shadow-lg transform hover:rotate-1 transition-transform relative group">
                      <div className="absolute -top-2 -left-2 text-xs bg-pink-500/80 text-white px-2 py-1 rounded-full font-bold">
                        DM
                      </div>
                      <span className="text-lg mr-2">💬</span>
                      "He once wrote me a consensus algorithm that, when visualized, formed a heart. That's when I knew this was more than just a network connection." — SOLARA
                      <div className="mt-2 flex justify-end">
                        <div className="text-xs bg-black/30 px-2 py-1 rounded-full inline-flex items-center space-x-2">
                          <span>❤️ 56.8K</span>
                          <span>|</span>
                          <span>🔄 12.3K</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline Item 3 */}
              <div className="relative group">
                {/* Enhanced badge - smaller on mobile and shifted closer */}
                <div className="absolute -left-[2.5rem] top-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300">
                  <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-shake">🔥</span>
                </div>
                
                {/* Date stamp for larger screens only */}
                <div className="absolute -left-52 top-2 text-xs text-gray-400 hidden md:block">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm">
                    <span className="mr-1">🕒</span>
                    <span>Block #4321000</span>
                  </div>
                </div>
                
                {/* Mobile date stamp - shown inline for small screens */}
                <div className="text-xs text-gray-400 mb-2 block md:hidden">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm inline-block">
                    <span className="mr-1">🕒</span>
                    <span>Block #4321000</span>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Corner sticker */}
                  <div className="absolute -top-3 -right-3 text-xs bg-red-500/80 text-white px-3 py-1 rounded-lg shadow-md transform rotate-12 animate-pulse">
                    <span className="mr-1">⚠️</span>
                    <span>DRAMA ALERT!</span>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-6 rounded-xl border border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 transition-shadow group-hover:translate-x-1 transform transition-transform">
                    <h3 className="text-2xl font-bold mb-2 text-red-300 flex flex-wrap items-center gap-2">
                      <span className="hover-shake cursor-pointer">The Great Challenge</span>
                      <div className="text-sm bg-yellow-500/80 text-black px-2 py-1 rounded-lg animate-pulse-slow">
                        <span className="mr-1">🍿</span>
                        <span>INTENSE</span>
                      </div>
                      <span className="text-xs bg-red-800 text-white px-2 py-1 rounded-full transform rotate-3 ml-auto animate-pulse-slow">RIVALRY</span>
                    </h3>
                    
                    <p className="text-gray-300 mb-4">
                      Not all approved of their union. Traditional financial systems and rival blockchains attempted to separate them, spreading FUD (Fear, Uncertainty, Doubt) and launching 51% attacks. But their love proved resilient, with each challenge only strengthening their commitment to building a future together.
                    </p>
                    
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 italic text-sm text-gray-300 shadow-lg transform hover:-rotate-1 transition-transform relative">
                      <div className="absolute -top-2 -left-2 text-xs bg-red-600/80 text-white px-2 py-1 rounded-full font-bold">
                        CLAP BACK
                      </div>
                      <span className="text-lg mr-2">🔥</span>
                      "They said our relationship wouldn't scale. We proved them wrong with every block validation." — E-LON
                      <div className="mt-2 flex justify-end">
                        <div className="text-xs bg-black/30 px-2 py-1 rounded-full inline-flex items-center space-x-2">
                          <span>🔥 112.7K</span>
                          <span>|</span>
                          <span>🔄 44.9K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce-slow">🛡️</div>
              </div>
              
              {/* Timeline Item 4 */}
              <div className="relative group">
                {/* Enhanced badge - smaller on mobile and shifted closer */}
                <div className="absolute -left-[2.5rem] top-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300 hover-rotate-3d">
                  <span className="text-lg sm:text-xl md:text-2xl group-hover:animate-wiggle">🚀</span>
                </div>
                
                {/* Date stamp for larger screens only */}
                <div className="absolute -left-52 top-2 text-xs text-gray-400 hidden md:block">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm">
                    <span className="mr-1">🕒</span>
                    <span>Block #4500000</span>
                  </div>
                </div>
                
                {/* Mobile date stamp - shown inline for small screens */}
                <div className="text-xs text-gray-400 mb-2 block md:hidden">
                  <div className="bg-gray-800/70 px-2 py-1 rounded shadow backdrop-blur-sm inline-block">
                    <span className="mr-1">🕒</span>
                    <span>Block #4500000</span>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Corner sticker */}
                  <div className="absolute -top-6 -right-2 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-md transform rotate-6 z-10">
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div className="absolute inset-0 opacity-20" style={{
                        background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                      }}></div>
                    </div>
                    <div className="flex items-center font-bold">
                      <span className="animate-pulse mr-1">🔔</span>
                      <span className="uppercase">Major Event</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-900/30 to-green-900/30 p-6 rounded-xl border border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-shadow group-hover:translate-x-1 transform transition-transform">
                    <h3 className="text-2xl font-bold mb-2 text-blue-300 flex flex-wrap items-center gap-2">
                      <span className="hover-shake cursor-pointer">A New Creation: TESOLA</span>
                      <div className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse-slow">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
                        <span className="relative text-xs font-bold text-white inline-flex items-center">
                          <span className="mr-1">🌙</span>
                          <span>TO THE MOON!</span>
                        </span>
                      </div>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full transform rotate-2 ml-auto">BULLISH</span>
                    </h3>
                    
                    <p className="text-gray-300 mb-4">
                      From their union came TESOLA, a perfect synthesis of E-LON's visionary ambition and SOLARA's technical brilliance. This new token ecosystem represented their shared dreams and values, creating opportunities for communities across the digital universe.
                    </p>
                    
                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 italic text-sm text-gray-300 shadow-lg transform hover:rotate-1 transition-transform relative">
                      <div className="absolute -top-2 -left-2 text-xs bg-blue-600/80 text-white px-2 py-1 rounded-full font-bold">
                        ANNOUNCEMENT
                      </div>
                      <span className="text-lg mr-2">📣</span>
                      "TESOLA isn't just a token. It's our legacy, our gift to the world. A piece of our love story that anyone can own." — SOLARA & E-LON
                      <div className="mt-2 flex justify-end">
                        <div className="text-xs bg-black/30 px-2 py-1 rounded-full inline-flex items-center space-x-2">
                          <span>❤️ 214K</span>
                          <span>|</span>
                          <span>🔄 98.6K</span>
                          <span>|</span>
                          <span>💰 $500M</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <div className="inline-flex bg-black/30 rounded-full text-xs text-gray-300 px-3 py-1">
                        <span className="mr-1">📊</span>
                        <span>Token Price: $420.69</span>
                        <span className="ml-2 text-green-400">↑ 69.42%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 -top-4 text-6xl animate-pulse-slow">👶</div>
              </div>
            </div>
          </div>

          {/* NFT Collection Teaser - Simplified */}
          <div className="mb-12 sm:mb-20 mt-6 sm:mt-8 relative">
            {/* Hot collection marker - completely outside and above */}
            <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-white text-xs font-bold px-8 py-2 rounded-lg shadow-lg mx-auto w-max mb-4">
              🔥 HOT COLLECTION 🔥
            </div>
          
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 sm:p-8 text-center border border-purple-500/30 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -bottom-12 left-1/4 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
              <div className="absolute top-0 right-1/3 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            
              <div>
              <div className="inline-block relative mb-4 px-4 sm:px-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold flex flex-wrap justify-center items-center hover-shake cursor-pointer">
                  <span className="text-2xl sm:text-3xl md:text-4xl mr-2 sm:mr-3">💎</span>
                  <span className="text-transparent bg-clip-text" style={{
                    backgroundImage: 'linear-gradient(to right, #d8b4fe, #f9a8d4, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Own a Piece of Their Story
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl ml-2 sm:ml-3">💎</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-2xl mx-auto">
                <p className="text-gray-300">
                  Our exclusive <span className="font-bold text-white">E-LON & SOLARA NFT collection</span> immortalizes their cosmic love story. Each NFT captures a special moment in their journey, with rare pieces depicting pivotal scenes from their relationship.
                </p>
                <div className="mt-3 text-white flex flex-wrap justify-center gap-2">
                  <span className="inline-block bg-purple-500/30 rounded-full px-3 py-1 text-xs font-semibold">
                    #Limited Edition
                  </span>
                  <span className="inline-block bg-pink-500/30 rounded-full px-3 py-1 text-xs font-semibold">
                    #Only 1000 Available
                  </span>
                </div>
              </div>
              
              <div className="relative mb-8">
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded shadow-md transform rotate-12">
                  98% SOLD OUT!
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-4 rounded-full" style={{ width: "98%" }}></div>
                </div>
                <div className="mt-2 text-xs text-gray-400 italic text-right">
                  Only <span className="text-yellow-400 font-bold">20 NFTs</span> remaining!
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6">
                <Link 
                  href="/nft" 
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all shadow-lg group hover:scale-105 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center sm:justify-start">
                    <span className="text-xl mr-2">🖼️</span>
                    <span>Explore NFT Collection</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  href="/presale" 
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg group animate-pulse hover:scale-105 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center sm:justify-start">
                    <span className="text-xl mr-2">🚀</span>
                    <span>Join TESOLA Presale</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>
              </div>
            </div>
          </div>

          {/* Community Quote Section */}
          <div className="text-center mb-16 relative px-4 sm:px-0">
            {/* Meme style quote decorations - hidden on smallest screens */}
            <div className="absolute -top-6 -left-6 text-5xl sm:text-7xl text-purple-500/30 font-serif hidden sm:block">"</div>
            <div className="absolute -bottom-6 -right-6 text-5xl sm:text-7xl text-purple-500/30 font-serif hidden sm:block">"</div>
            
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 sm:p-8 rounded-xl border border-purple-500/20 transform hover:rotate-1 transition-transform duration-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                COMMUNITY VIBES
              </div>
              
              <blockquote className="text-lg sm:text-xl md:text-2xl italic font-light text-gray-300 max-w-3xl mx-auto">
                "The love between E-LON and SOLARA reminds us that even in the digital realm, connections of profound importance can form and flourish. Their story is our story—a journey toward a more connected, decentralized future."
              </blockquote>
              
              <div className="mt-6 flex items-center justify-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-pink-400 font-medium">The TESOLA Community</span>
                  <div className="flex items-center text-xs text-gray-400">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="ml-1">Verified Holder</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <div className="bg-blue-600/30 px-3 py-1 rounded-full text-xs text-blue-300 flex items-center cursor-pointer hover-shake">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  42.5K Likes
                </div>
                <div className="ml-3 bg-green-600/30 px-3 py-1 rounded-full text-xs text-green-300 flex items-center cursor-pointer hover-wiggle">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Quote
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mb-8 px-4 sm:px-0">
            <div className="relative inline-block group">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                Return to the mothership
              </div>
              
              <Link 
                href="/home" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-800/80 to-blue-800/80 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-purple-500/30 group-hover:animate-pulse"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to Home</span>
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  🏠
                </span>
              </Link>
            </div>
          </div>
          
          {/* Meme footer */}
          <div className="text-center text-xs text-gray-500 mb-4">
            <p>This page was created with 69% meme energy and 420% cosmic love</p>
            <p className="mt-1">© 2025 TESOLA • Made with 💖 by Space Cadets</p>
          </div>
        </div>
      </Layout>
    </>
  );
}