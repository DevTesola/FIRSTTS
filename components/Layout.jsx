"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic"; 
import Navigation from "./Navigation";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// Dynamic import for better performance
const BackgroundVideo = dynamic(() => import("./BackgroundVideo"), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black -z-30"></div>
});

/**
 * Modern modals with contemporary design for TESOLA ecosystem
 * Includes optimized content from whitepaper and roadmap
 */
const ValueModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div 
      className="bg-gradient-to-br from-gray-900 to-purple-900/50 p-6 rounded-xl max-w-3xl w-full space-y-6 relative border border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]" 
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-purple-600/20 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">TESOLA Ecosystem</h2>
        <p className="text-gray-300 mt-2">The future of Solana with unique NFTs and tiered rewards</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-900/10 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-300">Limited NFT Collection</h3>
              <p className="text-gray-300 mt-1">1,000 unique SOLARA NFTs with tiered rarity: 50 Legendary, 100 Epic, 250 Rare, and 600 Common.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/10 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-300">TESOLA Token Rewards</h3>
              <p className="text-gray-300 mt-1">Stake your NFTs to earn TESOLA tokens with rewards based on NFT tier and staking period.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/10 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-teal-300">Token Utility & Governance</h3>
              <p className="text-gray-300 mt-1">TESOLA provides platform fee discounts, governance rights, and exclusive access to future projects.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-900/10 rounded-lg p-5 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
          <div className="flex items-start mb-3">
            <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-300">Community Benefits</h3>
              <p className="text-gray-300 mt-1">Exclusive airdrops, presale access, and special events for SOLARA NFT holders.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900/10 p-5 rounded-lg border border-blue-500/20 mt-6">
        <div className="flex items-start">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-300">Hold-to-Earn & Staking</h3>
            <p className="text-gray-300 mt-2">
              TESOLA features a 3-phase strategy: Hold-to-Earn phase offers up to 200 TESOLA per day for Legendary NFTs, with bonuses 
              for longer staking periods. Early participants gain advantages through our tiered rewards system, with detailed 
              tokenomics designed for sustainable long-term value growth.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40"
        >
          Explore the Ecosystem
        </button>
      </div>
    </div>
  </div>
);

const RoadmapModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div 
      className="bg-gradient-to-br from-gray-900 to-indigo-900/50 p-6 rounded-xl max-w-3xl w-full space-y-6 relative border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
      onClick={(e) => e.stopPropagation()}
      style={{maxHeight: '90vh', overflowY: 'auto'}}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-indigo-600/20 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">TESOLA Roadmap</h2>
        <p className="text-gray-300 mt-2">Our journey to build the TESOLA & SOLARA ecosystem</p>
      </div>
      
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
        
        <div className="space-y-8">
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">Q1</span>
            </div>
            <div className="bg-indigo-900/10 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Foundation & Launch (Q1 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">SOLARA NFT Collection of 1,000 unique NFTs</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">TESOLA Token Development & Audit</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Presale & Initial Token Distribution</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Initial Hold-to-Earn Program Launch</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">Q2</span>
            </div>
            <div className="bg-indigo-900/10 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Expansion & Gameplay (Q2-Q3 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">DEX Listings on Jupiter & Raydium</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Staking Platform Enhancement</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Game Drive-to-Earn Beta Launch</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Racing Game NFT Collection (2,000 Units)</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">Q4</span>
            </div>
            <div className="bg-indigo-900/10 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Ecosystem Growth (Q4 2025)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">CEX Listings & Expanded Trading</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Game Drive-to-Earn Full Launch</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Tesla Community Collaborations</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Real Drive-to-Earn Planning & Exploration</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative pl-12">
            <div className="absolute left-0 h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold">2026</span>
            </div>
            <div className="bg-indigo-900/10 p-5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-colors">
              <h3 className="text-xl font-semibold text-indigo-300">Full Integration (2026)</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Real Drive-to-Earn App Beta Launch</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Tesla Owner Events & Partnerships</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Cross-chain Integrations</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Global Ecosystem Expansion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900/10 p-5 rounded-lg border border-blue-500/20 mt-8">
        <div className="flex items-start">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-300">Community-Driven Development</h3>
            <p className="text-gray-300 mt-1">
              Our roadmap evolves with community feedback. TESOLA token holders participate in governance decisions, guiding 
              ecosystem development. Key milestones may adjust based on market conditions, but our commitment to creating 
              long-term value remains unwavering.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40"
        >
          Join the TESOLA Journey
        </button>
      </div>
    </div>
  </div>
);

const Layout = ({ children }) => {
  const [activeModal, setActiveModal] = useState(null); // Currently active modal
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Check if current page is presale
  const isPresalePage = () => router.pathname === '/presale';
  const isStakingPage = () => router.pathname === '/staking';

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
  };

  // Page context banners
  const renderContextBanner = () => {
    if (isPresalePage()) {
      return (
        <div className="mt-20 mb-6 mx-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 rounded-lg text-center border border-purple-500/20 shadow-lg animate-fadeIn">
          <p className="text-white">
            <span className="font-bold">TESOLA Token Presale:</span> Early access discount ends in <span className="text-yellow-300">limited time</span>!
          </p>
        </div>
      );
    } else if (isStakingPage()) {
      return (
        <div className="mt-20 mb-6 mx-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-3 rounded-lg text-center border border-blue-500/20 shadow-lg animate-fadeIn">
          <p className="text-white">
            <span className="font-bold">NFT Staking:</span> Stake your SOLARA NFTs to earn <span className="text-yellow-300">TESOLA tokens</span>!
          </p>
        </div>
      );
    } else {
      return (
        <div className="mt-20 mb-6 mx-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-lg text-center border border-purple-500/20 shadow-lg animate-fadeIn">
          <p className="text-white">
            <span className="font-bold">SOLARA NFT Collection:</span> Mint your unique NFT from our limited collection of 1,000 pieces.
          </p>
        </div>
      );
    }
  };

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
        {/* Navigation */}
        <Navigation />
        
        {/* Context Banner */}
        {renderContextBanner()}
        
        <main className="relative px-4 md:px-8 py-4 overflow-visible container mx-auto">
          {children}
        </main>
        
        {/* Quick Links */}
        <div className="flex justify-center mt-8 mb-4">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveModal('value')}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Token Info
              </button>
              <button
                onClick={() => setActiveModal('roadmap')}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Roadmap
              </button>
              <a 
                href="https://twitter.com/teslainsolana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Twitter
              </a>
              <a 
                href="https://discord.gg/tesola" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
        
        <footer className="text-center py-6 mt-6 text-sm text-gray-400 border-t border-gray-800/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <img src="/logo2.png" alt="Logo" className="h-8 w-auto" />
                <span>© 2025 TESOLA & SOLARA</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
                <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
                <Link href="/contact" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</Link>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 transition-colors">Solana Explorer</a>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              TESOLA and SOLARA are not affiliated with Tesla, Inc. TESOLA token is a utility token for the SOLARA ecosystem.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;