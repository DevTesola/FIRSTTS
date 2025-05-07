import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Introduction() {
  // 페이지 로드 시 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>TESOLA - The REAL Story</title>
        <meta name="description" content="The real story behind the TESOLA NFT project" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/30 border border-purple-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              The REAL TESOLA Story
            </h1>
            <span className="text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-lg text-sm">Degen Edition | 2025 💎</span>
          </div>

          <div className="space-y-8 text-gray-300">
            {/* Welcome Section */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Welcome to the Truth Zone 🎯</h2>
              <p className="mb-4">
                Yo degens! You clicked on "The REAL Story" instead of our normie whitepaper? NGMI! 🧠 
                That 22-page snoozer is what we show to boring VCs and exchanges. This is the BASED version 
                for the real ones - the full story, zero BS, maximum degen energy. WAGMI!
              </p>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "Finally, a crypto project that doesn't pretend to be the next Bitcoin. We're just here to make all of us obscenely rich." 🤑
                </p>
              </div>
            </section>

            {/* Why Different Section */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Why TESOLA is Different</h2>
              <p className="mb-4">
                We're not here with some cringe "we're going to save the world" narrative. 💩 
                We're here to build a degen-AF meme coin with actual utility, chad tokenomics, 
                and a community of absolute degens who understand the vibes. GM! 🔥
              </p>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">The TESOLA Difference:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Clear 15% team allocation (no hidden wallets)</li>
                  <li>Realistic APY based on actual math</li>
                  <li>Working products before promises</li>
                  <li>Community-first approach</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white mb-3">What We're Building</h3>
                <ul className="list-disc pl-6 space-y-3">
                  <li><span className="font-bold text-white">A meme with meaning:</span> Tesla + Solana = TESOLA</li>
                  <li><span className="font-bold text-white">Real utility:</span> NFT staking, gaming, and future Tesla integration</li>
                  <li><span className="font-bold text-white">Sustainable ecosystem:</span> Carefully planned tokenomics</li>
                  <li><span className="font-bold text-white">Strong community:</span> Degens who understand crypto</li>
                </ul>
              </div>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg mt-6">
                <p className="text-green-300">
                  <span className="font-bold">DISCLAIMER:</span> This is still a high-risk crypto investment. 
                  Please invest responsibly and never more than you can afford to lose. We believe in our 
                  project, but crypto markets are volatile.
                </p>
              </div>
            </section>

            {/* Team Allocation Truth */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">The 15% Transparency Revolution 💡</h2>
              
              <h3 className="text-xl font-bold text-white mb-3">Why We Take 15% (And Don't Hide It)</h3>
              <p className="mb-4">
                While other projects play hide-and-seek with their team tokens, we believe in radical 
                transparency. Yes, we take 15% - and here's exactly why and how.
              </p>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg my-6">
                <h3 className="text-lg font-bold text-white mb-3">The Crypto Industry's Dirty Secret:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 bg-red-900/30 text-red-300 font-medium">What They Say</th>
                        <th className="text-left py-3 px-4 bg-red-900/30 text-red-300 font-medium">What They Do</th>
                        <th className="text-left py-3 px-4 bg-green-900/30 text-green-300 font-medium">What We Do</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 bg-red-900/20 text-white font-medium">"Fair Launch"</td>
                        <td className="py-3 px-4 bg-red-900/20 text-red-300">Multiple hidden wallets</td>
                        <td className="py-3 px-4 bg-green-900/20 text-green-300 font-medium">15% clearly allocated</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 bg-red-900/20 text-white font-medium">"No Team Tokens"</td>
                        <td className="py-3 px-4 bg-red-900/20 text-red-300">Team buys with insider info</td>
                        <td className="py-3 px-4 bg-green-900/20 text-green-300 font-medium">Team tokens fully visible</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 bg-red-900/20 text-white font-medium">"Community Driven"</td>
                        <td className="py-3 px-4 bg-red-900/20 text-red-300">Centralized decisions</td>
                        <td className="py-3 px-4 bg-green-900/20 text-green-300 font-medium">Transparent governance</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 bg-red-900/20 text-white font-medium">"Renounced Contract"</td>
                        <td className="py-3 px-4 bg-red-900/20 text-red-300">Can't fix or improve</td>
                        <td className="py-3 px-4 bg-green-900/20 text-green-300 font-medium">Maintained for upgrades</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Our 15% Commitment</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>12-month cliff (we can't sell immediately)</li>
                <li>36-month vesting (aligned with long-term success)</li>
                <li>All wallets publicly trackable</li>
                <li>Multi-sig security (no single person can dump)</li>
              </ul>
              
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg my-6 font-mono text-sm overflow-x-auto">
                <p className="text-green-400">// How others handle team allocation</p>
                <p className="text-purple-400">function <span className="text-yellow-300">getTeamTokens</span>() {'{'}</p>
                <p className="pl-4">return <span className="text-blue-300">"0%"</span>; <span className="text-green-400">// But actually 50% in hidden wallets</span></p>
                <p>{'}'}</p>
                <p className="mt-4 text-green-400">// Our approach</p>
                <p className="text-purple-400">function <span className="text-yellow-300">getTeamTokens</span>() {'{'}</p>
                <p className="pl-4">return <span className="text-blue-300">"15%"</span>; <span className="text-green-400">// What you see is what you get</span></p>
                <p>{'}'}</p>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-3">Why This Works Better:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Incentivizes long-term development</li>
                  <li>Builds trust through transparency</li>
                  <li>Prevents rug pulls (we're locked too!)</li>
                  <li>Aligns team and community interests</li>
                </ul>
              </div>
            </section>

            {/* Real APY */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Real APY, Real Math 📊</h2>
              
              <h3 className="text-xl font-bold text-white mb-3">Why 73-219% APY is Actually Sustainable</h3>
              <p className="mb-4">
                In a world of "10,000% APY" promises, we chose to do something radical: use actual mathematics.
              </p>
              
              <div className="bg-red-900/20 border-l-4 border-red-500/50 p-4 rounded-lg my-4">
                <p className="text-white">
                  When projects promise astronomical returns, ask yourself: Where does the money come from?
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">The APY Reality Check</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">APY Promised</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Math Says</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Likely Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">1,000,000%</td>
                      <td className="py-3 px-4 text-red-400">Mathematically impossible</td>
                      <td className="py-3 px-4 text-white">Rug in days</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">100,000%</td>
                      <td className="py-3 px-4 text-red-400">Unsustainable inflation</td>
                      <td className="py-3 px-4 text-white">Token price collapse</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">10,000%</td>
                      <td className="py-3 px-4 text-red-400">Hyperinflation guaranteed</td>
                      <td className="py-3 px-4 text-white">Dead project in weeks</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-green-400 font-semibold">73-219% (TESOLA)</td>
                      <td className="py-3 px-4 text-green-400">Sustainable with our tokenomics</td>
                      <td className="py-3 px-4 text-green-400 font-semibold">Long-term viability</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">How Our Smart Contract Handles APY</h3>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg my-6 font-mono text-sm overflow-x-auto">
                <p className="text-purple-400">function <span className="text-yellow-300">calculateRewards</span>() {'{'}</p>
                <p className="pl-4 text-green-400">// Automated, unchangeable calculations</p>
                <p className="pl-4">const baseRate = getBaseRate();</p>
                <p className="pl-4">const nftTier = getNFTTier(user);</p>
                <p className="pl-4">const timeHeld = getStakingDuration(user);</p>
                <p className="pl-4"></p>
                <p className="pl-4 text-green-400">// Math doesn't lie, and neither can we</p>
                <p className="pl-4">return baseRate * nftTier * timeHeld;</p>
                <p>{'}'}</p>
                <p className="text-green-400">// No manual overrides, no hidden multipliers</p>
              </div>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-3">Our APY Safeguards:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Smart contract enforced (we can't change it)</li>
                  <li>Based on allocated reward pool</li>
                  <li>Automatic adjustments for sustainability</li>
                  <li>Transparent calculation methods</li>
                </ul>
              </div>
            </section>

            {/* Roadmap Reality */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Our Realistic Roadmap 🗺️</h2>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "Under-promise and over-deliver" - Ancient Crypto Wisdom
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Phase 1: Hold-to-Earn (Live Now! ✅)</h3>
              <p className="mb-1"><strong className="text-white">Promise:</strong> Stake NFTs, earn TESOLA</p>
              <p className="mb-3"><strong className="text-white">Reality:</strong> Working smart contracts, daily rewards, happy holders</p>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">What We've Delivered:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>✅ Audited smart contracts</li>
                  <li>✅ 1,000 NFTs successfully minted</li>
                  <li>✅ Automated reward distribution</li>
                  <li>✅ Transparent staking dashboard</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Phase 2: Game-to-Earn (Q3 2025)</h3>
              <p className="mb-1"><strong className="text-white">Promise:</strong> Electric vehicle racing game</p>
              <p className="mb-3"><strong className="text-white">Reality:</strong> In active development, playable alpha ready</p>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Feature</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Game Engine</td>
                      <td className="py-3 px-4 text-white">Development</td>
                      <td className="py-3 px-4 text-white">Q2 2025</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">NFT Integration</td>
                      <td className="py-3 px-4 text-white">Planned</td>
                      <td className="py-3 px-4 text-white">Q3 2025</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Multiplayer</td>
                      <td className="py-3 px-4 text-white">Design Phase</td>
                      <td className="py-3 px-4 text-white">Q4 2025</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Tournaments</td>
                      <td className="py-3 px-4 text-white">Conceptual</td>
                      <td className="py-3 px-4 text-white">2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Phase 3: Drive-to-Earn (2026)</h3>
              <p className="mb-1"><strong className="text-white">The Vision:</strong> Connect real Tesla vehicles for rewards</p>
              <p className="mb-3"><strong className="text-white">The Challenge:</strong> Technical and legal complexities</p>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Honest Assessment:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Technically feasible with API integration</li>
                  <li>Legal discussions ongoing</li>
                  <li>Community partnerships in negotiation</li>
                  <li>May pivot based on regulatory feedback</li>
                </ul>
              </div>
            </section>
            
            {/* Community Power-Up */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">The Community Power-Up System</h2>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "Community = Rocket Fuel 🚀"<br />
                  More degens = Faster development<br />
                  No degens = No moon mission
                </p>
              </div>
              
              <p className="mb-4">
                Here's the deal: Our roadmap isn't set in stone. It's powered by YOU.
              </p>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Community Milestones = Speed Boosts:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>10,000 holders → Game development +50% speed</li>
                  <li>25,000 Discord members → Hire 2 more devs</li>
                  <li>50,000 Twitter followers → Major exchange listing</li>
                  <li>100,000 holders → Elon might notice us (maybe)</li>
                </ul>
              </div>
              
              <div className="bg-red-900/20 border-l-4 border-red-500/50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">The Brutal Truth:</h3>
                <p className="text-gray-300">
                  No community = No project. If you're reading this alone in 2026, congrats on finding a dead project. 
                  But if we grow together, we can hit these milestones EARLY.
                </p>
              </div>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Community Size</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Development Speed</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Feature Unlock</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Ghost Town</td>
                      <td className="py-3 px-4 text-red-400">☠️ Dead</td>
                      <td className="py-3 px-4 text-white">Nothing happens</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Small Village</td>
                      <td className="py-3 px-4 text-yellow-400">🐌 Slow</td>
                      <td className="py-3 px-4 text-white">Basic features only</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">Busy City</td>
                      <td className="py-3 px-4 text-blue-400">🏃‍♂️ Normal</td>
                      <td className="py-3 px-4 text-white">All planned features</td>
                    </tr>
                    <tr className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 px-4 text-white">DEGEN NATION</td>
                      <td className="py-3 px-4 text-green-400">🚀 TURBO</td>
                      <td className="py-3 px-4 text-white">Moon features unlocked</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center">
                <p className="text-yellow-300 font-bold">
                  "Every share = 1 day closer to launch"<br />
                  "Every new member = 1 step closer to moon"<br />
                  "Every meme = Elon 1% more likely to notice"
                </p>
              </div>
            </section>

            {/* Why Buy */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Why TESOLA Makes Sense 🎯</h2>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "Not just another dog coin in a sea of dogs"
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">The Investment Case</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong className="text-white">Unique positioning:</strong> First electric vehicle gaming ecosystem</li>
                <li><strong className="text-white">Sustainable tokenomics:</strong> Math-based, not hype-based</li>
                <li><strong className="text-white">Transparent team:</strong> Public allocation, locked tokens</li>
                <li><strong className="text-white">Working products:</strong> NFT staking live and paying rewards</li>
                <li><strong className="text-white">Growth potential:</strong> Gaming and real-world utility planned</li>
              </ul>
              
              <h3 className="text-xl font-bold text-white mb-3">Risk vs. Reward Analysis</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 bg-red-900/30 text-red-300 font-medium">Risk Factors</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Our Mitigation</th>
                      <th className="text-left py-3 px-4 bg-green-900/30 text-green-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="py-3 px-4 bg-red-900/20 text-white">Team dumps tokens</td>
                      <td className="py-3 px-4 text-white">12-month cliff + vesting</td>
                      <td className="py-3 px-4 bg-green-900/20 text-green-300">✅ Implemented</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-3 px-4 bg-red-900/20 text-white">Unsustainable APY</td>
                      <td className="py-3 px-4 text-white">Math-based rewards</td>
                      <td className="py-3 px-4 bg-green-900/20 text-green-300">✅ Verified</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-3 px-4 bg-red-900/20 text-white">No real utility</td>
                      <td className="py-3 px-4 text-white">NFT staking + gaming</td>
                      <td className="py-3 px-4 bg-green-900/20 text-green-300">✅ Staking Live</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-3 px-4 bg-red-900/20 text-white">Legal issues</td>
                      <td className="py-3 px-4 text-white">Legal counsel engaged</td>
                      <td className="py-3 px-4 bg-yellow-900/20 text-yellow-300">⚠️ Ongoing</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 bg-red-900/20 text-white">Development delays</td>
                      <td className="py-3 px-4 text-white">Phased approach</td>
                      <td className="py-3 px-4 bg-green-900/20 text-green-300">✅ On track</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Community Benefits</h3>
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">What You Get:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Early access to all features</li>
                  <li>Governance voting rights</li>
                  <li>Priority in NFT sales</li>
                  <li>Community event rewards</li>
                  <li>Direct team communication</li>
                </ul>
              </div>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-3">Fair Warning:</h3>
                <p className="text-gray-300">
                  TESOLA is still a high-risk cryptocurrency investment. While we're building real utility 
                  and have sustainable tokenomics, the crypto market is volatile and unpredictable. 
                  Never invest more than you can afford to lose.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Real Questions, Real Answers ❓</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: Why should I trust you with 15%?</h3>
                  <p>
                    A: Because we don't hide it like those virgin projects do. 😎 Our tokens are locked for 12 months, then vest over 3 years. 
                    You can track every team wallet on-chain. Rug protection 101. We're here for generational wealth, not quick dumps. HODL gang! 🔒
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: Why only 73-219% APY?</h3>
                  <p>
                    A: Because we're not virgin rug-pullers printing quintillion% APY. Chad projects use real math, not fantasy numbers.
                    Those 1000000% APY projects? They're speedrunning to zero while we're building moon bags that actually last. IYKYK. 🧮
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: Is this related to Tesla Inc?</h3>
                  <p>
                    A: Our devs are Tesla car owners and Tesla enthusiasts! Plus, we're a team of Solana maximalists. 
                    Need we say more? TESOLA is the crystallization of our love for Tesla, our passion as Tesla car owners 
                    hoping for success, and our absolute obsession with Solana's technology. LFG! 🚀
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: When will the game launch?</h3>
                  <p>
                    A: Beta testing begins Q3 2025, full launch Q4 2025. We're already in development 
                    and will share progress updates regularly.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: Is the team doxxed?</h3>
                  <p>
                    A: Anon team, based AF. We value results over faces. The core devs have built multiple 
                    successful projects but prefer to stay anon to avoid the spotlight (and angry VCs). 
                    Our wallets are public though - track every move we make on-chain. Trust the code, not the faces. 💎🙌
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: What makes you different from other meme coins?</h3>
                  <p>
                    A: We're not another Elon dog token with zero utility. 🐕 We're building shit that actually works,
                    with tokenomics that don't implode, and a community of absolute chads. While others rug, we build. 
                    While they dump, we stack. IYKYK. 🧱
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: Can I really earn by driving my Tesla?</h3>
                  <p>
                    A: Ser, this is our final boss level (2026). 🦾 We gotta build the tech and navigate the legal BS first.
                    But imagine flexing on normies by earning crypto JUST BY DRIVING YOUR TESLA. Peak degen energy right there! ⚡
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Q: What if Elon tweets about you?</h3>
                  <p>
                    A: Then we're all drinking champagne on our yachts, fren! 🍾 But we're not some virgin project that needs
                    Elon's tweets to pump. We're building regardless. If he notices our big brain energy, that's just bonus tendies! 🚀
                  </p>
                </div>
              </div>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Remember:</h3>
                <p className="text-gray-300">
                  DYOR (Do Your Own Research) is not just a meme - it's essential. Read our whitepaper, 
                  check our contracts, join our community, and make informed decisions.
                </p>
              </div>
            </section>

            {/* Final CTA */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Join the TESOLA Movement 🚀</h2>
              
              <div className="text-center text-5xl my-8">⚡🚗💎🙌</div>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-white mb-3">Why TESOLA Is BASED AF:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>First EV-themed gaming ecosystem (not another dog coin, ser!) 🐶❌</li>
                  <li>Transparent 15% team allocation (yes, we're chads about it) 🗣️</li>
                  <li>Sustainable 73-219% APY (not some 1000000% ponzinomics) 📈</li>
                  <li>Working NFT staking platform (not "coming soon™") ✅</li>
                  <li>Upcoming racing game that'll make you NGMI at work 🎮</li>
                  <li>Future Tesla integration plans (we're going full degen) 🚗</li>
                  <li>Community of absolute chads with diamond hands 💎🙌</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Ready to Join?</h3>
              <p className="mb-3">We've been completely honest about:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Our team allocation (15% with vesting)</li>
                <li>Our realistic APY (73-219%)</li>
                <li>Our development timeline (phased approach)</li>
                <li>Our challenges (legal, technical)</li>
                <li>Our vision (EV + Crypto + Gaming)</li>
              </ul>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "Your FOMO = Our Development Speed"<br />
                  🚀 More Community = Faster Moon 🌙
                </p>
              </div>
              
              <div className="bg-green-900/20 border-l-4 border-green-500/50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Next Steps:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Visit our website: tesola.io</li>
                  <li>Join our Discord community</li>
                  <li>Follow us on Twitter</li>
                  <li>Read the full whitepaper</li>
                  <li>Make your own informed decision</li>
                </ul>
              </div>
              
              <div className="bg-amber-900/20 border-2 border-dashed border-amber-500/40 p-4 rounded-lg text-center my-6">
                <p className="text-yellow-300 font-bold text-lg">
                  "NGMI ALONE, WAGMI TOGETHER" 🚀<br /><br />
                  No community = NGMI and staying poor 📉<br />
                  Diamond hand community = MEGA PUMP AND LAMBO SZN 🏎️
                </p>
              </div>
              
              <div className="bg-red-900/20 border-l-4 border-red-500/50 p-4 rounded-lg mb-6">
                <p className="text-white">
                  <strong>INVESTMENT DISCLAIMER:</strong> Cryptocurrency investments carry high risk. 
                  TESOLA tokens may increase or decrease in value. Past performance doesn't guarantee 
                  future results. Always invest responsibly.
                </p>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-500/30 p-5 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-white mb-2">$TESOLA</h2>
                <p className="text-xl text-gray-300 mb-2">"Transparency is our Superpower"</p>
                <p className="text-gray-400">Building the future of crypto, one honest step at a time.</p>
              </div>
              
              <div className="flex justify-center space-x-6 mt-10">
                <a href="https://discord.gg/tesola" target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Discord
                </a>
                <a href="https://twitter.com/tesolanft" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  Twitter
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}