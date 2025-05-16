import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LaunchAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has opted not to see the modal today
    const lastDismissed = localStorage.getItem('launchModalDismissed');
    if (lastDismissed) {
      const dismissedDate = new Date(lastDismissed);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dismissedDate.setHours(0, 0, 0, 0);
      
      if (dismissedDate.getTime() === today.getTime()) {
        return; // Don't show if already dismissed today
      }
    }
    
    // Show modal after a short delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [router.pathname]);

  const handleClose = () => {
    if (dontShowToday) {
      localStorage.setItem('launchModalDismissed', new Date().toISOString());
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl animate-slideUp">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Content */}
        <div className="text-center">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            🚀 TESOLA Launch Timeline
          </h2>
          
          {/* June 1st emphasis */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 mb-6 border border-purple-500/50">
            <p className="text-xl sm:text-2xl font-bold text-white mb-2">
              📅 June 1st, 2025
            </p>
            <p className="text-lg text-purple-300 font-semibold">
              Everything Begins! 🎉
            </p>
          </div>
          
          {/* Timeline */}
          <div className="relative space-y-4 text-left mb-6">
            {/* Timeline line */}
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-purple-500/30"></div>
            
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="ml-4">
                <p className="font-semibold text-white">June 1st - NFT Official Launch</p>
                <p className="text-gray-400 text-sm">SOLARA NFT Collection minting begins</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="ml-4">
                <p className="font-semibold text-white">Post-Mint - TESOLA Presale</p>
                <p className="text-gray-400 text-sm">Exclusive presale for NFT holders</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="ml-4">
                <p className="font-semibold text-white">Presale End - DEX Listing</p>
                <p className="text-gray-400 text-sm">Launch on Raydium & Jupiter</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
                4
              </div>
              <div className="ml-4">
                <p className="font-semibold text-white">Community Integration</p>
                <p className="text-gray-400 text-sm">Full ecosystem activation</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                5
              </div>
              <div className="ml-4">
                <p className="font-semibold text-white">CEX Listing</p>
                <p className="text-gray-400 text-sm">Major exchange listings</p>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 mb-6">
            <p className="text-white font-medium mb-2">
              Don't miss the launch! 🎯
            </p>
            <p className="text-gray-300 text-sm">
              Join our community to get exclusive updates
            </p>
          </div>
          
          {/* Don't show today checkbox */}
          <div className="flex items-center justify-center mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="mr-2 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-gray-400 text-sm">Don't show this today</span>
            </label>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-lg"
            >
              Close
            </button>
            <a
              href="https://t.me/tesolachat"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg text-lg"
            >
              Join Telegram
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-out;
        }
        
        :global(.animate-slideUp) {
          animation: slideUp 0.4s ease-out;
        }
        
        :global(.animate-pulse) {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}