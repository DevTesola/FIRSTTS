// pages/solara/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

// Layout 컴포넌트를 동적으로 로드
const Layout = dynamic(() => import("../../components/Layout"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
});

export default function NFTViewer() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 리워드 관련 상태 추가
  const [rewardHistory, setRewardHistory] = useState([]);
  const [isTweetRewarded, setIsTweetRewarded] = useState(false);
  const [isTelegramRewarded, setIsTelegramRewarded] = useState(false);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // NFT 데이터 가져오기
  useEffect(() => {
    async function fetchNFTData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the environment variable for IPFS gateway
        const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
        const resourceCID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';
        
        const jsonUrl = `${ipfsGateway}/ipfs/${resourceCID}/${String(id).padStart(4, "0")}.json`;
        
        // 먼저 메타데이터 가져오기
        const response = await fetch(jsonUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch NFT data: ${response.statusText}`);
        }
        
        const nftData = await response.json();
        
        // 민트 주소가 있는지 확인하고 없으면 API에서 가져오기 시도
        if (!nftData.mintAddress && !nftData.mint) {
          try {
            // 여기서 API를 통해 nftId에 해당하는 민트 주소를 가져올 수 있음
            // 예시: const mintInfoResponse = await fetch(`/api/getNFTMintAddress?id=${id}`);
            // 현재 API가 없다면 이 부분은 건너뜀
          } catch (mintError) {
            console.error("Could not fetch mint address:", mintError);
          }
        }
        
        setData(nftData);
      } catch (err) {
        console.error("Error fetching NFT data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNFTData();
  }, [id]);

  // 리워드 기록 가져오기
  useEffect(() => {
    // 지갑 연결되어 있고 NFT 데이터가 있을 때만 실행
    const fetchRewardHistory = async () => {
      if (!data || !id) return;
      
      try {
        // 지갑 주소가 있는 경우에만 실행
        if (window.solana && window.solana.publicKey) {
          const walletAddress = window.solana.publicKey.toString();
          
          // 리워드 기록 가져오기
          const res = await fetch(`/api/getRewards?wallet=${walletAddress}`);
          if (!res.ok) {
            throw new Error('Failed to fetch rewards');
          }
          
          const { rewardHistory: history } = await res.json();
          setRewardHistory(history || []);
          
          // 이미 보상을 받았는지 확인
          const nftId = String(id).padStart(4, "0");
          checkRewardStatus(history, nftId);
        }
      } catch (error) {
        console.error('Error fetching reward history:', error);
      }
    };
    
    fetchRewardHistory();
  }, [data, id]);

  // Extract tier from attributes
  const getTier = () => {
    if (!data || !data.attributes) return "Unknown";
    
    const tierAttribute = data?.attributes.find(
      attr => attr.trait_type === "Tier" || attr.trait_type === "tier"
    );
    
    return tierAttribute ? tierAttribute.value : "Unknown";
  };
  
  // Format image URL properly
  const getImageUrl = () => {
    if (!data || !data.image) return null;
    
    // Handle IPFS URLs
    if (data.image.startsWith("ipfs://")) {
      const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
      const ipfsHash = data.image.replace("ipfs://", "");
      return `${ipfsGateway}/ipfs/${ipfsHash}`;
    }
    
    return data.image;
  };

  // 더 포괄적인 민트 주소 추출 함수
  const getMintAddress = () => {
    if (!data) return "";
    
    // 다양한 속성에서 민트 주소 확인
    return data.mintAddress || data.mint || data.address || 
          (data.attributes && data.attributes.find(attr => 
            attr.trait_type === "Mint Address" || attr.trait_type === "mint_address"
          )?.value) || "";
  };

  // 보상 상태 확인 함수
  const checkRewardStatus = (history, nftId) => {
    if (!history || !history.length) return;
    
    // 트윗 보상 확인 - NFT ID 또는 민트 주소 기반
    const tweetRewarded = history.some(reward => 
      (reward.reference_id === `mint_${nftId}` || 
       reward.reference_id === `nft_tweet_${nftId}` ||
       (getMintAddress() && reward.reference_id === `mint_${getMintAddress()}`)) && 
      (reward.reward_type === 'mint_tweet' || reward.reward_type === 'tweet')
    );
    
    // 텔레그램 보상 확인
    const telegramRewarded = history.some(reward => 
      (reward.reference_id === `mint_${nftId}` || 
       reward.reference_id === `nft_telegram_${nftId}` ||
       (getMintAddress() && reward.reference_id === `mint_${getMintAddress()}`)) && 
      reward.reward_type === 'telegram_share'
    );
    
    setIsTweetRewarded(tweetRewarded);
    setIsTelegramRewarded(telegramRewarded);
  };

  // 링크 생성 함수
  const createSolscanUrl = (mintAddr) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    if (mintAddr && mintAddr.length > 30) {  // 솔라나 주소는 보통 32-44자
      return `https://solscan.io/token/${mintAddr}?cluster=${network}`;
    } else if (mintAddr && mintAddr.length > 5) {  // 짧은 ID라면 트랜잭션일 수 있음
      return `https://solscan.io/tx/${mintAddr}?cluster=${network}`;
    } else {
      // NFT 전체 목록 페이지로 연결
      return `https://solscan.io/nfts?cluster=${network}`;
    }
  };

  const createMagicEdenUrl = (mintAddr) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    
    if (mintAddr && mintAddr.length > 30) {
      return `https://magiceden.io/item-details/${mintAddr}?cluster=${network}`;
    } else {
      // 컬렉션 페이지로 연결
      return `https://magiceden.io/marketplace/slr?cluster=${network}`;
    }
  };

  // 수정된 트윗 공유 함수
  const handleTweetShare = async () => {
    if (!data) return;
    
    // 이미 보상을 받았는지 확인
    if (isTweetRewarded) {
      alert("You've already received rewards for sharing this NFT!");
      return;
    }
    
    const tier = getTier();
    const mintAddress = getMintAddress();
    
    // Create links with proper checks
    const solscanUrl = createSolscanUrl(mintAddress);
    const magicEdenUrl = createMagicEdenUrl(mintAddress);
    const tesolaUrl = `https://tesola.xyz/solara/${id}`;
    
    // Create tweet text
    const text = `I just minted SOLARA #${id} – ${tier} tier! 🚀\n\n` +
               `View on Solscan: ${solscanUrl}\n` +
               `View on Magic Eden: ${magicEdenUrl}\n` +
               `Visit: ${tesolaUrl}\n\n` +
               `#SOLARA #NFT #Solana`;
    
    // 로딩 상태 시작
    setTweetLoading(true);
    
    // Open Twitter intent URL
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    
    // 사용자 확인
    const confirmed = window.confirm('Did you complete sharing on Twitter? Confirm to receive your TESOLA tokens.');
    
    if (confirmed) {
      try {
        // 지갑 주소 가져오기
        if (!window.solana || !window.solana.publicKey) {
          throw new Error('Please connect your wallet to receive rewards');
        }
        
        const walletAddress = window.solana.publicKey.toString();
        const nftId = String(id).padStart(4, "0");
        
        // API 호출하여 보상 기록
        const response = await fetch('/api/recordTweetReward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: walletAddress,
            reference_id: `nft_tweet_${nftId}`,
            reward_type: 'tweet',
            nft_id: nftId,
            mint_address: mintAddress || ''
          })
        });
        
        if (!response.ok) {
          throw new Error('Error processing tweet reward');
        }
        
        // 보상 성공 메시지
        alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
        setIsTweetRewarded(true);
        
        // 리워드 기록 새로고침
        const updatedRes = await fetch(`/api/getRewards?wallet=${walletAddress}`);
        if (updatedRes.ok) {
          const { rewardHistory: updatedHistory } = await updatedRes.json();
          setRewardHistory(updatedHistory || []);
        }
      } catch (error) {
        console.error('Tweet reward error:', error);
        alert(`Error: ${error.message}`);
      }
    }
    
    setTweetLoading(false);
  };
  
  // 수정된 텔레그램 공유 함수
  const handleTelegramShare = async () => {
    if (!data) return;
    
    // 이미 보상을 받았는지 확인
    if (isTelegramRewarded) {
      alert("You've already received rewards for sharing this NFT on Telegram!");
      return;
    }
    
    const tier = getTier();
    const mintAddress = getMintAddress();
    const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
    
    // Create links with proper checks
    const solscanUrl = createSolscanUrl(mintAddress);
    const magicEdenUrl = createMagicEdenUrl(mintAddress);
    const tesolaUrl = `https://tesola.xyz/solara/${id}`;
    
    // Create message text
    const text = `I just minted SOLARA #${id} – ${tier} tier! 🚀\n\n` +
               `View on Solscan: ${solscanUrl}\n` +
               `View on Magic Eden: ${magicEdenUrl}\n` +
               `Visit: ${tesolaUrl}\n\n` +
               `Join our community: ${telegramCommunityUrl}\n\n` +
               `#SOLARA #NFT #Solana`;
    
    // 로딩 상태 시작
    setTelegramLoading(true);
    
    // Open Telegram
    window.open(`https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    
    // 사용자 확인
    const confirmed = window.confirm('Did you complete sharing on Telegram? Confirm to receive your TESOLA tokens.');
    
    if (confirmed) {
      try {
        // 지갑 주소 가져오기
        if (!window.solana || !window.solana.publicKey) {
          throw new Error('Please connect your wallet to receive rewards');
        }
        
        const walletAddress = window.solana.publicKey.toString();
        const nftId = String(id).padStart(4, "0");
        
        // API 호출하여 보상 기록
        const response = await fetch('/api/recordTweetReward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: walletAddress,
            reference_id: `nft_telegram_${nftId}`,
            reward_type: 'telegram_share',
            nft_id: nftId,
            mint_address: mintAddress || ''
          })
        });
        
        if (!response.ok) {
          throw new Error('Error processing Telegram reward');
        }
        
        // 보상 성공 메시지
        alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
        setIsTelegramRewarded(true);
        
        // 리워드 기록 새로고침
        const updatedRes = await fetch(`/api/getRewards?wallet=${walletAddress}`);
        if (updatedRes.ok) {
          const { rewardHistory: updatedHistory } = await updatedRes.json();
          setRewardHistory(updatedHistory || []);
        }
      } catch (error) {
        console.error('Telegram reward error:', error);
        alert(`Error: ${error.message}`);
      }
    }
    
    setTelegramLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-xl">Loading NFT info...</span>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-red-500 mb-4">Error Loading NFT</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => router.push("/")} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Return Home
          </button>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl mb-4">NFT Not Found</h2>
          <button 
            onClick={() => router.push("/")} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Return Home
          </button>
        </div>
      </Layout>
    );
  }

  // 필요한 데이터 추출
  const tier = getTier();
  const imageUrl = getImageUrl();
  const nftName = data?.name || `SOLARA #${id}`;
  const description = data?.description || `SOLARA NFT #${id} - ${tier} tier`;
  const tesolaUrl = `https://tesola.xyz/solara/${id}`;
  const mintAddress = getMintAddress();
  const solscanUrl = createSolscanUrl(mintAddress);
  const magicEdenUrl = createMagicEdenUrl(mintAddress);

  return (
    <Layout>
      {/* 소셜 미디어 공유를 위한 메타 태그 추가 */}
      <Head>
        <title>{nftName} | TESOLA</title>
        <meta name="description" content={description} />
        
        {/* OpenGraph 태그 */}
        <meta property="og:title" content={`${nftName} | TESOLA`} />
        <meta property="og:description" content={`${description}. Check out this amazing NFT!`} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={tesolaUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter 카드 태그 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${nftName} | TESOLA`} />
        <meta name="twitter:description" content={`${description}. Check out this amazing NFT!`} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30">
          <div className="p-6 md:p-8">
            <h1 className="text-4xl font-bold mb-4 neon-title">
              {nftName}
            </h1>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Image column */}
              <div className="md:w-1/2">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={nftName}
                    className="w-full rounded-lg border-2 border-purple-500 shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x400/3f1f5f/ffffff?text=SOLARA+NFT';
                      console.log('Image load error');
                    }}
                  />
                )}
              </div>
              
              {/* Details column */}
              <div className="md:w-1/2">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-purple-300 mb-2">Properties</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-900/30 rounded p-2 text-center">
                      <div className="text-gray-400 text-xs">Tier</div>
                      <div className="font-bold text-lg">{tier}</div>
                    </div>
                    
                    {data.attributes && data.attributes.map((attr, index) => {
                      if (attr.trait_type === "Tier" || attr.trait_type === "tier") return null;
                      return (
                        <div key={index} className="bg-purple-900/30 rounded p-2 text-center">
                          <div className="text-gray-400 text-xs">{attr.trait_type}</div>
                          <div className="font-bold truncate">{attr.value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Description */}
                {data.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-purple-300 mb-2">Description</h2>
                    <p className="text-gray-300">{data.description}</p>
                  </div>
                )}
                
                {/* Links - all types including tesola.xyz */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-purple-300 mb-2">Links</h2>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={tesolaUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:underline flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      TESOLA.xyz
                    </a>
                    
                    <a 
                      href={solscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Solscan
                    </a>
                    
                    <a 
                      href={magicEdenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Magic Eden
                    </a>
                  </div>
                </div>
                
                {/* Blockchain details */}
                {mintAddress && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-purple-300 mb-2">Token Details</h2>
                    <div className="font-mono text-sm text-gray-400 break-all">
                      {mintAddress}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-8 border-t border-gray-700 pt-6 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy share link
              </button>
              
              <button
                onClick={handleTweetShare}
                disabled={tweetLoading || isTweetRewarded}
                className={`mint-button inline-block ${isTweetRewarded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tweetLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Processing...
                  </>
                ) : isTweetRewarded ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Shared
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Tweet it!
                  </>
                )}
              </button>
              
              <button
                onClick={handleTelegramShare}
                disabled={telegramLoading || isTelegramRewarded}
                className={`telegram-button inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ${isTelegramRewarded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {telegramLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Processing...
                  </>
                ) : isTelegramRewarded ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Shared
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
                    </svg>
                    Share on Telegram
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}