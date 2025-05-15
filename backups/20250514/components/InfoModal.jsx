"use client";

import React from "react";

export default function InfoModal({ isVisible, onClose }) {
  if (!isVisible) return null;
  
  // TESOLA 3-Phase Strategy
  const phases = [
    {
      name: "HOLD-TO-EARN",
      description: "Staking Rewards System",
      details: "This phase allows TESOLA token holders to earn up to 15% APY rewards through staking. Additional bonuses are provided for NFT holders.",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "bg-gradient-to-r from-blue-500 to-indigo-600"
    },
    {
      name: "GAME DRIVE-TO-EARN",
      description: "Virtual Driving Game Rewards",
      details: "A gamified reward system where users can earn TESOLA tokens by participating and achieving goals in virtual driving games.",
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
      color: "bg-gradient-to-r from-purple-500 to-pink-600"
    },
    {
      name: "REAL DRIVE-TO-EARN",
      description: "Real Tesla Driving Rewards",
      details: "An innovative reward system allowing actual Tesla vehicle owners to earn TESOLA tokens through eco-friendly driving and charging station usage.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      color: "bg-gradient-to-r from-teal-500 to-green-600"
    }
  ];
  
  // Ecosystem Value and Benefits
  const benefits = [
    "Unlimited staking - Up to 15% APY",
    "NFT holder additional rewards +5%",
    "Governance voting rights",
    "Premium feature access",
    "Ecosystem service discounts",
    "Community priority access"
  ];
  
  // Token Allocation
  const tokenAllocations = [
    { name: "Ecosystem Rewards", percentage: 40 },
    { name: "Development & Marketing", percentage: 20 },
    { name: "Team & Advisors", percentage: 15 },
    { name: "Presale", percentage: 10 },
    { name: "Liquidity & Exchanges", percentage: 10 },
    { name: "Reserve", percentage: 5 }
  ];
  
  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-gray-900/90 p-8 rounded-2xl max-w-3xl w-full relative overflow-hidden border border-indigo-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decoration elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close modal"
        >
          ✕
        </button>
        
        <h2 
          id="modal-title" 
          className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6"
        >
          TESOLA Ecosystem & Value
        </h2>
        
        {/* TESOLA 3단계 전략 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-indigo-300 mb-4">3-Phase Innovation Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {phases.map((phase, index) => (
              <div 
                key={index} 
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-indigo-500/10 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-lg ${phase.color} flex items-center justify-center mb-3`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={phase.icon} />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-1">{phase.name}</h4>
                <div className="text-indigo-300 text-sm mb-2">{phase.description}</div>
                <p className="text-gray-300 text-sm">{phase.details}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* 생태계 혜택 및 토큰 분배 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 에코시스템 가치 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-indigo-500/10">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Key Benefits</h3>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-1 mr-3 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-indigo-100">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 토큰 분배 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-indigo-500/10">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Token Allocation</h3>
            <div className="space-y-3">
              {tokenAllocations.map((allocation, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-32 text-sm text-indigo-200">{allocation.name}</div>
                  <div className="flex-1 mx-2">
                    <div className="h-5 bg-gray-700/70 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${allocation.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-10 text-right text-indigo-100 font-medium">{allocation.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 요약 정보 섹션 */}
        <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/30">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-indigo-200 text-sm mb-2">
                TESOLA builds a sustainable token ecosystem through a 3-phase strategy combining staking rewards, game participation, and real driving. It creates long-term value through diverse benefits and utilities.
              </p>
              <div className="text-indigo-300 text-sm font-medium">
                See the TESOLA whitepaper for more details.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}