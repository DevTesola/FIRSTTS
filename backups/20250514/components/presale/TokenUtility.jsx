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
        "Development roadmap voting rights",
        "Weighted voting based on holdings",
        "Community treasury management",
        "Proposal submission and review"
      ]
    },
    {
      title: "Premium Features",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      description: "TESOLA tokens serve as keys to access premium features, exclusive content, and special events within the ecosystem.",
      features: [
        "Premium dashboards and analytics",
        "Exclusive game items and skins",
        "VIP events and webinar access",
        "Early access to beta features"
      ]
    },
    {
      title: "Rewards Boosting",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: "The more TESOLA tokens you hold, the higher reward multipliers you receive in staking, gaming, and real driving.",
      features: [
        "Tiered reward multipliers (up to 2.5x)",
        "Holdings-based reward boosts",
        "NFT holder additional bonuses",
        "Synergy rewards for combined activities"
      ]
    },
    {
      title: "Payment System",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      description: "TESOLA provides a payment system for purchasing game items, premium features, physical goods, and services within the ecosystem.",
      features: [
        "Ecosystem-wide payments for all services",
        "Discount benefits (up to 30%)",
        "Marketplace transaction fees",
        "NFT minting and trading"
      ]
    }
  ];

  // TESOLA 3-Phase Strategy
  const strategyPillars = [
    {
      id: "hold-to-earn",
      title: "HOLD-TO-EARN",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: "A base model that provides continuous rewards to users who hold and stake TESOLA tokens. Rewards vary based on holding period and quantity.",
      features: [
        "Staking Rewards: Up to 12% APY",
        "NFT Staking Boost: Additional +3-5% rewards",
        "Long-term holding bonus system",
        "Compound interest automation"
      ],
      color: "from-blue-500 to-indigo-600",
      allocation: "40%"
    },
    {
      id: "game-drive-to-earn",
      title: "GAME DRIVE-TO-EARN",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      description: "A gamified economic system where users can earn tokens based on activities and achievements in virtual driving games, participating in the token ecosystem through gameplay.",
      features: [
        "Daily game mission rewards",
        "Driving skill reward levels",
        "Weekly tournaments & leaderboards",
        "Game item and power-up purchases"
      ],
      color: "from-purple-500 to-pink-600",
      allocation: "40%"
    },
    {
      id: "real-drive-to-earn",
      title: "REAL DRIVE-TO-EARN",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      description: "An innovative reward system for actual Tesla vehicle owners. Earn TESOLA tokens through eco-friendly driving habits, charging station usage, and community participation.",
      features: [
        "Eco-driving rewards",
        "Charging network points",
        "Tesla API integration rewards",
        "Eco-friendly driving certification NFTs"
      ],
      color: "from-teal-500 to-emerald-600",
      allocation: "20%"
    }
  ];

  // TESOLA ecosystem integrations
  const ecosystemIntegrations = [
    {
      title: "Tesla Community",
      icon: "M19 21a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h5a2 2 0 012 2v13z",
      description: "Special connection programs with Tesla vehicle owners and community",
      color: "from-red-400 to-red-600"
    },
    {
      title: "Driving Games",
      icon: "M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z",
      description: "Integration with virtual driving simulation game platforms",
      color: "from-purple-400 to-purple-600"
    },
    {
      title: "Mobility Network",
      icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
      description: "Global EV charging stations and mobility service connections",
      color: "from-blue-400 to-blue-600"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/30 rounded-xl p-8 border border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.25)] backdrop-blur-sm relative overflow-hidden font-orbitron">
      {/* Animated background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
    
      <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-shimmer">
        TESOLA Token Utility
      </h2>
      
      <div className="text-center mb-10">
        <p className="text-indigo-100 max-w-2xl mx-auto text-lg leading-relaxed">
          TESOLA is a multi-utility token built on a 3-phase strategy that integrates staking rewards, game incentives, and real Tesla driving rewards into a coherent ecosystem.
        </p>
      </div>
      
      {/* 3-Phase Strategy Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TESOLA 3-Phase Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {strategyPillars.map((pillar) => (
            <div key={pillar.id} className="bg-gray-800/80 rounded-xl p-6 border border-purple-500/30 shadow-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300 hover:translate-y-[-2px] group overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="flex items-center mb-5 relative z-10">
                <div className={`mr-4 bg-gradient-to-br ${pillar.color} p-3 rounded-lg shadow-md group-hover:shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-300`}>
                  {pillar.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">{pillar.title}</h4>
                  <span className="bg-purple-900/50 text-purple-300 text-xs px-3 py-1 rounded-full">
                    {pillar.allocation}
                  </span>
                </div>
              </div>
              
              <p className="text-indigo-200 mb-5 text-sm leading-relaxed">{pillar.description}</p>
              
              <ul className="space-y-3">
                {pillar.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-hover:text-purple-300 mr-2 flex-shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300 group-hover:text-indigo-200 transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main utility categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {utilityCategories.map((category, index) => (
          <div key={index} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/40 shadow-lg group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <div className="flex items-center mb-5">
              <div className="mr-4 bg-gray-900/80 p-3 rounded-lg group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-300">
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">{category.title}</h3>
            </div>
            
            <p className="text-indigo-200 mb-5 leading-relaxed">{category.description}</p>
            
            <ul className="space-y-3">
              {category.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 group-hover:text-purple-300 mr-2 flex-shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300 group-hover:text-indigo-200 transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* TESOLA Ecosystem Integration */}
      <div className="bg-gradient-to-br from-gray-900/70 to-indigo-900/30 rounded-xl p-8 border border-indigo-500/30 shadow-lg mb-12 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent mb-8">TESOLA Ecosystem Integration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ecosystemIntegrations.map((integration, index) => (
            <div key={index} className="bg-gray-800/60 p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:shadow-[0_5px_15px_rgba(99,102,241,0.2)] border border-indigo-500/20 hover:border-indigo-500/40 group">
              <div className={`bg-gradient-to-r ${integration.color} w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4 shadow-md group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={integration.icon} />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-200 transition-colors">{integration.title}</h4>
              <p className="text-indigo-200 text-sm leading-relaxed">{integration.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Token metrics */}
      <div className="bg-gradient-to-br from-purple-900/30 to-gray-900/70 rounded-xl p-8 border border-purple-500/30 shadow-lg mb-12 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">Token Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_5px_15px_rgba(168,85,247,0.15)] transform transition-all duration-300 hover:translate-y-[-2px] group">
            <div className="text-purple-400 font-bold text-3xl mb-2 group-hover:text-purple-300 transition-colors">25+</div>
            <div className="text-indigo-200 text-sm">Unique utility functions</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_5px_15px_rgba(96,165,250,0.15)] transform transition-all duration-300 hover:translate-y-[-2px] group">
            <div className="text-blue-400 font-bold text-3xl mb-2 group-hover:text-blue-300 transition-colors">15%</div>
            <div className="text-indigo-200 text-sm">Max annual staking APY</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-5 rounded-xl border border-pink-500/20 hover:border-pink-500/40 hover:shadow-[0_5px_15px_rgba(244,114,182,0.15)] transform transition-all duration-300 hover:translate-y-[-2px] group">
            <div className="text-pink-400 font-bold text-3xl mb-2 group-hover:text-pink-300 transition-colors">3</div>
            <div className="text-indigo-200 text-sm">Integrated ecosystem phases</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-5 rounded-xl border border-green-500/20 hover:border-green-500/40 hover:shadow-[0_5px_15px_rgba(52,211,153,0.15)] transform transition-all duration-300 hover:translate-y-[-2px] group">
            <div className="text-green-400 font-bold text-3xl mb-2 group-hover:text-green-300 transition-colors">30%</div>
            <div className="text-indigo-200 text-sm">Ecosystem payment discounts</div>
          </div>
        </div>
      </div>
      
      {/* Future Utility Expansion */}
      <div className="p-8 bg-gradient-to-br from-purple-900/40 to-pink-900/30 rounded-xl shadow-lg border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
        
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Future Utility Expansion</h3>
        <p className="text-indigo-100 mb-6 text-lg leading-relaxed max-w-3xl">
          As the TESOLA ecosystem grows, we plan to expand token utility in the following areas:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-800/50 p-5 rounded-xl border border-green-500/20 flex items-center transform transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_5px_15px_rgba(52,211,153,0.15)] hover:translate-y-[-2px] group">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-lg mr-4 shadow-md group-hover:shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-medium text-lg group-hover:text-green-200 transition-colors">Cross-chain bridge integration</span>
          </div>
          
          <div className="bg-gray-800/50 p-5 rounded-xl border border-yellow-500/20 flex items-center transform transition-all duration-300 hover:border-yellow-500/40 hover:shadow-[0_5px_15px_rgba(251,191,36,0.15)] hover:translate-y-[-2px] group">
            <div className="bg-gradient-to-br from-yellow-600 to-amber-600 p-3 rounded-lg mr-4 shadow-md group-hover:shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="text-white font-medium text-lg group-hover:text-yellow-200 transition-colors">Real-world asset tokenization</span>
          </div>
          
          <div className="bg-gray-800/50 p-5 rounded-xl border border-blue-500/20 flex items-center transform transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_5px_15px_rgba(59,130,246,0.15)] hover:translate-y-[-2px] group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-lg mr-4 shadow-md group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-medium text-lg group-hover:text-blue-200 transition-colors">Enterprise blockchain solutions</span>
          </div>
          
          <div className="bg-gray-800/50 p-5 rounded-xl border border-purple-500/20 flex items-center transform transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_5px_15px_rgba(139,92,246,0.15)] hover:translate-y-[-2px] group">
            <div className="bg-gradient-to-br from-purple-600 to-violet-600 p-3 rounded-lg mr-4 shadow-md group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <span className="text-white font-medium text-lg group-hover:text-purple-200 transition-colors">Metaverse & gaming integration</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-sm border border-blue-600/30 rounded-xl shadow-lg text-indigo-100 text-lg">
        <div className="flex items-start">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg mr-4 shadow-[0_0_10px_rgba(79,70,229,0.3)] flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="leading-relaxed">
            As outlined in our whitepaper, the TESOLA token is designed with a sustainable economic model that balances utility, scarcity, and long-term value creation through its innovative 3-phase strategy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenUtility;