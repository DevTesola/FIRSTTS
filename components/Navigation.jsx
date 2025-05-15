import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Dynamically import wallet button with no SSR
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => mod.WalletMultiButton),
  { ssr: false }
);

/**
 * Modern, sleek navigation component for the TESOLA & SOLARA ecosystem
 * Includes responsive design, glass morphism effects, and animated highlights
 */
export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  
  // Main navigation items with improved structure
  const navItems = [
    { 
      name: "HOME", 
      href: "/home", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )
    },
    { 
      name: "NFT MINT", 
      href: "/nft", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      name: "TESOLA TOKEN", 
      href: "/presale", 
      highlight: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      ) 
    },
    { 
      name: "STAKING", 
      href: "/staking", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      )
    },
    { 
      name: "COLLECTION", 
      href: "/my-collection", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    { 
      name: "COMMUNITY", 
      href: "/community", 
      highlight: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      )
    }
  ];

  // Listen for scroll to apply glass effect on header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest('.mobile-menu') && !e.target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Check if a navigation item is active
  const isActive = (path) => router.pathname === path;

  // Get highlight color for navigation item
  const getHighlightColors = (item) => {
    if (item.name === "HOME") {
      return "from-amber-500/70 to-orange-600/70 hover:from-amber-500 hover:to-orange-600";
    } else if (item.name === "TESOLA TOKEN") {
      return "from-purple-600/70 to-pink-600/70 hover:from-purple-600 hover:to-pink-600";
    } else if (item.name === "NFT MINT") {
      return "from-blue-600/70 to-indigo-600/70 hover:from-blue-600 hover:to-indigo-600";
    } else if (item.name === "STAKING") {
      return "from-cyan-600/70 to-blue-600/70 hover:from-cyan-600 hover:to-blue-600";
    } else if (item.name === "COLLECTION") {
      return "from-green-600/70 to-teal-600/70 hover:from-green-600 hover:to-teal-600";
    } else if (item.name === "COMMUNITY") {
      return "from-rose-600/70 to-amber-600/70 hover:from-rose-600 hover:to-amber-600";
    }
    return "from-purple-600/70 to-pink-600/70 hover:from-purple-600 hover:to-pink-600"; // Default
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/60 backdrop-blur-md py-2 shadow-lg' : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo with enhanced animations */}
          <Link href="/landing" className="flex items-center space-x-2 group">
            <div className="relative w-10 h-10 md:w-12 md:h-12 animate-fade-in">
              <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-md opacity-0 
                              group-hover:opacity-80 transition-all duration-500 animate-pulse-slow"></div>
              <div className="relative transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 transform">
                <Image 
                  src="/logo2.png" 
                  alt="TESOLA Logo" 
                  width={48}
                  height={48}
                  className="w-full h-full object-contain" 
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col animate-fade-right" style={{ animationDelay: '200ms' }}>
              <span className="text-xl md:text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 to-pink-400 
                               bg-clip-text text-transparent transition-all duration-300 group-hover:from-purple-300 
                               group-hover:to-pink-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]">
                TESOLA
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                POWERED BY SOLANA
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <ul className="flex space-x-2">
              {navItems.map((item, index) => (
                <li key={item.name} className="animate-fade-down" style={{ animationDelay: `${index * 70}ms` }}>
                  <Link
                    href={item.href}
                    className={`group relative px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all duration-300 ${
                      isActive(item.href)
                        ? `text-white bg-gradient-to-r ${
                            item.name === "HOME" 
                              ? "from-amber-600 to-orange-600" 
                              : "from-purple-700 to-pink-700"
                          } shadow-lg shadow-purple-900/30`
                        : item.highlight || item.name === "TESOLA TOKEN" || item.name === "NFT MINT" || item.name === "STAKING" || item.name === "COLLECTION" || item.name === "HOME"
                          ? `text-white bg-gradient-to-r ${getHighlightColors(item)} hover:shadow-md hover:scale-105 transform`
                          : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-md'
                    }`}
                  >
                    <span className={`relative ${isActive(item.href) || item.name === "HOME" ? 'animate-pulse' : ''}`}>
                      {item.icon}
                      <span className="absolute -inset-1 rounded-full blur-sm bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </span>
                    <span className="font-medium tracking-wide text-sm">{item.name}</span>
                    
                    {/* Animated underline effect with glow */}
                    {!isActive(item.href) && (
                      <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 
                                       shadow-[0_0_3px_rgba(168,85,247,0.8)] group-hover:w-[calc(100%-16px)] 
                                       -translate-x-1/2 transition-all duration-300"></span>
                    )}
                    
                    {/* "SOON" badge for highlighted items with animation */}
                    {item.highlight && !isActive(item.href) && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-400 to-purple-400 
                                       text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold shadow-md 
                                       animate-pulse-slow">
                        SOON
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Wallet button in header with animated glow effect */}
            <div className="ml-3 animate-fade-down" style={{ animationDelay: `${navItems.length * 70 + 50}ms` }}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-purple-600/20 rounded-lg blur-md opacity-75 
                                group-hover:bg-purple-600/40 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative">
                  <WalletMultiButton />
                </div>
              </div>
            </div>
          </nav>
          
          {/* Mobile Menu Button with enhanced animations */}
          <button
            className="menu-button md:hidden text-white p-3 rounded-full bg-gradient-to-r from-purple-800/50 to-pink-800/50 
                       hover:from-purple-700/60 hover:to-pink-700/60 backdrop-blur-sm focus:outline-none shadow-md 
                       transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] 
                       hover:scale-105 transform animate-fade-in"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-md opacity-0 
                              group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="relative">
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="mobile-menu md:hidden bg-black/80 backdrop-blur-lg mt-3 py-3 rounded-xl border border-purple-800/50 animate-fade-in shadow-lg"
          >
            <ul className="space-y-1 px-3">
              {navItems.map((item, index) => (
                <li key={item.name} 
                    className={`animate-fade-right`} 
                    style={{ animationDelay: `${index * 50}ms` }}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive(item.href)
                        ? `bg-gradient-to-r ${
                            item.name === "HOME" 
                              ? "from-amber-600 to-orange-600" 
                              : "from-purple-700 to-pink-700"
                          } text-white shadow-md`
                        : item.highlight || item.name === "TESOLA TOKEN" || item.name === "NFT MINT" || item.name === "STAKING" || item.name === "COLLECTION" || item.name === "HOME"
                          ? `bg-gradient-to-r ${getHighlightColors(item)} text-white hover:shadow-md hover:scale-[1.02] transform`
                          : 'text-gray-200 hover:bg-white/10 hover:shadow-md'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className={`relative ${isActive(item.href) || item.name === "HOME" ? 'animate-pulse' : ''}`}>
                      {item.icon}
                      {!isActive(item.href) && <span className="absolute -inset-1 rounded-full blur-sm bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>}
                    </span>
                    <span className="font-medium">{item.name}</span>
                    
                    {/* "SOON" badge for mobile */}
                    {item.highlight && !isActive(item.href) && (
                      <span className="ml-auto bg-gradient-to-r from-blue-400 to-purple-400 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold shadow-md animate-pulse-slow">
                        SOON
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              {/* Mobile wallet button */}
              <li className="mt-3 pt-3 border-t border-purple-800/30 animate-fade-up" style={{ animationDelay: `${navItems.length * 50 + 100}ms` }}>
                <div className="px-3 relative">
                  <div className="absolute -inset-1 bg-purple-600/20 rounded-lg blur-md animate-pulse-slow opacity-70"></div>
                  <div className="relative">
                    <WalletMultiButton />
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}