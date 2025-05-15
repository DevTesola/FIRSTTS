import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";

/**
 * 이 파일은 원래의 PresaleSection을 Coming Soon 버전으로 대체한 것입니다.
 * 백업 파일: PresaleSection.jsx.original
 */

export default function PresaleSection({
  currentPrice,
  tokensSold,
  hardCap,
  minPurchase,
  maxPurchase,
  saleEnds,
  onPurchase,
  onPurchaseComplete,
  ...props
}) {
  const wallet = useWallet();
  const router = useRouter();
  const [purchaseAmount, setPurchaseAmount] = useState(100);

  // Coming Soon 페이지로 리다이렉트하는 함수
  const handlePurchase = () => {
    // 현재 경로를 returnUrl로 설정하여 돌아올 수 있게 함
    const returnUrl = encodeURIComponent(router.asPath);
    router.push(`/coming-soon-presale?returnUrl=${returnUrl}`);
  };

  // 버튼 텍스트 계산 함수
  const getButtonText = () => {
    if (!wallet.connected) {
      return "Connect Wallet";
    }
    return "Buy TESOLA Tokens";
  };

  // 날짜 형식 변환 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return "Coming Soon";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 퍼센트 계산 함수
  const calculatePercentage = () => {
    if (!tokensSold || !hardCap) return 0;
    return Math.min(100, Math.floor((tokensSold / hardCap) * 100));
  };

  const percentage = calculatePercentage();

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-blue-500/30 shadow-lg shadow-blue-900/20 mb-12">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              TESOLA Token Presale
            </h2>
            <p className="text-gray-300 mb-6">
              Early access to TESOLA tokens at a discounted price. Limited allocation available for early supporters.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="bg-blue-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-200">Current price: {currentPrice || "$0.01"} USD</span>
              </div>
              
              <div className="flex items-center">
                <div className="bg-indigo-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-200">Sale ends: {formatDate(saleEnds) || "March 15, 2025"}</span>
              </div>
              
              <div className="flex items-center">
                <div className="bg-cyan-900/30 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-200">NFT holders get 10% bonus allocation</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress: {percentage}%</span>
                <span className="text-gray-400">
                  {tokensSold || 0} / {hardCap || "10,000,000"} TESOLA
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-gray-400 font-medium mb-2" htmlFor="amount">
                Purchase amount (TESOLA)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="amount"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                  min={minPurchase || 100}
                  max={maxPurchase || 100000}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-lg py-2 px-4 text-white focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setPurchaseAmount(Math.min(purchaseAmount + 100, maxPurchase || 100000))}
                  className="ml-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg"
                >
                  +
                </button>
                <button
                  onClick={() => setPurchaseAmount(Math.max(purchaseAmount - 100, minPurchase || 100))}
                  className="ml-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg"
                >
                  -
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Min: {minPurchase || 100} | Max: {maxPurchase || 100000}
              </div>
            </div>
            
            <button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-900/40 font-medium text-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {getButtonText()}
            </button>
            
            <p className="text-gray-500 text-xs text-center mt-3">
              By purchasing, you agree to our Terms of Service
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-4 md:p-0 md:flex md:items-stretch">
          <div className="w-full h-full min-h-[250px] relative rounded-xl md:rounded-l-none md:rounded-r-xl overflow-hidden">
            <Image
              src="/slr.png"
              alt="TESOLA Token"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-6">
              <div className="text-center">
                <p className="text-white font-medium mb-2">TESOLA Ecosystem Token</p>
                <p className="text-xs text-gray-300">Utility & Governance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}