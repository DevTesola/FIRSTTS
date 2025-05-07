import Head from "next/head";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Link from "next/link";

export default function CharacterIntroduction() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Easter egg sounds
  const playSolaraSound = () => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/cosmic-whoosh.mp3");
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Audio play failed:", err));
    }
  };

  const playElonSound = () => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/sounds/rocket-launch.mp3");
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Audio play failed:", err));
    }
  };

  return (
    <>
      <Head>
        <title>Main Character Introduction | SOLARA & TESOLA</title>
        <meta
          name="description"
          content="Meet the iconic characters from the SOLARA and TESOLA universe."
        />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-24 mt-8 relative">
            <div className="absolute inset-0 -top-10 flex justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full bg-gradient-to-r from-green-600/30 to-yellow-600/30 text-white mb-4">
                Exclusive Character Lore
              </span>
              <h1 className="text-5xl md:text-7xl font-black mb-8 text-transparent bg-clip-text animate-pulse-slow"
                style={{
                  backgroundImage: 'linear-gradient(to right, #39ff14, #ffff00, #00ffff)',
                  textShadow: '0 0 20px rgba(57, 255, 20, 0.7), 0 0 40px rgba(57, 255, 20, 0.4)'
                }}>
                THE LEGENDARY CHARACTERS
              </h1>
              <div className="flex justify-center">
                <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full mb-6"></div>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light">
                Meet the iconic figures that rule the SOLARA & TESOLA universe. 
                <span className="font-bold text-white block mt-2">Part legend, part meme, all awesome.</span>
              </p>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                <svg className="animate-bounce w-6 h-6 text-white opacity-70" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Character Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16 relative">
            <div className="absolute -inset-20 bg-gradient-to-r from-purple-900/10 via-transparent to-amber-900/10 blur-3xl pointer-events-none"></div>
            
            {/* SOLARA Character Card */}
            <div 
              className="relative overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-blue-900/60 to-purple-900/60 transform transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] group cursor-pointer"
              onClick={playSolaraSound}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 blur-xl opacity-30 animate-pulse-slow"></div>
              <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-purple-600/20 to-transparent"></div>
              <div className="absolute -top-24 -left-24 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative p-6 h-full">
                {/* Character Name */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">SOLARA</h2>
                  <span className="bg-purple-900/60 text-purple-100 px-3 py-1 rounded-full text-sm font-semibold">
                    Cosmic Guardian
                  </span>
                </div>

                {/* YouTube Embed */}
                <div className="mb-6 aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  {mounted && (
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/JsNBsou5BAY"
                      title="SOLARA Character Introduction"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>

                {/* Character Description */}
                <div className="mb-6">
                  <p className="text-purple-100 text-lg leading-relaxed mb-4">
                    Guardian of the SOLARA Network, protector of all digital realms. Born from cosmic energy and pure code.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-900/60 flex items-center justify-center mr-3">
                        <span className="text-purple-200">⚡</span>
                      </div>
                      <span className="text-gray-300">Controls the cosmic energy of the blockchain</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-900/60 flex items-center justify-center mr-3">
                        <span className="text-purple-200">👁️</span>
                      </div>
                      <span className="text-gray-300">Can see all transactions across the network</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-900/60 flex items-center justify-center mr-3">
                        <span className="text-purple-200">🔮</span>
                      </div>
                      <span className="text-gray-300">Predicts market trends with cosmic insight</span>
                    </div>
                  </div>
                </div>

                {/* Character quote */}
                <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 italic text-purple-200">
                  "I am SOLARA, watcher of the digital stars. No transaction escapes my gaze, no smart contract eludes my understanding."
                </div>

                {/* NFT gallery preview */}
                <div className="mt-6">
                  <h3 className="text-purple-300 text-lg font-semibold mb-3">Special Edition NFTs</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <img src="/nft-previews/0119.png" alt="SOLARA NFT" className="rounded-md hover:scale-105 transition-transform" />
                    <img src="/nft-previews/0171.png" alt="SOLARA NFT" className="rounded-md hover:scale-105 transition-transform" />
                    <img src="/nft-previews/0327.png" alt="SOLARA NFT" className="rounded-md hover:scale-105 transition-transform" />
                    <img src="/nft-previews/0416.png" alt="SOLARA NFT" className="rounded-md hover:scale-105 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* E-LON Character Card */}
            <div 
              className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-red-900/60 to-amber-900/60 transform transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(251,191,36,0.6)] group cursor-pointer"
              onClick={playElonSound}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 blur-xl opacity-30 animate-pulse-slow"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-amber-600/20 to-transparent"></div>
              <div className="absolute -top-24 -right-24 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative p-6 h-full">
                {/* Character Name */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">E-LON</h2>
                  <span className="bg-amber-900/60 text-amber-100 px-3 py-1 rounded-full text-sm font-semibold">
                    The Crypto King
                  </span>
                </div>

                {/* YouTube Embed */}
                <div className="mb-6 aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  {mounted && (
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/XV2Nh-RHBNI"
                      title="E-LON Character Introduction"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>

                {/* Character Description */}
                <div className="mb-6">
                  <p className="text-amber-100 text-lg leading-relaxed mb-4">
                    Ruler of TESOLA, visionary entrepreneur and crypto commander. With a single tweet, markets rise and fall at his command.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-900/60 flex items-center justify-center mr-3">
                        <span className="text-amber-200">🚀</span>
                      </div>
                      <span className="text-gray-300">Sends token prices to the moon with memes</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-900/60 flex items-center justify-center mr-3">
                        <span className="text-amber-200">💰</span>
                      </div>
                      <span className="text-gray-300">Master of tokenomics and digital wealth</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-900/60 flex items-center justify-center mr-3">
                        <span className="text-amber-200">🧠</span>
                      </div>
                      <span className="text-gray-300">Genius-level intellect focused on blockchain innovation</span>
                    </div>
                  </div>
                </div>

                {/* Character quote */}
                <div className="bg-amber-900/40 border border-amber-500/30 rounded-lg p-4 italic text-amber-200">
                  "TESOLA to the moon! When we achieve interplanetary consensus, we'll put a node on Mars. Bearish shorts will regret their FUD!"
                </div>

                {/* NFT gallery preview */}
                <div className="mt-6">
                  <h3 className="text-amber-300 text-lg font-semibold mb-3">Special Edition NFTs</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <img src="/nft-previews/0418.png" alt="E-LON NFT" className="rounded-md hover:scale-105 transition-transform" />
                    <img src="/nft-previews/0579.png" alt="E-LON NFT" className="rounded-md hover:scale-105 transition-transform" />
                    <img src="/elon.png" alt="E-LON" className="rounded-md hover:scale-105 transition-transform" />
                    <div className="bg-black rounded-md hover:scale-105 transition-transform overflow-hidden">
                      <video 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                      >
                        <source src="/nft-previews/0625.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-16 relative mt-20">
            <div className="absolute -inset-10 bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-amber-600/10 blur-3xl pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-gradient-to-r from-purple-500/20 to-amber-500/20 w-36 h-36 rounded-full blur-3xl"></div>
            
            <h2 className="text-4xl font-black mb-10 text-center animate-pulse-slow"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(236, 72, 153, 0.3)'
                }}>
              CHARACTER POWER COMPARISON
            </h2>
            
            <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-amber-500 mx-auto mb-10 rounded-full"></div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800/60">
                    <th className="px-6 py-4 text-left text-gray-300">Ability</th>
                    <th className="px-6 py-4 text-center text-purple-300">SOLARA</th>
                    <th className="px-6 py-4 text-center text-amber-300">E-LON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="bg-gray-900/30 hover:bg-gray-800/20">
                    <td className="px-6 py-4 text-gray-300">Market Influence</td>
                    <td className="px-6 py-4 text-center text-purple-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '70%'}}></div>
                        </div>
                        <span className="ml-2">7/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-amber-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{width: '90%'}}></div>
                        </div>
                        <span className="ml-2">9/10</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-900/30 hover:bg-gray-800/20">
                    <td className="px-6 py-4 text-gray-300">Blockchain Power</td>
                    <td className="px-6 py-4 text-center text-purple-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '100%'}}></div>
                        </div>
                        <span className="ml-2">10/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-amber-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{width: '80%'}}></div>
                        </div>
                        <span className="ml-2">8/10</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-900/30 hover:bg-gray-800/20">
                    <td className="px-6 py-4 text-gray-300">Meme Potential</td>
                    <td className="px-6 py-4 text-center text-purple-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="ml-2">6/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-amber-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{width: '100%'}}></div>
                        </div>
                        <span className="ml-2">10/10</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-900/30 hover:bg-gray-800/20">
                    <td className="px-6 py-4 text-gray-300">Technical Knowledge</td>
                    <td className="px-6 py-4 text-center text-purple-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '90%'}}></div>
                        </div>
                        <span className="ml-2">9/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-amber-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="ml-2">8.5/10</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-900/30 hover:bg-gray-800/20">
                    <td className="px-6 py-4 text-gray-300">Community Love</td>
                    <td className="px-6 py-4 text-center text-purple-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        <span className="ml-2">7.5/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-amber-300">
                      <div className="flex justify-center">
                        <div className="w-32 bg-gray-700 rounded-full h-2.5">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="ml-2">8.5/10</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fan Art Contest Banner */}
          <div className="relative overflow-hidden rounded-xl p-10 bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-amber-900/60 border border-pink-500/30 mt-28 shadow-[0_0_50px_rgba(236,72,153,0.2)]">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-30 blur-xl"></div>
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64">
              <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-amber-500/30 blur-3xl animate-pulse-slow"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">✨</div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-pink-700/70 to-purple-700/70 rounded-full text-pink-100 text-sm font-bold mb-3 animate-pulse shadow-[0_0_15px_rgba(219,39,119,0.5)]">
                  LIVE NOW
                </div>
                <h2 className="text-4xl font-black mb-4"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #d8b4fe, #f9a8d4, #fcd34d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(249, 168, 212, 0.4)'
                  }}>
                  CHARACTER FAN ART CONTEST
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6 rounded-full"></div>
                <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                  Create your own interpretation of SOLARA or E-LON and win exclusive NFTs and TESOLA tokens!
                  <span className="block text-pink-200 mt-2 font-medium">Top winners receive limited edition character NFTs worth 10 SOL each!</span>
                </p>
              </div>
              
              <div className="flex justify-center">
                <Link
                  href="/contest"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-bold rounded-xl hover:from-purple-500 hover:via-pink-500 hover:to-amber-500 transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                >
                  <span className="mr-2 text-xl">🎨</span>
                  JOIN THE CONTEST
                </Link>
              </div>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="fixed top-1/4 right-10 w-20 h-20 rounded-full bg-purple-500/20 blur-3xl animate-pulse-slow pointer-events-none"></div>
          <div className="fixed bottom-1/4 left-10 w-16 h-16 rounded-full bg-amber-500/20 blur-3xl animate-pulse-slow pointer-events-none"></div>
          
        </div>
      </Layout>
    </>
  );
}