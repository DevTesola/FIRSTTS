import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";
import NFTEvolutionDiagram from "./NFTEvolutionDiagram";

/**
 * 이 파일은 원래의 MintSection을 Coming Soon 버전으로 대체한 것입니다.
 * 백업 파일: MintSection.jsx.original
 */

// 원래 컴포넌트와 동일한 props 인터페이스 유지
export default function MintSection({ 
  mintPrice,
  onMintComplete,
  isClient, 
  setErrorMessage,
  setErrorDetails,
  setLoading,
  showRefundPolicy,
  mintAttempts,
  ...props 
}) {
  const wallet = useWallet();
  const router = useRouter();
  
  // 원래 함수와 같은 이름의 함수 제공하되, Coming Soon 페이지로 리다이렉트
  const handlePurchase = () => {
    // 현재 경로를 returnUrl로 설정하여 돌아올 수 있게 함
    const returnUrl = encodeURIComponent(router.asPath);
    router.push(`/coming-soon-mint?returnUrl=${returnUrl}`);
  };

  // 버튼 텍스트 표시를 위한 로직 (원래 컴포넌트와 유사)
  const getMintButtonText = () => {
    if (!wallet.connected) return "CONNECT WALLET";
    return "MINT NOW";
  };

  // 원래 컴포넌트의 UI와 최대한 동일하게 유지
  return (
    <div className="bg-gray-900 rounded-2xl overflow-visible border border-purple-500/30 shadow-lg shadow-purple-900/20 mb-12">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 lg:w-[55%] p-6 xl:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SOLARA NFT Collection
            </h2>
            <div className="inline-flex items-center bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/50 rounded-full px-4 py-1 mb-4">
              <span className="text-orange-400 font-medium text-sm">✨ EVOLVE YOUR NFT TO LIVING ENTITY ✨</span>
            </div>
            <p className="text-gray-300 mb-6">
              Mint your unique SOLARA NFT and unlock evolution capabilities. Transform your NFT into a living digital entity!
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="bg-purple-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-200">Limited collection of 1,000 NFTs</span>
              </div>
              <div className="flex items-center">
                <div className="bg-pink-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-200">Completely unique designs</span>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-200">Stake to earn TESOLA rewards</span>
                  <span className="text-xs text-gray-400 mt-1">Massive rewards up to 500%+ APY</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            {/* Evolution System Diagram */}
            <NFTEvolutionDiagram />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-gray-400 font-medium">Price:</p>
                <div className="font-bold text-white text-xl">{mintPrice}</div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => showRefundPolicy && showRefundPolicy()}
                  className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 whitespace-nowrap"
                >
                  Refund Policy
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePurchase}
                className="mint-button w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-xl transition-all shadow-2xl shadow-purple-500/50 font-bold text-lg flex items-center justify-center min-h-[52px] border-2 border-purple-400 hover:border-purple-300 transform hover:scale-105"
                disabled={!isClient}
              >
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="whitespace-nowrap">{getMintButtonText()}</span>
              </button>
              
              <button
                onClick={() => router.push('/evolution')}
                className="evolution-button w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-orange-500/50 font-bold text-lg flex items-center justify-center min-h-[52px] relative border-2 border-orange-400 hover:border-orange-300 group"
                disabled={!isClient}
              >
                <div className="relative flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  <span className="whitespace-nowrap drop-shadow-md">🔥 EVOLUTION SYSTEM 🔥</span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">NEW</span>
                </div>
              </button>
            </div>
            
            <p className="text-gray-500 text-xs text-center mt-3">
              By minting, you agree to our Terms of Service
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 lg:w-[45%] p-4 md:p-0 md:flex md:items-stretch">
          <div className="w-full h-full min-h-[250px] relative rounded-xl md:rounded-l-none md:rounded-r-xl overflow-hidden">
            <Image
              src="/nft-previews/0416.png"
              alt="SOLARA NFT Preview"
              fill
              className="object-contain"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end p-6">
              <div className="text-center">
                <p className="text-white font-medium mb-2">SOLARA #0416</p>
                <p className="text-xs text-gray-300 mb-4">Preview of collection item</p>
                <div className="bg-gradient-to-r from-orange-500/90 to-red-500/90 rounded-full px-4 py-2 backdrop-blur-sm border border-orange-400/50">
                  <span className="text-white font-bold text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    EVOLUTION READY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}