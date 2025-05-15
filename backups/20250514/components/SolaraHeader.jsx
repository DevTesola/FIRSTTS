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
        <div className="flex justify-center items-center">
          {/* 배경 효과 */}
          <div className="absolute z-0 w-auto h-16 bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-amber-500/10 blur-xl rounded-full"></div>
          {/* Logo */}
          <Link href="/landing" className="flex items-center hover:opacity-90 transition-opacity relative z-10">
            <Image 
              src="/logo2.png" 
              alt="SOLARA Logo" 
              width={60} 
              height={60} 
              className="mr-3"
            />
            <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(255,200,50,0.5)] tracking-wide transform hover:scale-105 transition-transform duration-300">
              {isPresalePage ? 'TESOLA Presale' : 'SOLARA'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SolaraHeader;