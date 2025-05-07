import React from 'react';

const Tokenomics = () => {
  // Updated Tokenomics data based on the latest information
  const tokenDistribution = [
    { category: "DRIVE[HOLD]-TO-EARN Ecosystem", percentage: 40, color: "bg-gradient-to-r from-purple-500 to-blue-500", description: "3-Phase Reward System" },
    { category: "Liquidity & Exchanges", percentage: 20, color: "bg-gradient-to-r from-blue-600 to-cyan-500", description: "DEX/CEX Liquidity Provision" },
    { category: "Team & Advisors", percentage: 15, color: "bg-gradient-to-r from-pink-600 to-rose-500", description: "Core Team & Strategic Advisors" },
    { category: "Development & Marketing", percentage: 10, color: "bg-gradient-to-r from-indigo-500 to-purple-600", description: "Development, Operations & Expansion" },
    { category: "Presale", percentage: 10, color: "bg-gradient-to-r from-green-600 to-emerald-500", description: "Early Investors & Community" },
    { category: "Reserve & DAO Treasury", percentage: 5, color: "bg-gradient-to-r from-amber-600 to-orange-500", description: "Governance & Ecosystem Fund" }
  ];

  // DRIVE[HOLD]-TO-EARN Structure
  const driveToEarnDetails = [
    { 
      phase: "HOLD-TO-EARN", 
      allocation: "40%", 
      status: "Active", 
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "from-purple-500 to-blue-500" 
    },
    { 
      phase: "GAME DRIVE-TO-EARN", 
      allocation: "40%", 
      status: "Q3 2025", 
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", 
      color: "from-blue-500 to-cyan-500" 
    },
    { 
      phase: "REAL DRIVE-TO-EARN", 
      allocation: "20%", 
      status: "2026 Target", 
      icon: "M13 10V3L4 14h7v7l9-11h-7z", 
      color: "from-cyan-500 to-teal-500" 
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl p-6 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)] font-orbitron">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 mb-3">
          TESOLA Tokenomics
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          A token economic model meticulously designed for sustainable growth and long-term value creation
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 토큰 분배 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <div className="bg-purple-900/50 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            Token Distribution Structure
          </h3>
          
          <div className="space-y-4">
            {tokenDistribution.map((item, index) => (
              <div key={index} className="group">
                <div className="flex justify-between text-sm mb-1 items-center">
                  <div className="flex items-center">
                    <span className="text-gray-300 font-medium">{item.category}</span>
                    <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                      ({item.description})
                    </span>
                  </div>
                  <span className="text-white font-bold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-6 overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out flex items-center justify-center`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="text-xs font-medium text-white mx-2">{item.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Token Supply Info */}
          <div className="mt-6">
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="text-purple-400 text-sm font-medium mb-1">Total Supply</div>
              <div className="text-white font-bold text-2xl">1,000,000,000 TESOLA</div>
            </div>
          </div>
        </div>
        
        {/* DRIVE-TO-EARN 세부 구조 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <div className="bg-blue-900/50 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            DRIVE[HOLD]-TO-EARN 3-Phase Strategy
          </h3>
          
          <div className="space-y-4">
            {driveToEarnDetails.map((phase, index) => (
              <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/30 transition-all hover:translate-x-1">
                <div className="flex items-start">
                  <div className={`rounded-lg p-2 mr-3 bg-gradient-to-r ${phase.color}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={phase.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-bold text-white">{phase.phase}</h4>
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-300 border border-blue-500/30">
                        {phase.allocation}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{phase.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-5 space-y-4">
            <div className="bg-blue-900/20 backdrop-blur-sm p-3 rounded-lg border border-blue-500/20">
              <div className="text-blue-300 font-medium mb-1">NFT Tier-Based Daily Rewards</div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-yellow-900/30 p-2 rounded">
                  <div className="text-yellow-300 font-bold">200</div>
                  <div className="text-gray-400 text-xs">Legendary</div>
                </div>
                <div className="bg-pink-900/30 p-2 rounded">
                  <div className="text-pink-300 font-bold">100</div>
                  <div className="text-gray-400 text-xs">Epic</div>
                </div>
                <div className="bg-purple-900/30 p-2 rounded">
                  <div className="text-purple-300 font-bold">50</div>
                  <div className="text-gray-400 text-xs">Rare</div>
                </div>
                <div className="bg-blue-900/30 p-2 rounded">
                  <div className="text-blue-300 font-bold">25</div>
                  <div className="text-gray-400 text-xs">Common</div>
                </div>
              </div>
            </div>
            
            <div className="bg-teal-900/20 backdrop-blur-sm p-3 rounded-lg border border-teal-500/20">
              <div className="text-teal-300 font-medium mb-1">Long-Term Staking Bonuses</div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-gray-800/50 p-2 rounded">
                  <div className="text-white font-bold">+20%</div>
                  <div className="text-gray-400 text-xs">30+ Days</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded">
                  <div className="text-white font-bold">+40%</div>
                  <div className="text-gray-400 text-xs">90+ Days</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded">
                  <div className="text-white font-bold">+70%</div>
                  <div className="text-gray-400 text-xs">180+ Days</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded">
                  <div className="text-white font-bold">+100%</div>
                  <div className="text-gray-400 text-xs">365+ Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 토큰 베스팅 및 가치 보호 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 베스팅 일정 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <div className="bg-pink-900/50 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Vesting & Release Schedule
          </h3>
          
          <div className="space-y-3">
            <div className="bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="text-purple-400 font-medium mb-1">Presale Participants</div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="bg-purple-500/20 h-3 rounded-full w-1/4"></div>
                <div className="bg-purple-500/40 h-3 rounded-full w-1/4"></div>
                <div className="bg-purple-500/40 h-3 rounded-full w-1/4"></div>
                <div className="bg-purple-500/40 h-3 rounded-full w-1/4"></div>
              </div>
              <p className="text-gray-300 text-xs">25% immediate unlock, then 25% monthly over 3 months</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="text-pink-400 font-medium mb-1">Team & Development</div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="bg-gray-700 h-3 rounded-full w-1/3"></div>
                <div className="bg-pink-500/30 h-3 rounded-full w-1/3"></div>
                <div className="bg-pink-500/30 h-3 rounded-full w-1/3"></div>
              </div>
              <p className="text-gray-300 text-xs">12-month cliff, then linear vesting over 24 months</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="text-blue-400 font-medium mb-1">DRIVE[HOLD]-TO-EARN Rewards</div>
              <div className="flex items-center space-x-0.5 mb-1">
                <div className="bg-blue-500/40 h-3 rounded-l-full w-1/6"></div>
                <div className="bg-blue-500/30 h-3 w-1/6"></div>
                <div className="bg-blue-500/30 h-3 w-1/6"></div>
                <div className="bg-blue-500/30 h-3 w-1/6"></div>
                <div className="bg-blue-500/20 h-3 w-1/6"></div>
                <div className="bg-blue-500/20 h-3 rounded-r-full w-1/6"></div>
              </div>
              <p className="text-gray-300 text-xs">Phased release: Hold-to-Earn (24 months), Game (36 months), Real Driving (48 months)</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="text-green-400 font-medium mb-1">Liquidity Pool</div>
              <div className="flex items-center space-x-0.5 mb-1">
                <div className="bg-green-500/40 h-3 rounded-l-full w-1/4"></div>
                <div className="bg-green-500/30 h-3 w-1/4"></div>
                <div className="bg-green-500/30 h-3 w-1/4"></div>
                <div className="bg-green-500/20 h-3 rounded-r-full w-1/4"></div>
              </div>
              <p className="text-gray-300 text-xs">25% initial, then gradual addition over 18 months</p>
            </div>
          </div>
        </div>
        
        {/* 토큰 가치 보호 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <div className="bg-teal-900/50 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            Token Value Protection Mechanisms
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="bg-red-900/30 p-1.5 rounded-full mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Burn Program</div>
                <p className="text-gray-400 text-xs">30% of game NFT sales and in-game purchases, 25% of transaction fees burned</p>
              </div>
            </div>
            
            <div className="flex items-start bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="bg-yellow-900/30 p-1.5 rounded-full mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Circulating Supply Limitation</div>
                <p className="text-gray-400 text-xs">Daily reward cap, reduced circulating supply through long-term staking incentives</p>
              </div>
            </div>
            
            <div className="flex items-start bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="bg-blue-900/30 p-1.5 rounded-full mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Liquidity Management</div>
                <p className="text-gray-400 text-xs">70% of presale funds permanently allocated to liquidity, diversified pools across multiple DEXs</p>
              </div>
            </div>
            
            <div className="flex items-start bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700/50">
              <div className="bg-green-900/30 p-1.5 rounded-full mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Buyback Program</div>
                <p className="text-gray-400 text-xs">Market purchases and burns using portions of game revenue and quarterly profits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer note */}
      <div className="mt-6 py-4 px-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg border border-purple-500/30 flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-gray-300 text-sm mb-1">
            <span className="font-medium text-purple-300">Sustainable Token Economy:</span> TESOLA tokenomics is designed with a focus on long-term value creation. 
          </p>
          <p className="text-gray-400 text-xs">
            Token distribution and vesting schedules are enforced by audited smart contracts, with all major changes determined through community governance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;