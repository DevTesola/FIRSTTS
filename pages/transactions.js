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

  // 개선된 보상 확인 함수
  const hasReceivedReward = (txSignature, rewardType) => {
    if (!rewardHistory || !rewardHistory.length) {
      return false;
    }
    
    // 디버깅용
    console.log('Checking for rewards:', { txSignature, rewardType });
    
    // 이 트랜잭션과 관련된 모든 보상 찾기
    const relatedRewards = rewardHistory.filter(reward => {
      return (
        // 정확한 참조 ID 또는 tx_signature 일치
        reward.reference_id === txSignature || 
        reward.tx_signature === txSignature ||
        // 또는 mint_ 접두사가 있는 참조 ID
        (reward.reference_id && reward.reference_id.includes(`mint_${txSignature}`))
      );
    });
    
    if (relatedRewards.length > 0) {
      console.log('Found related rewards:', relatedRewards);
    }
    
    // 트윗 보상의 경우, 모든 트윗 관련 보상 확인
    if (rewardType === 'tweet') {
      return relatedRewards.some(reward => 
        reward.reward_type === 'tweet' || 
        reward.reward_type === 'mint_tweet'
      );
    }
    
    // 텔레그램 보상의 경우
    if (rewardType === 'telegram_share') {
      return relatedRewards.some(reward => 
        reward.reward_type === 'telegram_share'
      );
    }
    
    // 다른 보상 유형의 경우
    return relatedRewards.some(reward => 
      reward.reward_type === rewardType
    );
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

  // 개선된 트윗 공유 핸들러
  const handleTweet = async (txSignature) => {
    // 이미 보상을 받았는지 확인
    if (hasReceivedReward(txSignature, 'tweet')) {
      alert("You've already received rewards for sharing this transaction!");
      return;
    }
    
    // 현재 트랜잭션 가져오기
    const tx = transactions.find(t => t.signature === txSignature);
    const mintAddress = tx?.nftMint || '';
    const nftName = tx?.nftName || 'SOLARA NFT';
    
    // 네트워크 설정
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    // Solscan 트랜잭션 URL 생성
    const solscanTxUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
    
    // 웹사이트 URL 생성
    const tesolaUrl = `https://tesola.xyz/solara/${mintAddress}`;
    
    // 공유 메시지 생성
    let shareText;
    if (mintAddress) {
      // 민트 주소가 있으면 Magic Eden 링크 포함
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      
      shareText = encodeURIComponent(
        `Check out my SOLARA NFT: ${nftName} 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
    } else {
      // 트랜잭션 링크만 포함
      shareText = encodeURIComponent(
        `Check out my SOLARA transaction! 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `Visit: https://tesola.xyz\n\n` +
        `#SOLARA #NFT #Solana`
      );
    }
    
    // 사용자 안내
    alert('Please share on Twitter and then return to this window for your reward.');
    
    // 보상 프로세스 시작
    setTweetLoading(prev => ({ ...prev, [txSignature]: true }));
    
    // 새 창에서 트위터 열기
    const tweetWindow = window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
    
    // 팝업 차단 확인
    if (!tweetWindow || tweetWindow.closed || typeof tweetWindow.closed === 'undefined') {
      alert('Please allow popups to open Twitter and earn rewards.');
      setTweetLoading(prev => ({ ...prev, [txSignature]: false }));
      return;
    }
    
    // 사용자가 공유를 완료할 시간을 주기 위한 지연
    setTimeout(async () => {
      // 확인 대화상자 표시
      const confirmed = window.confirm('Did you complete sharing on Twitter? Confirm to receive your TESOLA tokens.');
      
      if (confirmed && publicKey) {
        try {
          // 보상 API 호출
          const response = await fetch('/api/recordTweetReward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              txSignature,
              reference_id: txSignature,
              reward_type: 'tweet',
              mint_address: mintAddress || null
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error processing tweet reward');
          }
          
          // 보상 정보 업데이트
          const rewardsResponse = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            setRewards({
              totalRewards: rewardsData.totalRewards || 0,
              claimableRewards: rewardsData.claimableRewards || []
            });
            
            if (rewardsData.rewardHistory) {
              setRewardHistory(rewardsData.rewardHistory);
            }
          }
          
          // 성공 메시지
          alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
        } catch (error) {
          console.error('Tweet reward error:', error);
          alert(`Error: ${error.message}`);
        }
      }
      
      setTweetLoading(prev => ({ ...prev, [txSignature]: false }));
    }, 5000); // 5초 지연
  };

  // 개선된 텔레그램 공유 핸들러
  const handleTelegramShare = async (txSignature) => {
    // 이미 보상을 받았는지 확인
    if (hasReceivedReward(txSignature, 'telegram_share')) {
      alert("You've already received rewards for sharing this transaction on Telegram!");
      return;
    }
    
    // 현재 트랜잭션
    const tx = transactions.find(t => t.signature === txSignature);
    const mintAddress = tx?.nftMint || '';
    const nftName = tx?.nftName || 'SOLARA NFT';
    
    // 네트워크 설정
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    // Solscan 트랜잭션 URL 생성
    const solscanTxUrl = `https://solscan.io/tx/${txSignature}?cluster=${network}`;
    
    // 웹사이트 URL 생성
    const tesolaUrl = mintAddress 
      ? `https://tesola.xyz/solara/${mintAddress}`
      : `https://tesola.xyz`;
    
    // 텔레그램 커뮤니티 URL
    const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
    
    // 공유 메시지 생성
    let shareText;
    if (mintAddress) {
      // 민트 주소가 있으면 Magic Eden 링크 포함
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
      // 트랜잭션 링크만 포함
      shareText = encodeURIComponent(
        `Check out my SOLARA transaction! 🚀\n\n` +
        `View on Solscan: ${solscanTxUrl}\n` +
        `Visit: https://tesola.xyz\n\n` +
        `Join our community: ${telegramCommunityUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
    }
    
    // 사용자 안내
    alert('Please share on Telegram and then return to this window for your reward.');
    
    // 공유 프로세스 시작
    setTelegramLoading(prev => ({ ...prev, [txSignature]: true }));
    
    // 텔레그램 창 열기 - 미리 작성된 메시지로 TESOLA 커뮤니티로 바로 연결
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${shareText}`;
    const telegramWindow = window.open(telegramUrl, '_blank');
    
    // 팝업 차단 확인
    if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
      alert('Please allow popups to open Telegram and earn rewards.');
      setTelegramLoading(prev => ({ ...prev, [txSignature]: false }));
      return;
    }
    
    // 사용자가 공유를 완료할 시간을 주기 위한 지연
    setTimeout(async () => {
      const confirmed = window.confirm('Did you complete sharing on Telegram? Confirm to receive your TESOLA tokens.');
      
      if (confirmed && publicKey) {
        try {
          // 보상 API 호출
          const response = await fetch('/api/recordTweetReward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet: publicKey.toString(),
              txSignature,
              reference_id: txSignature,
              reward_type: 'telegram_share',
              mint_address: mintAddress || null
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error processing Telegram share reward');
          }
          
          // 보상 정보 업데이트
          const rewardsResponse = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            setRewards({
              totalRewards: rewardsData.totalRewards || 0,
              claimableRewards: rewardsData.claimableRewards || []
            });
            
            if (rewardsData.rewardHistory) {
              setRewardHistory(rewardsData.rewardHistory);
            }
          }
          
          // 성공 메시지
          const rewardAmount = process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5';
          alert(`Congratulations! ${rewardAmount} TESOLA tokens have been added to your rewards.`);
        } catch (error) {
          console.error('Telegram share error:', error);
          alert(`Error: ${error.message}`);
        }
      }
      
      setTelegramLoading(prev => ({ ...prev, [txSignature]: false }));
    }, 5000);
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
        
        {/* 보상 정책 안내 추가 */}
        {connected && (
          <div className="bg-purple-900/30 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-yellow-400 mb-2">Earn TESOLA Tokens by Sharing!</h3>
            <p className="text-sm text-gray-200">
              Share your NFTs on different platforms to earn up to 20 TESOLA tokens per NFT:
            </p>
            <ul className="text-sm text-gray-200 mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">•</span> 5 tokens when sharing after minting
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">•</span> 5 tokens when sharing from My Collection
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">•</span> 5 tokens when sharing from Transactions
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">•</span> 5 tokens when sharing on Telegram
              </li>
            </ul>
          </div>
        )}
        
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
                            
                            {/* Telegram share button - 중복 버튼 제거 및 올바른 버튼만 유지 */}
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