"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic"; 
import Link from "next/link";
import Image from "next/image";

// Dynamic import for better performance
const BackgroundVideo = dynamic(() => import("./BackgroundVideo"), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black -z-30"></div>  // 로딩 중 대체 컴포넌트 제공
});

// Section modal components
const ValueModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div 
      className="bg-gradient-to-b from-gray-900 to-purple-900/70 p-6 rounded-xl max-w-3xl w-full space-y-6 relative border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-purple-800/50 transition-colors"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-purple-600/30 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">SOLARA Value Proposition</h2>
        <p className="text-gray-300 mt-2">Uniquely positioned in the Solana NFT ecosystem</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-purple-900/20 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-300">Secure On-Chain Generation</h3>
              <p className="text-gray-300 mt-1">Each NFT is fully randomly generated on-chain with verifiable uniqueness and rarity.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/20 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-300">Solana Speed & Economy</h3>
              <p className="text-gray-300 mt-1">Leverage Solana's fast and low-cost transactions for seamless minting and trading experience.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/20 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-teal-300">TESOLA Token Rewards</h3>
              <p className="text-gray-300 mt-1">Integrated ecosystem with TESOLA token rewards for holders, staking, and community engagement.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/20 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-300">Thriving Community</h3>
              <p className="text-gray-300 mt-1">Join an active community of Solana enthusiasts with exclusive benefits for SOLARA GEN:0 holders.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900/20 p-5 rounded-lg border border-blue-500/30 mt-6">
        <div className="flex items-start">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-300">What Sets SOLARA Apart</h3>
            <p className="text-gray-300 mt-1">
              Unlike other NFT collections, SOLARA offers a tiered rewards system with increasing benefits based on rarity. 
              Our commitment to long-term value includes regular airdrops, staking rewards, and exclusive access to future Solana projects.
              Each SOLARA NFT serves as a key to unlock the broader TESOLA ecosystem.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
        >
          Explore SOLARA GEN:0
        </button>
      </div>
    </div>
  </div>
);

const RoadmapModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div 
      className="bg-gradient-to-b from-gray-900 to-indigo-900/70 p-6 rounded-xl max-w-3xl w-full space-y-6 relative border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-indigo-800/50 transition-colors"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-indigo-600/30 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">SOLARA Roadmap</h2>
        <p className="text-gray-300 mt-2">Our vision and development journey through 2025 and beyond</p>
      </div>
      
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
        
        <div className="space-y-8">
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">Q1</span>
            </div>
            <div className="bg-indigo-900/20 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Genesis & Foundation (Q1 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Initial 1,000 SOLARA GEN:0 Minting Event</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Community Launch with Tier-Based Rewards</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Initial TESOLA Token Distribution to Holders</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Social Media Expansion & Community Building</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">Q2</span>
            </div>
            <div className="bg-indigo-900/20 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Expansion & Utility (Q2 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Marketplace Integration with Enhanced Metadata</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Launch of NFT Staking Platform</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Whitelisting System for Future Collections</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Partnership Announcements with Solana Projects</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">Q3</span>
            </div>
            <div className="bg-indigo-900/20 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Innovation & Growth (Q3 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Launch of SOLARA GEN:1 Collection with Holder Benefits</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Enhanced Staking Rewards & Tier Upgrades</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Exclusive Airdrops for GEN:0 Holders</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Interactive Community Events & Competitions</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold">Q4</span>
            </div>
            <div className="bg-indigo-900/20 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Ecosystem & Metaverse (Q4 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Metaverse Integration & Virtual Gallery Launch</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">TESOLA Token Utility Expansion</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Major Partnership Reveals & Collaborations</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">2026 Roadmap Unveiling & Governance Voting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900/20 p-5 rounded-lg border border-blue-500/30 mt-8">
        <div className="flex items-start">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-300">Community-Driven Development</h3>
            <p className="text-gray-300 mt-1">
              Our roadmap is designed to be flexible and responsive to community feedback. As SOLARA GEN:0 holders, you'll have voting rights on future developments and the ability to shape our direction. The timeline may adjust based on community needs and market conditions, but our commitment to creating long-term value remains unwavering.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
        >
          Join the SOLARA Journey
        </button>
      </div>
    </div>
  </div>
);

