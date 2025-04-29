"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic"; 
import Link from "next/link";
import Image from "next/image";

// 동적 임포트
const BackgroundVideo = dynamic(() => import("./BackgroundVideo"), { ssr: false });

// Section modal components
const ValueModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="bg-gray-900 p-6 rounded-xl max-w-2xl w-full space-y-4 relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close modal"
      >
        ✕
      </button>
      <h2 className="text-3xl md:text-4xl font-bold text-center">Value Proposition</h2>
      <p className="text-center">
        SOLARA GEN:0 leverages Solana's fast and low-cost transactions to deliver
        top-tier quality and rarity. Each NFT is fully randomly generated, with
        additional value created through community-driven events and rewards.
      </p>
    </div>
  </div>
);

const RoadmapModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="bg-gray-900 p-6 rounded-xl max-w-2xl w-full space-y-4 relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close modal"
      >
        ✕
      </button>
      <h2 className="text-3xl md:text-4xl font-bold text-center">Roadmap</h2>
      <ul className="space-y-6">
        {[
          ["Q1 2025", "Genesis Minting & Community Launch"],
          ["Q2 2025", "Marketplace Integration & Whitelisting"],
          ["Q3 2025", "Staking Rewards & Airdrops"],
          ["Q4 2025", "Metaverse Reveal & Partnerships"],
        ].map(([quarter, desc]) => (
          <li key={quarter} className="flex items-start space-x-4">
            <div className="h-8 w-8 text-green-400 flex-shrink-0 flex items-center justify-center">✓</div>
            <div>
              <h3 className="font-semibold">{quarter}</h3>
              <p>{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // Currently active modal
  const [imageLoaded, setImageLoaded] = useState(false);

  // Navigation link click handler
  const handleNavClick = (e, href, label) => {
    e.preventDefault();
    
    if (href === '#value') {
      setActiveModal('value');
    } else if (href === '#roadmap') {
      setActiveModal('roadmap');
    } else {
      // For other pages, navigate using window.location for simplicity
      if (href === '/') {
        window.location.href = href;
      } else if (label === "MY COLLECTION") {
        window.location.href = '/my-collection';
      } else if (label === "TRANSACTIONS") {
        window.location.href = '/transactions';
      } else {
        window.location.href = href;
      }
    }

    // Close mobile menu after clicking
    setIsMenuOpen(false);
  };

  // Close modal when ESC key is pressed
  useEffect(() => {
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

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-orbitron">
      {/* Modal components */}
      {activeModal === 'value' && <ValueModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'roadmap' && <RoadmapModal onClose={() => setActiveModal(null)} />}
      
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
            {[
              ["/", "HOME"],
              ["#value", "Value Proposition"],
              ["#roadmap", "Roadmap"],
              ["/my-collection", "MY COLLECTION"],
              ["/transactions", "TRANSACTIONS"],
            ].map(([href, label]) => (
              <a 
                key={label} 
                href={href}
                onClick={(e) => handleNavClick(e, href, label)}
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
            {[
              ["/", "HOME"],
              ["#value", "Value Proposition"],
              ["#roadmap", "Roadmap"],
              ["/my-collection", "MY COLLECTION"],
              ["/transactions", "TRANSACTIONS"],
            ].map(([href, label]) => (
              <a
                key={label} 
                href={href}
                onClick={(e) => handleNavClick(e, href, label)}
                className="nav-button px-4 py-3 text-sm font-semibold text-purple-300 hover:text-white hover:bg-purple-600 rounded transition w-full text-left min-h-[44px] flex items-center"
                aria-label={`Navigate to ${label}`}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
        
        <main className="relative px-4 md:px-16 py-8 overflow-visible">{children}</main>
        
        <footer className="text-center py-4 text-sm text-gray-300 mt-8">
          © 2025 SOLARA • Built on Solana
        </footer>
      </div>
    </div>
  );
}