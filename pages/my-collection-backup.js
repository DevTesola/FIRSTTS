// pages/my-collection.js
import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from "next/head";
import { TabButton, PrimaryButton, SecondaryButton, GlassButton } from '../components/Buttons';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import EnhancedProgressiveImage from '../components/EnhancedProgressiveImage';
import StakingComponent from '../components/StakingComponent';
import StakingDashboard from '../components/staking/StakingDashboard';
import StakingRewards from '../components/staking/StakingRewards';
import Leaderboard from '../components/staking/Leaderboard';
import { useNotification, ConfirmModal } from '../components/Notifications';

// Import ErrorBoundary and FallbackLoading
import ErrorBoundary from '../components/ErrorBoundary';
import FallbackLoading from '../components/FallbackLoading';

// Layout 컴포넌트 동적 로딩 with error handling
const Layout = dynamic(
  () => import('../components/Layout')
    .catch(err => {
      console.error("Failed to load Layout:", err);
      // Return a simple fallback layout in case of error
      return ({ children }) => (
        <div className="min-h-screen bg-black text-white p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold py-4">My SOLARA Collection</h1>
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

// 지갑 버튼 동적 로딩 with error handling
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui')
    .then(mod => mod.WalletMultiButton)
    .catch(err => {
      console.error("Failed to load WalletMultiButton:", err);
      // Return a basic button as fallback
      return () => (
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md">
          Connect Wallet
        </button>
      );
    }),
  { 
    ssr: false,
    loading: () => (
      <div className="px-4 py-2 bg-gray-800 text-white rounded-md animate-pulse">
        Loading wallet...
      </div>
    )
  }
);

export default function MyCollection() {
  const { publicKey, connected } = useWallet();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStaked, setLoadingStaked] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const router = useRouter();
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const itemsPerPage = 9; // 한 페이지에 표시할 NFT 수
  
  // 스테이킹 모달 상태
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [stakingSuccess, setStakingSuccess] = useState(false);
  
  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState({ twitter: false, telegram: false });
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // 리워드 기록 상태 추가
  const [rewardHistory, setRewardHistory] = useState([]);
  
  // 트위터와 텔레그램 공유 상태 (개별적으로 관리)
  const [isTwitterShared, setIsTwitterShared] = useState(false);
  const [isTelegramShared, setIsTelegramShared] = useState(false);
  
  // 알림 시스템 사용
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  
  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  // 선택된 NFT가 변경되거나 리워드 기록이 업데이트될 때 공유 상태 업데이트
  useEffect(() => {
    if (!selectedNFT || !rewardHistory.length) {
      setIsTwitterShared(false);
      setIsTelegramShared(false);
      return;
    }
    
    // NFT ID 추출
    const nftId = selectedNFT.name?.match(/#(\d+)/)?.[1] || '0';
    const formattedId = String(nftId).padStart(4, '0');
    
    // 트위터 공유 확인
    const twitterShared = rewardHistory.some(reward => 
      ((reward.reference_id === `nft_tweet_${formattedId}` || 
        reward.reference_id === `nft_tweet_${nftId}`) && 
       reward.reward_type === 'tweet')
    );
    setIsTwitterShared(twitterShared);
    
    // 텔레그램 공유 확인
    const telegramShared = rewardHistory.some(reward => 
      ((reward.reference_id === `nft_telegram_${formattedId}` || 
        reward.reference_id === `nft_telegram_${nftId}`) && 
       reward.reward_type === 'telegram_share')
    );
    setIsTelegramShared(telegramShared);
    
  }, [selectedNFT, rewardHistory]);
  
  // NFT가 완전히 공유되었는지 확인하는 함수 (트위터와 텔레그램 모두)
  const checkNftFullyShared = useCallback((nft) => {
    if (!rewardHistory || !rewardHistory.length || !nft) return false;
    
    // NFT ID 추출
    let nftId = "";
    if (nft.name) {
      const match = nft.name.match(/#(\d+)/);
      if (match && match[1]) {
        nftId = match[1];
      }
    }
    
    // ID가 없으면 mint 주소 사용
    if (!nftId && nft.mint) {
      nftId = nft.mint;
    }
    
    // ID가 없으면 공유하지 않은 것으로 간주
    if (!nftId) return false;
    
    // 패딩된 ID 포맷 (4자리)
    const formattedId = String(nftId).padStart(4, '0');
    
    // 트위터 공유 확인
    const twitterShared = rewardHistory.some(reward => {
      return (
        (reward.reference_id === `nft_tweet_${formattedId}` || 
         reward.reference_id === `nft_tweet_${nftId}`) && 
        reward.reward_type === 'tweet'
      ) || (
        reward.reference_id === nft.mint && 
        reward.reward_type === 'tweet'
      );
    });
    
    // 텔레그램 공유 확인
    const telegramShared = rewardHistory.some(reward => {
      return (
        (reward.reference_id === `nft_telegram_${formattedId}` || 
         reward.reference_id === `nft_telegram_${nftId}`) && 
        reward.reward_type === 'telegram_share'
      ) || (
        reward.reference_id === nft.mint && 
        reward.reward_type === 'telegram_share'
      );
    });
    
    // 둘 다 공유했는지 확인 (두 플랫폼 모두에서 보상을 받았는지)
    const fullyShared = twitterShared && telegramShared;
    
    console.log(`NFT #${formattedId} share status:`, { 
      twitter: twitterShared, 
      telegram: telegramShared,
      fullyShared: fullyShared
    });
    
    return fullyShared;
  }, [rewardHistory]);
  
  // NFT가 하나 이상의 플랫폼에서 공유되었는지 확인
  const checkNftPartiallyShared = useCallback((nft) => {
    if (!rewardHistory || !rewardHistory.length || !nft) return false;
    
    // NFT ID 추출
    let nftId = "";
    if (nft.name) {
      const match = nft.name.match(/#(\d+)/);
      if (match && match[1]) {
        nftId = match[1];
      }
    }
    
    // ID가 없으면 mint 주소 사용
    if (!nftId && nft.mint) {
      nftId = nft.mint;
    }
    
    // ID가 없으면 공유하지 않은 것으로 간주
    if (!nftId) return false;
    
    // 패딩된 ID 포맷 (4자리)
    const formattedId = String(nftId).padStart(4, '0');
    
    // 이 NFT에 대한 보상이 있는지 검사 (확장된 패턴)
    const isPartiallyShared = rewardHistory.some(reward => {
      // 기존 매칭 패턴
      const isTweetMatch = reward.reference_id === `nft_tweet_${formattedId}` && reward.reward_type === 'tweet';
      const isTelegramMatch = reward.reference_id === `nft_telegram_${formattedId}` && reward.reward_type === 'telegram_share';
      
      // 추가 패턴 (패딩되지 않은 ID)
      const isNonPaddedTweetMatch = reward.reference_id === `nft_tweet_${nftId}` && reward.reward_type === 'tweet';
      const isNonPaddedTelegramMatch = reward.reference_id === `nft_telegram_${nftId}` && reward.reward_type === 'telegram_share';
      
      // 민트 주소 기반 패턴 (이전 방식으로 저장된 경우)
      const isMintBasedMatch = reward.reference_id === nft.mint && 
        (reward.reward_type === 'tweet' || reward.reward_type === 'telegram_share');
      
      return isTweetMatch || isTelegramMatch || isNonPaddedTweetMatch || isNonPaddedTelegramMatch || isMintBasedMatch;
    });
    
    return isPartiallyShared;
  }, [rewardHistory]);
  
  // 스테이킹 통계
  const [stakingStats, setStakingStats] = useState(null);
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState("collection");
  
  // 리워드 기록 가져오기
  const fetchRewardHistory = useCallback(async () => {
    if (!connected || !publicKey) return [];
    
    try {
      console.log("Fetching reward history...");
      const response = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Reward history received:", data.rewardHistory);
      setRewardHistory(data.rewardHistory || []);
      return data.rewardHistory || [];
    } catch (error) {
      console.error("Error fetching reward history:", error);
    }
    return [];
  }, [publicKey, connected]);
  
  // NFT 데이터 가져오기 - 페이지네이션 적용
  const fetchOwnedNFTs = useCallback(async (page = 1) => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      console.log('Fetching NFTs for wallet:', publicKey.toString());
      
      // 페이지네이션 파라미터 포함하여 요청
      const res = await fetch(`/api/getNFTs?wallet=${publicKey.toString()}&page=${page}&limit=${itemsPerPage}`, {
        timeout: 30000 // 30초 타임아웃
      });
      
      console.log('API Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch NFTs: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API Data received:', data);
      
      // 페이지네이션 정보 업데이트
      setTotalNFTs(data.pagination.total);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
      
      setOwnedNFTs(data.nfts || []);
      console.log('NFTs count:', data.nfts.length);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err.message || "Failed to load NFTs");
      setErrorDetails(err.toString());
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);
  
  // 스테이킹된 NFT 가져오기
  const fetchStakedNFTs = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    setLoadingStaked(true);
    
    try {
      const response = await fetch(`/api/getStakingStats?wallet=${publicKey.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch staking statistics");
      }
      
      const data = await response.json();
      setStakingStats(data);
      setStakedNFTs(data.activeStakes || []);
    } catch (err) {
      console.error("Error fetching staked NFTs:", err);
    } finally {
      setLoadingStaked(false);
    }
  }, [publicKey, connected]);
  
  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "collection") {
      fetchOwnedNFTs(currentPage);
    }
  }, [publicKey, connected, currentPage, fetchOwnedNFTs, activeTab]);
  
  // 지갑 연결 시 리워드 기록 로드
  useEffect(() => {
    if (connected && publicKey) {
      fetchRewardHistory();
    }
  }, [publicKey, connected, fetchRewardHistory]);
  
  // 스테이킹 탭 활성화 시 스테이킹된 NFT 가져오기
  useEffect(() => {
    if (activeTab === "staking" && connected && publicKey) {
      fetchStakedNFTs();
    }
  }, [activeTab, publicKey, connected, fetchStakedNFTs]);
  
  
  // NFT 클릭 핸들러
  const handleNFTClick = (nft) => {
    // NFT ID 추출 (이름이나 mint 주소 사용)
    let nftId;
    if (nft.name) {
      // "#123"과 같은 패턴에서 숫자 추출
      const match = nft.name.match(/#(\d+)/);
      if (match && match[1]) {
        nftId = match[1];
      }
    }
    
    // ID를 찾지 못했으면 mint 주소 사용
    if (!nftId && nft.mint) {
      nftId = nft.mint;
    }
    
    // ID가 있으면 상세 페이지로 이동
    if (nftId) {
      router.push(`/solara/${nftId}`);
    }
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // 페이지 상단으로 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 다시 시도 핸들러
  const handleRetry = () => {
    if (publicKey) {
      setError(null);
      setErrorDetails(null);
      setLoading(true);
      
      // 0.5초 지연 후 다시 시도 (UI 반응성 향상)
      setTimeout(() => {
        fetchOwnedNFTs(currentPage);
      }, 500);
    }
  };
  
  // 스테이킹 핸들러
  const handleStake = (nft) => {
    if (!connected || !publicKey) {
      showWarning("Please connect your wallet to stake NFTs");
      return;
    }
    
    setSelectedNFT(nft);
    setShowStakingModal(true);
  };
  
  // 스테이킹 성공 핸들러
  const handleStakingSuccess = (result) => {
    setStakingSuccess(true);
    
    // 5초 후 성공 메시지 숨기기
    setTimeout(() => {
      setStakingSuccess(false);
    }, 5000);
    
    // 모달 닫기
    setShowStakingModal(false);
    
    // 데이터 새로고침
    fetchOwnedNFTs(currentPage);
    fetchStakedNFTs();
  };
  
  // 스테이킹 오류 핸들러
  const handleStakingError = (error) => {
    console.error("Staking error:", error);
    setError(`Failed to stake NFT: ${error.message}`);
    setErrorDetails(error.toString());
    
    // 모달 닫기
    setShowStakingModal(false);
  };
  
  // 공유 핸들러 (부분 공유도 모달 표시 가능하도록 수정)
  const handleShare = (nft) => {
    if (!connected || !publicKey) {
      showWarning("Please connect your wallet to share NFTs");
      return;
    }
    
    // NFT가 이미 두 플랫폼 모두에서 공유되었는지 확인
    if (checkNftFullyShared(nft)) {
      showInfo("You've already received all rewards for sharing this NFT on both Twitter and Telegram.");
      return;
    }
    
    setSelectedNFT(nft);
    
    // 모달 표시 전에 선택된 NFT에 대한 공유 상태 업데이트
    updateShareButtonStates(nft);
    
    setShowShareModal(true);
  };
  
  // 선택된 NFT의 공유 상태에 따라 버튼 상태 업데이트
  const updateShareButtonStates = (nft) => {
    if (!nft) return;
    
    // NFT ID 추출
    let nftId = "";
    if (nft.name) {
      const match = nft.name.match(/#(\d+)/);
      if (match && match[1]) {
        nftId = match[1];
      }
    }
    
    if (!nftId && nft.mint) {
      nftId = nft.mint;
    }
    
    if (!nftId) return;
    
    const formattedId = String(nftId).padStart(4, '0');
    
    // 트위터 공유 확인
    const twitterShared = rewardHistory.some(reward => {
      return (
        (reward.reference_id === `nft_tweet_${formattedId}` || 
         reward.reference_id === `nft_tweet_${nftId}`) && 
        reward.reward_type === 'tweet'
      ) || (
        reward.reference_id === nft.mint && 
        reward.reward_type === 'tweet'
      );
    });
    
    // 텔레그램 공유 확인
    const telegramShared = rewardHistory.some(reward => {
      return (
        (reward.reference_id === `nft_telegram_${formattedId}` || 
         reward.reference_id === `nft_telegram_${nftId}`) && 
        reward.reward_type === 'telegram_share'
      ) || (
        reward.reference_id === nft.mint && 
        reward.reward_type === 'telegram_share'
      );
    });
    
    // 상태 업데이트
    setIsTwitterShared(twitterShared);
    setIsTelegramShared(telegramShared);
  };
  
  // 트위터 공유 핸들러
  const handleTwitterShare = async () => {
    if (!selectedNFT || !publicKey) return;
    
    setShareLoading(prev => ({ ...prev, twitter: true }));
    
    try {
      // NFT 정보 추출
      const nftId = selectedNFT.name?.match(/#(\d+)/)?.[1] || '0';
      const formattedId = String(nftId).padStart(4, '0');
      const tier = selectedNFT.tier || 'Unknown';
      const mintAddress = selectedNFT.mint;
      
      // 네트워크 설정
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      
      // 링크 생성
      const solscanUrl = `https://solscan.io/token/${mintAddress}?cluster=${network}`;
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      const tesolaUrl = `https://tesola.xyz/solara/${nftId}`;
      
      // 트윗 텍스트 생성
      const tweetText = encodeURIComponent(
        `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection! 🚀\n\n` +
        `View on Solscan: ${solscanUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
      
      // 사용자 안내 (alert 대신 알림 시스템 사용)
      showInfo('Share on Twitter and then return here to claim your reward.', 6000);
      
      // 트위터 창 열기
      const twitterWindow = window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
      
      // 팝업 차단 확인
      if (!twitterWindow || twitterWindow.closed || typeof twitterWindow.closed === 'undefined') {
        showWarning('Please allow popups to open Twitter and earn rewards.', 5000);
        setShareLoading(prev => ({ ...prev, twitter: false }));
        return;
      }
      
      // 사용자가 공유를 완료할 시간을 주기 위한 지연
      setTimeout(() => {
        // 모달 설정
        setConfirmModal({
          isOpen: true,
          title: 'Confirm Twitter Share',
          message: 'Did you complete sharing on Twitter? Please make sure you actually shared the tweet. In a production environment, we would verify that you actually tweeted.',
          confirmText: 'Yes, I Shared',
          cancelText: 'Cancel',
          onConfirm: async () => {
          try {
            console.log('Recording tweet reward for NFT:', { nftId, formattedId, mintAddress });
            
            // 실제로는 여기서 트위터 API를 통해 사용자의 최근 트윗 확인이 가능
            // 그러나 API 호출 제한과 인증 문제로 프로덕션에서는 다른 접근법 필요
            
            /* 
            // Twitter API v2를 사용하여 최근 트윗 확인하는 예시 코드
            const verifyTweet = async () => {
              // 서버 측에서 처리하는 것이 보안상 더 좋음
              const twitterUserId = 'USER_ID';
              const response = await fetch(`/api/verify-tweet?userId=${twitterUserId}&text=${encodeURIComponent(tesolaUrl)}`);
              return response.ok;
            }
            
            const isTweetVerified = await verifyTweet();
            if (!isTweetVerified) {
              throw new Error("We couldn't verify your tweet. Please make sure you've shared with the correct text and try again.");
            }
            */
            
            // 보상 API 호출
            const response = await fetch('/api/recordTweetReward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                wallet: publicKey.toString(),
                reference_id: `nft_tweet_${formattedId}`,
                reward_type: 'tweet',
                nft_id: nftId,
                mint_address: mintAddress,
                // 트윗 텍스트도 저장하여 나중에 검증에 사용할 수 있음
                tweet_text: `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection!`
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error processing tweet reward');
            }
            
            // 성공 메시지
            showSuccess('Congratulations! 5 TESOLA tokens have been added to your rewards.', 5000);
            setShareSuccess(true);
            
            // 리워드 기록 업데이트 - 즉각적인 UI 업데이트를 위해
            const freshRewards = await fetchRewardHistory();
            console.log('Updated reward history after tweet:', freshRewards);
            
            // 성공 후 버튼 상태 즉시 업데이트 (독립적인 상태)
            setIsTwitterShared(true);
            
            // 수동으로 리워드 기록에 추가하여 UI 즉시 반영
            setRewardHistory(prev => {
              // 이미 추가된 보상이 있는지 확인
              const isDuplicate = prev.some(reward => 
                reward.reference_id === `nft_tweet_${formattedId}` && 
                reward.reward_type === 'tweet'
              );
              
              if (isDuplicate) return prev;
              
              return [
                ...prev, 
                {
                  reward_type: 'tweet',
                  reference_id: `nft_tweet_${formattedId}`,
                  wallet_address: publicKey.toString(),
                  amount: 5,
                  claimed: false
                }
              ];
            });
            
            // 모달은 닫지 않고 유지 (사용자가 다른 플랫폼도 공유할 수 있게)
            // setShowShareModal(false);
            
            // 5초 후 성공 메시지 숨기기
            setTimeout(() => {
              setShareSuccess(false);
            }, 5000);
          } catch (error) {
            console.error('Tweet reward error:', error);
            // Display user-friendly error message
            const errorMessage = error.message && typeof error.message === 'string' 
              ? error.message 
              : 'Unknown error occurred';
              
            // Check if it's a server response with better error message
            const friendlyMessage = errorMessage.includes('System maintenance') || 
                                    errorMessage.includes('feature is temporarily') ||
                                    errorMessage.includes('already received rewards')
              ? errorMessage
              : 'Unable to record your share. Please try again later.';
              
            showError(friendlyMessage, 7000);
          }
            setShareLoading(prev => ({ ...prev, twitter: false }));
          },
          onClose: () => {
            setShareLoading(prev => ({ ...prev, twitter: false }));
      }
      });
      }, 5000);
    } catch (error) {
      console.error('Error in twitter share process:', error);
      setShareLoading(prev => ({ ...prev, twitter: false }));
      showError(`Error: ${error.message}`, 7000);
    }
  };
  
  // 텔레그램 공유 핸들러
  const handleTelegramShare = async () => {
    if (!selectedNFT || !publicKey) return;
    
    setShareLoading(prev => ({ ...prev, telegram: true }));
    
    try {
      // NFT 정보 추출
      const nftId = selectedNFT.name?.match(/#(\d+)/)?.[1] || '0';
      const formattedId = String(nftId).padStart(4, '0');
      const tier = selectedNFT.tier || 'Unknown';
      const mintAddress = selectedNFT.mint;
      
      // 네트워크 설정
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      
      // 링크 생성
      const solscanUrl = `https://solscan.io/token/${mintAddress}?cluster=${network}`;
      const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
      const tesolaUrl = `https://tesola.xyz/solara/${nftId}`;
      const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
      
      // 공유 텍스트 생성
      const shareText = encodeURIComponent(
        `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection! 🚀\n\n` +
        `View on Solscan: ${solscanUrl}\n` +
        `View on Magic Eden: ${magicEdenUrl}\n` +
        `Visit: ${tesolaUrl}\n\n` +
        `Join our community: ${telegramCommunityUrl}\n\n` +
        `#SOLARA #NFT #Solana`
      );
      
      // 사용자 안내 (알림 시스템 사용)
      showInfo('Share on Telegram and then return here to claim your reward.', 6000);
      
      // 텔레그램 창 열기
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${shareText}`;
      const telegramWindow = window.open(telegramUrl, '_blank');
      
      // 팝업 차단 확인
      if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
        showWarning('Please allow popups to open Telegram and earn rewards.', 5000);
        setShareLoading(prev => ({ ...prev, telegram: false }));
        return;
      }
      
      // 사용자가 공유를 완료할 시간을 주기 위한 지연
      setTimeout(() => {
        // 모달 설정
        setConfirmModal({
          isOpen: true,
          title: 'Confirm Telegram Share',
          message: 'Did you complete sharing on Telegram? Please make sure you actually shared the message. In a production environment, we would verify that you actually shared on Telegram.',
          confirmText: 'Yes, I Shared',
          cancelText: 'Cancel',
          onConfirm: async () => {
          try {
            console.log('Recording telegram reward for NFT:', { nftId, formattedId, mintAddress });
            
            // 보상 API 호출
            const response = await fetch('/api/recordTweetReward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                wallet: publicKey.toString(),
                reference_id: `nft_telegram_${formattedId}`,
                reward_type: 'telegram_share',
                nft_id: nftId,
                mint_address: mintAddress,
                // 공유 텍스트도 저장하여 나중에 검증에 사용할 수 있음
                share_text: `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection!`
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Error processing Telegram reward');
            }
            
            // 성공 메시지
            showSuccess('Congratulations! 5 TESOLA tokens have been added to your rewards.', 5000);
            setShareSuccess(true);
            
            // 리워드 기록 업데이트 - 즉각적인 UI 업데이트를 위해
            const freshRewards = await fetchRewardHistory();
            console.log('Updated reward history after telegram share:', freshRewards);
            
            // 성공 후 버튼 상태 즉시 업데이트 (독립적인 상태)
            setIsTelegramShared(true);
            
            // 수동으로 리워드 기록에 추가하여 UI 즉시 반영
            setRewardHistory(prev => {
              // 이미 추가된 보상이 있는지 확인
              const isDuplicate = prev.some(reward => 
                reward.reference_id === `nft_telegram_${formattedId}` && 
                reward.reward_type === 'telegram_share'
              );
              
              if (isDuplicate) return prev;
              
              return [
                ...prev, 
                {
                  reward_type: 'telegram_share',
                  reference_id: `nft_telegram_${formattedId}`,
                  wallet_address: publicKey.toString(),
                  amount: 5,
                  claimed: false
                }
              ];
            });
            
            // 5초 후 성공 메시지 숨기기
            setTimeout(() => {
              setShareSuccess(false);
            }, 5000);
          } catch (error) {
            console.error('Telegram reward error:', error);
            // Display user-friendly error message
            const errorMessage = error.message && typeof error.message === 'string' 
              ? error.message 
              : 'Unknown error occurred';
              
            // Check if it's a server response with better error message
            const friendlyMessage = errorMessage.includes('System maintenance') || 
                                    errorMessage.includes('feature is temporarily') ||
                                    errorMessage.includes('already received rewards')
              ? errorMessage
              : 'Unable to record your share. Please try again later.';
              
            showError(friendlyMessage, 7000);
          }
            
          setShareLoading(prev => ({ ...prev, telegram: false }));
      },
      
      // 모달 취소 시
      onClose: () => {
        setShareLoading(prev => ({ ...prev, telegram: false }));
      }
      });
      }, 5000);
    } catch (error) {
      console.error('Error in telegram share process:', error);
      setShareLoading(prev => ({ ...prev, telegram: false }));
      showError(`Error: ${error.message}`, 7000);
    }
  };

  // 오프라인 상태 감지
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // 온라인/오프라인 상태 이벤트 리스너
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    // 초기 상태 설정
    setIsOffline(!navigator.onLine);
    
    // 이벤트 리스너 등록
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // 클린업
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 탭 콘텐츠 렌더링 함수
  const renderTabContent = () => {
    if (!connected) {
      return (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Connect your wallet to see your SOLARA NFTs</p>
          <div className="mt-4 flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="mb-6">
          <ErrorMessage 
            message={error}
            type="error"
            errorDetails={errorDetails}
            onRetry={handleRetry}
            onDismiss={() => {
              setError(null);
              setErrorDetails(null);
            }}
          />
        </div>
      );
    }
    
    // 컬렉션 탭
    if (activeTab === "collection") {
      if (loading) {
        return (
          <div className="py-12">
            <p className="text-center text-gray-400 mb-8">Loading your NFTs...</p>
            <LoadingSkeleton type="nft" count={6} />
          </div>
        );
      }
      
      if (ownedNFTs.length === 0) {
        return (
          <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xl mb-4">You don't own any SOLARA NFTs yet</p>
            <PrimaryButton
              onClick={() => router.push('/')}
              className="mx-auto"
            >
              Mint Your First NFT
            </PrimaryButton>
          </div>
        );
      }
      
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedNFTs.map((nft) => {
              // Format NFT name to ensure 4-digit ID display
              if (nft.name && nft.name.includes('#')) {
                nft.name = nft.name.replace(/#(\d+)/, (match, id) => 
                  `#${String(id).padStart(4, '0')}`
                );
              }
              
              return (
                <div 
                  key={nft.mint} 
                  className="border border-purple-500/30 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 bg-gray-900/50"
                  onClick={() => handleNFTClick(nft)}
                >
                  <div className="relative aspect-square">
                    <EnhancedProgressiveImage 
                      src={nft.image} 
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      lazyLoad={true}
                      quality={85}
                    />
                    
                    {/* NFT info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <p className="text-white font-semibold truncate">{nft.name}</p>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${
                          (nft.tier?.toLowerCase() || '').includes('legendary') ? 'text-yellow-300' :
                          (nft.tier?.toLowerCase() || '').includes('epic') ? 'text-purple-300' :
                          (nft.tier?.toLowerCase() || '').includes('rare') ? 'text-blue-300' :
                          'text-green-300'
                        }`}>{nft.tier}</p>
                        {nft.mint && <p className="text-gray-400 text-xs font-mono">{nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="p-3 bg-gray-800/80 backdrop-blur-sm flex justify-between items-center gap-2">
                    <SecondaryButton 
                      size="small" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click event
                        window.open(`https://solscan.io/token/${nft.mint}?cluster=devnet`, '_blank');
                      }}
                    >
                      View
                    </SecondaryButton>
                    <SecondaryButton 
                      size="small" 
                      className={`flex-1 ${
                        checkNftFullyShared(nft) 
                          ? 'bg-green-700/50 border-green-500/50' 
                          : checkNftPartiallyShared(nft) 
                            ? 'bg-yellow-700/50 border-yellow-500/50'
                            : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click event
                        handleShare(nft);
                      }}
                      disabled={checkNftFullyShared(nft)}
                    >
                      {checkNftFullyShared(nft) 
                        ? '✓ Fully Shared' 
                        : checkNftPartiallyShared(nft)
                          ? '½ Partial Rewards' 
                          : 'Share'}
                    </SecondaryButton>
                    <PrimaryButton 
                      size="small" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click event
                        handleStake(nft);
                      }}
                    >
                      Stake
                    </PrimaryButton>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
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
          
          {/* NFT 수량 표시 */}
          {totalNFTs > 0 && (
            <div className="text-center mt-6 text-gray-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalNFTs)}-
              {Math.min(currentPage * itemsPerPage, totalNFTs)} of {totalNFTs} NFTs
            </div>
          )}
        </>
      );
    }
    
    // 리워드 대시보드 탭 (기존 스테이킹 대시보드를 개선)
    if (activeTab === "staking") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* 스테이킹된 NFTs 목록 추가 */}
            <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Currently Staked NFTs
              </h3>
              
              {loadingStaked ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-gray-700 rounded-lg"></div>
                  <div className="h-16 bg-gray-700 rounded-lg"></div>
                  <div className="h-16 bg-gray-700 rounded-lg"></div>
                </div>
              ) : !stakedNFTs || stakedNFTs.length === 0 ? (
                <div className="text-center py-8 bg-gray-900/30 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">No Staked NFTs</h4>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    You don't have any staked SOLARA NFTs yet. Stake your NFTs to earn TESOLA rewards.
                  </p>
                  <PrimaryButton
                    onClick={() => setActiveTab("collection")}
                    size="small"
                  >
                    Go to Collection
                  </PrimaryButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {stakedNFTs.map((stake) => (
                    <div 
                      key={stake.mint_address} 
                      className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/20 hover:border-purple-400/40 transition-all"
                    >
                      <div className="flex items-center">
                        <div className="w-14 h-14 mr-3 relative rounded overflow-hidden bg-gray-800">
                          {stake.image_url && (
                            <img 
                              src={stake.image_url} 
                              alt={stake.nft_name || "Staked NFT"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder-nft.jpg";
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{stake.nft_name || "SOLARA NFT"}</h4>
                              <p className="text-xs text-gray-400">{new Date(stake.staked_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-yellow-400">{stake.earned_so_far || 0} TESOLA</p>
                              <p className="text-xs text-gray-300">of {stake.total_rewards}</p>
                            </div>
                          </div>
                          
                          {/* Progress bar for staking progress */}
                          <div className="mt-2">
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{width: `${stake.progress_percentage || 0}%`}}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                              <span>{Math.floor(stake.progress_percentage || 0)}%</span>
                              <span>Unlocks: {new Date(stake.release_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 스테이킹 대시보드 */}
            <StakingDashboard 
              stats={stakingStats} 
              isLoading={loadingStaked} 
              onRefresh={fetchStakedNFTs}
            />
          </div>
          <div>
            <StakingRewards 
              stats={stakingStats} 
              isLoading={loadingStaked}
            />
          </div>
        </div>
      );
    }
    
    // 리더보드 탭 - 최상위 탭으로 이동
    if (activeTab === "leaderboard") {
      return (
        <Leaderboard 
          stats={stakingStats}
          isLoading={loadingStaked}
          onRefresh={fetchStakedNFTs}
        />
      );
    }
    
    // NFT 분석 탭 (기존 Stake NFTs 대신 더 유용한 정보 제공)
    if (activeTab === "stake") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                NFT Collection Metrics
              </h3>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-gray-700 rounded-lg"></div>
                  <div className="h-24 bg-gray-700 rounded-lg"></div>
                </div>
              ) : ownedNFTs.length === 0 ? (
                <div className="text-center py-10 bg-gray-900/30 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-400 mb-1">No Data Available</h4>
                  <p className="text-gray-500 max-w-md mx-auto">
                    You don't have any SOLARA NFTs in your collection yet. Mint or purchase NFTs to see your collection analytics.
                  </p>
                </div>
              ) : (
                <>
                  {/* NFT Tier Distribution Chart (Simplified visualization) */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-300 mb-3">Tier Distribution</h4>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-end h-48 space-x-4 justify-center">
                        {/* Calculate tier counts */}
                        {(() => {
                          const tierCounts = {
                            LEGENDARY: ownedNFTs.filter(nft => 
                              nft.tier?.toUpperCase().includes('LEGEND')).length,
                            EPIC: ownedNFTs.filter(nft => 
                              nft.tier?.toUpperCase().includes('EPIC')).length,
                            RARE: ownedNFTs.filter(nft => 
                              nft.tier?.toUpperCase().includes('RARE')).length,
                            COMMON: ownedNFTs.filter(nft => 
                              !nft.tier?.toUpperCase().includes('LEGEND') && 
                              !nft.tier?.toUpperCase().includes('EPIC') && 
                              !nft.tier?.toUpperCase().includes('RARE')).length
                          };
                          
                          // Calculate max value for scaling
                          const maxCount = Math.max(...Object.values(tierCounts), 1);
                          
                          // Render bars
                          return (
                            <>
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-16 bg-yellow-500/80 hover:bg-yellow-500 transition-all rounded-t-md"
                                  style={{ height: `${(tierCounts.LEGENDARY / maxCount) * 100}%` }}
                                ></div>
                                <p className="mt-2 text-xs font-medium text-yellow-400">Legendary</p>
                                <p className="text-sm">{tierCounts.LEGENDARY}</p>
                              </div>
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-16 bg-purple-500/80 hover:bg-purple-500 transition-all rounded-t-md"
                                  style={{ height: `${(tierCounts.EPIC / maxCount) * 100}%` }}
                                ></div>
                                <p className="mt-2 text-xs font-medium text-purple-400">Epic</p>
                                <p className="text-sm">{tierCounts.EPIC}</p>
                              </div>
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-16 bg-blue-500/80 hover:bg-blue-500 transition-all rounded-t-md"
                                  style={{ height: `${(tierCounts.RARE / maxCount) * 100}%` }}
                                ></div>
                                <p className="mt-2 text-xs font-medium text-blue-400">Rare</p>
                                <p className="text-sm">{tierCounts.RARE}</p>
                              </div>
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-16 bg-green-500/80 hover:bg-green-500 transition-all rounded-t-md"
                                  style={{ height: `${(tierCounts.COMMON / maxCount) * 100}%` }}
                                ></div>
                                <p className="mt-2 text-xs font-medium text-green-400">Common</p>
                                <p className="text-sm">{tierCounts.COMMON}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Staking Status Overview */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-300 mb-3">Staking Status</h4>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-400">Total NFTs:</span>
                        <span className="text-xl font-bold text-white">{ownedNFTs.length}</span>
                      </div>
                      
                      {/* Calculate staked percentage */}
                      {(() => {
                        if (!stakingStats) return null;
                        
                        const stakedCount = stakedNFTs.length;
                        const totalCount = ownedNFTs.length + stakedCount;
                        const stakedPercentage = totalCount > 0 ? Math.floor((stakedCount / totalCount) * 100) : 0;
                        
                        return (
                          <>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="text-gray-400">Currently Staked:</span>
                              <span className="text-white">{stakedCount} ({stakedPercentage}%)</span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                style={{width: `${stakedPercentage}%`}}
                              ></div>
                            </div>
                          </>
                        );
                      })()}
                      
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                          <p className="text-xs text-gray-400">Earning Potential</p>
                          <p className="text-xl font-bold text-yellow-400">
                            {(() => {
                              // Calculate potential daily earnings if all NFTs were staked
                              const tierValues = {
                                LEGENDARY: 200, 
                                EPIC: 100, 
                                RARE: 50, 
                                COMMON: 25
                              };
                              
                              let potentialDaily = 0;
                              ownedNFTs.forEach(nft => {
                                let tierKey = 'COMMON';
                                if (nft.tier?.toUpperCase().includes('LEGEND')) tierKey = 'LEGENDARY';
                                else if (nft.tier?.toUpperCase().includes('EPIC')) tierKey = 'EPIC';
                                else if (nft.tier?.toUpperCase().includes('RARE')) tierKey = 'RARE';
                                
                                potentialDaily += tierValues[tierKey];
                              });
                              
                              return `${potentialDaily}`;
                            })()}
                            <span className="text-sm font-normal text-gray-300"> TESOLA/day</span>
                          </p>
                        </div>
                        <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                          <p className="text-xs text-gray-400">Collection Value</p>
                          <p className="text-xl font-bold text-white">
                            {(() => {
                              // Calculate collection SOL value (simplified)
                              const tierValues = {
                                LEGENDARY: 5.0, 
                                EPIC: 2.5, 
                                RARE: 1.2, 
                                COMMON: 0.5
                              };
                              
                              let totalValue = 0;
                              ownedNFTs.forEach(nft => {
                                let tierKey = 'COMMON';
                                if (nft.tier?.toUpperCase().includes('LEGEND')) tierKey = 'LEGENDARY';
                                else if (nft.tier?.toUpperCase().includes('EPIC')) tierKey = 'EPIC';
                                else if (nft.tier?.toUpperCase().includes('RARE')) tierKey = 'RARE';
                                
                                totalValue += tierValues[tierKey];
                              });
                              
                              return totalValue.toFixed(2);
                            })()}
                            <span className="text-sm font-normal text-gray-300"> SOL</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Take action buttons */}
                  <div className="flex space-x-4">
                    <PrimaryButton
                      onClick={() => window.scrollTo(0, 0)}
                      className="flex-1 py-2.5"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      }
                    >
                      Mint New NFT
                    </PrimaryButton>
                    
                    <SecondaryButton
                      onClick={() => setActiveTab("staking")}
                      className="flex-1 py-2.5"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      }
                    >
                      View Rewards
                    </SecondaryButton>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-5 border border-purple-500/20 h-full">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Collection Insights
              </h3>
              
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-medium text-teal-300 mb-2">SOLARA Collection Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Total Supply</span>
                      <span className="font-medium text-white">1,000 NFTs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Distribution</span>
                      <span className="font-medium text-white">
                        {ownedNFTs.length > 0 && `You own ${((ownedNFTs.length / 1000) * 100).toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Rarest Tier</span>
                      <span className="font-medium text-yellow-300">Legendary (5%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-300 mb-2">Market Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300 flex justify-between">
                      <span>Floor Price:</span>
                      <span className="font-medium text-white">0.5 SOL</span>
                    </p>
                    <p className="text-gray-300 flex justify-between">
                      <span>Avg. Legendary Price:</span>
                      <span className="font-medium text-white">5.0 SOL</span>
                    </p>
                    <p className="text-gray-300 flex justify-between">
                      <span>7 Day Volume:</span>
                      <span className="font-medium text-white">120 SOL</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-medium text-green-300 mb-2">Upcoming Events</h4>
                  <div className="space-y-3 text-sm">
                    <div className="border-l-2 border-green-500 pl-3">
                      <p className="font-medium text-white">Season 2 Launch</p>
                      <p className="text-xs text-gray-400">In 12 days</p>
                    </div>
                    <div className="border-l-2 border-blue-500 pl-3">
                      <p className="font-medium text-white">Staking Rewards Boost</p>
                      <p className="text-xs text-gray-400">In 5 days</p>
                    </div>
                    <div className="border-l-2 border-purple-500 pl-3">
                      <p className="font-medium text-white">Community Showcase</p>
                      <p className="text-xs text-gray-400">Tomorrow</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Head>
        <title>TESOLA - My Collection & Staking</title>
        <meta name="description" content="View your SOLARA NFT collection and stake to earn TESOLA tokens. Higher tier NFTs earn more rewards." />
      </Head>
      
      <ErrorBoundary>
        <Layout>
          <div className="max-w-6xl mx-auto p-6">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                My SOLARA Collection
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                View and manage your SOLARA NFTs, stake them to earn TESOLA rewards
              </p>
            </div>
          
          {/* 오프라인 알림 */}
          {isOffline && (
            <ErrorMessage
              message="You are currently offline"
              type="warning"
              className="mb-6"
            />
          )}
          
          {/* 스테이킹 성공 메시지 */}
          {stakingSuccess && (
            <div className="mb-6">
              <ErrorMessage 
                message="NFT staked successfully! You'll receive TESOLA rewards based on your staking period."
                type="success"
                onDismiss={() => setStakingSuccess(false)}
              />
            </div>
          )}
          
          {/* 공유 성공 메시지 */}
          {shareSuccess && (
            <div className="mb-6">
              <ErrorMessage 
                message="NFT shared successfully! 5 TESOLA tokens have been added to your rewards."
                type="success"
                onDismiss={() => setShareSuccess(false)}
              />
            </div>
          )}
          
          {/* 확인 모달 */}
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
          />
          
          {/* 스테이킹 모달 */}
          {showStakingModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
                <button 
                  onClick={() => setShowStakingModal(false)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                  aria-label="Close staking modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-2xl font-bold mb-4">Stake Your SOLARA NFT</h2>
                
                <StakingComponent 
                  nft={selectedNFT}
                  onSuccess={handleStakingSuccess}
                  onError={handleStakingError}
                />
              </div>
            </div>
          )}
          
          {/* 공유 모달 */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
                <button 
                  onClick={() => { 
                    setShowShareModal(false);
                    fetchRewardHistory(); // 모달 닫을 때 리워드 기록 새로고침
                  }} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                  aria-label="Close share modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-2xl font-bold mb-4">Share Your SOLARA NFT</h2>
                
                {/* 안내 문구 추가 */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-3 mb-4 text-sm">
                  <p className="text-blue-300 font-medium">💡 Tip</p>
                  <p className="text-gray-300">You can share on both Twitter and Telegram to earn rewards from each platform.</p>
                </div>
                
                {/* NFT 정보 */}
                <div className="flex items-center mb-6 p-3 bg-gray-800 rounded-lg">
                  {selectedNFT.image && (
                    <img 
                      src={selectedNFT.image} 
                      alt={selectedNFT.name} 
                      className="w-16 h-16 rounded object-cover mr-3"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{selectedNFT.name}</h3>
                    <p className="text-sm text-gray-300">{selectedNFT.tier}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">
                  Share your NFT on social media and earn TESOLA tokens!
                </p>
                
                <div className="space-y-4">
                  {/* 트위터 공유 버튼 */}
                  <PrimaryButton
                    onClick={handleTwitterShare}
                    disabled={shareLoading.twitter || isTwitterShared}
                    loading={shareLoading.twitter}
                    icon={!shareLoading.twitter && !isTwitterShared && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    )}
                    className={isTwitterShared ? 'bg-green-700 hover:bg-green-800' : ''}
                    fullWidth
                  >
                    {shareLoading.twitter 
                      ? "Sharing..." 
                      : isTwitterShared 
                        ? "✓ Shared on Twitter" 
                        : "Share on Twitter (+5 TESOLA)"}
                  </PrimaryButton>
                  
                  {/* 텔레그램 공유 버튼 */}
                  <SecondaryButton
                    onClick={handleTelegramShare}
                    disabled={shareLoading.telegram || isTelegramShared}
                    loading={shareLoading.telegram}
                    icon={!shareLoading.telegram && !isTelegramShared && (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
                      </svg>
                    )}
                    className={isTelegramShared ? 'bg-green-700 hover:bg-green-800 text-white' : ''}
                    fullWidth
                  >
                    {shareLoading.telegram 
                      ? "Sharing..." 
                      : isTelegramShared 
                        ? "✓ Shared on Telegram" 
                        : "Share on Telegram (+5 TESOLA)"}
                  </SecondaryButton>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/60 rounded-lg p-1">
              <div className="flex space-x-1">
                <TabButton
                  isActive={activeTab === "collection"}
                  onClick={() => setActiveTab("collection")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  }
                >
                  My NFTs
                </TabButton>
                <TabButton
                  isActive={activeTab === "staking"}
                  onClick={() => setActiveTab("staking")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  Rewards Dashboard
                </TabButton>
                <TabButton
                  isActive={activeTab === "stake"}
                  onClick={() => setActiveTab("stake")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                  }
                >
                  NFT Analytics
                </TabButton>
                <TabButton
                  isActive={activeTab === "leaderboard"}
                  onClick={() => setActiveTab("leaderboard")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  }
                >
                  Leaderboard
                </TabButton>
              </div>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="mb-12">
            {renderTabContent()}
          </div>
        </div>
        </Layout>
      </ErrorBoundary>
    </>
  );
}