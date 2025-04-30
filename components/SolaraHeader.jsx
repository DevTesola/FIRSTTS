import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const SolaraHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // Check current path to highlight active nav item
  const isActive = (path) => router.pathname === path;
  
  // Determine if we're on presale page
  const isPresalePage = router.pathname === '/presale';
  
  // Navigation items
  const navItems = [
    { name: "Home", href: "/" },
    { name: "NFT Collection", href: "/nft" },
    { name: "Token Presale", href: "/presale", highlight: true },
    { name: "About", href: "/about" },
    { name: "Docs", href: "/docs" }
  ];

  return (
    <header className="py-4 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo2.png" 
              alt="SOLARA Logo" 
              width={40} 
              height={40} 
              className="mr-2"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isPresalePage ? 'TESOLA Presale' : 'SOLARA'}
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive(item.href)
                        ? 'bg-purple-600 text-white'
                        : item.highlight
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {item.name}
                    {item.highlight && !isActive(item.href) && (
                      <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 px-6 py-4 mt-2 rounded-lg animate-fade-in">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-lg ${
                      isActive(item.href)
                        ? 'bg-purple-600 text-white'
                        : item.highlight
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                    {item.highlight && !isActive(item.href) && (
                      <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Context Banner - shows different content based on page */}
        {isPresalePage ? (
          <div className="mt-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3 rounded-lg text-center">
            <p className="text-sm text-white">
              <span className="font-bold">TESOLA Token Presale:</span> Early access discount ends in <span className="text-yellow-300">limited time</span>!
            </p>
          </div>
        ) : (
          <div className="mt-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-lg text-center">
            <p className="text-sm text-white">
              <span className="font-bold">SOLARA NFT Collection:</span> Mint your unique NFT from our limited collection of 1,000 pieces.
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default SolaraHeader;