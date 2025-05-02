// components/LandingPage.jsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <Image 
            src="/logo2.png" 
            alt="Logo" 
            width={100} 
            height={100} 
            className="animate-pulse" 
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
          Welcome to the Future of Solana
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Explore our unique NFT collection and participate in our token presale — two distinct ways to join our thriving ecosystem.
        </p>
        
        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="bg-gray-800 px-6 py-3 rounded-lg">
            <div className="text-3xl font-bold text-purple-400">1,000</div>
            <div className="text-sm text-gray-400">Unique NFTs</div>
          </div>
          <div className="bg-gray-800 px-6 py-3 rounded-lg">
            <div className="text-3xl font-bold text-pink-400">1B</div>
            <div className="text-sm text-gray-400">Total TESOLA Supply</div>
          </div>
          <div className="bg-gray-800 px-6 py-3 rounded-lg">
            <div className="text-3xl font-bold text-blue-400">18K+</div>
            <div className="text-sm text-gray-400">Community Members</div>
          </div>
        </div>
      </div>
      
      {/* Two Main Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* NFT Collection Card */}
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl overflow-hidden border border-purple-500/30 shadow-xl hover:shadow-purple-500/20 transition-shadow">
          <div className="relative h-60">
            <Image 
              src="/nft-banner.jpg" 
              alt="SOLARA NFT Collection" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white">SOLARA NFT Collection</h2>
              <p className="text-gray-300">1,000 Unique Digital Collectibles</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Collection Features:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Completely unique designs with no duplicates</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Tiered rarity system with special traits</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Exclusive holder benefits and future airdrops</span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Price:</span>
                <div className="text-xl font-bold text-white">1.5 SOL</div>
              </div>
              <Link 
                href="/nft" 
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                Mint NFT
              </Link>
            </div>
          </div>
        </div>
        
        {/* Token Presale Card */}
        <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/40 rounded-xl overflow-hidden border border-pink-500/30 shadow-xl hover:shadow-pink-500/20 transition-shadow relative">
          {/* "Live Now" badge */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-semibold animate-pulse">
            LIVE NOW
          </div>
          
          <div className="relative h-60">
            <Image 
              src="/token-banner.jpg" 
              alt="TESOLA Token Presale" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white">TESOLA Token Presale</h2>
              <p className="text-gray-300">Early Access at Special Price</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Token Benefits:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Governance rights in the TESOLA DAO</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Staking rewards and platform fee discounts</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Access to premium features and early launches</span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Token Price:</span>
                <div className="text-xl font-bold text-white">0.000005 SOL</div>
              </div>
              <Link 
                href="/presale" 
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                Join Presale
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Overview */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          A Complete Ecosystem on Solana
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
          Our project combines the artistic appeal of NFTs with the practical utility of a governance token, creating a comprehensive ecosystem for creators and collectors.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-purple-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Fast & Affordable</h3>
            <p className="text-gray-400">
              Built on Solana for lightning-fast transactions and minimal fees, making our ecosystem accessible to everyone.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-blue-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Audited</h3>
            <p className="text-gray-400">
              All smart contracts are rigorously audited by leading security firms, ensuring your assets remain safe.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-pink-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Community Governed</h3>
            <p className="text-gray-400">
              Our DAO puts decision-making power in the hands of TESOLA holders, ensuring true decentralization.
            </p>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Join Our Community?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Whether you're interested in our unique NFT collection, our utility token, or both, now is the perfect time to get involved.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/nft" 
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Explore NFTs
          </Link>
          <Link 
            href="/presale" 
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Join Token Presale
          </Link>
          <a 
            href="https://discord.gg/tesola" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
}