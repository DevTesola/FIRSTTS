import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Whitepaper() {
  // Page load scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>TESOLA - Official Whitepaper 2025</title>
        <meta name="description" content="The First Tesla-Inspired Meme Coin That Actually Works™" />
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="bg-gray-800/30 border border-purple-500/20 rounded-xl p-4 sm:p-6 mb-6">
          {/* Cover/Title Section */}
          <div className="flex flex-col items-center justify-center text-center mb-10 py-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
              TESOLA
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4">The First Tesla-Inspired Meme Coin That Actually Works™</p>
            <p className="text-purple-400 bg-purple-900/30 px-3 py-1 rounded-lg text-sm">🚀 To The Moon Edition | May 2025 🌙</p>
            <div className="mt-8 text-gray-400 text-sm">
              https://tesola.xyz<br />
              "Wen Tesla? Soon™"
            </div>
          </div>

          {/* Table of Contents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Table of Contents</h2>
            <div className="space-y-2">
              {[
                { title: "To The Moon Summary 🚀", page: "3" },
                { title: "1. Mission: From Zero to Tesla 🏎️", page: "4" },
                { title: "2. Why Crypto Sucks (And How We Fix It) 🔧", page: "5" },
                { title: "3. Ecosystem Architecture", page: "6" },
                { title: "4. The Master Plan (Don't Tell SEC) 🤫", page: "7" },
                { title: "4.1 HODL-to-Earn (Free Money Glitch) 💎🙌", page: "8" },
                { title: "4.2 Game Drive-to-Earn (Mario Kart on Steroids) 🎮", page: "10" },
                { title: "4.3 Real Drive-to-Earn (Actually Driving = Actually Earning) 🚗💨", page: "12" },
                { title: "5. Tokenomics", page: "14" },
                { title: "6. Technology Stack", page: "17" },
                { title: "7. Strategic Roadmap", page: "18" },
                { title: "8. Community & Governance", page: "19" },
                { title: "9. Team & Advisors", page: "20" },
                { title: "10. Environmental & Social Impact", page: "21" },
                { title: "11. Legal Disclaimer", page: "22" },
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-white">{item.title}</span>
                  <div className="flex-1 mx-2 border-b border-dotted border-gray-600 h-4"></div>
                  <span className="text-gray-400">{item.page}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">To The Moon Summary 🚀</h2>
            
            <div className="bg-gray-800/50 p-5 rounded-lg mb-6">
              <p className="mb-3 text-gray-300">
                TESOLA is what happens when Tesla fanboys meet crypto degens and decide to create something actually useful. We're building a Drive-to-Earn ecosystem that's more revolutionary than Elon's tweets and more reliable than your favorite shitcoin.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Why TESOLA? 🤔</h3>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li>Three-phase moon mission: HODL-to-Earn → Play-to-Moon → Drive-to-Mars</li>
              <li>73-219% APY (not financial advice, but mathematically sound 👀)</li>
              <li>Actually connects to real Tesla cars (no cap)</li>
              <li>Deflationary tokenomics (we burn tokens faster than gas fees)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Wen Moon? 🌙</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>GameFi market going brrrr 📈</li>
                <li>4M+ Tesla owners waiting to be rugged... we mean, onboarded</li>
                <li>Solana = Fast & Cheap (like your ex, but better)</li>
                <li>First mover advantage in the "cars go vroom on blockchain" sector</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Why We're Not Your Average Shitcoin</h3>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li>Actual utility (shocking, we know)</li>
              <li>Doxxed team (partially, we're not completely regarded)</li>
              <li>Multi-sig treasury (can't rug if we wanted to)</li>
              <li>Real audits coming (trust me bro, but verify)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Quick Stats for Smooth Brains</h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-400">Total Supply</span>
                <div className="text-xl font-bold text-white">1B</div>
                <span className="text-xs text-gray-400">(That's a BILLION, ser)</span>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-400">Initial Market Cap</span>
                <div className="text-xl font-bold text-white">$600K</div>
                <span className="text-xs text-gray-400">(Still early anon)</span>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-400">Ticker</span>
                <div className="text-xl font-bold text-white">TSL</div>
                <span className="text-xs text-gray-400">(Unique and recognizable)</span>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-400">Initial Circulation</span>
                <div className="text-xl font-bold text-white">10%</div>
                <span className="text-xs text-gray-400">(We're not dumping, promise)</span>
              </div>
            </div>
          </section>

          {/* Vision & Mission */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">1. Mission: From Zero to Tesla 🏎️</h2>
            
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
              <h4 className="text-xl font-bold text-red-400 mb-2">The REAL TESOLA Story 📜</h4>
              <p className="text-gray-300 mb-2">So you clicked on our whitepaper and actually read this far? You're our kind of degen! Here's the brutal truth that other projects won't tell you:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>We're not here to revolutionize DeFi or create the next Bitcoin</li>
                <li>We're building a fun meme coin with ACTUAL utility (shocking concept)</li>
                <li>Transparent tokenomics - no hidden wallets, no secret allocations</li>
                <li>A community of degens who actually understand crypto</li>
              </ul>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">The Dream (Vision)</h3>
            <p className="mb-4 text-gray-300">
              Imagine a world where your Tesla mines crypto while you sleep, your racing game pays your rent, and HODLing actually gets you a Lambo... err, we mean Tesla. That's not just hopium - that's TESOLA.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">The Plan (Mission)</h3>
            <p className="mb-4 text-gray-300">
              We're building the bridge between Tesla simps and crypto degens through a 3-phase masterplan that's so genius, it might actually work:
            </p>
            
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>Phase 1: HODL NFTs, get TESOLA (literally free money)</li>
                <li>Phase 2: Play racing game, get more TESOLA (gamers finally touch grass)</li>
                <li>Phase 3: Drive actual Tesla, get even MORE TESOLA (this is the way)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Core Values (We Actually Have Some)</h3>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li><strong>Innovation:</strong> We're pushing tech boundaries harder than Elon pushes deadlines</li>
              <li><strong>Sustainability:</strong> Our tokenomics are more balanced than your portfolio</li>
              <li><strong>Community:</strong> We're all gonna make it (probably)</li>
              <li><strong>Transparency:</strong> Our code is more open than a 24/7 McDonald's</li>
              <li><strong>Security:</strong> Fort Knox wishes it had our smart contracts</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">The 15% Transparency Revolution</h3>
            <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-lg mb-6">
              <p className="text-gray-300 mb-2">Why we take 15% (and don't hide it like others):</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>12-month cliff vesting (we can't dump on day 1)</li>
                <li>36-month linear vesting (aligned with long-term success)</li>
                <li>All team wallets are publicly trackable</li>
                <li>Multi-sig security (no single person can rug)</li>
                <li>Building takes time and resources - we're here for the long haul</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Long-term Goals (2027 Hopium)</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <ol className="list-decimal pl-6 space-y-1 text-gray-300">
                <li>Become the #1 Drive-to-Earn platform (or die trying)</li>
                <li>Get noticed by Elon-senpai</li>
                <li>Create an ecosystem so sustainable, even Greta would approve</li>
                <li>Make a racing game that doesn't suck</li>
                <li>Actually deliver on our roadmap (revolutionary concept)</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Our Promise to You</h3>
            <p className="mb-2 text-gray-300">TESOLA is committed to creating value for all stakeholders through:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li>Continuous innovation (we never sleep, like the crypto market)</li>
              <li>Community engagement (we read every single "wen moon" message)</li>
              <li>Responsible development (we test in prod... just kidding)</li>
              <li>Making blockchain tech so easy, even your grandma can HODL</li>
            </ul>
          </section>

          {/* Problem & Solution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">2. Why Crypto Sucks (And How We Fix It) 🔧</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">The Problems (aka Why We Can't Have Nice Things)</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">1. Crypto is Harder Than Rocket Science 🚀</h4>
            <p className="mb-2 text-gray-300">Current state of crypto onboarding:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Step 1: Learn 47 new acronyms</li>
              <li>Step 2: Set up wallet (pray you don't lose seed phrase)</li>
              <li>Step 3: Get rugged</li>
              <li>Step 4: Repeat</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">2. Tokenomics Usually = Ponzinomics 📉</h4>
            <p className="mb-2 text-gray-300">Most projects' economic model:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Day 1: "To the moon!" 🚀</li>
              <li>Day 30: "Where lambo?" 🤔</li>
              <li>Day 60: "Is this the bottom?" 😰</li>
              <li>Day 90: [Project has left the chat]</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">3. Zero Real-World Use (Just Vibes) 🌈</h4>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li>Buy token → Hold token → Sell token (maybe)</li>
              <li>That's it. That's the utility.</li>
              <li>Oh, and sometimes you can vote on proposals nobody reads</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Our Galaxy Brain Solutions 🧠</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">Three-Phase "Actually Makes Sense" Strategy</h4>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <p className="mb-2 text-gray-300">We're rolling out in phases because we're not psychopaths:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li><strong>Phase 1:</strong> HODL NFT = Get paid (monkey can do this)</li>
                <li><strong>Phase 2:</strong> Play game = Get paid more (gamers rise up)</li>
                <li><strong>Phase 3:</strong> Drive Tesla = Ultimate gains (this is the future)</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-purple-300 mb-2">Tokenomics That Don't Suck</h4>
            <p className="mb-2 text-gray-300">Our economic model is so balanced, it could do yoga:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Rewards that don't hyperinflate (math is hard, but we did it)</li>
              <li>Burns that actually burn (not just marketing BS)</li>
              <li>Multiple revenue streams (diversification, baby)</li>
              <li>Dynamic adjustments (we're not stupid)</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">Real Utility (Unlimited)</h4>
            <p className="mb-2 text-gray-300">TESOLA tokens serve actual utility functions:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Integration with sustainable transportation ecosystem</li>
              <li>Reward system for eco-conscious lifestyle choices</li>
              <li>Access to exclusive community resources and benefits</li>
              <li>Governance participation in ecosystem development</li>
            </ul>
          </section>

          {/* Ecosystem Architecture */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">3. Ecosystem Architecture</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Overview</h3>
            <p className="mb-4 text-gray-300">
              The TESOLA ecosystem is built on a modular architecture that enables seamless integration of different components while maintaining security and scalability. Our three-phase approach creates a versatile system where each module enhances the overall ecosystem value while functioning independently.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Core Components</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">1. Blockchain Layer</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li><strong>Network:</strong> Solana blockchain for high throughput and low fees</li>
              <li><strong>Token Standard:</strong> SPL token with immutable supply</li>
              <li><strong>Smart Contracts:</strong> Audited contracts for all ecosystem functions</li>
              <li><strong>Performance:</strong> 65,000+ TPS capability with sub-second finality</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">2. NFT Infrastructure</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li><strong>SOLARA Collection:</strong> 1,000 genesis NFTs with tiered benefits</li>
              <li><strong>Game NFTs:</strong> 2,000 vehicle NFTs for racing game</li>
              <li><strong>Verification System:</strong> On-chain metadata for tier validation</li>
              <li><strong>Marketplace Integration:</strong> Support for major Solana NFT platforms</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">3. Reward Distribution System</h4>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-4">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>Automated daily reward calculations</li>
                <li>Multi-signature treasury management</li>
                <li>Time-locked vesting schedules</li>
                <li>Dynamic reward adjustment mechanisms</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-purple-300 mb-2">4. Gaming Infrastructure</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li><strong>Game Engine:</strong> Unity WebGL for cross-platform compatibility</li>
              <li><strong>Backend Services:</strong> Node.js with Redis caching</li>
              <li><strong>Blockchain Integration:</strong> Web3.js for wallet connectivity</li>
              <li><strong>Tournament System:</strong> Smart contract-based prize distribution</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">5. Real-World Integration Layer</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li><strong>Vehicle Authentication:</strong> Cryptographic verification of Tesla ownership</li>
              <li><strong>GPS Data Processing:</strong> Secure tracking with privacy protection</li>
              <li><strong>Partner APIs:</strong> Integration with charging networks and services</li>
              <li><strong>Mobile Application:</strong> React Native for iOS and Android</li>
            </ul>
          </section>

          {/* Three-Phase Strategy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">4. The Master Plan (Don't Tell SEC) 🤫</h2>
            
            <p className="mb-4 text-gray-300">
              Unlike other projects that promise everything on day 1 and deliver nothing by day 365, we're taking the "actually build stuff" approach. Revolutionary, we know.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">The Sacred Timeline ⏰</h3>
            
            {/* Mobile swipe hint - only shown on small screens */}
            <div className="swipe-hint md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Swipe horizontally to see all data</span>
            </div>
            
            {/* Mobile card view - visible on mobile only */}
            <div className="block md:hidden space-y-4 mb-4">
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">HODL-to-Earn</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">When Moon?</span>
                    <span className="text-white">Q2 2025</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Status</span>
                    <span className="text-white">Live (LFG!)</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">TESOLA</span>
                    <span className="text-white">133M</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Game-to-Earn</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">When Moon?</span>
                    <span className="text-white">Q3 2025</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Status</span>
                    <span className="text-white">Building</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">TESOLA</span>
                    <span className="text-white">133M</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Drive-to-Earn</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">When Moon?</span>
                    <span className="text-white">2026</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Status</span>
                    <span className="text-white">Soon™</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">TESOLA</span>
                    <span className="text-white">134M</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto table-container mb-6 -mx-4 sm:mx-0">
              <div className="min-w-[640px] p-4 sm:p-0">
                <table className="w-full keep-structure">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Phase</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">When Moon?</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">TESOLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">HODL-to-Earn</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Q2 2025</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Live (LFG!)</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">133M</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Game-to-Earn</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Q3 2025</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Building</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">133M</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Drive-to-Earn</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">2026</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Soon™</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">134M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Why This Actually Works</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <p className="mb-2 text-gray-300">Our big brain strategy has some actual benefits:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>We don't YOLO everything at once (unlike your favorite shitcoin)</li>
                <li>Community can grow naturally (no forced shilling)</li>
                <li>Multiple ways to earn = multiple ways to moon</li>
                <li>Sustainable tokenomics (not oxymoron)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Success Metrics (Hopium Levels)</h3>
            
            {/* Mobile swipe hint - only shown on small screens */}
            <div className="swipe-hint md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Swipe horizontally to see all data</span>
            </div>
            
            {/* Mobile card view - visible on mobile only */}
            <div className="block md:hidden space-y-4 mb-4">
              {/* Active Degens Metric */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Active Degens</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 1</span>
                    <span className="text-white">2,000+</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 2</span>
                    <span className="text-white">10,000+</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Phase 3</span>
                    <span className="text-white">25,000+</span>
                  </li>
                </ul>
              </div>
              
              {/* Daily Volume Metric */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Daily Volume</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 1</span>
                    <span className="text-white">$10K</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 2</span>
                    <span className="text-white">$50K</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Phase 3</span>
                    <span className="text-white">$100K</span>
                  </li>
                </ul>
              </div>
              
              {/* Diamond Hands Metric */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Diamond Hands</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 1</span>
                    <span className="text-white">5,000+</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Phase 2</span>
                    <span className="text-white">20,000+</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Phase 3</span>
                    <span className="text-white">50,000+</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto table-container mb-6 -mx-4 sm:mx-0">
              <div className="min-w-[640px] p-4 sm:p-0">
                <table className="w-full keep-structure">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Metric</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Phase 1</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Phase 2</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Phase 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Active Degens</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">2,000+</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">10,000+</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">25,000+</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Daily Volume</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">$10K</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">$50K</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">$100K</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Diamond Hands</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">5,000+</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">20,000+</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">50,000+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Resource Allocation (We Have a Budget!)</h3>
            <p className="mb-2 text-gray-300">Unlike projects that spend 90% on marketing and 10% on "development" (Twitter spaces), we actually allocate resources properly:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li><strong>Dev Team:</strong> 5+ code monkeys dedicated to the project</li>
              <li><strong>Marketing:</strong> Actual strategy beyond "WAGMI" tweets</li>
              <li><strong>Security:</strong> More audits than your tax returns</li>
              <li><strong>Community:</strong> Mods that don't sleep (they're probably bots)</li>
            </ul>
          </section>

          {/* HODL-to-Earn Phase */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">4.1 HODL-to-Earn (Free Money Glitch) 💎🙌</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Status: Printing Money 🖨️💰</h3>
            <p className="mb-4 text-gray-300">
              While other projects are still writing whitepapers about their whitepapers, we're already distributing tokens. Built different.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">NFT Staking = Easy Mode</h3>
            
            {/* Mobile swipe hint - only shown on small screens */}
            <div className="swipe-hint md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Swipe horizontally to see all data</span>
            </div>
            
            {/* Mobile card view - visible on mobile only */}
            <div className="block md:hidden space-y-4 mb-4">
              {/* Legendary Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-yellow-300">
                <h4 className="text-lg font-medium text-yellow-300">Legendary 👑</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Rarity</span>
                    <span className="text-white">50</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Daily</span>
                    <span className="text-white">200</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Monthly</span>
                    <span className="text-white">6,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Yearly</span>
                    <span className="text-white">73,000</span>
                  </li>
                </ul>
              </div>
              
              {/* Epic Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-purple-300">
                <h4 className="text-lg font-medium text-purple-300">Epic 🔥</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Rarity</span>
                    <span className="text-white">100</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Daily</span>
                    <span className="text-white">100</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Monthly</span>
                    <span className="text-white">3,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Yearly</span>
                    <span className="text-white">36,500</span>
                  </li>
                </ul>
              </div>
              
              {/* Rare Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-300">
                <h4 className="text-lg font-medium text-blue-300">Rare 💎</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Rarity</span>
                    <span className="text-white">250</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Daily</span>
                    <span className="text-white">50</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Monthly</span>
                    <span className="text-white">1,500</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Yearly</span>
                    <span className="text-white">18,250</span>
                  </li>
                </ul>
              </div>
              
              {/* Common Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-green-300">
                <h4 className="text-lg font-medium text-green-300">Common 🌱</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Rarity</span>
                    <span className="text-white">600</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Daily</span>
                    <span className="text-white">25</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Monthly</span>
                    <span className="text-white">750</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Yearly</span>
                    <span className="text-white">9,125</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto table-container mb-6 -mx-4 sm:mx-0">
              <div className="min-w-[700px] p-4 sm:p-0">
                <table className="w-full keep-structure">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">NFT Tier</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Rarity</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Daily</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Monthly</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Yearly</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-yellow-300 font-medium">Legendary 👑</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">50</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">200</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">6,000</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">73,000</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-purple-300 font-medium">Epic 🔥</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">100</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">100</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">3,000</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">36,500</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-blue-300 font-medium">Rare 💎</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">250</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">50</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">1,500</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">18,250</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-green-300 font-medium">Common 🌱</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">600</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">25</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">750</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">9,125</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Bonus System (Because We're Not Greedy... Yet)</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">Early Bird Gets the Gains 🐦</h4>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-4">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li><strong>Days 1-7:</strong> 2X rewards (FOMO intensifies)</li>
                <li><strong>Days 8-14:</strong> 1.75X rewards (still early anon)</li>
                <li><strong>Days 15-30:</strong> 1.5X rewards (better than nothing)</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-purple-300 mb-2">Diamond Hands Rewards 💎✋</h4>
            
            {/* Mobile swipe hint - only shown on small screens */}
            <div className="swipe-hint md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Swipe horizontally to see all data</span>
            </div>
            
            {/* Mobile card view - visible on mobile only */}
            <div className="block md:hidden space-y-4 mb-4">
              {/* 30+ days Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">30+ days</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Bonus</span>
                    <span className="text-white">+20%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Extra Perks</span>
                    <span className="text-white">Monthly airdrops</span>
                  </li>
                </ul>
              </div>
              
              {/* 90+ days Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">90+ days</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Bonus</span>
                    <span className="text-white">+40%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Extra Perks</span>
                    <span className="text-white">Game NFT whitelist</span>
                  </li>
                </ul>
              </div>
              
              {/* 180+ days Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">180+ days</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Bonus</span>
                    <span className="text-white">+70%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Extra Perks</span>
                    <span className="text-white">2x DAO votes</span>
                  </li>
                </ul>
              </div>
              
              {/* 365+ days Card */}
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">365+ days</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Bonus</span>
                    <span className="text-white">+100%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Extra Perks</span>
                    <span className="text-white">OG status + swag</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto table-container mb-6 -mx-4 sm:mx-0">
              <div className="min-w-[640px] p-4 sm:p-0">
                <table className="w-full keep-structure">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">HODL Period</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Bonus</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Extra Perks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">30+ days</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">+20%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Monthly airdrops</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">90+ days</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">+40%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Game NFT whitelist</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">180+ days</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">+70%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">2x DAO votes</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">365+ days</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">+100%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">OG status + swag</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-green-900/30 border border-green-500/40 p-4 rounded-lg mb-6">
              <h4 className="text-lg font-medium text-green-300 mb-2">The Real Truth About APY 📊</h4>
              <p className="text-gray-300 mb-2">Why we offer 73-219% APY instead of some ridiculous 10,000% number:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>Our math actually checks out (we use real formulas, not hopium)</li>
                <li>Backed by our token allocation (no money printer go brrr)</li>
                <li>Dynamic adjustment based on staking participation</li>
                <li>Transparent calculations you can verify on-chain</li>
              </ul>
              <p className="text-gray-300 mt-2 italic">Remember: When projects promise astronomical returns, the question isn't "wen moon" but "wen rug"</p>
            </div>
          </section>

          {/* Game Drive-to-Earn Phase */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">4.2 Game Drive-to-Earn (Mario Kart on Steroids) 🎮</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Status: BUIDLING (Not a Typo) 🏗️</h3>
            <p className="mb-4 text-gray-300">
              We're making a racing game that doesn't suck. Your grandma's Facebook games could never.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Release Schedule (Trust Me Bro)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Milestone</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Target Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Alpha Test</td>
                    <td className="py-3 px-4 text-white">Q2 2025</td>
                    <td className="py-3 px-4 text-white">Devs playing (and winning)</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Closed Beta</td>
                    <td className="py-3 px-4 text-white">Q3 2025</td>
                    <td className="py-3 px-4 text-white">NFT holders only (VIP club)</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">NFT Drop</td>
                    <td className="py-3 px-4 text-white">Q3 2025</td>
                    <td className="py-3 px-4 text-white">Prepare your SOL</td>
                  </tr>
                  <tr className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Public Launch</td>
                    <td className="py-3 px-4 text-white">Q4 2025</td>
                    <td className="py-3 px-4 text-white">Wen moon? Then.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Game Features (Actually Good Ones)</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">Core Gameplay</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Racing that requires actual skill (no pay-to-win BS)</li>
              <li>Vehicle customization (pimp your ride)</li>
              <li>Real-time PvP (lag is a feature)</li>
              <li>Strategic boosts (blue shell PTSD intensifies)</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">NFT Cars (Not Your Average JPEGs)</h4>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-4">
              <p className="mb-2 text-white font-semibold">Limited Edition: 2,000 Racing NFTs</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>Legendary: 100 NFTs</li>
                <li>Epic: 250 NFTs</li>
                <li>Rare: 650 NFTs</li>
                <li>Common: 1,000 NFTs</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-purple-300 mb-2">Tournament System (Esports When?)</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Tournament</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Frequency</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Prize Pool</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Entry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Daily Degen Race</td>
                    <td className="py-3 px-4 text-white">Every 24h</td>
                    <td className="py-3 px-4 text-white">5,000 TESOLA</td>
                    <td className="py-3 px-4 text-white">Any NFT</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Weekly Championship</td>
                    <td className="py-3 px-4 text-white">Sundays</td>
                    <td className="py-3 px-4 text-white">50,000 TESOLA</td>
                    <td className="py-3 px-4 text-white">Top 100 racers</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Monthly Grand Prix</td>
                    <td className="py-3 px-4 text-white">Last weekend</td>
                    <td className="py-3 px-4 text-white">200,000 TESOLA</td>
                    <td className="py-3 px-4 text-white">Rare+ NFTs</td>
                  </tr>
                  <tr className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Quarterly Moon Race</td>
                    <td className="py-3 px-4 text-white">Every 3 months</td>
                    <td className="py-3 px-4 text-white">1,000,000 TESOLA</td>
                    <td className="py-3 px-4 text-white">Qualification</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">P2E Economics (Yes, You Can Quit Your Job)</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">Revenue Sources</h4>
            <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-300">
              <li><strong>NFT Sales:</strong> Primary market go brrrr</li>
              <li><strong>Skins & Upgrades:</strong> Look good, race better</li>
              <li><strong>Tournament Fees:</strong> Pay to play, win to earn</li>
              <li><strong>Season Pass:</strong> Because recurring revenue</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Reward Distribution</h3>
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-purple-300 mb-4">How We Share the Pie 🥧</h4>
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-4 sm:mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Daily Activities: 30% (108 degrees) */}
                    <path d="M50,50 L50,0 A50,50 0 0,1 93.3,75 Z" fill="#3b82f6"/>
                    {/* Tournaments: 40% (144 degrees) */}
                    <path d="M50,50 L93.3,75 A50,50 0 0,1 6.7,75 Z" fill="#8b5cf6"/>
                    {/* Skill-based: 30% (108 degrees) */}
                    <path d="M50,50 L6.7,75 A50,50 0 0,1 50,0 Z" fill="#6366f1"/>
                    {/* Center circle */}
                    <circle cx="50" cy="50" r="25" fill="#111827"/>
                    <text x="50" y="50" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">TESOLA</text>
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <div className="w-4 h-4 rounded bg-blue-500 mx-auto sm:mx-0"></div>
                    <span className="text-gray-300 text-xs sm:text-sm text-center sm:text-left">Daily: 30%</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <div className="w-4 h-4 rounded bg-purple-500 mx-auto sm:mx-0"></div>
                    <span className="text-gray-300 text-xs sm:text-sm text-center sm:text-left">Tourney: 40%</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <div className="w-4 h-4 rounded bg-indigo-500 mx-auto sm:mx-0"></div>
                    <span className="text-gray-300 text-xs sm:text-sm text-center sm:text-left">Skill: 30%</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Token Burn Mechanism</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-4">
              <p className="mb-2 text-gray-300">30% of all game revenue is allocated to token buyback and burn:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>NFT marketplace fees: 2.5% of all transactions</li>
                <li>In-game purchases: Direct burn from revenue</li>
                <li>Tournament entry fees: 50% burned, 50% to prize pool</li>
              </ul>
            </div>
          </section>

          {/* Real Drive-to-Earn Phase */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">4.3 Real Drive-to-Earn (Actually Driving = Actually Earning) 🚗💨</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Status: Soon™ (No, Seriously) 🔜</h3>
            <p className="mb-4 text-gray-300">
              The final form of our master plan: Your Tesla becomes a money printer. Elon would be proud (probably).
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Roadmap to Riches</h3>
            <div className="relative border-l-2 border-purple-600 pl-8 space-y-8 py-2 mb-6">
              <div className="relative">
                <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">2026 Q1: Tesla Owner Verification</h4>
                <p className="text-gray-300">Prove you're not a poor (in the nicest way possible)</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">2026 Q2: GPS Goes Brrr</h4>
                <p className="text-gray-300">We track your driving (not in a creepy way)</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">2026 Q3: Charging Network Integration</h4>
                <p className="text-gray-300">Get paid while your car gets juiced</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-10 mt-1.5 w-5 h-5 rounded-full bg-purple-600"></div>
                <h4 className="text-lg font-medium text-purple-300 mb-2">2026 Q4: Full Launch</h4>
                <p className="text-gray-300">Your Tesla = ATM machine</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">How It Works (ELI5 Version)</h3>
            
            <h4 className="text-lg font-medium text-purple-300 mb-2">Step 1: Flex Your Tesla</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-300">
              <li>Connect your Tesla (we verify you're not driving a Prius)</li>
              <li>Get exclusive Tesla NFT badge (flex on peasants)</li>
              <li>Join the elite Tesla-crypto club</li>
            </ul>

            <h4 className="text-lg font-medium text-purple-300 mb-2">Step 2: Drive & Earn</h4>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li><strong>Every Mile:</strong> Earn TESOLA (gas stations hate this trick)</li>
                <li><strong>Eco Driving:</strong> Drive like grandma, earn like a whale</li>
                <li><strong>Charging Rewards:</strong> Get paid to charge (reverse electricity bill)</li>
                <li><strong>Community Events:</strong> Tesla meetups = money conventions</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Partnership Strategy (Not Delusional)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Target</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Approach</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Timeline</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Copium Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Tesla Clubs</td>
                    <td className="py-3 px-4 text-white">Community outreach</td>
                    <td className="py-3 px-4 text-white">2026 Q1</td>
                    <td className="py-3 px-4 text-white">Realistic</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Tesla YouTubers</td>
                    <td className="py-3 px-4 text-white">Sponsorships</td>
                    <td className="py-3 px-4 text-white">2026 Q2</td>
                    <td className="py-3 px-4 text-white">Moderate</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Charging Networks</td>
                    <td className="py-3 px-4 text-white">B2B partnerships</td>
                    <td className="py-3 px-4 text-white">2026 Q3</td>
                    <td className="py-3 px-4 text-white">Ambitious</td>
                  </tr>
                  <tr className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Elon Himself</td>
                    <td className="py-3 px-4 text-white">Twitter DMs</td>
                    <td className="py-3 px-4 text-white">2027+</td>
                    <td className="py-3 px-4 text-white">Maximum</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Reward Structure (Get Rich Quick Scheme)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Activity</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Base Reward</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Bonus Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Per Mile Driven</td>
                    <td className="py-3 px-4 text-white">0.1 TESOLA</td>
                    <td className="py-3 px-4 text-white">2x for eco-driving</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Charging Session</td>
                    <td className="py-3 px-4 text-white">10 TESOLA</td>
                    <td className="py-3 px-4 text-white">1.5x at partner stations</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Community Event</td>
                    <td className="py-3 px-4 text-white">100 TESOLA</td>
                    <td className="py-3 px-4 text-white">2x for organizers</td>
                  </tr>
                  <tr className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Monthly Challenge</td>
                    <td className="py-3 px-4 text-white">500 TESOLA</td>
                    <td className="py-3 px-4 text-white">Speed bonus available</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-red-900/30 border border-red-500/40 p-4 rounded-lg mb-6">
              <p className="text-gray-300 mb-0"><strong className="text-white">Legal Stuff:</strong> Real Drive-to-Earn is subject to partnerships, regulations, and Elon's mood. Features may change based on reality checks. All partnerships are currently in our imagination.</p>
            </div>
          </section>

          {/* Tokenomics */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">5. Tokenomics</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">Token Specifications</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Parameter</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Token Name</td>
                    <td className="py-3 px-4 text-white">TESOLA</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Symbol</td>
                    <td className="py-3 px-4 text-white">TSL</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Blockchain</td>
                    <td className="py-3 px-4 text-white">Solana</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Token Standard</td>
                    <td className="py-3 px-4 text-white">SPL Token</td>
                  </tr>
                  <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Total Supply</td>
                    <td className="py-3 px-4 text-white">1,000,000,000 TESOLA</td>
                  </tr>
                  <tr className="hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 text-white">Contract Type</td>
                    <td className="py-3 px-4 text-white">Immutable Supply</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Key Token Metrics</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 mb-6">
              <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Initial FDV</span>
                <div className="text-base sm:text-xl font-bold text-white">$6M</div>
              </div>
              <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Initial Cap</span>
                <div className="text-base sm:text-xl font-bold text-white">$600K</div>
              </div>
              <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Circulation</span>
                <div className="text-base sm:text-xl font-bold text-white">10%</div>
              </div>
              <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-400">Launch (SOL)</span>
                <div className="text-base sm:text-xl font-bold text-white">0.000005</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Token Distribution</h3>
            <div className="mb-6">
              <div className="mb-4">
                {/* Bar chart showing token distribution */}
                <div className="max-w-lg mx-auto mb-6">
                  {/* HODL: 40% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">HODL-to-Earn</span>
                      <span className="text-white">40%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-blue-500 h-4 sm:h-5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  
                  {/* Liquidity: 20% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">Liquidity</span>
                      <span className="text-white">20%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-emerald-500 h-4 sm:h-5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  
                  {/* Team: 15% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">Team</span>
                      <span className="text-white">15%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-indigo-500 h-4 sm:h-5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  
                  {/* Marketing: 10% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">Marketing</span>
                      <span className="text-white">10%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-purple-500 h-4 sm:h-5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                  
                  {/* Presale: 10% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">Presale</span>
                      <span className="text-white">10%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-pink-500 h-4 sm:h-5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                  
                  {/* DAO: 5% */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-white font-medium">DAO</span>
                      <span className="text-white">5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 sm:h-5">
                      <div className="bg-amber-500 h-4 sm:h-5 rounded-full" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                </div>
                
                {/* Token amounts - moved to a cleaner grid layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center max-w-lg mx-auto">
                  <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-2 rounded border border-blue-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">HODL: 400M</span>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 p-2 rounded border border-emerald-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">Liquidity: 200M</span>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-800/30 p-2 rounded border border-indigo-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">Team: 150M</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-2 rounded border border-purple-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">Marketing: 100M</span>
                  </div>
                  <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/30 p-2 rounded border border-pink-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">Presale: 100M</span>
                  </div>
                  <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/30 p-2 rounded border border-amber-500/30">
                    <span className="text-xs sm:text-sm text-gray-300">DAO: 50M</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Vesting Schedule</h3>
            
            {/* Mobile swipe hint - only shown on small screens */}
            <div className="swipe-hint md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Swipe horizontally to see all data</span>
            </div>
            
            {/* Mobile card view - visible on mobile only */}
            <div className="block md:hidden space-y-4 mb-4">
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Team</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">15%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">0%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">12m cliff, 36m linear</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Presale</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">10%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">25%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">3m linear (75%)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Marketing</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">10%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">Gradual</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">As needed</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">HODL</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">40%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">0%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">24-48m phased</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">Liquidity</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">20%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">30%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">12m gradual</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <h4 className="text-lg font-medium text-white">DAO</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Allocation</span>
                    <span className="text-white">5%</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Initial</span>
                    <span className="text-white">0%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Vesting</span>
                    <span className="text-white">Community gov.</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto table-container mb-6 -mx-4 sm:mx-0">
              <div className="min-w-[700px] p-4 sm:p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Category</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Allocation</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Initial</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium">Vesting</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Team</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">15%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">0%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">12m cliff, 36m linear</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Presale</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">10%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">25%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">3m linear (75%)</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Marketing</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">10%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Gradual</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">As needed</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">HODL</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">40%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">0%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">24-48m phased</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Liquidity</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">20%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">30%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">12m gradual</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">DAO</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">5%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">0%</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-white">Community gov.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Value Protection Mechanisms</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/20 mb-6">
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>30% of game NFT sales revenue allocated to token buyback and burn</li>
                <li>25% of platform trading fees permanently removed from circulation</li>
                <li>Quarterly burn events based on ecosystem performance</li>
                <li>Community-voted special burn initiatives</li>
              </ul>
            </div>
          </section>

          {/* Legal Disclaimer */}
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Legal Disclaimer</h2>
            
            <div className="bg-gray-900/50 p-4 rounded-lg text-sm border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-2">Important Notice</h3>
              <p className="text-gray-400 mb-4">
                <strong>PLEASE READ THIS SECTION CAREFULLY.</strong> This whitepaper is for informational purposes only and does not constitute financial advice, 
                investment recommendations, or an offer to sell any securities or tokens. TESOLA tokens are utility 
                tokens designed for use within our ecosystem and do not represent any ownership stake, equity, 
                or rights to future profits. Cryptocurrency investments involve significant risk, and users should 
                conduct their own research before participating in the TESOLA ecosystem.
              </p>
              <p className="text-gray-400">
                © 2025 TESOLA. All rights reserved. Version 2.0 - May 2025
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}