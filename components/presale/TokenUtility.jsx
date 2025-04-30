import React from 'react';

const TokenUtility = () => {
  const utilityCategories = [
    {
      title: "Governance",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      description: "TESOLA token holders can participate in governance decisions for the platform, including voting on protocol upgrades, fee structures, and treasury allocations.",
      features: [
        "Proposal creation rights",
        "Weighted voting based on holdings",
        "Community treasury management",
        "Protocol parameter adjustments"
      ]
    },
    {
      title: "Platform Benefits",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
      ),
      description: "TESOLA tokens provide holders with various benefits and discounts when interacting with the platform's ecosystem.",
      features: [
        "Reduced transaction fees",
        "Priority access to new features",
        "Enhanced API rate limits",
        "Premium dashboard tools"
      ]
    },
    {
      title: "Staking & Rewards",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: "Holders can stake TESOLA tokens to earn passive income and additional benefits within the ecosystem.",
      features: [
        "Staking APY rewards",
        "Liquidity mining incentives",
        "Yield farming opportunities",
        "Bonus rewards for long-term stakers"
      ]
    },
    {
      title: "Access Control",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      description: "TESOLA tokens serve as keys to access premium features, exclusive content, and special events within the ecosystem.",
      features: [
        "VIP platform areas",
        "Premium data analytics",
        "Exclusive NFT drops",
        "Early access to new protocols"
      ]
    }
  ];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        TESOLA Token Utility
      </h2>
      
      <div className="text-center mb-8">
        <p className="text-gray-300 max-w-2xl mx-auto">
          TESOLA is a multi-utility token designed to power the entire ecosystem, providing holders with a wide range of benefits and use cases.
        </p>
      </div>
      
      {/* Main utility categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {utilityCategories.map((category, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-5 border-l-4 border-purple-500">
            <div className="flex items-center mb-4">
              <div className="mr-4 bg-gray-800 p-3 rounded-lg">
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{category.title}</h3>
            </div>
            
            <p className="text-gray-300 mb-4">{category.description}</p>
            
            <ul className="space-y-2">
              {category.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* TESOLA Ecosystem Integration */}
      <div className="bg-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-center text-white mb-5">TESOLA Ecosystem Integration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="bg-purple-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">DeFi Protocol</h4>
            <p className="text-gray-400 text-sm">Powers lending, borrowing, and liquidity features across the platform</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="bg-blue-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">NFT Marketplace</h4>
            <p className="text-gray-400 text-sm">Used for trading fees, creator royalties, and exclusive NFT access</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="bg-pink-900/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">DAO Governance</h4>
            <p className="text-gray-400 text-sm">Enables decentralized decision-making across the entire ecosystem</p>
          </div>
        </div>
      </div>
      
      {/* Future Utility Expansion */}
      <div className="p-5 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-3">Future Utility Expansion</h3>
        <p className="text-gray-300 mb-4">
          As the TESOLA ecosystem grows, we plan to expand token utility in the following areas:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded-lg flex items-center">
            <div className="bg-green-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white">Cross-chain bridge integration</span>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg flex items-center">
            <div className="bg-yellow-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="text-white">Real-world asset tokenization</span>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg flex items-center">
            <div className="bg-blue-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white">Enterprise blockchain solutions</span>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded-lg flex items-center">
            <div className="bg-purple-900/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <span className="text-white">Metaverse & gaming integration</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/20 rounded-lg text-blue-200 text-sm">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            As outlined in our whitepaper, the TESOLA token is designed with a sustainable economic model that balances utility, scarcity, and long-term value creation. New utility features will be added based on community governance decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenUtility;