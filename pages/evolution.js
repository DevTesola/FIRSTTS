import React, { useState } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import Image from "next/image";
import LaunchAnnouncementModal from "../components/LaunchAnnouncementModal";

export default function EvolutionPage() {
  const [selectedExample, setSelectedExample] = useState(0);
  
  const evolutionExamples = [
    { id: "0011", name: "SOLARA #0011", rarity: "common", rarityEng: "COMMON", color: "from-green-500 to-green-600", bgColor: "from-green-900/20 to-green-800/20", borderColor: "border-green-500/50", beforeType: "png", afterType: "jpg" },
    { id: "0012", name: "SOLARA #0012", rarity: "common", rarityEng: "COMMON", color: "from-green-500 to-green-600", bgColor: "from-green-900/20 to-green-800/20", borderColor: "border-green-500/50", beforeType: "png", afterType: "jpg" },
    { id: "0467", name: "SOLARA #0467", rarity: "rare", rarityEng: "RARE", color: "from-blue-500 to-blue-600", bgColor: "from-blue-900/20 to-blue-800/20", borderColor: "border-blue-500/50", beforeType: "png", afterType: "jpg" },
    { id: "0932", name: "SOLARA #0932", rarity: "epic", rarityEng: "EPIC", color: "from-purple-500 to-purple-600", bgColor: "from-purple-900/20 to-purple-800/20", borderColor: "border-purple-500/50", beforeType: "png", afterType: "jpg" },
    { id: "0873", name: "SOLARA #0873", rarity: "legendary", rarityEng: "LEGENDARY (IMAGE)", color: "from-yellow-500 to-amber-600", bgColor: "from-yellow-900/20 to-amber-800/20", borderColor: "border-yellow-500/50", beforeType: "png", afterType: "jpg" },
    { id: "0873", name: "SOLARA #0873", rarity: "legendary", rarityEng: "LEGENDARY (VIDEO)", color: "from-orange-500 to-red-600", bgColor: "from-orange-900/20 to-red-800/20", borderColor: "border-orange-500/50", beforeType: "mp4", afterType: "mp4", isVideo: true }
  ];

  return (
    <>
      <Head>
        <title>Evolution System - Transform Your NFTs | SOLARA</title>
        <meta
          name="description"
          content="Discover the SOLARA Evolution System - Transform your NFT cards into living digital entities. Experience the future of dynamic NFTs on Solana."
        />
        <style jsx global>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes spin-slow {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
          
          .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
          }
          
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
          
          .animate-fade-in-scale {
            animation: fadeInScale 0.6s ease-out forwards;
          }
          
          .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
          .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
          .animation-delay-600 { animation-delay: 0.6s; opacity: 0; }
          .animation-delay-800 { animation-delay: 0.8s; opacity: 0; }
        `}</style>
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-purple-900/10 pt-24 pb-12 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-300"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-orange-600/10 rounded-full blur-3xl animate-spin-slow"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                🔥 EVOLUTION SYSTEM
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-4">
                Transform your SOLARA NFT cards into living, breathing digital entities. 
                Evolution unlocks the true potential of your collection.
              </p>
              <div className="max-w-2xl mx-auto space-y-3">
                <p className="text-xl sm:text-2xl font-bold text-purple-300">
                  Get Your Own SOLARA and Protect Solana!
                </p>
                <p className="text-lg sm:text-xl text-orange-300 font-medium">
                  Solana Maxis, Unite!
                </p>
                <p className="text-base sm:text-lg text-gray-400">
                  1000 Completely Random SOLARAs Are Waiting For You
                </p>
              </div>
            </div>

            {/* Interactive Example */}
            <div className="max-w-6xl mx-auto mb-16 animate-fade-in-scale animation-delay-200">
              <div className={`bg-gradient-to-br ${evolutionExamples[selectedExample].bgColor} backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 ${evolutionExamples[selectedExample].borderColor} shadow-2xl relative ${evolutionExamples[selectedExample].isVideo ? 'overflow-hidden' : ''}`}>
                {/* Special Legendary Background Effects */}
                {evolutionExamples[selectedExample].isVideo && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-orange-500/10 animate-pulse pointer-events-none"></div>
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-75"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-yellow-500/5 to-transparent rounded-full animate-pulse"></div>
                  </>
                )}
                <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
                  See The Evolution In Action
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Before - Card Version */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-300 mb-4">BEFORE: Card Form</h3>
                    <div className={`relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 ${evolutionExamples[selectedExample].borderColor} shadow-xl`}>
                      {evolutionExamples[selectedExample].isVideo ? (
                        <video
                          src={`/zz/${evolutionExamples[selectedExample].id}.${evolutionExamples[selectedExample].beforeType}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={`/zz/${evolutionExamples[selectedExample].id}.${evolutionExamples[selectedExample].beforeType}`}
                          alt={`${evolutionExamples[selectedExample].name} Card`}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-bold text-lg">{evolutionExamples[selectedExample].name}</p>
                        <p className="text-sm text-gray-300">Card Form</p>
                        <div className={`inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${evolutionExamples[selectedExample].color} text-xs font-bold text-white`}>
                          {evolutionExamples[selectedExample].rarityEng}
                        </div>
                      </div>
                      {evolutionExamples[selectedExample].isVideo && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-600 px-3 py-1 rounded-full animate-pulse">
                          <span className="text-xs font-bold text-white">🎬 LEGENDARY VIDEO</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evolution Arrow */}
                  <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <svg className="w-20 h-20 text-white drop-shadow-2xl animate-pulse relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 rounded-full animate-bounce">
                        EVOLVE!
                      </div>
                    </div>
                  </div>

                  {/* After - Evolved Version */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-300 mb-4">AFTER: Evolved SOLARA</h3>
                    <div className={`relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 ${evolutionExamples[selectedExample].borderColor} shadow-xl ring-4 ring-orange-500/50 animate-pulse`}>
                      {evolutionExamples[selectedExample].isVideo ? (
                        <video
                          src={`/zz/${evolutionExamples[selectedExample].id}z.${evolutionExamples[selectedExample].afterType}`}
                          className="absolute inset-0 w-[120%] h-[120%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={`/zz/${evolutionExamples[selectedExample].id}z.${evolutionExamples[selectedExample].afterType}`}
                          alt={`${evolutionExamples[selectedExample].name} Evolved`}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-bold text-lg">{evolutionExamples[selectedExample].name}</p>
                        <p className="text-sm text-orange-300">Evolved Form ⚡</p>
                        <div className={`inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${evolutionExamples[selectedExample].color} text-xs font-bold text-white animate-pulse`}>
                          {evolutionExamples[selectedExample].rarityEng} EVOLVED
                        </div>
                      </div>
                      {evolutionExamples[selectedExample].isVideo && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-600 to-red-600 px-3 py-1 rounded-full animate-bounce shadow-lg">
                          <span className="text-xs font-bold text-white">🔥 LEGENDARY EVOLVED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Example Selector */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {evolutionExamples.map((example, index) => (
                    <button
                      key={example.id}
                      onClick={() => setSelectedExample(index)}
                      className={`px-6 py-3 rounded-full transition-all transform hover:scale-105 ${
                        selectedExample === index
                          ? `bg-gradient-to-r ${example.color} text-white shadow-lg`
                          : `bg-gradient-to-r ${example.bgColor} text-gray-300 hover:text-white border-2 ${example.borderColor}`
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold">{example.rarityEng}</span>
                        <span className="font-medium">{example.name}</span>
                        {example.isVideo && (
                          <span className="text-xxs mt-1">🎬 VIDEO</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="max-w-4xl mx-auto mb-16 animate-fade-in-up animation-delay-400">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                How Evolution Works
              </h2>
              
              <div className="grid gap-6">
                <div className="bg-gray-900/60 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-600 text-white rounded-full p-3 shrink-0">
                      <span className="text-xl font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Hold Your NFT</h3>
                      <p className="text-gray-300">
                        Start with any SOLARA NFT from our Gen:0 collection. Each card has unique evolution potential based on its traits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-600 text-white rounded-full p-3 shrink-0">
                      <span className="text-xl font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Stake & Earn</h3>
                      <p className="text-gray-300">
                        Stake your NFT to earn TESOLA tokens. The longer you stake, the more evolution points you accumulate.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-600 text-white rounded-full p-3 shrink-0">
                      <span className="text-xl font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Trigger Evolution</h3>
                      <p className="text-gray-300">
                        When ready, use your TESOLA tokens to initiate the evolution process. Transform your static card into a living SOLARA entity.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-600 text-white rounded-full p-3 shrink-0">
                      <span className="text-xl font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Unlock Powers</h3>
                      <p className="text-gray-300">
                        Evolved SOLARAs gain special abilities: boosted staking rewards, governance power, exclusive access, and more.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="max-w-5xl mx-auto mb-16 animate-fade-in-up animation-delay-600">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Evolution Benefits
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-500/30">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-white mb-2">Enhanced Staking Rewards</h3>
                  <p className="text-gray-300">
                    Evolved SOLARAs earn significantly higher staking rewards than card form.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
                  <div className="text-4xl mb-4">🗳️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Enhanced Governance</h3>
                  <p className="text-gray-300">
                    Gain 2X voting power in DAO decisions with your evolved NFT.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30">
                  <div className="text-4xl mb-4">🎭</div>
                  <h3 className="text-xl font-bold text-white mb-2">Exclusive Access</h3>
                  <p className="text-gray-300">
                    Unlock VIP channels, events, and future collection whitelist spots.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/30">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-xl font-bold text-white mb-2">Dynamic Artwork</h3>
                  <p className="text-gray-300">
                    Your NFT becomes animated with special effects and interactions.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-2xl p-6 border border-yellow-500/30">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-2">Power Traits</h3>
                  <p className="text-gray-300">
                    Unlock unique abilities based on your NFT's original traits.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 rounded-2xl p-6 border border-pink-500/30">
                  <div className="text-4xl mb-4">🎁</div>
                  <h3 className="text-xl font-bold text-white mb-2">Airdrop Priority</h3>
                  <p className="text-gray-300">
                    Evolved holders get priority access to future airdrops and rewards.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto mb-16 animate-fade-in-up animation-delay-800">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                <details className="bg-gray-900/60 rounded-xl p-6 border border-gray-700 cursor-pointer">
                  <summary className="font-bold text-white">When will evolution be available?</summary>
                  <p className="text-gray-300 mt-4">
                    Be part of the Top 100 holders to find out! Evolution tokens will be granted to qualified holders.
                  </p>
                </details>

                <details className="bg-gray-900/60 rounded-xl p-6 border border-gray-700 cursor-pointer">
                  <summary className="font-bold text-white">Can I reverse the evolution?</summary>
                  <p className="text-gray-300 mt-4">
                    Evolved NFTs will be issued as additional NFTs. You'll own both the symbolic card of Solana Maxis and the evolved version!
                  </p>
                </details>

                <details className="bg-gray-900/60 rounded-xl p-6 border border-gray-700 cursor-pointer">
                  <summary className="font-bold text-white">How much TESOLA is needed to evolve?</summary>
                  <p className="text-gray-300 mt-4">
                    Check the real-time Top 100 leaderboard to find out the current requirements!
                  </p>
                </details>

                <details className="bg-gray-900/60 rounded-xl p-6 border border-gray-700 cursor-pointer">
                  <summary className="font-bold text-white">Do evolved NFTs maintain their original traits?</summary>
                  <p className="text-gray-300 mt-4">
                    Yes! Evolved NFTs retain all original traits and gain additional evolved characteristics.
                  </p>
                </details>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center animate-fade-in-scale animation-delay-800">
              <div className="bg-gradient-to-r from-purple-900/30 via-orange-900/30 to-purple-900/30 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Ready to Evolve?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Take Your SOLARA to the Next Dimension!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.href = '/nft'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-10 rounded-xl transition-all shadow-lg font-medium text-lg transform hover:scale-105"
                  >
                    Mint Your NFT
                  </button>
                  <button
                    onClick={() => window.location.href = '/staking'}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-4 px-10 rounded-xl transition-all shadow-lg font-medium text-lg transform hover:scale-105"
                  >
                    Start Staking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <LaunchAnnouncementModal />
      </Layout>
    </>
  );
}