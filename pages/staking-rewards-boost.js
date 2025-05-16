import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function StakingRewardsBoost() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Staking Rewards Boost - Coming Soon | TESOLA</title>
        <meta name="description" content="Revolutionary staking rewards boost system coming soon. Maximize your TESOLA earnings with advanced staking strategies." />
      </Head>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          {/* Icon */}
          <div className="mb-8 inline-flex">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full filter blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
              Staking Rewards Boost
            </span>
          </h1>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-full border border-purple-500/30 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-3"></div>
            <span className="text-lg font-medium text-purple-300">Coming Q3 2025</span>
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            Experience the most transparent staking rewards system in DeFi. Every boost, every multiplier, 
            every reward is 100% on-chain. Full transparency with verifiable smart contracts on Solana.
          </p>

          {/* On-Chain Transparency Emphasis */}
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 backdrop-blur-xl p-8 rounded-2xl border border-green-500/30 mb-12">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                100% On-Chain Transparency
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-semibold text-white mb-1">Verifiable Contracts</h3>
                <p className="text-sm text-gray-400">All smart contracts are public and auditable</p>
              </div>
              <div className="text-center">
                <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-white mb-1">Immutable Records</h3>
                <p className="text-sm text-gray-400">Every transaction permanently recorded on Solana</p>
              </div>
              <div className="text-center">
                <svg className="w-12 h-12 text-purple-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="text-lg font-semibold text-white mb-1">Real-Time Tracking</h3>
                <p className="text-sm text-gray-400">Monitor all rewards and boosts live on blockchain</p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-xl border border-purple-500/30 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">On-Chain Multipliers</h3>
              <p className="text-gray-400">Up to 5x boost calculated transparently on-chain based on verifiable staking data</p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-xl border border-purple-500/30 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Contract Auto-Compound</h3>
              <p className="text-gray-400">Trustless automatic reinvestment executed by on-chain smart contracts</p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-xl border border-purple-500/30 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">On-Chain NFT Synergy</h3>
              <p className="text-gray-400">Stack multiple NFTs with rewards calculated transparently on-chain</p>
            </div>
          </div>

          {/* Waitlist */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-xl p-8 rounded-2xl border border-purple-500/30 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Join the Early Access List</h2>
            <p className="text-gray-300 mb-6">Be the first to know when Staking Rewards Boost launches and get exclusive early adopter benefits.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg transform hover:scale-105">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm3.224 17.582c.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-7.306c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-3.799c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123z"/>
                </svg>
                Join Telegram Community
              </a>
              
              <Link href="/staking" className="inline-flex items-center px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all shadow-lg border border-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Current Staking
              </Link>
            </div>
          </div>

          {/* Blockchain Explorer Integration */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Track Every Transaction On-Chain
            </h3>
            <p className="text-gray-300 text-center mb-4">All staking boosts and rewards will be viewable on Solana Explorer</p>
            <div className="flex justify-center">
              <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Solana Explorer
              </a>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-400 mb-4">Development Progress</h3>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">75% Complete - Final Testing Phase</p>
          </div>

          {/* Back to Staking */}
          <Link href="/staking" className="text-purple-400 hover:text-purple-300 inline-flex items-center font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Staking Dashboard
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </Layout>
  );
}