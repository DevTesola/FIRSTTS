import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { BlogHeroMediaHybrid } from '../../components/BlogMediaHybrid';

export default function UpcomingGamingPartnership() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Upcoming Gaming Partnership Announcement | TESOLA</title>
        <meta name="description" content="TESOLA announces a major gaming partnership that will revolutionize blockchain gaming. Get the exclusive details on our upcoming collaboration." />
        <meta property="og:title" content="Major Gaming Partnership Coming to TESOLA" />
        <meta property="og:description" content="Revolutionary blockchain gaming experience coming soon" />
        <meta property="og:image" content="/ss/s1.gif" />
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <article className="prose prose-invert max-w-none">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-gray-900/50 to-blue-900/20 rounded-xl p-6 mb-8 border border-blue-500/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Upcoming Gaming Partnership
                </h1>
                <p className="text-gray-400 text-sm">
                  April 10, 2025 • TESOLA Team
                </p>
              </div>
              <Link href="/community?tab=news" className="mt-4 sm:mt-0 text-blue-400 hover:text-blue-300 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to News
              </Link>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Breaking News
              </span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Gaming
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <BlogHeroMediaHybrid
              src="/ss/s1.gif"
              alt="TESOLA Gaming Partnership"
              className="rounded-xl shadow-2xl border border-blue-500/20"
            >
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-20">
                <p className="text-white text-lg font-bold">The Future of Blockchain Gaming Arrives</p>
              </div>
            </BlogHeroMediaHybrid>
          </div>

          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-orange-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-orange-400 mb-1">Exclusive First Look</h3>
                <p className="text-gray-300">
                  TESOLA holders get early access to beta testing and exclusive in-game rewards. 
                  Full details will be revealed at our partnership announcement event.
                </p>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <section className="space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                We're thrilled to announce that TESOLA is entering the gaming space with a groundbreaking 
                partnership that will bring our Drive-to-Earn vision to life. After months of negotiations 
                and development, we're ready to reveal our collaboration with one of the industry's most 
                innovative gaming studios.
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                This partnership represents a major milestone in our roadmap, accelerating our plans to 
                create the ultimate blockchain gaming experience that seamlessly integrates with the 
                TESOLA ecosystem.
              </p>
            </div>

            {/* Partnership Details */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Partnership Overview
              </h2>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-5 rounded-lg border border-blue-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">About Our Partner</h3>
                  <p className="text-gray-300 mb-3">
                    While we can't reveal the studio name until the official announcement, we can share that 
                    they're a <strong className="text-white">AAA game developer</strong> with:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>Over 50 million active players across their titles</li>
                    <li>Multiple Game of the Year awards</li>
                    <li>Pioneer in multiplayer racing games</li>
                    <li>Strong focus on Web3 integration</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-5 rounded-lg border border-blue-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">What This Means for TESOLA</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-300">
                    <li><strong className="text-white">Accelerated Development:</strong> Professional game development resources</li>
                    <li><strong className="text-white">Mass Adoption:</strong> Access to millions of existing gamers</li>
                    <li><strong className="text-white">Technical Excellence:</strong> Industry-leading game engine and infrastructure</li>
                    <li><strong className="text-white">Cross-Platform Play:</strong> PC, Console, and Mobile support</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Game Features */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Exclusive Game Features
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="bg-purple-600/20 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Tesla-Inspired Vehicles</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Race with officially licensed Tesla-inspired vehicles, each with unique stats and abilities 
                    tied to your NFT collection.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="bg-green-600/20 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Play-to-Earn Racing</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Earn TESOLA tokens through competitive racing, daily challenges, and tournament victories. 
                    Real rewards for real skill.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-600/20 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">NFT Integration</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Your SOLARA NFTs become playable characters with unique abilities. Evolved NFTs unlock 
                    special tracks and exclusive content.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-3">
                    <div className="bg-pink-600/20 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Social Features</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Create racing teams, challenge friends, and compete in community tournaments with 
                    massive prize pools.
                  </p>
                </div>
              </div>
            </div>

            {/* Game Environment Preview */}
            <div className="my-8">
              <BlogHeroMediaHybrid
                src="/ss/s7.png"
                alt="In-Game Racing Environment"
                className="rounded-xl shadow-2xl border border-blue-500/20"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">Developers working day and night on coding... 🔧🚀</p>
            </div>

            {/* Roadmap Integration */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Gaming Roadmap Update
              </h2>

              <div className="relative border-l-2 border-purple-600 pl-8 space-y-8">
                <div className="relative">
                  <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-2">Q4 2025: Alpha Testing</h3>
                    <p className="text-gray-300">
                      Closed alpha planned for top 100 NFT holders. Test core gameplay mechanics and provide feedback.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-2">Q1-Q2 2026: Beta Launch</h3>
                    <p className="text-gray-300">
                      Open beta for all TESOLA holders. Introduce play-to-earn mechanics and NFT integration.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-2">Q4 2026 (planned): Full Release</h3>
                    <p className="text-gray-300">
                      Global launch with cross-platform support. Major esports tournament with $1M prize pool.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-2">Q1-Q2 2027: Expansion</h3>
                    <p className="text-gray-300">
                      Introduction of new game modes, additional NFT utilities, and enhanced reward systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NFT Gaming Integration Visual */}
            <div className="my-8">
              <BlogHeroMediaHybrid
                src="/ss/s8.png"
                alt="NFT Gaming Integration"
                className="rounded-xl shadow-2xl border border-purple-500/20"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">The combination of these two is... beyond imagination 🤩🎆</p>
            </div>

            {/* Benefits for Holders */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Exclusive Benefits for TESOLA Holders
              </h2>

              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-lg border border-yellow-500/30">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Early access to all game releases</span>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Exclusive in-game NFT skins</span>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">2x earning multiplier</span>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Tournament priority registration</span>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Seasonal airdrop rewards</span>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Governance voting on game features</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer Statement */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Statement from the Founders
              </h2>

              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-500/30">
                <blockquote className="text-lg text-gray-300 italic">
                  "This partnership represents everything we've been working towards at TESOLA. By combining 
                  our innovative tokenomics with world-class game development, we're creating something 
                  truly revolutionary in the blockchain gaming space."
                </blockquote>
                <p className="text-purple-400 font-bold mt-4">
                  — The TESOLA Team
                </p>
              </div>
            </div>

            {/* What's Next */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-6-3a2 2 0 114 0 2 2 0 01-4 0zm5-9a3 3 0 00-3 3v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 011-1h1a1 1 0 100-2h-1z" clipRule="evenodd" />
                </svg>
                What to Expect Next
              </h2>

              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mr-3">1</span>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Official Announcement Event</h3>
                      <p className="text-gray-300">
                        Join us for a live-streamed event on <strong className="text-white">October 1st, 2025</strong> where 
                        we'll reveal our partner and showcase gameplay footage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mr-3">2</span>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Alpha Testing Sign-ups</h3>
                      <p className="text-gray-300">
                        Top 100 NFT holders will receive exclusive invitations to participate in alpha testing 
                        starting <strong className="text-white">October 2025</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="bg-purple-600 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mr-3">3</span>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Gaming NFT Collection</h3>
                      <p className="text-gray-300">
                        A special gaming-focused NFT collection will be announced with unique utility in the 
                        upcoming game.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                <details className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 cursor-pointer group">
                  <summary className="font-bold text-white flex items-center justify-between">
                    Will I need to buy new NFTs to play?
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-3">
                    No! Your existing SOLARA NFTs will be fully integrated into the game. However, special 
                    gaming NFTs will offer additional features and customization options.
                  </p>
                </details>

                <details className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 cursor-pointer group">
                  <summary className="font-bold text-white flex items-center justify-between">
                    What platforms will the game be available on?
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-3">
                    Currently in development for web page and PC environment. Additional platforms may be 
                    announced as development progresses.
                  </p>
                </details>

                <details className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 cursor-pointer group">
                  <summary className="font-bold text-white flex items-center justify-between">
                    How will TESOLA token integration work?
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </summary>
                  <p className="text-gray-300 mt-3">
                    TESOLA will be the primary currency for all in-game transactions, rewards, and tournament 
                    prizes. Players can earn tokens through gameplay and spend them on upgrades, customizations, 
                    and entry fees.
                  </p>
                </details>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 p-8 rounded-xl border border-orange-500/30 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Get Ready for the Gaming Revolution</h2>
              <p className="text-lg text-gray-300 mb-6">
                This is just the beginning. Join our community to stay updated on all gaming developments 
                and be first in line for exclusive opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm3.224 17.582c.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-7.306c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-3.799c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123z"/>
                  </svg>
                  Join TESOLA Community
                </a>
                
                <Link href="/nft" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Get SOLARA NFTs
                </Link>
              </div>
            </div>
          </section>

          {/* Development Disclaimer */}
          <div className="mt-12 p-6 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-900/90 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-500 blur-[0.5px] select-none">
                  * Game-related content may be delayed or canceled based on development progress and community milestones. 
                  All dates and features are tentative and subject to change.
                </p>
              </div>
            </div>
          </div>

          {/* Social Share */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 sm:mb-0">Share this announcement</p>
              <div className="flex space-x-4">
                <a href={`https://twitter.com/intent/tweet?text=TESOLA announces major gaming partnership! The future of blockchain gaming is here.&url=${encodeURIComponent('https://tesola.xyz/blog/upcoming-gaming-partnership')}`}
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