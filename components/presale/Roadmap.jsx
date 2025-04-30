import React from 'react';

const Roadmap = () => {
  const roadmapPhases = [
    {
      quarter: "Q2 2025",
      title: "Foundation & Presale",
      completed: true,
      items: [
        "Project concept and whitepaper",
        "Team formation",
        "Smart contract development",
        "Security audit",
        "Community building",
        "Token presale"
      ]
    },
    {
      quarter: "Q3 2025",
      title: "Launch & Initial Ecosystem",
      completed: false,
      items: [
        "Token Generation Event (TGE)",
        "DEX listings",
        "Liquidity pool establishment",
        "Staking platform launch",
        "Governance portal beta",
        "Partnership announcements"
      ]
    },
    {
      quarter: "Q4 2025",
      title: "Platform Expansion",
      completed: false,
      items: [
        "Mobile wallet integration",
        "Cross-chain bridge deployment",
        "Enhanced DeFi features",
        "Major CEX listings",
        "Partnership ecosystem growth",
        "DAO governance implementation"
      ]
    },
    {
      quarter: "Q1 2026",
      title: "Advanced Features & Growth",
      completed: false,
      items: [
        "NFT marketplace integration",
        "DApp platform launch",
        "Developer grant program",
        "Enterprise solutions beta",
        "Global marketing campaign",
        "Ecosystem fund activation"
      ]
    }
  ];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        TESOLA Roadmap
      </h2>
      
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[15px] md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
        
        {/* Timeline items */}
        <div className="space-y-12">
          {roadmapPhases.map((phase, index) => (
            <div 
              key={index}
              className={`relative flex flex-col md:flex-row ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 rounded-full border-4 bg-gray-900 z-10 flex items-center justify-center"
                style={{ 
                  borderColor: phase.completed ? '#A855F7' : '#2D3748',
                  top: '2rem'
                }}
              >
                {phase.completed && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              {/* Content */}
              <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                <div className={`bg-gray-700 rounded-lg p-5 ${
                  phase.completed ? 'border-l-4 border-purple-500' : 'border-l-4 border-gray-600'
                }`}>
                  <div className="flex items-center mb-3">
                    <span className="bg-gray-800 text-xs font-medium px-2.5 py-1 rounded text-gray-300">
                      {phase.quarter}
                    </span>
                    {phase.completed && (
                      <span className="ml-2 bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                  
                  <ul className="space-y-2">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-10 p-4 bg-blue-900/20 border border-blue-600/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">Long-term Vision (2026-2027)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Enterprise Adoption</div>
            <p className="text-gray-300">Develop enterprise solutions for major corporations to integrate TESOLA token into their businesses</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Protocol Expansion</div>
            <p className="text-gray-300">Create a full suite of interoperable DeFi protocols powered by TESOLA governance</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Global Ecosystem</div>
            <p className="text-gray-300">Establish regional hubs and partnerships worldwide to drive adoption and utility</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>This roadmap is subject to changes based on market conditions and community decisions.</p>
        <p>All updates will be announced through our official channels.</p>
      </div>
    </div>
  );
};

export default Roadmap;