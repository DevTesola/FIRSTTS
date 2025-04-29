"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createShareUrl, hasReceivedReward, recordReward } from '../utils/rewards';

/**
 * 통합된 공유 버튼 컴포넌트
 * 여러 컴포넌트에서 중복되던 공유 기능을 하나로 통합
 * 
 * @param {string} platform - 공유 플랫폼 (twitter, telegram)
 * @param {Object} data - 공유할 데이터 (nftId, tier, mintAddress, txSignature 등)
 * @param {Array} rewardHistory - 유저의 리워드 히스토리
 * @param {string} rewardType - 리워드 타입 (tweet, mint_tweet, telegram_share 등)
 * @param {string} referenceId - 리워드 참조 ID
 * @param {function} onSuccess - 성공 시 콜백
 * @param {function} onError - 에러 시 콜백
 * @param {string} className - 추가 CSS 클래스
 * @param {Object} buttonProps - 버튼에 전달할 추가 속성
 */
export default function ShareButton({ 
  platform = 'twitter',
  data,
  rewardHistory = [],
  rewardType,
  referenceId,
  onSuccess,
  onError,
  className = "",
  buttonProps = {},
}) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  
  // 이미 리워드를 받았는지 확인
  const alreadyRewarded = hasReceivedReward(rewardHistory, referenceId, rewardType);
  
  // 플랫폼별 UI 요소 설정
  const platformConfig = {
    twitter: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
      text: 'Tweet',
      loadingText: 'Sharing...',
      sharedText: 'Shared',
      defaultClass: 'bg-blue-500 hover:bg-blue-600',
      disabledClass: 'bg-gray-500 cursor-not-allowed',
    },
    telegram: {
      icon: (
        <svg className="h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
        </svg>
      ),
      text: 'Telegram',
      loadingText: 'Sharing...',
      sharedText: 'Shared',
      defaultClass: 'bg-sky-500 hover:bg-sky-600',
      disabledClass: 'bg-gray-500 cursor-not-allowed',
    }
  };
  
  // 현재 플랫폼 설정 가져오기
  const config = platformConfig[platform] || platformConfig.twitter;
  
  const handleShare = async () => {
    // 지갑 연결 확인
    if (!connected || !publicKey) {
      alert("Please connect your wallet to receive rewards");
      return;
    }
    
    // 이미 보상을 받았는지 확인
    if (alreadyRewarded) {
      alert(`You've already received rewards for sharing this content on ${platform}!`);
      return;
    }
    
    setLoading(true);
    
    try {
      const walletAddress = publicKey.toString();
      
      // 공유 URL 생성
      const shareUrl = createShareUrl(platform, data);
      if (!shareUrl) {
        throw new Error(`Failed to create share URL for ${platform}`);
      }
      
      // 사용자 안내
      alert(`Please share on ${platform} and then return to this window for your reward.`);
      
      // 공유 창 열기
      const shareWindow = window.open(shareUrl, '_blank');
      
      // 팝업 차단 확인
      if (!shareWindow || shareWindow.closed || typeof shareWindow.closed === 'undefined') {
        alert(`Please allow popups to open ${platform} and earn rewards.`);
        setLoading(false);
        return;
      }
      
      // 사용자가 공유를 완료할 시간을 주기 위한 지연
      setTimeout(async () => {
        // 확인 대화상자
        const confirmed = window.confirm(`Did you complete sharing on ${platform}? Confirm to receive your TESOLA tokens.`);
        
        if (confirmed) {
          try {
            // 디버깅 로그
            console.log(`Sending ${platform} reward request:`, {
              wallet: walletAddress,
              reference_id: referenceId,
              reward_type: rewardType,
              ...data
            });
            
            // 보상 기록 API 호출
            const result = await recordReward(
              walletAddress, 
              referenceId,
              rewardType,
              data
            );
            
            // 성공 메시지
            alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
            
            // 성공 콜백 호출
            if (onSuccess) {
              onSuccess(result);
            }
          } catch (error) {
            console.error(`${platform} reward error:`, error);
            alert(`Error: ${error.message}`);
            
            // 에러 콜백 호출
            if (onError) {
              onError(error);
            }
          }
        }
        
        setLoading(false);
      }, 5000); // 5초 지연
    } catch (error) {
      console.error(`Error in ${platform} share process:`, error);
      alert(`Error: ${error.message}`);
      setLoading(false);
      
      // 에러 콜백 호출
      if (onError) {
        onError(error);
      }
    }
  };
  
  // 버튼 스타일 클래스 결정
  const buttonClass = alreadyRewarded ? config.disabledClass : config.defaultClass;
  
  return (
    <button 
      onClick={handleShare}
      disabled={loading || alreadyRewarded}
      className={`px-2 py-1 rounded text-xs text-white transition-colors flex items-center justify-center ${buttonClass} ${className}`}
      aria-label={`Share on ${platform}`}
      {...buttonProps}
    >
      {loading ? (
        <>
          <span className="animate-spin mr-2">⟳</span> {config.loadingText}
        </>
      ) : alreadyRewarded ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {config.sharedText}
        </>
      ) : (
        <>
          {config.icon}
          {`${config.text} +5`}
        </>
      )}
    </button>
  );
}