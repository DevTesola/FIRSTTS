import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ComingSoonMintPage() {
  const router = useRouter();
  const { returnUrl } = router.query;
  const [animationClass, setAnimationClass] = useState('opacity-0');
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimationClass('opacity-100 transform-none'), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate remaining time (starting from 15 days)
  const calculateTimeLeft = () => {
    // Set launch date to 15 days from now
    const now = new Date();
    const launchDate = new Date();
    launchDate.setDate(now.getDate() + 15);
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
  
  // Update countdown timer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-black bg-[url('/stars.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4" style={{ minHeight: '-webkit-fill-available' }}>
      <Head>
        <title>NFT Minting Coming Soon | TESOLA</title>
        <meta name="description" content="TESOLA NFT Minting Coming Soon - Exclusive benefits and early access for whitelist members." />
      </Head>
    
      <div 
        className={`max-w-4xl w-full transition-all duration-1000 ease-out transform translate-y-10 ${animationClass}`}
      >
        {/* Top logo / title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-3">
            NFT MINTING
          </h1>
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            <span className="bg-purple-700 px-3 py-1 rounded-md">COMING SOON</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 backdrop-blur-lg rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl">
          {/* Top decoration */}
          <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600"></div>
          
          {/* Timer section */}
          <div className="flex justify-center py-6 px-4 bg-black/30">
            {Object.keys(timeLeft).length > 0 ? (
              <div className="flex space-x-2 sm:space-x-4">
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white bg-purple-900/50 w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center border border-purple-500/30">
                    {timeLeft.days}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">DAYS</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white bg-purple-900/50 w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center border border-purple-500/30">
                    {timeLeft.hours}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">HOURS</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white bg-purple-900/50 w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center border border-purple-500/30">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">MINUTES</div>
                </div>
              </div>
            ) : (
              <p className="text-xl text-white">Launch date coming soon!</p>
            )}
          </div>
          
          {/* Main announcement */}
          <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Official Announcement
            </h2>
            
            <div className="space-y-4 text-gray-200">
              <p className="bg-purple-900/30 p-2.5 sm:p-3 md:p-4 rounded-lg border-l-4 border-purple-500 text-xs sm:text-sm md:text-base leading-tight sm:leading-normal">
                <span className="font-bold text-white">Early access</span> will be available to whitelist members and early Telegram supporters.
              </p>
              
              <div className="bg-black/30 rounded-lg p-3 sm:p-4 md:p-5 mt-4 sm:mt-5 md:mt-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="leading-tight">Pricing Information</span>
                </h3>
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-2.5 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base leading-tight sm:leading-normal">
                  <p className="mb-2">Price starts at <span className="font-bold text-blue-400">3 SOL</span> and increases by <span className="font-bold text-pink-400">0.2 SOL</span> each day.</p>
                  <p>Final price will be <span className="font-bold text-white">5 SOL</span>.</p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-5 md:mt-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span className="leading-tight">NFT Benefits</span>
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base">
                  <li className="flex items-start bg-black/20 rounded-lg p-1.5 sm:p-2 md:p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">TESOLA token presale whitelist qualification</span>
                  </li>
                  <li className="flex items-start bg-black/20 rounded-lg p-1.5 sm:p-2 md:p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Incredible rewards through hold-to-earn system</span>
                  </li>
                  <li className="flex items-start bg-black/20 rounded-lg p-1.5 sm:p-2 md:p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Beta tester qualification for future game releases</span>
                  </li>
                  <li className="flex items-start bg-black/20 rounded-lg p-1.5 sm:p-2 md:p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="leading-tight line-clamp-2 sm:line-clamp-none">Various benefits including meme battle voting rights</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
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
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base flex items-center justify-center"
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
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-15 animate-blob animation-delay-4000"></div>
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
          .text-3xl {
            font-size: 1.5rem !important;
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