"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletGuide() {
  const { publicKey, connected } = useWallet();
  const [showGuide, setShowGuide] = useState(false);
  const [step, setStep] = useState(1);
  
  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenWalletGuide");
    if (!hasSeenGuide && !connected) {
      setShowGuide(true);
    }
  }, [connected]);
  
  // When connected, update the step to show success message
  useEffect(() => {
    if (connected && showGuide) {
      setStep(4);
    }
  }, [connected, showGuide]);
  
  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("hasSeenWalletGuide", "true");
  };
  
  if (!showGuide) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button 
          onClick={closeGuide}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        {/* Progress indicator */}
        <div className="flex mb-6 justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`h-2 w-14 mx-1 rounded-full ${
                i <= step ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            ></div>
          ))}
        </div>
        
        {/* Content based on current step */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">Welcome to SOLARA!</h2>
            <p className="text-gray-300 mb-6">
              To mint NFTs on Solana, you'll need a compatible wallet. This quick guide will help you get started.
            </p>
            <div className="bg-purple-900/30 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-purple-300 mb-1">What is a Wallet?</h3>
              <p className="text-sm text-gray-300">
                A crypto wallet is a secure digital tool that allows you to store, send, and receive cryptocurrencies like SOL, and interact with NFTs.
              </p>
            </div>
            <div className="text-center">
              <button 
                onClick={() => setStep(2)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Next
              </button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">Choose a Wallet</h2>
            <p className="text-gray-300 mb-6">
              SOLARA supports several popular Solana wallets. Here are our recommendations:
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <img src="/phantom-logo.png" alt="Phantom Logo" className="h-12 mx-auto mb-2" />
                <h3 className="font-medium">Phantom</h3>
                <p className="text-xs text-gray-400">Popular & easy to use</p>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <img src="/solflare-logo.png" alt="Solflare Logo" className="h-12 mx-auto mb-2" />
                <h3 className="font-medium">Solflare</h3>
                <p className="text-xs text-gray-400">Feature-rich wallet</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Next
              </button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Now, click the button below to connect your wallet. If you don't have one yet, you'll be prompted to install it.
            </p>
            
            <div className="bg-purple-900/30 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-purple-300 mb-1">Tip:</h3>
              <p className="text-sm text-gray-300">
                Make sure your wallet is funded with SOL before minting. The current mint price is 1.5 SOL.
              </p>
            </div>
            
            <div className="flex justify-center mb-6">
              <WalletMultiButton />
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={closeGuide}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Skip
              </button>
            </div>
          </>
        )}
        
        {step === 4 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-4">Wallet Connected!</h2>
            <p className="text-gray-300 mb-6">
              Great! Your wallet is now connected. You're ready to mint your SOLARA NFT.
            </p>
            
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/50 mb-6">
              <h3 className="font-bold text-green-400 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Connected Wallet:
              </h3>
              <p className="text-sm font-mono text-gray-300">
                {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
              </p>
            </div>
            
            <div className="text-center">
              <button 
                onClick={closeGuide}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Start Minting
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}