/**
 * 중앙화된 리워드 시스템 유틸리티
 * 여러 컴포넌트에서 사용되는 리워드 관련 함수들을 통합
 */

// 기본 리워드 금액 설정 (환경 변수에서 가져오거나 기본값 사용)
export const SHARE_REWARD_AMOUNT = parseInt(process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5');

/**
 * 특정 트랜잭션에 대한 리워드 중복 여부 확인
 * 
 * @param {Array} rewardHistory - 사용자의 리워드 히스토리 배열
 * @param {string} reference - 참조 ID (트랜잭션 서명이나 NFT ID)
 * @param {string} rewardType - 리워드 타입 (tweet, mint_tweet, telegram_share 등)
 * @returns {boolean} - 이미 리워드를 받았는지 여부
 */
export function hasReceivedReward(rewardHistory, reference, rewardType) {
  if (!rewardHistory || !rewardHistory.length) {
    return false;
  }
  
  // 참조 ID가 다양한 형식일 수 있으므로 여러 가지 형태 검사
  const relatedRewards = rewardHistory.filter(reward => {
    // 정확한 참조 ID 일치
    const exactMatch = reward.reference_id === reference || reward.tx_signature === reference;
    
    // 접두사가 있는 경우 (mint_ID 패턴 등)
    const prefixMatch = 
      reward.reference_id && 
      (reward.reference_id.includes(`mint_${reference}`) || 
       reference.includes(`mint_${reward.reference_id}`) ||
       reward.reference_id.includes(`nft_${reference}`) || 
       reference.includes(`nft_${reward.reference_id}`));
    
    return exactMatch || prefixMatch;
  });
  
  if (relatedRewards.length === 0) {
    return false;
  }
  
  // 리워드 타입 확인
  if (rewardType === 'tweet') {
    // 트윗의 경우 모든 트윗 관련 리워드 확인
    return relatedRewards.some(reward => 
      reward.reward_type === 'tweet' || reward.reward_type === 'mint_tweet'
    );
  }
  
  // 그 외 타입 (텔레그램, 일반 등)
  return relatedRewards.some(reward => reward.reward_type === rewardType);
}

/**
 * 특정 NFT ID에 대한 리워드 상태 확인
 * 
 * @param {Array} rewardHistory - 사용자의 리워드 히스토리 배열
 * @param {string} nftId - NFT ID
 * @returns {Object} - 각 플랫폼별 리워드 받은 상태 객체
 */
export function checkNftRewardStatus(rewardHistory, nftId) {
  if (!rewardHistory || !rewardHistory.length || !nftId) {
    return {
      tweet: false,
      mintTweet: false,
      telegram: false
    };
  }
  
  // 정규화된 NFT ID
  const normalizedId = String(nftId).padStart(4, '0');
  
  // 각 플랫폼별 리워드 상태 확인
  const tweetRewarded = rewardHistory.some(reward => 
    reward.reference_id === `nft_tweet_${normalizedId}` && reward.reward_type === 'tweet'
  );
  
  const mintTweetRewarded = rewardHistory.some(reward => 
    reward.reference_id === `mint_${normalizedId}` && reward.reward_type === 'mint_tweet'
  );
  
  const telegramRewarded = rewardHistory.some(reward => 
    reward.reference_id === `nft_telegram_${normalizedId}` && reward.reward_type === 'telegram_share'
  );
  
  return {
    tweet: tweetRewarded,
    mintTweet: mintTweetRewarded,
    telegram: telegramRewarded
  };
}

/**
 * 공유 URL 생성 함수
 * 
 * @param {string} platform - 공유 플랫폼 (twitter, telegram)
 * @param {Object} data - 공유할 데이터 (nftId, tier, mintAddress, txSignature 등)
 * @returns {string} - 공유 URL
 */
export function createShareUrl(platform, data) {
  const { nftId, tier, mintAddress, txSignature } = data || {};
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  
  // 블록체인 Explorer URL 생성
  const solscanUrl = mintAddress 
    ? `https://solscan.io/token/${mintAddress}?cluster=${network}`
    : txSignature 
      ? `https://solscan.io/tx/${txSignature}?cluster=${network}`
      : `https://solscan.io/address/${process.env.NEXT_PUBLIC_COLLECTION_MINT || ''}?cluster=${network}`;
  
  // Magic Eden URL 생성
  const magicEdenUrl = mintAddress
    ? `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`
    : `https://magiceden.io/marketplace/slr?cluster=${network}`;
  
  // Tesola 사이트 URL
  const tesolaUrl = nftId
    ? `https://tesola.xyz/solara/${nftId}`
    : `https://tesola.xyz`;
  
  // 텔레그램 커뮤니티 URL
  const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
  
  // 공유 텍스트 생성
  let shareText;
  if (nftId && tier) {
    // NFT 정보가 있는 경우
    shareText = `I just minted SOLARA #${nftId} – ${tier} tier! 🚀\n\n` +
              `View on Solscan: ${solscanUrl}\n` +
              `View on Magic Eden: ${magicEdenUrl}\n` +
              `Visit: ${tesolaUrl}\n\n`;
  } else {
    // 일반 트랜잭션 공유
    shareText = `Check out my SOLARA transaction! 🚀\n\n` +
              `View on Solscan: ${solscanUrl}\n` +
              `Visit: ${tesolaUrl}\n\n`;
  }
  
  // 태그 추가
  shareText += `#SOLARA #NFT #Solana`;
  
  // 플랫폼별 URL 생성
  if (platform === 'twitter') {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  } else if (platform === 'telegram') {
    // 텔레그램은 커뮤니티 링크도 추가
    const telegramText = shareText + `\n\nJoin our community: ${telegramCommunityUrl}`;
    return `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${encodeURIComponent(telegramText)}`;
  }
  
  // 기본 응답
  return null;
}

/**
 * 리워드 청구 처리 함수
 * 
 * @param {string} walletAddress - 사용자 지갑 주소
 * @returns {Promise<Object>} - 청구 결과
 */
export async function claimRewards(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  
  try {
    const response = await fetch('/api/claimRewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet: walletAddress
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to claim rewards');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
}

/**
 * 리워드 기록 처리 함수
 * 
 * @param {string} walletAddress - 사용자 지갑 주소
 * @param {string} referenceId - 참조 ID
 * @param {string} rewardType - 리워드 타입
 * @param {Object} additionalData - 추가 데이터
 * @returns {Promise<Object>} - 리워드 기록 결과
 */
export async function recordReward(walletAddress, referenceId, rewardType, additionalData = {}) {
  if (!walletAddress || !referenceId || !rewardType) {
    throw new Error('Missing required parameters: wallet, referenceId, and rewardType are required');
  }
  
  try {
    const response = await fetch('/api/recordTweetReward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet: walletAddress,
        reference_id: referenceId,
        reward_type: rewardType,
        ...additionalData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error processing ${rewardType} reward`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error recording ${rewardType} reward:`, error);
    throw error;
  }
}