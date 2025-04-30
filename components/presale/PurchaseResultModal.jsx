import React from 'react';
import Image from 'next/image';

export default function PurchaseResultModal({ result, onClose }) {
  if (!result) return null;
  
  const { tokenAmount, totalCost, txSignature } = result;
  
  // Format signatures for display
  const formatSignature = (sig) => {
    if (!sig) return '';
    return sig.slice(0, 8) + '...' + sig.slice(-8);
  };
  
  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full overflow-hidden border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)] animate-fade-in">
        {/* Success header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-6 relative">
          <div className="absolute inset-0 bg-[url('/confetti.svg')] opacity-30"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white text-center">Purchase Successful!</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <Image src="/logo2.png" alt="TESOLA Logo" width={64} height={64} className="animate-pulse" />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Tokens Purchased</div>
                <div className="text-white font-bold text-xl">{formatNumber(tokenAmount)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Total Cost</div>
                <div className="text-white font-bold text-xl">{totalCost.toFixed(6)} SOL</div>
              </div>
            </div>
            
            {txSignature && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-gray-400 text-sm mb-1">Transaction Signature:</div>
                <a 
                  href={`https://solscan.io/tx/${txSignature}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-mono break-all"
                >
                  {formatSignature(txSignature)}
                </a>
              </div>
            )}
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-600/20 rounded-lg p-4 text-yellow-300 text-sm mb-6">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium mb-1">Important Note:</p>
                <p>Your TESOLA tokens will be airdropped to your wallet when the token officially launches. Keep an eye on our announcements for the official release date.</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors shadow-lg font-medium flex justify-center items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Transaction
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}