const ProjectLinks = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;
  
  // Get current path to highlight active link
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-3 mb-6">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <Link 
          href="/"
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            pathname === '/' 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Home
        </Link>
        
        <Link 
          href="/nft"
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            pathname === '/nft' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            SOLARA NFT
          </span>
        </Link>
        
        <Link 
          href="/presale"
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            pathname === '/presale' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            TESOLA Token
          </span>
        </Link>
        
        <Link 
          href="/my-collection"
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            pathname === '/my-collection' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            My Collection
          </span>
        </Link>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // Currently active modal
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Close modal when ESC key is pressed
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (e) => {
      if (isMenuOpen && e.target.closest('.mobile-menu') === null && e.target.closest('.menu-button') === null) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Navigation link click handler
  const handleNavClick = (e, href) => {
    e.preventDefault();
    
    if (href === '#value') {
      setActiveModal('value');
    } else if (href === '#roadmap') {
      setActiveModal('roadmap');
    } else {
      // For other pages, use client-side navigation
      if (typeof window !== 'undefined') {
        window.location.href = href;
      }
    }

    // Close mobile menu after clicking
    setIsMenuOpen(false);
  };

  // Check if current page is presale
  const isPresalePage = isClient && typeof window !== 'undefined' && window.location.pathname === '/presale';

  // Get page context text
  const getPageContextText = () => {
    if (isPresalePage) {
      return (
        <>
          <span className="font-bold">TESOLA Token Presale:</span> Early access discount ends in <span className="text-yellow-300">limited time</span>!
        </>
      );
    }
    return (
      <>
        <span className="font-bold">SOLARA NFT Collection:</span> Mint your unique NFT from our limited collection of 1,000 pieces.
      </>
    );
  };

  // Navigation items
  const navItems = [
    { href: "/", label: "HOME" },
    { href: "#value", label: "VALUE" },
    { href: "#roadmap", label: "ROADMAP" },
    { href: "/my-collection", label: "MY COLLECTION" },
    { href: "/transactions", label: "TRANSACTIONS" },
  ];

  if (isPresalePage) {
    // Add presale specific links
    navItems.splice(2, 0, { href: "/nft", label: "NFT MINT" });
  } else {
    // Add NFT specific links
    navItems.splice(2, 0, { href: "/presale", label: "TOKEN PRESALE" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-orbitron">
      {/* Modal components */}
      {activeModal === 'value' && <ValueModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'roadmap' && <RoadmapModal onClose={() => setActiveModal(null)} />}
      
      {/* Background video */}
      <BackgroundVideo />
      
      {/* Background image */}
      <div className="fixed inset-0 -z-40">
        <Image
          src="/stars.jpg"
          alt="Stars"
          fill
          className={`object-cover opacity-${imageLoaded ? '20' : '0'} transition-opacity duration-1000`}
          priority={false}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.error('Failed to load background image');
            setImageLoaded(true);
          }}
        />
      </div>
      
      {/* Gradient overlay */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(25,25,112,0.05) 50%, rgba(75,0,130,0.1) 75%, rgba(0,0,0,0.2) 100%)",
        }}
      />
      
      <div className="relative z-10">
        <header className="flex items-center justify-between px-4 md:px-6 py-4">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img src="/logo2.png" alt="Secondary Logo" className="h-10 md:h-16 w-auto" />
              <img src="/logo.svg" alt="TESOLA Logo" className="h-10 md:h-16 w-auto" />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center space-x-4">
            {navItems.map(({ href, label }) => (
              <a 
                key={label} 
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="nav-button px-4 py-2 text-sm font-semibold text-purple-300 hover:text-white hover:bg-purple-600 rounded transition"
                aria-label={`Navigate to ${label}`}
              >
                {label}
              </a>
            ))}
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="menu-button md:hidden text-white p-3 rounded hover:bg-purple-800 focus:outline-none min-w-[44px] min-h-[44px]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </header>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="mobile-menu md:hidden bg-gray-900 px-4 py-3 flex flex-col space-y-2 animate-fade-in rounded-lg mx-4 shadow-lg"
          >
            {navItems.map(({ href, label }) => (
              <a
                key={label} 
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="nav-button px-4 py-3 text-sm font-semibold text-purple-300 hover:text-white hover:bg-purple-600 rounded transition w-full text-left min-h-[44px] flex items-center"
                aria-label={`Navigate to ${label}`}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
        
        {/* Context Banner */}
        <div className="mt-4 mb-6 mx-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 rounded-lg text-center">
          <p className="text-sm text-white">
            {getPageContextText()}
          </p>
        </div>
        
        {/* Project Navigation Links */}
        <ProjectLinks />
        
        <main className="relative px-4 md:px-8 py-4 overflow-visible">
          {children}
        </main>
        
        <footer className="text-center py-6 mt-12 text-sm text-gray-300 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <img src="/logo2.png" alt="Logo" className="h-8 w-auto" />
                <span>© 2025 SOLARA & TESOLA</span>
              </div>
              <div className="flex space-x-6">
                <a href="https://twitter.com/tesola_token" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="https://discord.gg/tesola" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Discord</a>
                <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
                <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;