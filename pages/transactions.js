// pages/transactions.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';

// Dynamic loading of wallet button
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Transactions() {
  const { publicKey, connected } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState({
    totalRewards: 0,
    claimableRewards: []
  });
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [tweetLoading, setTweetLoading] = useState({});
  const [telegramLoading, setTelegramLoading] = useState({});
  const [rewardHistory, setRewardHistory] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!connected || !publicKey) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/getTransactions?wallet=${publicKey.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [publicKey, connected]);

  useEffect(() => {
    const fetchRewards = async () => {
      if (!connected || !publicKey) return;
      
      try {
        const res = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch rewards');
        
        const data = await res.json();
        setRewards({
          totalRewards: data.totalRewards || 0,
          claimableRewards: data.claimableRewards || []
        });
        
        // Store full reward history for checking duplicates
        if (data.rewardHistory) {
          setRewardHistory(data.rewardHistory);
        }
      } catch (err) {
        console.error('Error fetching rewards:', err);
      }
    };
    
    fetchRewards();
  }, [publicKey, connected]);

  // 개선된 중복 리워드 확인 함수
  const hasReceivedReward = (txSignature, rewardType) => {
    // 기본 체크: 해당 트랜잭션 + 리워드 타입 조합 확인
    const typeSpecificCheck = rewardHistory.some(reward => 
      (reward.reference_id === txSignature || 
       reward.txSignature === txSignature) && 
      reward.reward_type === rewardType
    );
    
    // 트윗 리워드인 경우 추가 체크
    if (rewardType === 'tweet') {
      // 민팅 트윗 체크
      const mintTweetCheck = rewardHistory.some(reward => 
        // mint_ 접두사 포함 체크
        (reward.reference_id && reward.reference_id.includes(`mint_`) && 
         reward.reward_type === 'mint_tweet') ||
        // 또는 동일한 트랜잭션 체크
        (reward.txSignature === txSignature && reward.reward_type === 'mint_tweet')
      );
      
      // 텔레그램 공유 체크 - 만약 이미 텔레그램으로 공유했으면 트윗 공유도 막음
      const telegramCheck = rewardHistory.some(reward => 
        (reward.reference_id === txSignature || 
         reward.txSignature === txSignature) && 
        reward.reward_type === 'telegram_share'
      );
      
      return typeSpecificCheck || mintTweetCheck || telegramCheck;
    } 
    // 텔레그램 리워드인 경우
    else if (rewardType === 'telegram_share') {
      // 트윗 체크 - 만약 이미 트윗으로 공유했으면 텔레그램 공유도 막음
      const tweetCheck = rewardHistory.some(reward => 
        (reward.reference_id === txSignature || 
         reward.txSignature === txSignature) && 
        reward.reward_type === 'tweet'
      );
      
      // 민팅 트윗 체크
      const mintTweetCheck = rewardHistory.some(reward => 
        (reward.txSignature === txSignature) && 
        reward.reward_type === 'mint_tweet'
      );
      
      return typeSpecificCheck || tweetCheck || mintTweetCheck;
    }
    
    // 기본적으로는 타입 체크만
    return typeSpecificCheck;
  };

  // List handler function
  const handleList = async (mintAddress, name) => {
    if (!mintAddress) {
      alert("NFT mint address not found");
      return;
    }
    
    // Navigate to Magic Eden listing page
    window.open(`https://magiceden.io/sell/devnet/${mintAddress}`, '_blank');
  };

  // Staking button handler
  const handleStake = (txSignature) => {
    alert("Staking feature is under development. Coming soon!");
  };

  // Tweet share handler
  const handleTweet = async (txSignature) => {
    // Check if already rewarded
    if (hasReceivedReward(txSignature, 'tweet')) {
      alert("You've already received rewards for sharing this transaction!");
      return;
    }
    
    // Get current transaction for consistent sharing message
    const tx = transactions.find(t => t.signature === txSignature);
    const mintAddress = tx?.nftMint || '';
    const nftName = tx?.nftName || 'SOLARA NFT';
    
    // Network configuration
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    // Create Solscan transaction URL
    const solscanTxUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
    
    // Create Website URL
    const tesolaUrl = `https://tesola.xyz/solara/${mintAddress}`;
    
    // Create share message with useful links
    let shareText;
    if (mintAddress) {
      // Include Magic Eden link if we have mint address
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      
      shareText = encodeURIComponent(
        `Check out my SOLARA NFT: ${nftName} 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
    } else {
      // Otherwise just include transaction link
      shareText = encodeURIComponent(
        `Check out my SOLARA transaction! 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `Visit: https://tesola.xyz\n\n` +
        `#SOLARA #NFT #Solana`
      );
    }
    
    // Twitter share URL (no additional URL parameter since links are in the text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
    
    // User instructions
    alert('Please share on Twitter and then return to this window for your reward.');
    
    // Start the reward process
    setTweetLoading(prev => ({ ...prev, [txSignature]: true }));
    
    // Open Twitter in a new window
    const tweetWindow = window.open(twitterUrl, '_blank');
    
    // Check if popup was blocked
    if (!tweetWindow || tweetWindow.closed || typeof tweetWindow.closed === 'undefined') {
      alert('Please allow popups to open Twitter and earn rewards.');
      setTweetLoading(prev => ({ ...prev, [txSignature]: false }));
      return;
    }
    
    // Set a delay before allowing reward claim
    setTimeout(async () => {
      // Now show the confirmation dialog
      const confirmed = window.confirm('Did you complete sharing on Twitter? Confirm to receive your TESOLA tokens.');
      
      if (confirmed && publicKey) {
        try {
          // Call reward API
          const response = await fetch('/api/recordTweetReward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              txSignature,
              reference_id: txSignature,
              reward_type: 'tweet' // Use specific type for transactions page tweets
            })
          });
          
          if (!response.ok) {
            throw new Error('Error processing tweet reward');
          }
          
          // Update rewards info
          const rewards = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`).then(res => res.json());
          setRewards({
            totalRewards: rewards.totalRewards || 0,
            claimableRewards: rewards.claimableRewards || []
          });
          
          if (rewards.rewardHistory) {
            setRewardHistory(rewards.rewardHistory);
          }
          
          // Success message
          alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
        } catch (error) {
          console.error('Tweet reward error:', error);
          alert(`Error: ${error.message}`);
        }
      }
      
      setTweetLoading(prev => ({ ...prev, [txSignature]: false }));
    }, 8000); // 8 second delay
  };

  // Telegram share handler
  const handleTelegramShare = async (txSignature) => {
    // Check if already rewarded for Telegram specifically
    if (hasReceivedReward(txSignature, 'telegram_share')) {
      alert("You've already received rewards for sharing this transaction on Telegram!");
      return;
    }
    
    // Current transaction
    const tx = transactions.find(t => t.signature === txSignature);
    const mintAddress = tx?.nftMint || '';
    const nftName = tx?.nftName || 'SOLARA NFT';
    
    // Network configuration
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    // Create Solscan transaction URL
    const solscanTxUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
    
    // Create Website URL
    const tesolaUrl = mintAddress 
      ? `https://tesola.xyz/solara/${mintAddress}`
      : `https://tesola.xyz`;
    
    // Create Telegram community URL (the TESOLA Telegram community)
    const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
    
    // Create share message with useful links
    let shareText;
    if (mintAddress) {
      // Include Magic Eden link if we have mint address
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      
      shareText = encodeURIComponent(
        `Check out my SOLARA NFT: ${nftName} 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `Join our community: ${telegramCommunityUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
    } else {
      // Otherwise just include transaction link
      shareText = encodeURIComponent(
        `Check out my SOLARA transaction! 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `Visit: https://tesola.xyz\n\n` +
        `Join our community: ${telegramCommunityUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
    }
    
    // Open in Telegram directly to TESOLA community with pre-filled message
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${shareText}`;
    
    // User guidance
    alert('Please share on Telegram and then return to this window for your reward.');
    
    // Start sharing process
    setTelegramLoading(prev => ({ ...prev, [txSignature]: true }));
    
    // Open Telegram window
    const telegramWindow = window.open(telegramUrl, '_blank');
    
    // Check for popup blocking
    if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
      alert('Please allow popups to open Telegram and earn rewards.');
      setTelegramLoading(prev => ({ ...prev, [txSignature]: false }));
      return;
    }
    
    // Delay for user to complete sharing
    setTimeout(async () => {
      const confirmed = window.confirm('Did you complete sharing on Telegram? Confirm to receive your TESOLA tokens.');
      
      if (confirmed && publicKey) {
        try {
          // Call reward API
          const response = await fetch('/api/recordTweetReward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              txSignature,
              reference_id: txSignature,
              reward_type: 'telegram_share' // Use specific reward type
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error processing Telegram share reward');
          }
          
          // Update rewards info
          const rewards = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`).then(res => res.json());
          setRewards({
            totalRewards: rewards.totalRewards || 0,
            claimableRewards: rewards.claimableRewards || []
          });
          
          if (rewards.rewardHistory) {
            setRewardHistory(rewards.rewardHistory);
          }
          
          // Success message
          alert(`Congratulations! ${process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5'} TESOLA tokens have been added to your rewards.`);
        } catch (error) {
          console.error('Telegram share error:', error);
          alert(`Error: ${error.message}`);
        }
      }
      
      setTelegramLoading(prev => ({ ...prev, [txSignature]: false }));
    }, 8000);
  };

  // Check which buttons should be disabled
  const checkTweetShared = (txSignature) => {
    return rewardHistory.some(reward => 
      ((reward.reference_id === txSignature || reward.txSignature === txSignature) && reward.reward_type === 'tweet') ||
      ((reward.reference_id === `mint_${txSignature}` || reward.txSignature === txSignature) && reward.reward_type === 'mint_tweet')
    );
  };
  
  const checkTelegramShared = (txSignature) => {
    return rewardHistory.some(reward => 
      (reward.reference_id === txSignature || reward.txSignature === txSignature) && 
      reward.reward_type === 'telegram_share'
    );
  };

  // Reward claim handler
  const handleClaimRewards = async () => {
    if (rewards.totalRewards <= 0) {
      alert('No rewards available to claim.');
      return;
    }
    
    setClaimLoading(true);
    try {
      const response = await fetch('/api/claimRewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey.toString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim rewards');
      }
      
      // Claim result
      const result = await response.json();
      
      // Reset rewards info
      setRewards({
        totalRewards: 0,
        claimableRewards: []
      });
      
      // Success message
      alert(`Reward claim successful! ${result.claim.amount} TESOLA tokens will be sent to your wallet soon.`);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Transactions</h1>
          
          {/* Total rewards and claim button */}
          {connected && rewards.totalRewards > 0 && (
            <div className="bg-purple-900/30 p-3 rounded-xl flex items-center">
              <div className="mr-4">
                <p className="text-sm text-gray-300">Available Rewards:</p>
                <p className="text-xl font-bold text-yellow-400">{rewards.totalRewards} TESOLA</p>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={claimLoading}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg disabled:opacity-50"
              >
                {claimLoading ? 'Processing...' : 'Claim All'}
              </button>
            </div>
          )}
        </div>
        
        {!connected && (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Connect your wallet to see your transaction history</p>
            <div className="mt-4 flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        {connected && !loading && (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-xl text-center py-12">No transactions found</p>
            ) : (
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-purple-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Transaction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Rewards</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {transactions.map((tx) => {
                    // Find rewards for this transaction
                    const txRewards = rewards.claimableRewards.filter(r => 
                      r.reference_id === tx.signature
                    );
                    const rewardAmount = txRewards.reduce((sum, r) => sum + r.amount, 0);
                    
                    // Check if already shared on Twitter or Telegram using separate functions
                    const tweetShared = checkTweetShared(tx.signature);
                    const telegramShared = checkTelegramShared(tx.signature);
                    
                    return (
                      <tr key={tx.signature} className="hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:underline truncate max-w-xs block">
                            {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {rewardAmount > 0 ? (
                              <>
                                <span className="text-yellow-400 font-medium mr-1">{rewardAmount}</span>
                                <span className="text-xs text-gray-300">TESOLA</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">No rewards yet</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* List button */}
                            <button 
                              onClick={() => handleList(tx.nftMint, tx.nftName)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                            >
                              List
                            </button>

                            {/* Staking button */}
                            <button 
                              onClick={() => handleStake(tx.signature)}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs"
                            >
                              Stake
                            </button>
                            
                            {/* Tweet share button */}
                            <button 
                              onClick={() => handleTweet(tx.signature)}
                              disabled={tweetLoading[tx.signature] || tweetShared}
                              className={`px-2 py-1 rounded text-xs ${
                                tweetShared
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                            >
                              {tweetLoading[tx.signature] ? 'Sharing...' : 
                               tweetShared ? 'Shared' : 'Tweet +5'}
                            </button>
                            
                            {/* Telegram share button */}
                            <button 
                              onClick={() => handleTelegramShare(tx.signature)}
                              disabled={telegramLoading[tx.signature] || telegramShared}
                              className={`px-2 py-1 rounded text-xs ${
                                telegramShared
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-sky-500 hover:bg-sky-600'
                              }`}
                            >
                              {telegramLoading[tx.signature] ? 'Sharing...' : 
                               telegramShared ? 'Shared' : 'Telegram +5'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}