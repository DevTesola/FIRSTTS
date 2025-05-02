// pages/leaderboard.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Head from "next/head";
import ErrorBoundary from '../components/ErrorBoundary';
import FallbackLoading from '../components/FallbackLoading';
import Leaderboard from '../components/staking/Leaderboard';

// Layout 컴포넌트 동적 로딩 with error handling
const Layout = dynamic(
  () => import('../components/Layout')
    .catch(err => {
      console.error("Failed to load Layout:", err);
      // Return a simple fallback layout in case of error
      return ({ children }) => (
        <div className="min-h-screen bg-black text-white p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold py-4">TESOLA Leaderboard</h1>
            {children}
          </div>
        </div>
      );
    }), 
  { 
    ssr: false,
    loading: () => <FallbackLoading message="Loading application layout..." />
  }
);

export default function LeaderboardPage() {
  const { publicKey, connected } = useWallet();
  const [stakingStats, setStakingStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Fetch staking statistics for the leaderboard
  useEffect(() => {
    if (connected && publicKey) {
      fetchStakingStats();
    }
  }, [publicKey, connected]);
  
  // Function to fetch staking statistics
  const fetchStakingStats = async () => {
    if (!connected || !publicKey) return;
    
    setLoadingStats(true);
    
    try {
      const response = await fetch(`/api/getStakingStats?wallet=${publicKey.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch staking statistics");
      }
      
      const data = await response.json();
      setStakingStats(data);
    } catch (err) {
      console.error("Error fetching staking stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <>
      <Head>
        <title>TESOLA - Token Holders Leaderboard</title>
        <meta name="description" content="View the top TESOLA token holders and earn rewards by holding tokens longer. The top 100 holders receive exclusive NFT evolutions." />
      </Head>
      
      <ErrorBoundary>
        <Layout>
          <div className="max-w-6xl mx-auto p-6">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                TESOLA Token Holders Leaderboard
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                The top 100 TESOLA token holders will receive exclusive evolved NFTs. Rank is based on token amount and holding period.
              </p>
            </div>
            
            {/* Leaderboard Component */}
            <div className="mb-12">
              <Leaderboard 
                stats={stakingStats}
                isLoading={loadingStats}
                onRefresh={fetchStakingStats}
              />
            </div>
          </div>
        </Layout>
      </ErrorBoundary>
    </>
  );
}