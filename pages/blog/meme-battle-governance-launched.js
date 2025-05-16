import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function MemeBattleGovernanceLaunched() {
  // 페이지 로드 시 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>TESOLA Meme Battle Governance Launched! Vote for the Ultimate Meme King | TESOLA</title>
        <meta name="description" content="The most fun governance system in crypto! Vote for your favorite memes, earn rewards, and become the Meme Lord of TESOLA!" />
        <meta property="og:title" content="TESOLA Meme Battle Voting System Launched!" />
        <meta property="og:description" content="Democracy has never been this fun! Join the meme battle governance" />
        <meta property="og:image" content="/ss/s2.gif" />
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <article className="prose prose-invert max-w-none">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 rounded-xl p-6 mb-8 border border-purple-500/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Meme Battle Governance Launched! 🚀
                </h1>
                <p className="text-gray-400 text-sm">
                  May 20, 2025 • DevTeam
                </p>
              </div>
              <Link href="/community?tab=news" className="mt-4 sm:mt-0 text-purple-400 hover:text-purple-300 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to News
              </Link>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                1,337 votes
              </span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                69 memes submitted
              </span>
            </div>
          </div>

          {/* Epic Banner */}
          <div className="mb-8 rounded-xl overflow-hidden shadow-2xl border border-pink-500/20">
            <div className="relative h-64 md:h-96">
              <Image
                src="/ss/s2.gif"
                alt="TESOLA Meme Battle Governance"
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-500 hover:scale-105"
              />
              {/* Meme Text Overlay */}
              <div className="absolute top-0 left-0 w-full p-4">
                <div className="flex justify-start">
                  <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-pink-500/50">
                    <p className="text-white text-sm md:text-base font-bold tracking-wider">
                      SUPER TESOLA <span className="text-green-400">LEADS</span> THE <span className="text-red-400">BEARS</span> 🚀
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white text-lg font-bold">🏆 The Meme Battle for Ultimate TESOLA Supremacy Begins! 🏆</p>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border-l-4 border-pink-500 p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-pink-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-pink-400 mb-1">Current Meme King: TEST_MoonBoi9999</h3>
                <p className="text-gray-300">
                  Dethroned after 420 hours of reign! Will YOU be the next Meme Lord?
                </p>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <section className="space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Forget boring governance proposals about protocol parameters and treasury allocations. 
                TESOLA just launched the most democratically degenerate governance system in the history 
                of cryptocurrency: <strong className="text-pink-400">The Great Meme Battle Royale</strong>!
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                Every week, the TESOLA community votes for the ultimate meme that represents our 
                collective smooth-brained genius. Winners get eternal glory, losers get roasted, 
                and everyone gets TESOLA rewards!
              </p>
            </div>

            {/* How It Works */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                How The Meme Battle Works
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">1. Submit Your Dankest Memes</h3>
                  <p className="text-gray-300">
                    Got a meme that'll make Elon himself shed a tear of joy? Submit it to the weekly 
                    battle. Each NFT holder can submit 1 meme per week.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">2. Community Votes with TESOLA</h3>
                  <p className="text-gray-300">
                    Every TESOLA holder can vote! NFT holders get bonus voting power based on their 
                    rarity tier. The more legendary your NFT, the more your meme opinion matters!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">3. Winner Takes All</h3>
                  <p className="text-gray-300">
                    The weekly winner becomes the official TESOLA Meme Lord, gets featured on our 
                    homepage, and receives a massive TESOLA reward pool!
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Power */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Meme Voting Power Breakdown
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-blue-400 mb-3">Token Holders</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <span className="text-white font-bold mr-2">500,000 TESOLA = 1 vote</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-gray-400 text-sm">Minimum 500,000 TESOLA to vote</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">NFT Holders Special Powers</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <span className="text-purple-300">Common NFT:</span>
                      <span className="ml-2 text-white font-bold">1 voting power</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-300">Rare NFT:</span>
                      <span className="ml-2 text-white font-bold">2 voting power</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-pink-300">Epic NFT:</span>
                      <span className="ml-2 text-white font-bold">3 voting power</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-yellow-300">Legendary NFT:</span>
                      <span className="ml-2 text-white font-bold">5 voting power</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Battle */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4.5 1.25-4.5.5 0 .875.75.875.75l1.5 3.75c0 .5.375.5.375.5z" clipRule="evenodd" />
                </svg>
                Current Meme Battle Leaders
              </h2>

              <div className="space-y-4">
                {/* Leader 1 */}
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-5 rounded-lg border border-yellow-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400">1st Place: "When TESOLA hits $10"</h3>
                      <p className="text-gray-300 mt-1">Submitted by @TEST_LamboWen420</p>
                      <p className="text-sm text-gray-400 mt-2">Current votes: 42,069</p>
                    </div>
                    <div className="text-4xl">🏆</div>
                  </div>
                </div>

                {/* Leader 2 */}
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-5 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-300">2nd Place: "Mom said it's my turn on the blockchain"</h3>
                      <p className="text-gray-300 mt-1">Submitted by @TEST_GigaChad6969</p>
                      <p className="text-sm text-gray-400 mt-2">Current votes: 38,420</p>
                    </div>
                    <div className="text-4xl">🥈</div>
                  </div>
                </div>

                {/* Leader 3 */}
                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-5 rounded-lg border border-orange-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-orange-400">3rd Place: "Virgin ETH gas fees vs Chad Solana"</h3>
                      <p className="text-gray-300 mt-1">Submitted by @TEST_DiamondHands777</p>
                      <p className="text-sm text-gray-400 mt-2">Current votes: 33,333</p>
                    </div>
                    <div className="text-4xl">🥉</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Weekly Meme Battle Rewards
              </h2>

              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-6 rounded-lg border border-green-500/30">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-bold text-lg">🏆 1st Place</span>
                    <span className="text-white font-bold">500,000 TESOLA + "Meme Lord" Title</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold">🥈 2nd Place</span>
                    <span className="text-white font-bold">100,000 TESOLA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-400 font-bold">🥉 3rd Place</span>
                    <span className="text-white font-bold">30,000 TESOLA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pink-400 font-bold">Social Share Reward</span>
                    <span className="text-white font-bold">TESOLA rewards for Twitter/Telegram shares</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Events */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
                Upcoming Special Meme Events
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">"Elon & SOLARA Love Story" Meme Contest</h3>
                  <p className="text-gray-300">
                    Express your feelings about Elon and SOLARA's love story through memes! 
                    Most touching or hilarious interpretation wins!
                  </p>
                  <p className="text-sm text-purple-400 mt-2">Starts: June 1, 2025</p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-pink-400 mb-2">"Bear Market Survivor" Contest</h3>
                  <p className="text-gray-300">
                    Share your most painful crypto loss stories in meme format. Most relatable 
                    sob story wins!
                  </p>
                  <p className="text-sm text-pink-400 mt-2">Starts: June 15, 2025</p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">"Tesla Dreams" Championship</h3>
                  <p className="text-gray-300">
                    The funniest Tesla contest! Create the most hilarious Tesla-themed meme. 
                    Winner gets closer to their own Tesla (in TESOLA)!
                  </p>
                  <p className="text-sm text-blue-400 mt-2">Starts: July 1, 2025</p>
                </div>
              </div>
            </div>

            {/* Hall of Fame */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Meme Hall of Fame
              </h2>

              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-lg border border-yellow-500/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Hall of Fame Examples</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-3">🥇</span>
                    <span className="text-gray-300">"This is Fine" - TESOLA edition (Example)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-3">🥇</span>
                    <span className="text-gray-300">"Drake choosing TESOLA over BTC" (Example)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-3">🥇</span>
                    <span className="text-gray-300">"Wojak panic selling at $0.01" (Example)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-3">🔥</span>
                    <span className="text-gray-300">"Gigachad TESOLA holder" (Example: 69,420 votes)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 p-8 rounded-xl border border-pink-500/30 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Become a Meme Legend?</h2>
              <p className="text-lg text-gray-300 mb-6">
                Join the most degenerate democracy in crypto. Your memes could shape the future 
                of TESOLA (and make everyone laugh)!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contest" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Submit Your Meme
                </Link>
                
                <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm3.224 17.582c.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-7.306c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-3.799c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123z"/>
                  </svg>
                  Join Meme Army
                </a>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 italic">
                * Not financial advice. TESOLA Meme Battle is purely for entertainment and community 
                building. Side effects may include: uncontrollable laughter, excessive hopium, and 
                the urge to screenshot NFTs. Please meme responsibly.
              </p>
            </div>
          </section>

          {/* Social Share */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 sm:mb-0">Share this article</p>
              <div className="flex space-x-4">
                <a href={`https://twitter.com/intent/tweet?text=TESOLA just launched the most fun governance system ever! Vote for memes, win prizes 🚀&url=${encodeURIComponent('https://tesola.xyz/blog/meme-battle-governance-launched')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                  <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer"
                   className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                  <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.203-.049-.313-.346-.11l-6.4 4.02-2.76-.918c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.18.94.12.78.88z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </Layout>
  );
}