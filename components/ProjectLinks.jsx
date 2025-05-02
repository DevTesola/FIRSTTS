import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const ProjectLinks = () => {
  const router = useRouter();
  
  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="text-gray-300 font-medium">Our Projects:</div>
        
        <Link 
          href="/"
          className={`px-4 py-2 rounded-lg transition-colors ${
            router.pathname === '/' 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Home
        </Link>
        
        <Link 
          href="/nft"
          className={`px-4 py-2 rounded-lg transition-colors ${
            router.pathname === '/nft' 
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
          className={`px-4 py-2 rounded-lg transition-colors ${
            router.pathname === '/presale' 
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
      </div>
    </div>
  );
};

export default ProjectLinks;