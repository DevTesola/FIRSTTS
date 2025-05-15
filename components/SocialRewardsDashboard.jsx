import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { GlassButton, SecondaryButton } from "./Buttons";
import ErrorMessage from "./ErrorMessage";

/**
 * SocialRewardsDashboard Component
 * Dashboard displaying rewards earned through external activities such as social sharing and game participation
 */
const SocialRewardsDashboard = ({ rewardHistory = [], isLoading, onRefresh }) => {
  const [animateStats, setAnimateStats] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [error, setError] = useState(null);
  const { publicKey, connected } = useWallet();
  
  // Categorization of reward activities
  const [rewardStats, setRewardStats] = useState({
    total: 0,
    twitter: 0,
    telegram: 0,
    gameplay: 0,
    staking: 0,
    other: 0,
    // Recent activities
    recent: []
  });
  
  // Analyze reward history and generate statistics
  useEffect(() => {
    if (!rewardHistory || rewardHistory.length === 0) {
      setRewardStats({
        total: 0,
        twitter: 0,
        telegram: 0,
        gameplay: 0,
        staking: 0,
        other: 0,
        recent: []
      });
      return;
    }
    
    let total = 0;
    let twitter = 0;
    let telegram = 0;
    let gameplay = 0;
    let staking = 0;
    let other = 0;
    
    // Recent activities (max 5)
    const recentActivities = [...rewardHistory]
      .sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()))
      .slice(0, 5);
    
    // Aggregation by category
    rewardHistory.forEach(reward => {
      const amount = Number(reward.amount) || 0;
      total += amount;
      
      if (reward.reward_type?.includes('tweet') || reward.reward_type?.includes('twitter')) {
        twitter += amount;
      } else if (reward.reward_type?.includes('telegram')) {
        telegram += amount;
      } else if (reward.reward_type?.includes('game') || reward.reward_type?.includes('play')) {
        gameplay += amount;
      } else if (reward.reward_type?.includes('stake') || reward.reward_type?.includes('staking')) {
        staking += amount;
      } else {
        other += amount;
      }
    });
    
    setRewardStats({
      total,
      twitter,
      telegram,
      gameplay,
      staking,
      other,
      recent: recentActivities
    });
    
    // Animation effect when statistics are updated
    setAnimateStats(true);
    const timer = setTimeout(() => setAnimateStats(false), 1500);
    return () => clearTimeout(timer);
    
  }, [rewardHistory]);
  
  // Define icons and colors based on reward type
  const getRewardTypeInfo = (type) => {
    if (!type) return { 
      icon: "🎁", 
      label: "Other Rewards", 
      color: "text-gray-400",
      bgColor: "bg-gray-700"
    };
    
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('tweet') || lowerType.includes('twitter')) {
      return { 
        icon: "🐦", 
        label: "Twitter Share", 
        color: "text-blue-400",
        bgColor: "bg-blue-900/30"
      };
    } else if (lowerType.includes('telegram')) {
      return { 
        icon: "📱", 
        label: "Telegram Share", 
        color: "text-cyan-400",
        bgColor: "bg-cyan-900/30"
      };
    } else if (lowerType.includes('game') || lowerType.includes('play')) {
      return { 
        icon: "🎮", 
        label: "Game Rewards", 
        color: "text-green-400",
        bgColor: "bg-green-900/30"
      };
    } else if (lowerType.includes('stake') || lowerType.includes('staking')) {
      return { 
        icon: "🔒", 
        label: "Staking Rewards", 
        color: "text-purple-400",
        bgColor: "bg-purple-900/30"
      };
    } else if (lowerType.includes('community')) {
      return { 
        icon: "👥", 
        label: "Community Activity", 
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/30"
      };
    }
    
    return { 
      icon: "🎁", 
      label: "Other Rewards", 
      color: "text-gray-400",
      bgColor: "bg-gray-700"
    };
  };
  
  // Date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "No date information";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      return date.toLocaleDateString();
    } else if (diffDay > 0) {
      return `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hours ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minutes ago`;
    } else {
      return "Just now";
    }
  };
  
  // Display when wallet is not connected
  if (!connected) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">Wallet Connection Required</h3>
        <p className="text-gray-400 mb-4">
          Connect your wallet to view social rewards and activity history.
        </p>
      </div>
    );
  }
  
  // Display error message
  if (error) {
    return (
      <ErrorMessage 
        message={error}
        type="error"
        onRetry={onRefresh}
        onDismiss={() => setError(null)}
      />
    );
  }
  
  // Display while loading
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-300">Loading social reward information...</p>
      </div>
    );
  }
  
  // Component to display when there are no rewards
  if (!rewardHistory || rewardHistory.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a4 4 0 00-4-4H5.45a4 4 0 00-2.83 1.17l-1.9 1.9a4 4 0 00-1.17 2.83V12h6.17a4 4 0 012.83 1.17l1.9 1.9a4 4 0 002.83 1.17H20" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No Reward History Yet</h3>
        <p className="text-gray-400 mb-4">
          Share your NFT on social media or participate in game activities to earn TESOLA tokens.
        </p>
        <div className="flex justify-center space-x-3">
          <SecondaryButton onClick={onRefresh}>
            Refresh
          </SecondaryButton>
          <GlassButton
            onClick={() => {
              // Navigate to 'Collection' tab
              document.querySelector('[aria-controls="collection"]')?.click();
            }}
          >
            View My NFTs
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome guide for new users */}
      {showWelcomeGuide && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/30 relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={() => setShowWelcomeGuide(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-2 rounded-full mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Welcome to Social Rewards Dashboard!</h3>
              <p className="text-gray-300 mb-2">
                Here you can track TESOLA tokens earned through various activities like NFT sharing and game participation.
              </p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-2">
                <li>Share your NFTs on Twitter and Telegram to earn tokens</li>
                <li>Participate in games to receive rewards</li>
                <li>Join community events for additional tokens</li>
                <li>Track all your social rewards</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics cards (with animation effects) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-purple-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total TESOLA Earned</p>
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {rewardStats.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Sum of all social rewards</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Social Sharing Rewards</p>
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {(rewardStats.twitter + rewardStats.telegram).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                  Twitter: {rewardStats.twitter}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded-full">
                  Telegram: {rewardStats.telegram}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-5 border border-green-500/20 backdrop-blur-sm">
          <div className="flex items-start">
            <div className="bg-green-500/20 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Other Rewards</p>
              <p className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {(rewardStats.gameplay + rewardStats.other).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                  Games: {rewardStats.gameplay}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-yellow-900/50 text-yellow-300 rounded-full">
                  Other: {rewardStats.other}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent reward activities section */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Recent Reward Activities
          </h3>
          
          <div className="flex items-center">
            <GlassButton 
              size="small" 
              onClick={onRefresh}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              }
            >
              Refresh
            </GlassButton>
          </div>
        </div>

        {rewardStats.recent.length > 0 ? (
          <div className="space-y-3">
            {rewardStats.recent.map((reward, index) => {
              const { icon, label, color, bgColor } = getRewardTypeInfo(reward.reward_type);
              return (
                <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center">
                    <div className={`${bgColor} p-3 rounded-full mr-4 flex-shrink-0`}>
                      <span className="text-xl">{icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <h4 className={`font-medium ${color}`}>{label}</h4>
                          <p className="text-sm text-gray-400">
                            {reward.description || `${reward.reward_type?.replace('_', ' ') || 'Reward'}`}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <p className="text-lg font-bold text-yellow-400">{reward.amount} TESOLA</p>
                          <p className="text-xs text-gray-500">{formatDate(reward.created_at)}</p>
                        </div>
                      </div>
                      
                      {/* Show reference ID if exists (e.g. NFT ID) */}
                      {reward.reference_id && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                          <p className="text-xs text-gray-500">
                            Reference ID: <span className="text-gray-400 font-mono">{reward.reference_id}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-900/30 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-400 mb-1">No Recent Reward History</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Earn TESOLA tokens through various activities such as NFT sharing, game participation, and more.
            </p>
          </div>
        )}
      </div>

      {/* Reward activities guide */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          TESOLA Token Earning Guide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/10">
            <h4 className="font-medium text-blue-300 flex items-center mb-2">
              <span className="mr-2">🐦</span>
              Share on Twitter
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Share your NFT on Twitter and receive 5 TESOLA tokens.
            </p>
            <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
              <li>Select an NFT from the Collection tab</li>
              <li>Click the "Share" button</li>
              <li>Complete Twitter sharing to receive rewards</li>
            </ol>
          </div>
          
          <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/10">
            <h4 className="font-medium text-cyan-300 flex items-center mb-2">
              <span className="mr-2">📱</span>
              Share on Telegram
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Share your NFT on Telegram and receive 5 TESOLA tokens.
            </p>
            <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
              <li>Select an NFT from the Collection tab</li>
              <li>Click the "Share" button</li>
              <li>Complete Telegram sharing to receive rewards</li>
            </ol>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/10">
            <h4 className="font-medium text-green-300 flex items-center mb-2">
              <span className="mr-2">🎮</span>
              Participate in Games
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Participate in TESOLA games and earn tokens.
            </p>
            <p className="text-xs text-gray-400">
              You can earn additional tokens by participating in upcoming mini-games. More details will be announced soon.
            </p>
          </div>
          
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/10">
            <h4 className="font-medium text-yellow-300 flex items-center mb-2">
              <span className="mr-2">👥</span>
              Community Activities
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              Participate in TESOLA community activities and receive rewards.
            </p>
            <p className="text-xs text-gray-400">
              Join our Discord server and Telegram group to participate in various events and receive rewards. Check official channels for more details.
            </p>
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes countUp {
          from { opacity: 0.5; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-count {
          animation: countUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SocialRewardsDashboard;