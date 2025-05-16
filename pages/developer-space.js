import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function DeveloperSpace() {
  const [isPlaying, setIsPlaying] = useState(true); // Set to true for autoplay
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTapeId, setCurrentTapeId] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  
  // Handle video play/pause
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle audio play/pause for a specific tape
  const toggleAudio = (tapeId) => {
    if (audioRef.current) {
      if (audioPlaying && currentTapeId === tapeId) {
        audioRef.current.pause();
        setAudioPlaying(false);
        setCurrentTapeId(null);
        setShowLyrics(false);
      } else {
        // If a different tape is already playing, stop it first
        if (audioPlaying) {
          audioRef.current.pause();
        }
        
        // Set the src based on the tape ID
        audioRef.current.src = `/sounds/${tapeId}.mp3`;
        audioRef.current.volume = volume;
        
        // Play the audio
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setAudioPlaying(true);
            setCurrentTapeId(tapeId);
            
            // Show lyrics if it's the devtape
            if (tapeId === 'devtape') {
              setShowLyrics(true);
            } else {
              setShowLyrics(false);
            }
          }).catch(error => {
            console.error("Error playing audio:", error);
          });
        }
      }
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  // The available tapes
  const tapes = [
    { id: 'devtape', name: "Dev's TAPE (TESOLA Anthem)", active: true },
    { id: 'futuretape1', name: "Tesola Dreams", active: false },
    { id: 'futuretape2', name: "Crypto Beats", active: false },
    { id: 'futuretape3', name: "Solana Vibes", active: false },
  ];

  // Lyrics data
  const tesolaLyrics = [
    { title: "Verse 1", lines: [
      "Yeah, I drive a Tesla, sun out, wheels glide",
      "Not just a car, it's a dream I ride",
      "I want the stock up, and the fam up too",
      "From the leather to the logo — we pushin' through",
      "",
      "I ain't just checkin' charts, I'm watchin' Sol flow",
      "Liquidity's risin', and I want us to grow",
      "I'm a Solana head, I bleed that chain",
      "Fast like the block, built for no pain"
    ]},
    { title: "Verse 2", lines: [
      "Used to lie awake, dreams in my mind",
      "Meme coin thoughts I could never unwind",
      "But then I stayed up, code in the night",
      "No fame, just flame — my hands on the light",
      "",
      "One-man dev, with AI in tow",
      "You love AI coins? I built one, yo",
      "Logic and beats, a late-night birth",
      "TESOLA dropped while the world touched earth"
    ]},
    { title: "Hook", lines: [
      "I ain't chasin' the bag, I'm chasin' the flame",
      "It's bigger than cash, it's buildin' a name",
      "Drive to Earn — this ain't no game",
      "It's vision, it's motion, the TESOLA lane"
    ]},
    { title: "Verse 3", lines: [
      "In silence I build, just me and this chain",
      "No shortcuts, no lies, no hidden gain",
      "No team stash, no secret remain",
      "Just me and a meme — drivin' through rain"
    ]},
    { title: "Verse 4", lines: [
      "They told me it's crazy, \"you makin' a coin?\"",
      "I told 'em it's movement, not somethin' to join",
      "It's gas and belief, it's realer than tweets",
      "It's torque on the chain, it's code in the streets",
      "",
      "This ain't no copy, no trend I just chase",
      "I built it for drivers, for speed, for grace",
      "For Solana dreamers, for Tesla in sun",
      "For those who got vision when others got none"
    ]},
    { title: "Bridge", lines: [
      "Yeah, I worked in the dark with no one to see",
      "No likes, no funds, no friends but me",
      "But I had this thought — this dream to code",
      "To give wheels to a meme, and a chain to hold",
      "",
      "The world went quiet, but my keys clicked loud",
      "I built this with faith, without any crowd",
      "They call it a coin, I call it a sign",
      "That you can drive your purpose and rewrite time"
    ]},
    { title: "Hook 2", lines: [
      "I ain't chasing the bag, I'm chasing the spark",
      "This ain't for the whales, this is built for the park",
      "Drive to Earn — it's more than a name",
      "It's the ride of our lives, it's the TESOLA flame"
    ]}
  ];

  // Effect to handle video autoplay
  useEffect(() => {
    // Start video automatically
    const videoElement = videoRef.current;
    if (videoElement) {
      // Wait a short moment before playing to ensure it's fully loaded
      const timer = setTimeout(() => {
        videoElement.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error("Error autoplaying video:", err);
            setIsPlaying(false);
          });
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, []);

  return (
    <>
      <Head>
        <title>Developer's Space - TESOLA</title>
        <meta
          name="description"
          content="Behind the scenes of TESOLA - the developer's space where magic happens."
        />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12 text-white">
          {/* Hero Section */}
          <div className="text-center mb-12 px-4 sm:px-0">
            <div className="inline-block relative">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text animate-pulse-slow"
                style={{
                  backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6, #d946ef)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                }}>
                Developer's Space
              </h1>
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-8 text-2xl sm:text-3xl animate-bounce-slow">
                🧑‍💻
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-6"></div>
            </div>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-light mb-4">
              Welcome to the secret lab where TESOLA magic happens. Witness the reality behind the blockchain innovation.
            </p>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:flex md:flex-wrap justify-center gap-2 mb-3">
              <span className="text-xs sm:text-sm bg-gradient-to-r from-blue-900/40 to-blue-700/40 px-2 sm:px-3 py-1 rounded-full border border-blue-500/30 flex items-center hover-shake cursor-pointer">
                <span className="mr-1">🚗</span>
                <span>TESLA MAXI SINCE 2016</span>
              </span>
              
              <span className="text-xs sm:text-sm bg-gradient-to-r from-purple-900/40 to-purple-700/40 px-2 sm:px-3 py-1 rounded-full border border-purple-500/30 flex items-center hover-wiggle cursor-pointer">
                <span className="mr-1">⚡</span>
                <span>SOLANA BELIEVER</span>
              </span>
              
              <span className="text-xs sm:text-sm bg-gradient-to-r from-green-900/40 to-blue-900/40 px-2 sm:px-3 py-1 rounded-full border border-green-500/30 flex items-center hover-shake cursor-pointer">
                <span className="mr-1">💻</span>
                <span>10+ YRS DEV (Trust me bro)</span>
              </span>
              
              <span className="text-xs sm:text-sm bg-gradient-to-r from-red-900/40 to-yellow-900/40 px-2 sm:px-3 py-1 rounded-full border border-red-500/30 flex items-center hover-wiggle cursor-pointer">
                <span className="mr-1">🧠</span>
                <span>TSLA HODLER SINCE 2018</span>
              </span>
            </div>
            
            <div className="inline-block bg-gradient-to-r from-gray-900/50 to-gray-800/50 p-2 rounded text-xs sm:text-sm text-gray-400 border border-gray-700/50 relative hover-rotate-3d max-w-xs sm:max-w-none mx-auto">
              <span className="absolute -top-2 -right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">OFFICIAL</span>
              "Coding by day, driving my Tesla by night. This is the way." 
            </div>
          </div>

          {/* Video Section - Meme-styled */}
          <div className="mb-16 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -bottom-12 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-1/3 w-32 h-32 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            
            {/* Meme-style stickers */}
            <div className="absolute top-5 left-5 bg-blue-500 text-white text-xs px-3 py-1 font-bold rounded shadow-md transform -rotate-12 animate-pulse z-10">
              LIVE CODING
            </div>
            <div className="absolute top-1/3 right-5 bg-green-500 text-white text-xs px-3 py-1 font-bold rounded shadow-md transform rotate-12 z-10">
              BUGS INCOMING
            </div>
            <div className="absolute bottom-10 left-10 bg-purple-500 text-white text-xs px-3 py-1 font-bold rounded shadow-md transform rotate-6 z-10">
              PRO HACKER
            </div>
            
            <div className="relative">
              <div className="flex flex-wrap justify-center items-center mb-6">
                <div className="text-2xl sm:text-3xl mr-2 sm:mr-3">👨‍💻</div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                  The Reality of Coding
                </h2>
                <div className="text-2xl sm:text-3xl ml-2 sm:ml-3">💻</div>
              </div>
              
              <div className="absolute -top-2 right-2 sm:-top-4 sm:right-4 bg-red-600 text-white text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg shadow-md transform rotate-12 animate-pulse">
                REAL FOOTAGE!
              </div>
              
              <div className="relative rounded-xl overflow-hidden shadow-[0_0_25px_rgba(59,130,246,0.5)] mb-6 border border-blue-500/30 backdrop-blur-sm group">
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={toggleVideo}
                >
                  <div className="text-5xl transform transition-transform group-hover:scale-150">
                    {isPlaying ? "⏸️" : "▶️"}
                  </div>
                </div>
                
                <video 
                  ref={videoRef}
                  className="w-full rounded-xl"
                  poster="/video-poster.png"
                  onClick={toggleVideo}
                  loop
                  muted={true} // Always muted so we can have audio playing
                  autoPlay
                  playsInline
                >
                  <source src="/dev.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Video overlay elements */}
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  RECORDING
                </div>
                
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                  9999+ watching
                </div>
              </div>
              
              {/* Control panel */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
                <button 
                  onClick={toggleVideo}
                  className="flex items-center bg-blue-900/30 hover:bg-blue-700/50 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-md"
                >
                  <span className="text-lg mr-1 sm:mr-2">{isPlaying ? "⏸️" : "▶️"}</span>
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </button>
                
                <div className="flex items-center text-gray-300 cursor-pointer">
                  <span className="text-lg mr-1 sm:mr-2">⏱️</span>
                  <span className="text-xs sm:text-sm">03:42 / 05:17</span>
                </div>
                
                <div className="flex items-center text-gray-300 cursor-pointer hover:text-blue-400 transition-colors">
                  <span className="text-lg mr-1 sm:mr-2">🔄</span>
                  <span className="text-xs sm:text-sm">Loop</span>
                </div>
              </div>
              
              <div className="text-center text-gray-300">
                <p className="text-sm italic mb-2">
                  "This is what I actually do all day. The blockchain stuff is just a side effect." — TESOLA Dev
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="bg-red-900/30 text-red-300 text-xs px-3 py-1 rounded-full border border-red-500/20 flex items-center">
                    <span className="mr-1">☕</span>
                    <span>Powered by 42 coffees</span>
                  </span>
                  <span className="bg-green-900/30 text-green-300 text-xs px-3 py-1 rounded-full border border-green-500/20 flex items-center">
                    <span className="mr-1">⚡</span>
                    <span>Charging at 420%</span>
                  </span>
                  <span className="bg-yellow-900/30 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/20 flex items-center">
                    <span className="mr-1">🚗</span>
                    <span>Model Y in background</span>
                  </span>
                </div>
                
                <div className="mt-4 mx-auto max-w-md bg-black/30 rounded-lg p-2 border border-gray-700/30">
                  <div className="text-xs font-mono flex items-center">
                    <span className="text-green-400 mr-2">$</span>
                    <span className="text-white animate-pulse-slow">npm run build-tesola-to-the-moon</span>
                    <span className="text-pink-400 ml-2 animate-pulse">|</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lyrics Modal */}
          {showLyrics && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="lyrics-modal" role="dialog" aria-modal="true">
              <div className="flex items-center justify-center min-h-screen p-4">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity"></div>
                
                <div className="relative bg-gradient-to-br from-blue-900/90 to-purple-900/90 rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-blue-500/30 transform transition-all">
                  {/* Close button */}
                  <button 
                    onClick={() => setShowLyrics(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none"
                    aria-label="Close lyrics"
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #60a5fa, #a78bfa, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                      TESOLA - Dev's Mixtape
                    </h3>
                    <div className="mt-1 text-sm text-gray-400">Now Playing - 5:23</div>
                    
                    {/* Animated equalizer */}
                    <div className="flex items-center justify-center h-6 mt-3 gap-1">
                      <div className="w-1 bg-blue-500 equalizer-bar-1" style={{height: '15%'}}></div>
                      <div className="w-1 bg-purple-500 equalizer-bar-2" style={{height: '30%'}}></div>
                      <div className="w-1 bg-pink-500 equalizer-bar-3" style={{height: '20%'}}></div>
                      <div className="w-1 bg-blue-500 equalizer-bar-4" style={{height: '25%'}}></div>
                      <div className="w-1 bg-purple-500 equalizer-bar-1" style={{height: '15%'}}></div>
                      <div className="w-1 bg-pink-500 equalizer-bar-2" style={{height: '30%'}}></div>
                      <div className="w-1 bg-blue-500 equalizer-bar-3" style={{height: '20%'}}></div>
                      <div className="w-1 bg-purple-500 equalizer-bar-4" style={{height: '25%'}}></div>
                    </div>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
                    {tesolaLyrics.map((section, idx) => (
                      <div key={idx} className="lyrics-section">
                        <h4 className="text-lg font-bold text-pink-400 mb-2">{section.title}</h4>
                        <div className="text-gray-300 space-y-1">
                          {section.lines.map((line, lineIdx) => (
                            <p key={lineIdx} className={line === "" ? "h-4" : ""}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <button 
                      onClick={() => setShowLyrics(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Continue Listening
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Tapes Section */}
          <div className="mb-16 px-4 sm:px-0">
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <div className="absolute -top-6 sm:-top-8 right-0 transform rotate-12 bg-gradient-to-r from-blue-600 to-pink-600 text-white text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg shadow-md animate-pulse-slow z-10">
                  NEW DROP!
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #60a5fa, #a78bfa, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                  Developer's Mixtapes
                </h2>
              </div>
              <p className="text-gray-300 mt-4 text-sm sm:text-base">
                Listen to the beats that power our development process
              </p>
              <div className="mt-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg inline-block px-3 sm:px-4 py-1 border border-blue-500/20">
                <span className="text-xs sm:text-sm text-blue-300 animate-pulse-slow">First Tape: TESOLA Anthem — The Dev's Journey</span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <span className="bg-blue-900/50 px-2 py-1 rounded">NFT HOLDERS EXCLUSIVE</span> • DRM-protected audio streaming
              </div>
            </div>
            
            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              className="hidden" 
              onEnded={() => {
                setAudioPlaying(false);
                setCurrentTapeId(null);
                setShowLyrics(false);
              }}
              controlsList="nodownload" 
            />
            
            {/* Cassette Tapes UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {tapes.map((tape) => (
                <div 
                  key={tape.id}
                  className={`relative bg-gradient-to-r ${
                    tape.active 
                      ? "from-blue-900/40 to-purple-900/40 border-blue-500/30" 
                      : "from-gray-800/40 to-gray-700/40 border-gray-600/30"
                  } rounded-xl p-4 border shadow-lg overflow-hidden ${
                    !tape.active && "opacity-60"
                  }`}
                >
                  {/* Tape visualization */}
                  <div className="flex items-center mb-4">
                    <div className={`w-20 h-14 ${
                      tape.active ? "bg-blue-900/60" : "bg-gray-900/60"
                    } rounded-md border ${
                      tape.active ? "border-blue-500/50" : "border-gray-600/50"
                    } relative flex-shrink-0 mr-4`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-12 h-8">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-4 h-4 rounded-full ${
                              currentTapeId === tape.id && audioPlaying
                                ? "border-2 border-white animate-spin"
                                : tape.active ? "border border-blue-400" : "border border-gray-500"
                            }`}></div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-1 border-t border-dashed border-gray-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className={`text-xl font-bold ${
                        tape.active ? "text-white" : "text-gray-400"
                      } mb-1`}>
                        {tape.name}
                      </h3>
                      <div className="text-xs text-gray-400 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          currentTapeId === tape.id && audioPlaying
                            ? "bg-green-500"
                            : tape.active ? "bg-blue-500" : "bg-gray-500"
                        }`}></span>
                        <span>
                          {currentTapeId === tape.id && audioPlaying
                            ? "Now Playing"
                            : tape.active ? "Ready to Play" : "Coming Soon"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tape controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button 
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tape.active 
                            ? currentTapeId === tape.id && audioPlaying
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-blue-600 hover:bg-blue-700" 
                            : "bg-gray-700 cursor-not-allowed"
                        } transition-colors`}
                        onClick={() => tape.active && toggleAudio(tape.id)}
                        disabled={!tape.active}
                      >
                        <span className="text-lg">
                          {currentTapeId === tape.id && audioPlaying ? "⏹️" : "▶️"}
                        </span>
                      </button>
                      
                      {tape.active && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-400 text-xs">🔈</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 appearance-none bg-gray-600 rounded-full focus:outline-none"
                            style={{
                              backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
                            }}
                          />
                          <span className="text-gray-400 text-xs">🔊</span>
                          
                          {/* Lyrics button - only for devtape and only when playing */}
                          {tape.id === 'devtape' && currentTapeId === tape.id && audioPlaying && (
                            <button 
                              onClick={() => setShowLyrics(true)}
                              className="ml-2 bg-pink-600 hover:bg-pink-700 text-white text-xs rounded-full px-2 py-0.5 transition-colors inline-flex items-center"
                            >
                              <span className="mr-1">🎵</span>
                              <span>Lyrics</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {tape.active ? "2025 OST" : "Coming Soon"}
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  {!tape.active && (
                    <div className="absolute -bottom-2 -right-2 transform rotate-12 bg-gray-900 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700">
                      Locked
                    </div>
                  )}
                  
                  {currentTapeId === tape.id && audioPlaying && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Developer's Quote */}
          <div className="text-center mb-16 relative px-4 sm:px-0">
            {/* Quote marks - hidden on smallest screens */}
            <div className="absolute -top-6 -left-6 text-5xl sm:text-7xl text-blue-500/30 font-serif hidden sm:block">"</div>
            <div className="absolute -bottom-6 -right-6 text-5xl sm:text-7xl text-blue-500/30 font-serif hidden sm:block">"</div>
            
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 sm:p-8 rounded-xl border border-blue-500/20 transform hover:rotate-1 transition-transform duration-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                DEVELOPER'S WISDOM
              </div>
              
              <blockquote className="text-lg sm:text-xl md:text-2xl italic font-light text-gray-300 max-w-3xl mx-auto">
                "The difference between a good blockchain project and a great one is not just the code, but the love and memes we put into it along the way."
              </blockquote>
              
              <div className="mt-6 flex items-center justify-center">
                <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center border-2 border-blue-400">
                  <span className="text-2xl">👨‍💻</span>
                </div>
                <div className="ml-3 flex flex-col items-start">
                  <div className="flex items-center">
                    <span className="text-blue-400 font-medium">TESOLA Lead Developer</span>
                    <span className="ml-2 bg-green-700/60 text-xs px-2 py-0.5 rounded text-white">VERIFIED</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="ml-1">Blockchain Wizard & Tesla Model Y Owner</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs bg-blue-900/40 px-2 py-0.5 rounded-full text-blue-300 border border-blue-500/20">Sol Maxi</span>
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-300 border border-gray-600/20">10+ YOE</span>
                    <span className="text-xs bg-pink-900/40 px-2 py-0.5 rounded-full text-pink-300 border border-pink-500/20">Meme Lord</span>
                    <span className="text-xs bg-green-900/40 px-2 py-0.5 rounded-full text-green-300 border border-green-500/20">TSL Hodler</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <div className="bg-blue-600/30 px-3 py-1 rounded-full text-xs text-blue-300 flex items-center cursor-pointer hover:bg-blue-600/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  42.5K Likes
                </div>
              </div>
            </div>
          </div>

          {/* DEV's Dream Section */}
          <div className="mb-16 overflow-hidden relative">
            <div className="absolute -top-12 right-1/4 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            
            {/* Fun ASCII Art Banner */}
            <div className="text-center mb-8">
              <pre className="text-xs md:text-sm lg:text-base font-mono text-blue-400 inline-block transform hover:scale-110 transition-transform duration-300 hover:text-green-400 cursor-pointer mx-auto">
{`                                                      
  _____  ______      _______ _____  _____  ______          __  __ 
 |  __ \\|  ____|    |__   __|  __ \\|  __ \\|  ____|   /\\   |  \\/  |
 | |  | | |__  __   __ | |  | |  | | |__) | |__     /  \\  | \\  / |
 | |  | |  __| \\ \\ / / | |  | |  | |  _  /|  __|   / /\\ \\ | |\\/| |
 | |__| | |____ \\ V /  | |  | |__| | | \\ \\| |____ / ____ \\| |  | |
 |_____/|______| \\_/   |_|  |_____/|_|  \\_\\______/_/    \\_\\_|  |_|
                                                                  `}
              </pre>
            </div>
            
            {/* Section Title with Blinking Effect */}
            <div className="text-center mb-8 relative">
              <div className="inline-block">
                <div className="absolute -top-10 right-0 transform rotate-12 bg-red-600 text-white text-xs px-3 py-1 rounded-lg shadow-md animate-pulse z-10">
                  SUPER SECRET CONFESSION
                </div>
                <h2 className="text-5xl font-extrabold text-transparent bg-clip-text animate-text-glow"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #ff4d4d, #f9cb28, #ff4d4d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255, 77, 77, 0.4)'
                  }}>
                  DEV'S ULTIMATE DREAM
                </h2>
                <span className="ml-2 inline-block animate-bounce-slow text-3xl">🔥</span>
                <span className="ml-1 inline-block animate-pulse text-3xl">💯</span>
              </div>
            </div>
            
            {/* Dream Note with Handwritten Style */}
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-gray-900/70 to-gray-800/70 p-6 rounded-xl border-2 border-red-500/30 shadow-[0_0_25px_rgba(255,77,77,0.2)] mb-12 transform -rotate-1 hover:rotate-1 transition-transform">
              <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg transform rotate-12 animate-pulse-slow">TOP SECRET</div>
              <div className="absolute -bottom-3 -left-3 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full transform -rotate-12">CONFIDENTIAL</div>
              
              <div className="font-handwriting text-xl text-gray-200 leading-relaxed relative z-10">
                <div className="mb-4 text-2xl font-bold text-red-400">Dear Future Solana Maxis,</div>
                <p className="mb-4">
                  <span className="text-yellow-400 font-bold">Confession time...</span> I'm not just a developer. I'm a <span className="underline decoration-wavy decoration-pink-500">MEGA-FAN</span> on a <span className="text-green-400 font-bold">MISSION</span>. I drive a Tesla, I stack Solana, and I <span className="text-red-400 font-bold">WILL</span> make DRIVE TO EARN a reality!
                </p>
                <p className="mb-4">
                  My ultimate dream isn't just coding. It's seeing TESOLA tokens <span className="text-blue-400 font-bold">ACTUALLY COMMERCIALIZED</span> into the real world! I want to create a system where <span className="underline decoration-dotted decoration-green-400">EVERY TESLA OWNER</span> earns crypto while driving! This isn't just a project - it's my LIFE'S PURPOSE!!
                </p>
                <p className="mb-4">
                  And our NFTs? They <span className="text-purple-400 font-bold text-2xl">WILL</span> become the ultimate symbol of Solana Maximalists everywhere. I swear on my entire collection of Tesla merch. <span className="underline decoration-wavy decoration-yellow-500">WE. WILL. SUCCEED.</span>
                </p>
                <div className="text-right mt-6 text-gray-400">
                  <span className="block">Obsessively yours,</span>
                  <span className="block text-xl font-bold text-blue-400">The Dev 👨‍💻</span>
                  <span className="block text-xs text-gray-500">(Tesla Model Y owner since 2020, Solana maxi since genesis)</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4 transform rotate-45 opacity-20">
                <div className="h-24 w-24 border-4 border-red-500 rounded-full flex items-center justify-center">
                  <span className="text-red-500 font-bold">APPROVED</span>
                </div>
              </div>
            </div>
            
            {/* Vision Roadmap - Comic Style */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl p-6 border border-blue-500/30 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-xl"></div>
                
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text inline-block"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #d946ef)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                    THE TESOLA MANIFESTO 
                  </h3>
                  <span className="ml-2 text-2xl">🚀</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Step 1 */}
                  <div className="flex items-start bg-gradient-to-r from-blue-900/20 to-blue-800/20 p-4 rounded-lg border border-blue-500/20 transform hover:scale-102 transition-transform relative overflow-hidden">
                    <div className="text-4xl mr-4 text-blue-500 font-comic">1</div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-bold text-blue-400 flex items-center">
                        <span className="mr-2">Make TESOLA the icon of Solana Maxis & Tesla Fans</span>
                        <span className="text-2xl">🏆</span>
                      </h4>
                      <p className="text-gray-300 text-sm mt-2">
                        TESOLA NFTs will be the ULTIMATE flex for Solana maximalists everywhere! If you're a true Tesla + Solana believer, our NFTs are the ONLY way to prove your dedication. Every serious Solana fan will NEED one!
                      </p>
                      <div className="mt-2 bg-black/30 px-3 py-1 rounded-lg inline-block">
                        <span className="text-xs text-yellow-400">STATUS: IN PROGRESS 🚧</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex items-start bg-gradient-to-r from-green-900/20 to-green-800/20 p-4 rounded-lg border border-green-500/20 transform hover:scale-102 transition-transform relative overflow-hidden">
                    <div className="text-4xl mr-4 text-green-500 font-comic">2</div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-bold text-green-400 flex items-center">
                        <span className="mr-2">Commercialize DRIVE TO EARN (For REAL!)</span>
                        <span className="text-2xl">💸</span>
                      </h4>
                      <p className="text-gray-300 text-sm mt-2">
                        This is NON-NEGOTIABLE!! I'm coding day and night to create an actual Tesla integration where owners EARN REAL TOKENS while driving. Not just a concept - a FULLY FUNCTIONAL ecosystem with Tesla APIs! The first 10,000 Tesla owners will be our pioneers!
                      </p>
                      <div className="mt-2 bg-black/30 px-3 py-1 rounded-lg inline-block">
                        <span className="text-xs text-yellow-400">STATUS: OBSESSIVELY CODING 🔥</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex items-start bg-gradient-to-r from-red-900/20 to-red-800/20 p-4 rounded-lg border border-red-500/20 transform hover:scale-102 transition-transform relative overflow-hidden">
                    <div className="text-4xl mr-4 text-red-500 font-comic">3</div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-bold text-red-400 flex items-center">
                        <span className="mr-2">Create a TESOLA EMPIRE (No less!)</span>
                        <span className="text-2xl">👑</span>
                      </h4>
                      <p className="text-gray-300 text-sm mt-2">
                        World domination through Tesla-Solana synergy! Our community will be LEGENDARY. Every Tesla supercharger = TESOLA meetup spot. Every Solana conference = TESOLA showcase. We'll create an UNBREAKABLE alliance between EV owners and crypto natives!
                      </p>
                      <div className="mt-2 bg-black/30 px-3 py-1 rounded-lg inline-block">
                        <span className="text-xs text-yellow-400">STATUS: INEVITABLE 💯</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dev's Oath */}
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <div className="relative inline-block">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 -rotate-6 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse z-10">
                  PINKY PROMISE
                </div>
                
                <div className="bg-gradient-to-r from-red-900/30 to-yellow-900/30 p-6 rounded-xl border-2 border-yellow-500/30 shadow-lg relative">
                  <div className="absolute -right-3 -bottom-3 h-16 w-16 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
                  
                  <h3 className="text-2xl font-bold text-yellow-400 mb-3">DEV'S UNBREAKABLE OATH</h3>
                  
                  <p className="text-xl text-gray-200 font-handwriting italic">
                    I will make DRIVE TO EARN a reality or I will sell my Tesla! <span className="text-red-400">NO MATTER WHAT IT TAKES!</span>
                  </p>
                  
                  <div className="mt-4 flex justify-center">
                    <div className="w-32 h-32 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/favicon.ico" alt="TESOLA Logo" className="h-16 w-16 animate-spin-slow" />
                      </div>
                      <div className="absolute inset-0 border-4 border-dashed border-yellow-500/50 rounded-full animate-reverse-spin"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Community Call to Action */}
            <div className="text-center">
              <div className="inline-block bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-red-900/40 px-6 py-4 rounded-xl border border-blue-500/30 shadow-lg transform hover:scale-105 transition-transform">
                <p className="text-xl text-white font-bold mb-2">
                  JOIN THE REVOLUTION! <span className="text-yellow-400">HODL $TESOLA</span> 🚀
                </p>
                <p className="text-gray-300 text-sm max-w-lg">
                  Together we'll create the ultimate bridge between Tesla owners and Solana maximalists. The greatest crossover in crypto history isn't just coming - it's already HERE!
                </p>
                <Link href="/presale">
                  <div className="mt-4 inline-block bg-gradient-to-r from-red-600/80 to-yellow-500/80 px-6 py-3 rounded-lg animate-pulse-slow cursor-pointer shadow-[0_0_15px_rgba(255,77,77,0.5)] hover:shadow-[0_0_20px_rgba(255,77,77,0.8)] transition-all">
                    <span className="text-white font-extrabold text-sm flex items-center">
                      <span className="mr-2">🚀</span>
                      ABSOLUTE SUCCESS! TO THE MOON TOGETHER!
                      <span className="ml-2">🌕</span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mb-8 px-4 sm:px-0">
            <div className="relative inline-block group">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                Return to main page
              </div>
              
              <Link 
                href="/home" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-800/80 to-purple-800/80 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-blue-500/30 group-hover:animate-pulse"
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
            <p>This page contains 100% real footage of blockchain development</p>
            <p className="mt-1">© 2025 TESOLA Dev Team • Powered by ☕ and 🍕</p>
          </div>
        </div>
      </Layout>
    </>
  );
}