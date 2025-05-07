import React from 'react';

const Roadmap = () => {
  // Updated roadmap phases
  const roadmapPhases = [
    {
      quarter: "Q2 2025",
      title: "Foundation & Token Launch",
      completed: true,
      items: [
        "TESOLA token and smart contract launch",
        "Staking platform implementation (HOLD-TO-EARN)",
        "Initial DEX & CEX listings",
        "Community foundation development",
        "NFT collection integration"
      ]
    },
    {
      quarter: "Q3 2025",
      title: "Game Platform Expansion",
      completed: false,
      items: [
        "Virtual driving game platform beta release",
        "Game reward system implementation",
        "Gaming partnerships acquisition",
        "Tournament & competition system launch",
        "Mobile app release"
      ]
    },
    {
      quarter: "Q4 2025",
      title: "Ecosystem Expansion & Globalization",
      completed: false,
      items: [
        "Global marketing campaign",
        "Additional exchange listings",
        "Multi-language platform support",
        "DAO governance system implementation",
        "Extended developer ecosystem"
      ]
    },
    {
      quarter: "1H 2026",
      title: "Real Driving Integration",
      completed: false,
      items: [
        "Tesla API integration system development",
        "Real driving data based rewards mechanism",
        "Charging station network partnerships",
        "Eco-friendly driving incentive program",
        "Tesla owner exclusive benefits"
      ]
    },
    {
      quarter: "2H 2026",
      title: "Global Ecosystem Integration",
      completed: false,
      items: [
        "Major mobility platform connections",
        "Global charging infrastructure partnerships",
        "Carbon credit system integration",
        "Expanded mobility rewards network",
        "Next-generation technology integration"
      ]
    }
  ];

  // 3-Phase TESOLA Strategy
  const strategies = [
    {
      title: "HOLD-TO-EARN",
      description: "Staking rewards for token holders",
      allocation: "40%",
      status: "Active",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    },
    {
      title: "GAME DRIVE-TO-EARN",
      description: "Game-based virtual driving rewards",
      allocation: "40%",
      status: "Q3 2025",
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    },
    {
      title: "REAL DRIVE-TO-EARN",
      description: "Real Tesla driving rewards",
      allocation: "20%",
      status: "2026 Target",
      icon: "M13 10V3L4 14h7v7l9-11h-7z"
    }
  ];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6 border border-purple-500/20 shadow-xl font-orbitron">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        TESOLA Roadmap
      </h2>
      
      {/* 3-Phase Strategy Section */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-white mb-5 bg-purple-900/20 rounded-lg p-2 text-center">3-Phase TESOLA Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategies.map((strategy, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-5 border-l-4 border-purple-500">
              <div className="flex items-center mb-3">
                <div className="bg-gray-800 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={strategy.icon} />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{strategy.title}</h4>
                  <div className="flex items-center mt-1">
                    <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded mr-2">
                      {strategy.allocation}
                    </span>
                    <span className="bg-gray-800 text-xs text-gray-300 px-2 py-0.5 rounded">
                      {strategy.status}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">{strategy.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline Section */}
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
      
      {/* Long-term Vision */}
      <div className="mt-10 p-4 bg-blue-900/20 border border-blue-600/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">Long-term Vision (2026-2027)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Tesla Integration</div>
            <p className="text-gray-300">Full integration with Tesla vehicles through API and partnerships for real-world driving rewards</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Mobility Network</div>
            <p className="text-gray-300">Expanded ecosystem connecting various mobility and EV charging platforms globally</p>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-blue-400 font-medium mb-1">Metaverse Expansion</div>
            <p className="text-gray-300">Creating immersive virtual experiences and showrooms in the metaverse</p>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>This roadmap is subject to changes based on market conditions and community decisions.</p>
        <p>All updates will be announced through our official channels.</p>
      </div>
    </div>
  );
};

export default Roadmap;