import React from 'react';

const Tokenomics = () => {
  // Tokenomics data
  const tokenDistribution = [
    { category: "Presale", percentage: 10, color: "bg-purple-500" },
    { category: "Ecosystem Growth", percentage: 30, color: "bg-blue-500" },
    { category: "Team & Advisors", percentage: 20, color: "bg-pink-500" },
    { category: "Liquidity & Reserves", percentage: 25, color: "bg-green-500" },
    { category: "Marketing", percentage: 10, color: "bg-yellow-500" },
    { category: "Community Rewards", percentage: 5, color: "bg-red-500" }
  ];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        TESOLA Tokenomics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Token Distribution */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Token Distribution</h3>
          
          <div className="space-y-3">
            {tokenDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.category}</span>
                  <span className="text-white font-medium">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Token Supply Info */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">Total Supply</div>
              <div className="text-white font-bold">1,000,000,000</div>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">Initial Circulating</div>
              <div className="text-white font-bold">150,000,000</div>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">Initial Market Cap</div>
              <div className="text-white font-bold">$750,000</div>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">Initial Token Price</div>
              <div className="text-white font-bold">$0.005</div>
            </div>
          </div>
        </div>
        
        {/* Token Utility & Vesting */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Vesting Schedule</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-purple-400 font-medium mb-1">Presale Tokens</div>
              <p className="text-gray-300 text-sm">25% unlocked at TGE, then 25% every month for 3 months</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-pink-400 font-medium mb-1">Team & Advisors</div>
              <p className="text-gray-300 text-sm">12-month cliff, then linear vesting over 24 months</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-blue-400 font-medium mb-1">Ecosystem Growth</div>
              <p className="text-gray-300 text-sm">10% unlocked at TGE, then linear vesting over 36 months</p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-green-400 font-medium mb-1">Liquidity & Reserves</div>
              <p className="text-gray-300 text-sm">40% unlocked at TGE, then linear vesting over 24 months</p>
            </div>
          </div>
          
          {/* Token Utility */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-white mb-3">Token Utility</h3>
            
            <div className="bg-gray-700 p-4 rounded-lg space-y-3">
              <div className="flex items-start">
                <div className="bg-blue-500/20 p-1.5 rounded-full mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm">Platform fees & transaction discounts</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-500/20 p-1.5 rounded-full mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm">Governance voting rights for protocol decisions</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-pink-500/20 p-1.5 rounded-full mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm">Staking rewards & yield farming opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-500/20 p-1.5 rounded-full mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm">Access to premium features & exclusive content</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/20 rounded-lg text-yellow-200 text-sm">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Full tokenomics details are available in our whitepaper. The distribution and vesting schedules are enforced by smart contracts that have been audited for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;