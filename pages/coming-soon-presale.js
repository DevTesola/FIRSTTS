import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ComingSoonPresalePage() {
  const router = useRouter();
  const { returnUrl } = router.query;
  const [animationClass, setAnimationClass] = useState('opacity-0');
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimationClass('opacity-100 transform-none'), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate remaining time (after NFT minting is completed)
  const calculateTimeLeft = () => {
    const launchDate = new Date('2025-07-25T00:00:00');
    const now = new Date();
    const difference = launchDate - now;
    
    let timeLeft = {};
    
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      };
    }
    
    return timeLeft;
  };
  
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-black bg-[url('/stars3.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4" style={{ minHeight: '-webkit-fill-available' }}>
      <Head>
        <title>TESOLA Presale Coming Soon | TESOLA</title>
        <meta name="description" content="TESOLA Token Presale Coming Soon - Exclusive benefits for NFT holders." />
      </Head>
    
      <div 
        className={`max-w-4xl w-full transition-all duration-1000 ease-out transform translate-y-10 ${animationClass}`}
      >
        {/* Top logo / title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-3">
            TESOLA TOKEN
          </h1>
          <div className="text-xl md:text-2xl font-bold text-white">
            <span className="bg-blue-700 px-3 py-1 rounded-md">PRESALE COMING SOON</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 backdrop-blur-lg rounded-2xl border border-blue-500/30 overflow-hidden shadow-2xl">
          {/* Top decoration */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"></div>
          
          {/* Timer section */}
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-black/30">
            <p className="text-xl sm:text-2xl text-white font-medium mb-2">Countdown will start after minting is completed</p>
            <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/30 mt-2">
              <p className="text-sm text-blue-300">Token presale follows the NFT minting phase</p>
            </div>
          </div>
          
          {/* Expected price and investment summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-black/20">
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-4 text-center border border-blue-500/20">
              <div className="bg-blue-600/20 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Presale Volume</h3>
              <p className="text-xl font-bold text-cyan-400">10%</p>
              <p className="text-xs text-gray-400 mt-1">Limited to 10% of total supply</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-4 text-center border border-blue-500/20">
              <div className="bg-blue-600/20 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Whitelist</h3>
              <p className="text-md font-medium text-cyan-400">NFT Holder Priority</p>
              <p className="text-xs text-gray-400 mt-1">Special selection for marketing contributors</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-lg p-4 text-center border border-blue-500/20">
              <div className="bg-blue-600/20 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Next Steps</h3>
              <p className="text-md font-medium text-cyan-400">DEX Listing</p>
              <p className="text-xs text-gray-400 mt-1">DEX liquidity provided immediately after presale</p>
            </div>
          </div>
          
          {/* Main announcement */}
          <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Official Announcement
            </h2>
            
            <div className="space-y-4 text-gray-200">
              <p className="bg-blue-900/30 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500 text-xs sm:text-sm md:text-base leading-tight sm:leading-normal">
                <span className="font-bold text-white">Coming soon.</span> Will proceed after minting is completed. Early access will be given priority to NFT holders.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="bg-black/30 rounded-lg p-3 sm:p-4 md:p-5 border border-blue-500/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Fair Distribution Policy
                  </h3>
                  <p>The total presale volume is set at <span className="font-bold text-blue-400">10%</span> to minimize unfairness in early access.</p>
                  <p className="mt-2">There is no whitelist except for those selected as marketing contributors.</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 sm:p-4 md:p-5 border border-blue-500/20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                    </svg>
                    Future Schedule
                  </h3>
                  <p>DEX listing is planned after the presale ends.</p>
                  <p className="mt-2">All announcements will be made first on <span className="font-bold text-blue-400">Telegram</span> and then published on <span className="font-bold text-cyan-400">Twitter</span>.</p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 md:mt-8 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-3 sm:p-4 md:p-5">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  TESOLA Token Utility
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3 text-xs sm:text-sm md:text-base">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Governance voting and proposal participation</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Staking rewards and reward amplification</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Service and product payments within ecosystem</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Future utilization in games and applications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Bottom social and action buttons */}
          <div className="bg-black/40 p-4 sm:p-6 flex justify-center">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-xs sm:max-w-none">
              <button 
                onClick={() => router.push(returnUrl || '/')}
                className="px-4 sm:px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Go Back
              </button>
              
              <a 
                href="https://t.me/tesolachat" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-3.5 14.5c5.194-2.584 6.5-3.25 8.5-4.5-1.587-1.685-3.25-3.25-4-4.5 0 0-4.5 3-5.5 5.5 0.5 0.5 1 3.5 1 3.5z"/>
                </svg>
                Join Telegram
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          &copy; 2025 TESOLA. All rights reserved.
        </div>
      </div>
      
      {/* Background decoration elements */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-blob animation-delay-4000"></div>
      </div>
      
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Prevent text overflow on small screens */
        @media (max-width: 340px) {
          .text-4xl {
            font-size: 1.75rem !important;
          }
          .text-xl, .text-lg {
            font-size: 1rem !important;
          }
          h1, h2, h3 {
            word-break: break-word;
          }
        }
      `}</style>
    </div>
  );
}