/**
 * 이 파일은 원래의 Layout.jsx에서 Discord와 GitHub 링크를 Coming Soon 페이지로 리다이렉트하도록 수정한 것입니다.
 * 백업 파일: Layout.jsx.original
 * 
 * 수정된 부분: handleSocialLinkClick 함수 추가 및 소셜 링크의 onClick 속성 설정
 */
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic"; 
import Navigation from "./Navigation";
import MobileBottomNav from "./MobileBottomNav";
import ScrollToTopButton from "./ScrollToTopButton";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// Dynamic import for better performance
const BackgroundVideo = dynamic(() => import("./BackgroundVideo").catch(err => {
  console.error("Failed to load BackgroundVideo:", err);
  return () => <div className="fixed inset-0 bg-black -z-30"></div>;
}), { 
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
              <p className="text-gray-300 mt-1">Join our thriving community with exclusive holder events, airdrops, and early access to partnerships.</p>
            </div>
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
      className="bg-gradient-to-br from-gray-900 to-indigo-900/50 p-6 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
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
      
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-indigo-600/20 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">TESOLA Roadmap</h2>
        <p className="text-gray-300 mt-2">Our strategic plan for ecosystem growth and value creation</p>
      </div>
      
      <div className="space-y-6">
        <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-indigo-500/20">
          <div className="absolute left-[-8px] top-2 w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 mb-2">Phase 1: Foundation (Q1 2025)</h3>
          <div className="bg-indigo-900/10 p-4 rounded-lg border border-indigo-500/20 space-y-3">
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Launch SOLARA NFT Collection (1,000 unique items)</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Establish NFT Staking System & Rewards</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Initial DEX Offering for TESOLA Token</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-yellow-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Community Building & Governance Structure</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-blue-500/20">
          <div className="absolute left-[-8px] top-2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">Phase 2: Expansion (Q2-Q3 2025)</h3>
          <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20 space-y-3">
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <svg className="h-6 w-6 text-yellow-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>TESOLA Marketplace Launch with NFT Trading</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-yellow-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Enhanced Staking Mechanisms & Tiered Rewards</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Cross-Chain Integration (Ethereum, Polygon)</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Mobile App Development</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:to-cyan-500/20">
          <div className="absolute left-[-8px] top-2 w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400 mb-2">Phase 3: Evolution (Q4 2025 - Q1 2026)</h3>
          <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20 space-y-3">
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">SOLARA Metaverse Experience</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Play-to-Earn Gaming Integration</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">DAO Expansion & Community Treasury</span>
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Global Ecosystem Expansion</span>
              </li>
            </ul>
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

  // Discord 및 GitHub 링크 처리 함수 추가
  const handleSocialLinkClick = (e, type) => {
    e.preventDefault();
    const returnUrl = encodeURIComponent(router.asPath);
    router.push(`/coming-soon-social?type=${type}&returnUrl=${returnUrl}`);
  };

  useEffect(() => {
    setIsClient(true);
    
    // Only add event listeners on client side
    if (typeof window === 'undefined') return;
    
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
      // For other pages, use router for navigation
      router.push(href);
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
    <div className="relative min-h-screen overflow-hidden text-white" style={{ fontFamily: "'Orbitron', sans-serif !important" }}>
      {/* Background Video */}
      <BackgroundVideo />

      {/* Modal components */}
      {activeModal === 'value' && <ValueModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'roadmap' && <RoadmapModal onClose={() => setActiveModal(null)} />}
      
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
      
      {/* Gradient overlay - modified as a single layer */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
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
              <Link
                href="/whitepaper"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Whitepaper
              </Link>
              <Link
                href="/audit-report"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Audit Report
              </Link>
              <Link
                href="/team"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Team
              </Link>
            </div>
          </div>
        </div>
        
        {/* Social Links - Discord와 GitHub 링크를 Coming Soon 페이지로 리다이렉트 */}
        <div className="flex justify-center space-x-4 mb-8">
          <a 
            href="https://twitter.com/teslainsolana" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
            aria-label="Twitter"
          >
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
            </svg>
          </a>
          <a 
            href="https://t.me/tesolachat" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
            aria-label="Telegram"
          >
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-3.5 8c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"></path>
            </svg>
          </a>
          <a 
            href="#"
            onClick={(e) => handleSocialLinkClick(e, 'discord')}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
            aria-label="Discord"
          >
            <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
            </svg>
          </a>
          <a 
            href="#"
            onClick={(e) => handleSocialLinkClick(e, 'github')}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
            </svg>
          </a>
        </div>
        
        <footer className="text-center py-6 mt-6 text-sm text-gray-400 border-t border-gray-800/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <Link href="/landing" className="flex items-center hover:opacity-80 transition-opacity">
                  <img src="/logo2.png" alt="Logo" className="h-8 w-auto" />
                  <span>© 2025 TESOLA & SOLARA</span>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
                <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
                <Link href="/contact" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</Link>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 transition-colors">Solana Explorer</a>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              Powered by Solana Blockchain & TESOLA Ecosystem
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation - Only visible on mobile devices */}
        <MobileBottomNav />
        
        {/* Scroll to top button - appears when scrolling down */}
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Layout;