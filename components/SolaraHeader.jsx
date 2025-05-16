import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const SolaraHeader = () => {
  const router = useRouter();
  
  // Determine if we're on presale page
  const isPresalePage = router.pathname === '/presale';
  
  return (
    <header className="py-5 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          {/* 배경 효과 */}
          <div className="absolute z-0 w-auto h-24 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-amber-500/10 blur-xl rounded-full"></div>
          {/* Logo */}
          <Link href="/landing" className="flex items-center hover:opacity-90 transition-opacity relative z-10">
            <Image 
              src="/logo2.png" 
              alt="SOLARA Logo" 
              width={60} 
              height={60} 
              className="mr-3"
            />
            <span className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(0,0,0,0.15)] tracking-wide transform hover:scale-105 transition-transform duration-300">
              {isPresalePage ? 'TESOLA Presale' : 'SOLARA'}
            </span>
          </Link>
          
          {/* Preview NFT Button - NFT 페이지에서만 표시 */}
          {router.pathname === '/nft' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-nft-preview'))}
              className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-amber-500/40 transform hover:scale-105 transition-all duration-300 border-2 border-yellow-300/80"
              aria-label="Preview NFT"
            >
              Preview NFT
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SolaraHeader;