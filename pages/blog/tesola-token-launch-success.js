import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { BlogMediaHybrid } from '../../components/BlogMediaHybrid';

export default function TesolaTokenLaunchSuccess() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>TESOLA Token Launch: A New Era Begins | TESOLA</title>
        <meta name="description" content="We're excited to announce the successful launch of TESOLA token on Solana. Join our growing community and be part of the future!" />
        <meta property="og:title" content="TESOLA Token Launch: A New Era Begins" />
        <meta property="og:description" content="The official TESOLA token has launched on Solana blockchain!" />
        <meta property="og:image" content="/nft-previews/tsts.mp4" />
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <article className="bg-gray-900/50 rounded-xl p-6 md:p-8">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  TESOLA Token Launch: A New Era Begins
                </h1>
                <p className="text-gray-400">
                  May 1, 2025 • TESOLA Team
                </p>
              </div>
              <Link href="/community?tab=news" className="mt-4 sm:mt-0 text-purple-400 hover:text-purple-300 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to News
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-8">
            <BlogMediaHybrid
              src="/nft-previews/tsts.mp4"
              alt="TESOLA Token Launch"
              className="rounded-lg overflow-hidden"
              priority={true}
            />
          </div>

          {/* Article Content */}
          <div className="space-y-8 text-gray-300">
            <p className="text-lg leading-relaxed">
              After months of careful development and testing, we're thrilled to announce that TESOLA has officially launched on the Solana blockchain. This milestone represents the beginning of an exciting journey in the meme coin ecosystem.
            </p>

            {/* Launch Day Statistics */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Launch Day Statistics (Expected Metrics)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-700/30 p-4 rounded">
                  <div className="text-purple-400 text-sm mb-1">Unique Wallets</div>
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-gray-400 text-sm">Early adopters joining</div>
                </div>
                <div className="bg-gray-700/30 p-4 rounded">
                  <div className="text-purple-400 text-sm mb-1">Initial Liquidity</div>
                  <div className="text-2xl font-bold text-white">Strong</div>
                  <div className="text-gray-400 text-sm">Foundation for stable trading</div>
                </div>
                <div className="bg-gray-700/30 p-4 rounded">
                  <div className="text-purple-400 text-sm mb-1">Technical Performance</div>
                  <div className="text-2xl font-bold text-white">Zero Downtime</div>
                  <div className="text-gray-400 text-sm">Flawless execution on Solana</div>
                </div>
                <div className="bg-gray-700/30 p-4 rounded">
                  <div className="text-purple-400 text-sm mb-1">Community Engagement</div>
                  <div className="text-2xl font-bold text-white">Active Staking</div>
                  <div className="text-gray-400 text-sm">Long-term confidence shown</div>
                </div>
              </div>
            </div>

            {/* Launch Day Visualization */}
            <div className="my-8">
              <BlogMediaHybrid
                src="/ss/s12.jpg"
                alt="Launch Day Statistics Dashboard"
                className="rounded-lg shadow-xl shadow-purple-900/30"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">Real-time launch day metrics dashboard</p>
            </div>

            {/* Why TESOLA */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Why TESOLA?</h2>
              
              {/* Revolutionary NFT Integration */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-purple-400 mb-3">1. Revolutionary NFT Integration</h3>
                <p className="mb-4">Unlike typical meme coins, TESOLA is deeply integrated with our SOLARA NFT collection:</p>
                <ul className="space-y-2 text-gray-300 pl-6">
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span><strong>Dynamic Staking Rewards:</strong> NFT rarity determines earning potential</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span><strong>Evolution System:</strong> NFTs that grow stronger over time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    <span><strong>Governance Rights:</strong> NFT holders shape the project's future</span>
                  </li>
                </ul>
              </div>

              {/* Community-Driven Development */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-purple-400 mb-3">2. Community-Driven Development</h3>
                <p className="mb-4">We believe in transparency and community involvement:</p>
                <ul className="space-y-2 text-gray-300 pl-6">
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    Regular development updates
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    Community polls for major decisions
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    Open-source approach
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    Regular AMAs with the team
                  </li>
                </ul>
              </div>

              {/* Sustainable Tokenomics */}
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-3">3. Sustainable Tokenomics</h3>
                <p className="mb-4">Our carefully designed tokenomics ensure long-term sustainability:</p>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Supply</span>
                    <span className="font-bold text-white">1,000,000,000 TESOLA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DRIVE[HOLD]-TO-EARN</span>
                    <span className="font-bold text-white">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liquidity & Exchanges</span>
                    <span className="font-bold text-white">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team & Advisors</span>
                    <span className="font-bold text-white">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Development & Marketing</span>
                    <span className="font-bold text-white">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Presale</span>
                    <span className="font-bold text-white">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reserve & DAO Treasury</span>
                    <span className="font-bold text-white">5%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NFT Staking Interface Showcase */}
            <div className="my-8">
              <BlogMediaHybrid
                src="/ss/s13.jpg"
                alt="NFT Staking Interface"
                className="rounded-lg shadow-xl shadow-purple-900/30"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">Our innovative staking interface in action</p>
            </div>

            {/* DRIVE[HOLD]-TO-EARN System */}
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6 rounded-lg border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-3">DRIVE[HOLD]-TO-EARN System</h3>
              <p className="mb-4">The revolutionary 3-phase reward structure:</p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm font-medium mr-3">Active</div>
                  <span><strong>Phase 1: HOLD-TO-EARN</strong> - 33.3% allocation</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm font-medium mr-3">Q3 2025</div>
                  <span><strong>Phase 2: GAME DRIVE-TO-EARN</strong> - 33.3% allocation</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-sm font-medium mr-3">2026</div>
                  <span><strong>Phase 3: REAL DRIVE-TO-EARN</strong> - 33.3% allocation</span>
                </div>
              </div>
            </div>

            {/* Future Development Preview */}
            <div className="my-8">
              <BlogMediaHybrid
                src="/ss/s14.jpg"
                alt="Future Development Roadmap"
                className="rounded-lg shadow-xl shadow-purple-900/30"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">Sneak peek at upcoming features and developments</p>
            </div>

            {/* What's Next */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">What's Next?</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">Q3 2025 Roadmap</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      DEX listings (Raydium, Jupiter)
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Mobile app optimization
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Partnership announcements
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Enhanced staking features
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">Q3-Q4 2025 Plans</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">◆</span>
                      CEX exchange listings
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">◆</span>
                      DAO governance implementation
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">◆</span>
                      NFT marketplace integration
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">◆</span>
                      Major marketing campaign
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How to Get Started */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">How to Get Started</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">1. Buy TESOLA</h3>
                  <p className="mb-3">Available on:</p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Raydium (Coming Q3)</li>
                    <li>• Jupiter Aggregator (Coming Q3)</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">2. Stake Your Tokens</h3>
                  <p className="mb-3">Earn rewards by staking:</p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Connect wallet at <Link href="/" className="text-purple-400 hover:text-purple-300">tesola.xyz</Link></li>
                    <li>• Navigate to Staking page</li>
                    <li>• Choose your staking duration</li>
                    <li>• Enjoy daily rewards</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">3. Join the Community</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Telegram: <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">t.me/tesolachat</a></li>
                    <li>• Twitter: <a href="https://x.com/TESLAINSOLANA" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">@TESLAINSOLANA</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security First */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Security First</h2>
              <p className="mb-4">All contracts have been:</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Built with security best practices
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Reviewed by experienced developers
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Tested extensively on testnet
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Deployed with safety measures
                </li>
              </ul>
            </div>

            {/* Thank You */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-8 rounded-lg border border-purple-500/20 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
              <p className="text-lg mb-6">
                To our early supporters and believers - this is just the beginning. Your trust and enthusiasm drive us to build something truly special in the Solana ecosystem.
              </p>
              <p className="text-lg mb-6">
                Join us on this incredible journey as we revolutionize how meme coins integrate with NFTs, creating real utility and lasting value for our community.
              </p>
              <p className="text-2xl font-bold text-purple-400">
                To the moon and beyond! 🚀
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/presale" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Buy TESOLA
              </Link>
              
              <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm3.224 17.582c.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-7.306c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-3.799c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123z"/>
                </svg>
                Join Telegram
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 sm:mb-0">
                Published on May 1, 2025 by TESOLA Team
              </p>
              <div className="flex space-x-4">
                <a href={`https://twitter.com/intent/tweet?text=TESOLA token has officially launched on Solana! Join the revolution 🚀&url=${encodeURIComponent('https://tesola.xyz/blog/tesola-token-launch-success')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-purple-400 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-purple-400 transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
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