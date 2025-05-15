import React, { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { GlassButton, SecondaryButton } from "../Buttons";
import EnhancedProgressiveImage from "../EnhancedProgressiveImage";
import { createPlaceholder, getNftPreviewImage } from "../../utils/mediaUtils";
import { getNFTImageUrl } from "../../utils/nftImageUtils";

/**
 * Leaderboard Component
 * Displays the top TESOLA token holders and rewards users based on their token holding and retention
 */
const Leaderboard = ({ stats, isLoading, onRefresh }) => {
  const { publicKey } = useWallet();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("score"); // "score", "tokens", "duration"
  const [animateStats, setAnimateStats] = useState(false);
  const [error, setError] = useState(null);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const itemsPerPage = 25;

  // Fetch leaderboard data on initial load and when refreshed
  useEffect(() => {
    fetchLeaderboardData();
    // Set next update time to display countdown (simulating daily updates)
    const now = new Date();
    const nextUpdate = new Date(now);
    nextUpdate.setHours(24, 0, 0, 0); // Next midnight
    setNextUpdateTime(nextUpdate);
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!nextUpdateTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextUpdateTime - now;
      
      if (diff <= 0) {
        setRemainingTime("Updating...");
        clearInterval(interval);
        // Simulate refresh
        setTimeout(() => {
          fetchLeaderboardData();
          const newNextUpdate = new Date();
          newNextUpdate.setHours(24, 0, 0, 0);
          setNextUpdateTime(newNextUpdate);
        }, 2000);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setRemainingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextUpdateTime]);

  // Function to fetch leaderboard data with enhanced error handling, retry logic, and memory optimizations
  const fetchLeaderboardData = async (retryCount = 0) => {
    setDataLoading(true);
    setError(null);
    
    // Memory cleanup before loading new data
    if (leaderboardData.length > 200) {
      setLeaderboardData([]);
    }
    
    try {
      // API call to get leaderboard data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Batch size to prevent memory issues
      const batchSize = 50;
      
      const response = await fetch(
        `/api/leaderboard?sort=${sortBy}&page=${currentPage}&limit=${batchSize}${publicKey ? `&wallet=${publicKey.toString()}` : ''}`,
        { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
      }
      
      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error("Invalid response format from server");
      }
      
      // Validate response structure
      if (!data || !Array.isArray(data.leaderboard)) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid leaderboard data format");
      }
      
      // Set leaderboard data with memory consideration
      setLeaderboardData(prevData => {
        // Only keep a reasonable amount of data in memory
        if (prevData.length > 200) {
          return data.leaderboard;
        }
        return data.leaderboard;
      });
      
      // If there's a connected wallet, set the user's rank
      if (publicKey && data.userRank) {
        setUserRank(data.userRank);
      }
      
      // Trigger animation for stats
      setAnimateStats(true);
      const animationTimer = setTimeout(() => setAnimateStats(false), 1500);
      
      // Cleanup animation timer on error
      return () => clearTimeout(animationTimer);
      
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      
      // If error is due to AbortController, show timeout message
      if (error.name === 'AbortError') {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError(`Failed to load leaderboard data: ${error.message}`);
      }
      
      // Implement retry logic for network errors (max 2 retries)
      if (retryCount < 2 && (error.name === 'TypeError' || error.message.includes('network'))) {
        console.log(`Retrying leaderboard fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchLeaderboardData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // If all retries failed or other error, fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        const mockData = generateMockLeaderboardData();
        setLeaderboardData(mockData);
        if (publicKey) {
          const userRankNum = Math.floor(Math.random() * 50) + 50;
          const userEntry = {
            ...mockData[userRankNum - 1],
            isUser: true,
            walletAddress: `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
          };
          setUserRank({
            rank: userRankNum,
            tokenAmount: userEntry.tokenAmount,
            holdingDays: userEntry.holdingDays,
            score: userEntry.score,
            hasEvolvedNFT: userEntry.hasEvolvedNFT
          });
        }
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Function to handle sorting change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
    fetchLeaderboardData();
  };

  // Function to handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of the component
    document.getElementById('leaderboard-top')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  // Generate mock data for development (remove in production)
  const generateMockLeaderboardData = () => {
    // Create 100 mock entries
    const mockData = Array.from({ length: 100 }, (_, i) => {
      const rank = i + 1;
      // Exponentially decrease token amounts for lower ranks
      const tokenAmount = Math.floor(100000 * Math.pow(0.95, i));
      const holdingDays = Math.floor(Math.random() * 365) + 30;
      
      // Calculate score based on tokens and holding period
      const score = Math.floor(tokenAmount * (1 + (holdingDays / 30) * 0.1));
      
      // For top 10, simulate evolved NFTs
      const hasEvolvedNFT = rank <= 10;
      
      return {
        rank,
        walletAddress: `${randomWalletPrefix()}...${randomWalletSuffix()}`,
        tokenAmount,
        holdingDays,
        score,
        hasEvolvedNFT,
        isUser: false // Will be set for the user's entry
      };
    });
    
    return mockData;
  };
  
  // Helper for mock data
  const randomWalletPrefix = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Helper for mock data
  const randomWalletSuffix = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // If no actual data, use mock data for development
  useEffect(() => {
    if (!dataLoading && leaderboardData.length === 0 && !error) {
      const mockData = generateMockLeaderboardData();
      
      // Simulate user data (randomly place user in ranks 50-100)
      if (publicKey) {
        const userRank = Math.floor(Math.random() * 50) + 50;
        const userEntry = {
          ...mockData[userRank - 1],
          isUser: true,
          walletAddress: `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
        };
        mockData[userRank - 1] = userEntry;
        setUserRank({
          rank: userRank,
          tokenAmount: userEntry.tokenAmount,
          holdingDays: userEntry.holdingDays,
          score: userEntry.score,
          hasEvolvedNFT: userEntry.hasEvolvedNFT
        });
      }
      
      setLeaderboardData(mockData);
    }
  }, [dataLoading, leaderboardData, error, publicKey]);

  // Current page data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaderboard = leaderboardData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);

  return (
    <div className="space-y-6" id="leaderboard-top">
      {/* Explanatory Info Panel */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-500/20">
        <h3 className="text-xl font-bold text-white mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          TESOLA Holders Leaderboard
        </h3>
        <div className="text-gray-300 mb-4">
          <p>The top 100 TESOLA token holders will receive exclusive evolved NFTs through airdrops. Your rank is determined by:</p>
          <ul className="list-disc list-inside mt-2 ml-2 space-y-1 text-sm">
            <li>The amount of TESOLA tokens you hold</li>
            <li>How long you've held your tokens (longer = higher score)</li>
            <li>Your score = Tokens × (1 + (Holding days ÷ 30) × 0.1)</li>
          </ul>
        </div>
        
        {/* Countdown to next update */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-400">Next update in:</span>
            <span className="ml-2 font-mono text-yellow-300">{remainingTime || "Loading..."}</span>
          </div>
          
          <div className="text-sm text-gray-400">
            <span>Updated daily at 00:00 UTC</span>
          </div>
        </div>
      </div>
      
      {/* User's rank display */}
      {publicKey && userRank && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-5 border border-yellow-500/20">
          <h3 className="text-lg font-bold text-white mb-3">Your Leaderboard Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Your Rank</div>
              <div className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                #{userRank.rank} <span className="text-sm font-normal text-gray-400">of 100</span>
              </div>
              {userRank.rank <= 100 ? (
                <div className="mt-1 text-xs inline-block px-2 py-1 bg-green-900/30 text-green-400 rounded-full">
                  Eligible for evolved NFT!
                </div>
              ) : (
                <div className="mt-1 text-xs inline-block px-2 py-1 bg-gray-900/30 text-gray-400 rounded-full">
                  Need to reach top 100
                </div>
              )}
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">TESOLA Balance</div>
              <div className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {userRank.tokenAmount.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Total Token Holdings
              </div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Holding Period</div>
              <div className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {userRank.holdingDays} <span className="text-sm font-normal text-gray-400">days</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Average holding time
              </div>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Your Score</div>
              <div className={`text-2xl font-bold text-white ${animateStats ? 'animate-count' : ''}`}>
                {userRank.score.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Tokens × Time Multiplier
              </div>
            </div>
          </div>
          
          {/* Progress to next rank visualization */}
          {userRank.rank > 100 && leaderboardData.length > 0 && leaderboardData.length >= 100 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Progress to Top 100</span>
                <span className="text-gray-300">
                  Need {(leaderboardData[99]?.score > userRank.score ? (leaderboardData[99].score - userRank.score) : 0).toLocaleString()} more score
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                  style={{ 
                    width: `${leaderboardData[99]?.score ? 
                      Math.min(100, Math.max(5, (userRank.score / leaderboardData[99].score) * 100)) : 5}%` 
                  }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Increase your score by acquiring more TESOLA tokens and holding them longer.
              </div>
            </div>
          )}
          
          {/* Show message when data is incomplete */}
          {userRank.rank > 100 && (!leaderboardData.length || leaderboardData.length < 100) && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-100">
                  Complete leaderboard data is loading. Please check back in a moment to see your progress to Top 100.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Leaderboard Table Section */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Top TESOLA Holders
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort options */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="score">By Total Score</option>
                <option value="tokens">By Token Amount</option>
                <option value="duration">By Holding Period</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Refresh button */}
            <GlassButton 
              size="small" 
              onClick={fetchLeaderboardData}
              disabled={dataLoading}
              icon={
                dataLoading ? (
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )
              }
            >
              Refresh
            </GlassButton>
          </div>
        </div>
        
        {error ? (
          <div className="text-center py-10 bg-red-900/20 rounded-lg border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-lg font-medium text-white mb-2">Error Loading Leaderboard</h4>
            <p className="text-gray-300 max-w-md mx-auto mb-4">{error}</p>
            <SecondaryButton onClick={fetchLeaderboardData}>
              Try Again
            </SecondaryButton>
          </div>
        ) : dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Top 3 Winners Highlight */}
            {currentPage === 1 && (
              <div className="mb-8">
                <h4 className="text-center text-lg font-medium text-white mb-6">Top Holders with Evolved NFTs</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {leaderboardData.slice(0, 3).map((entry, index) => {
                    // Crown for 1st place, medals for 2nd and 3rd
                    const position = index + 1;
                    let icon;
                    let bgGradient;
                    let borderColor;
                    
                    if (position === 1) {
                      icon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      );
                      bgGradient = "from-yellow-900/40 to-amber-900/40";
                      borderColor = "border-yellow-500/30";
                    } else if (position === 2) {
                      icon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      );
                      bgGradient = "from-gray-800/50 to-gray-700/50";
                      borderColor = "border-gray-500/30";
                    } else {
                      icon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      );
                      bgGradient = "from-amber-900/40 to-orange-900/40";
                      borderColor = "border-amber-500/30";
                    }
                    
                    return (
                      <div 
                        key={`top-${position}`}
                        className={`bg-gradient-to-br ${bgGradient} rounded-xl p-5 border ${borderColor} relative backdrop-blur-sm ${
                          entry.isUser ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
                        }`}
                      >
                        {/* Position indicator */}
                        <div className="absolute -top-3 -left-3 bg-gray-900 rounded-full p-1">
                          {icon}
                        </div>
                        
                        <div className="text-center mt-2">
                          <div className="text-gray-400 text-sm mb-1">Rank #{position}</div>
                          <div className="font-bold text-xl text-white mb-3 truncate">
                            {entry.walletAddress}
                          </div>
                          
                          {/* NFT Evolution Badge */}
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-2.5 py-1 rounded-full mb-3 inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                            </svg>
                            EVOLVED NFT UNLOCKED
                          </div>
                          
                          {/* NFT Image Preview */}
                          <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden border border-gray-700">
                            <EnhancedProgressiveImage
                              src={(() => {
                                // API에서 이미지 URL을 제공하면 우선 사용
                                if (entry.nft_image) {
                                  console.log(`🔥 Leaderboard Top: API에서 제공한 nft_image 사용: ${entry.nft_image}`);

                                  // URL이 http:// 또는 https://로 시작하는지 확인
                                  if (entry.nft_image.startsWith('http://') || entry.nft_image.startsWith('https://')) {
                                    // 캐시 버스팅 추가
                                    try {
                                      const url = new URL(entry.nft_image);
                                      url.searchParams.set('_t', Date.now().toString());
                                      console.log(`🔍 Leaderboard Top: 캐시 버스팅 URL 생성: ${url.toString()}`);
                                      return url.toString();
                                    } catch (e) {
                                      // URL 생성 실패 시 원본 URL에 쿼리 매개변수 추가
                                      console.log(`⚠️ Leaderboard Top: URL 파싱 실패, 원본 URL 사용: ${entry.nft_image}`);
                                      return `${entry.nft_image}?_t=${Date.now()}`;
                                    }
                                  } else {
                                    console.log(`⚠️ Leaderboard Top: API URL이 http/https로 시작하지 않음: ${entry.nft_image}`);
                                  }
                                }

                                // 직접 URL 생성: getNFTImageUrl 함수 사용
                                const imageUrl = getNFTImageUrl({
                                  id: entry.rank,
                                  mint: entry.walletAddress,
                                  name: `Top ${position}`,
                                  _source: 'Leaderboard-top',
                                  _cacheBust: Date.now() // 강제 캐시 버스팅
                                });

                                console.log(`✅ Leaderboard Top: getNFTImageUrl으로 생성된 URL: ${imageUrl}`);
                                return imageUrl;
                              })()}
                              alt={`Top ${position} NFT`}
                              placeholder={createPlaceholder(`Top ${position}`)}
                              className="w-full h-full object-cover"
                              lazyLoad={false}
                              priority={true}
                              highQuality={true}
                              blur={true}
                              preferRemote={true}
                              useCache={false}
                              _source="Leaderboard-top"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-black/30 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Tokens</div>
                              <div className="text-lg font-bold text-white">
                                {entry.tokenAmount.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-black/30 p-2 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Score</div>
                              <div className="text-lg font-bold text-white">
                                {entry.score.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Main Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">NFT</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Wallet</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">TESOLA Tokens</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Holding Period</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Score</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Evolved NFT</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeaderboard.map((entry) => (
                    <tr 
                      key={`rank-${entry.rank}`}
                      className={`border-b border-gray-800 hover:bg-gray-700/20 transition-colors ${
                        entry.isUser ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span 
                            className={`font-bold ${
                              entry.rank <= 3 
                                ? entry.rank === 1 
                                  ? 'text-yellow-400' 
                                  : entry.rank === 2 
                                    ? 'text-gray-300' 
                                    : 'text-amber-600'
                                : 'text-white'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          {entry.isUser && (
                            <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded overflow-hidden border border-gray-700">
                          <EnhancedProgressiveImage
                            src={(() => {
                              // 중요: 이미 entry.nft_image가 있는 경우 우선 사용
                              if (entry.nft_image) {
                                console.log(`🔥 Leaderboard Table: API에서 제공한 nft_image 사용: ${entry.nft_image}`);

                                // URL이 http:// 또는 https://로 시작하는지 확인
                                if (entry.nft_image.startsWith('http://') || entry.nft_image.startsWith('https://')) {
                                  // 캐시 버스팅 추가
                                  try {
                                    const url = new URL(entry.nft_image);
                                    url.searchParams.set('_t', Date.now().toString());
                                    console.log(`🔍 Leaderboard Table: 캐시 버스팅 URL 생성: ${url.toString()}`);
                                    return url.toString();
                                  } catch (e) {
                                    // URL 생성 실패 시 원본 URL에 쿼리 매개변수 추가
                                    console.log(`⚠️ Leaderboard Table: URL 파싱 실패, 원본 URL 사용: ${entry.nft_image}`);
                                    return `${entry.nft_image}?_t=${Date.now()}`;
                                  }
                                } else {
                                  console.log(`⚠️ Leaderboard Table: API URL이 http/https로 시작하지 않음: ${entry.nft_image}`);
                                }
                              }

                              // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                              // 단순화된 강력한 로직: 항상 ID를 추출하여 직접 IPFS URL을 생성하는 방식으로 변경

                              let nftId = entry.rank; // 리더보드에서는 rank를 ID로 사용

                              // 모든 상황에서 항상 직접 IPFS URL 생성
                              const formattedId = String(nftId).padStart(4, '0');
                              // 최신 환경 변수 사용 (하드코딩 제거)
                              const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                              const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                              const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;

                              // 로그로 생성된 URL 확인
                              console.log(`✅ Leaderboard Table: 강제 생성된 IPFS URL: ${gatewayUrl}`);

                              return gatewayUrl;
                            })()}
                            alt={`Rank #${entry.rank} NFT`}
                            placeholder={createPlaceholder(`#${entry.rank}`)}
                            className="w-full h-full object-cover"
                            id={entry.rank}
                            lazyLoad={true}
                            priority={true}
                            highQuality={true}
                            blur={true}
                            preferRemote={true}
                            useCache={false}
                            _source="Leaderboard-table"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {entry.walletAddress}
                      </td>
                      <td className="text-right py-3 px-4 text-white">
                        {entry.tokenAmount.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-300">
                        {entry.holdingDays} days
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-white">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="text-center py-3 px-4">
                        {entry.rank <= 100 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                            {entry.rank <= 10 ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Unlocked
                              </>
                            ) : (
                              "Eligible"
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
                            Not eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page buttons */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page and 1 page on each side of current
                    const showPageButton = pageNum === 1 || 
                                          pageNum === totalPages || 
                                          Math.abs(pageNum - currentPage) <= 1;
                                        
                    // Show ellipsis
                    if (!showPageButton && (pageNum === currentPage - 2 || pageNum === currentPage + 2)) {
                      return (
                        <span
                          key={`ellipsis-${pageNum}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    if (!showPageButton) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium ${
                          currentPage === pageNum 
                            ? 'bg-purple-700 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* NFT Evolution Information */}
      <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
          NFT Evolution Program
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              How to Qualify
            </h4>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-2 text-sm">
              <li>Own at least one SOLARA NFT to be eligible</li>
              <li>Reach top 100 on the leaderboard</li>
              <li>Maintain your position until the next airdrop</li>
              <li>Airdrops occur on the 1st of each month</li>
            </ul>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Evolved NFT Features
            </h4>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-2 text-sm">
              <li>Enhanced visual appearance with unique effects</li>
              <li>Increased staking rewards (25% boost)</li>
              <li>Special community role and badge</li>
              <li>Priority access to future features</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/10">
          <h4 className="text-white font-medium mb-2">Reward Tiers</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/30 p-3 rounded">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-yellow-500/30 mb-2">
                  <EnhancedProgressiveImage
                    src={(() => {
                      // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                      let nftId = 1; // 레전더리 랭크는 1번

                      // 모든 상황에서 항상 직접 IPFS URL 생성
                      const formattedId = String(nftId).padStart(4, '0');
                      // 최신 환경 변수 사용 (하드코딩 제거)
                      const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                      const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';

                      // 간단한 캐시 버스팅 추가
                      const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                      console.log(`✅ Leaderboard Legendary: 생성된 IPFS URL: ${gatewayUrl}`);

                      return gatewayUrl;
                    })()}
                    alt="Legendary NFT"
                    placeholder={createPlaceholder("Legendary")}
                    className="w-full h-full object-cover"
                    id="1"
                    lazyLoad={true}
                    priority={true}
                    highQuality={true}
                    blur={true}
                    preferRemote={true}
                    useCache={false}
                    _source="Leaderboard-legendary"
                  />
                </div>
                <div className="text-yellow-400 font-medium mb-1">Top 10</div>
                <div className="text-sm text-gray-300">Legendary Evolution</div>
                <div className="text-xs text-gray-500 mt-1">+50% staking boost</div>
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-blue-500/30 mb-2">
                  <EnhancedProgressiveImage
                    src={(() => {
                      // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                      let nftId = 20; // 에픽 등급 샘플 NFT

                      // 모든 상황에서 항상 직접 IPFS URL 생성
                      const formattedId = String(nftId).padStart(4, '0');
                      // 최신 환경 변수 사용 (하드코딩 제거)
                      const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                      const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';

                      // 간단한 캐시 버스팅 추가
                      const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                      console.log(`✅ Leaderboard Epic: 생성된 IPFS URL: ${gatewayUrl}`);

                      return gatewayUrl;
                    })()}
                    alt="Epic NFT"
                    placeholder={createPlaceholder("Epic")}
                    className="w-full h-full object-cover"
                    id="20"
                    lazyLoad={true}
                    priority={true}
                    highQuality={true}
                    blur={true}
                    preferRemote={true}
                    useCache={false}
                    _source="Leaderboard-epic"
                  />
                </div>
                <div className="text-blue-400 font-medium mb-1">Top 11-50</div>
                <div className="text-sm text-gray-300">Epic Evolution</div>
                <div className="text-xs text-gray-500 mt-1">+35% staking boost</div>
              </div>
            </div>
            <div className="bg-black/30 p-3 rounded">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-green-500/30 mb-2">
                  <EnhancedProgressiveImage
                    src={(() => {
                      // 무조건 NFT ID 기반으로 IPFS URL 직접 생성
                      let nftId = 75; // 레어 등급 샘플 NFT

                      // 모든 상황에서 항상 직접 IPFS URL 생성
                      const formattedId = String(nftId).padStart(4, '0');
                      // 최신 환경 변수 사용 (하드코딩 제거)
                      const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                      const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';

                      // 간단한 캐시 버스팅 추가
                      const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
                      console.log(`✅ Leaderboard Rare: 생성된 IPFS URL: ${gatewayUrl}`);

                      return gatewayUrl;
                    })()}
                    alt="Rare NFT"
                    placeholder={createPlaceholder("Rare")}
                    className="w-full h-full object-cover"
                    id="75"
                    lazyLoad={true}
                    priority={true}
                    highQuality={true}
                    blur={true}
                    preferRemote={true}
                    useCache={false}
                    _source="Leaderboard-rare"
                  />
                </div>
                <div className="text-green-400 font-medium mb-1">Top 51-100</div>
                <div className="text-sm text-gray-300">Rare Evolution</div>
                <div className="text-xs text-gray-500 mt-1">+25% staking boost</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom animation styles */}
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

export default Leaderboard;