import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// 중요: PublicKey를 반드시 가장 먼저 임포트하여 가용성 보장
import * as web3 from '@solana/web3.js';
const { PublicKey } = web3;
import { subscribeToStakeAccount, subscribeToUserStakingInfo, unsubscribe, unsubscribeAll } from '../../services/eventSubscriptionService';
import { isClient } from '../clientSideUtils';

/**
 * 디바운스 유틸리티 함수
 * 짧은 시간 내에 여러 번 호출되는 함수를 제한하여 성능 최적화
 * 
 * @param {Function} fn - 디바운스할 함수
 * @param {number} delay - 디바운스 지연 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * React hook for subscribing to staking events
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoSubscribeUserAccount - Whether to automatically subscribe to user staking account
 * @param {string[]} options.nftMintAddresses - Array of NFT mint addresses to subscribe to
 * @param {function} options.onUserStakingUpdate - Callback for user staking info updates
 * @param {function} options.onStakeAccountUpdate - Callback for stake account updates
 * @returns {Object} Subscriptions manager
 */
export default function useStakingEvents({
  autoSubscribeUserAccount = true,
  nftMintAddresses = [],
  onUserStakingUpdate = null,
  onStakeAccountUpdate = null,
  debounceDelay = 300, // 디바운스 지연 시간(ms)
  batchUpdates = true  // 업데이트 배치 처리 여부
} = {}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [eventUpdates, setEventUpdates] = useState([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // 업데이트 배치 처리를 위한 참조
  const pendingUpdates = useRef({ stake: {}, user: null });
  const batchTimeoutRef = useRef(null);
  
  // 배치 처리를 위한 함수 - 일정 시간 동안 모인 업데이트를 한 번에 처리
  const processBatchUpdates = useCallback(() => {
    const { stake, user } = pendingUpdates.current;
    
    // 스테이킹 업데이트 처리
    const stakeUpdates = Object.values(stake);
    if (stakeUpdates.length > 0) {
      // 기록 이벤트 업데이트
      setEventUpdates(prev => [
        ...stakeUpdates,
        ...prev.slice(0, Math.max(0, 20 - stakeUpdates.length))
      ]);
      
      // 개별 콜백 호출
      if (onStakeAccountUpdate && typeof onStakeAccountUpdate === 'function') {
        // 가장 최근 업데이트를 전달
        stakeUpdates.forEach(update => onStakeAccountUpdate(update));
      }
    }
    
    // 유저 업데이트 처리
    if (user) {
      // 기록 이벤트 업데이트
      setEventUpdates(prev => [user, ...prev.slice(0, 19)]);
      
      // 개별 콜백 호출
      if (onUserStakingUpdate && typeof onUserStakingUpdate === 'function') {
        onUserStakingUpdate(user);
      }
    }
    
    // 대기 중인 업데이트 초기화
    pendingUpdates.current = { stake: {}, user: null };
    batchTimeoutRef.current = null;
  }, [onStakeAccountUpdate, onUserStakingUpdate]);
  
  // 디바운스된 배치 처리 함수 생성
  const debouncedProcessBatch = useCallback(
    debounce(() => processBatchUpdates(), debounceDelay), 
    [processBatchUpdates, debounceDelay]
  );
  
  // Handle stake account updates
  const handleStakeUpdate = useCallback((update) => {
    if (batchUpdates) {
      // 배치 처리 모드: 업데이트 수집
      // 민트 주소로 인덱싱하여 중복 업데이트 방지
      pendingUpdates.current.stake[update.mintAddress] = update;
      
      // 배치 처리 예약
      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(debouncedProcessBatch, debounceDelay);
      }
    } else {
      // 즉시 처리 모드
      setEventUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep only the last 20 updates
      
      // Call the custom handler if provided
      if (onStakeAccountUpdate && typeof onStakeAccountUpdate === 'function') {
        onStakeAccountUpdate(update);
      }
    }
  }, [onStakeAccountUpdate, batchUpdates, debouncedProcessBatch, debounceDelay]);
  
  // Handle user staking updates
  const handleUserStakingUpdate = useCallback((update) => {
    if (batchUpdates) {
      // 배치 처리 모드: 마지막 업데이트만 유지
      pendingUpdates.current.user = update;
      
      // 배치 처리 예약
      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(debouncedProcessBatch, debounceDelay);
      }
    } else {
      // 즉시 처리 모드
      setEventUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep only the last 20 updates
      
      // Call the custom handler if provided
      if (onUserStakingUpdate && typeof onUserStakingUpdate === 'function') {
        onUserStakingUpdate(update);
      }
    }
  }, [onUserStakingUpdate, batchUpdates, debouncedProcessBatch, debounceDelay]);
  
  // Subscribe to user staking account
  const subscribeToUser = useCallback(() => {
    if (!isClient || !connection || !publicKey) return null;
    
    try {
      setIsSubscribing(true);
      
      const subscriptionKey = `user_${publicKey.toString()}`;
      const id = subscribeToUserStakingInfo(
        connection,
        publicKey.toString(),
        handleUserStakingUpdate
      );
      
      if (id) {
        setActiveSubscriptions(prev => [...prev, { key: subscriptionKey, id, type: 'user_staking' }]);
        return subscriptionKey;
      }
      
      return null;
    } catch (error) {
      console.error('Error subscribing to user staking:', error);
      return null;
    } finally {
      setIsSubscribing(false);
    }
  }, [connection, publicKey, handleUserStakingUpdate]);
  
  // Subscribe to NFT stake account
  const subscribeToNFT = useCallback((mintAddress) => {
    if (!isClient || !connection || !mintAddress) return null;
    
    try {
      setIsSubscribing(true);
      
      // Validate mint address
      let publicKeyObj;
      try {
        publicKeyObj = new PublicKey(mintAddress);
      } catch (e) {
        console.error('Invalid mint address:', mintAddress);
        return null;
      }
      
      const subscriptionKey = mintAddress;
      const id = subscribeToStakeAccount(
        connection,
        mintAddress,
        handleStakeUpdate
      );
      
      if (id) {
        setActiveSubscriptions(prev => [...prev, { key: subscriptionKey, id, type: 'stake_account' }]);
        return subscriptionKey;
      }
      
      return null;
    } catch (error) {
      console.error('Error subscribing to NFT stake account:', error);
      return null;
    } finally {
      setIsSubscribing(false);
    }
  }, [connection, handleStakeUpdate]);
  
  // Unsubscribe from a specific subscription
  const unsubscribeByKey = useCallback((subscriptionKey) => {
    if (!isClient || !connection) return false;
    
    try {
      const result = unsubscribe(subscriptionKey, connection);
      if (result) {
        setActiveSubscriptions(prev => prev.filter(sub => sub.key !== subscriptionKey));
      }
      return result;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [connection]);
  
  // Subscribe to multiple NFTs
  const subscribeToMultipleNFTs = useCallback((mintAddresses) => {
    if (!Array.isArray(mintAddresses) || mintAddresses.length === 0) return [];
    
    const newSubscriptions = [];
    for (const mintAddress of mintAddresses) {
      const key = subscribeToNFT(mintAddress);
      if (key) newSubscriptions.push(key);
    }
    
    return newSubscriptions;
  }, [subscribeToNFT]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // 배치 처리 타이머 정리
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
      
      // 대기 중인 업데이트 정리
      pendingUpdates.current = { stake: {}, user: null };
      
      // 웹소켓 구독 해제
      if (isClient && connection) {
        for (const subscription of activeSubscriptions) {
          unsubscribe(subscription.key, connection);
        }
      }
    };
  }, [connection, activeSubscriptions]);
  
  // Auto-subscribe to user staking account when wallet connects
  useEffect(() => {
    if (autoSubscribeUserAccount && publicKey && connection) {
      subscribeToUser();
    }
  }, [autoSubscribeUserAccount, publicKey, connection, subscribeToUser]);
  
  // Auto-subscribe to provided NFT mint addresses
  useEffect(() => {
    if (nftMintAddresses.length > 0 && connection) {
      subscribeToMultipleNFTs(nftMintAddresses);
    }
  }, [nftMintAddresses, connection, subscribeToMultipleNFTs]);
  
  return {
    // Subscription management
    subscribeToUser,
    subscribeToNFT,
    subscribeToMultipleNFTs,
    unsubscribe: unsubscribeByKey,
    activeSubscriptions,
    isSubscribing,
    
    // Event data
    eventUpdates,
    clearEvents: () => setEventUpdates([]),
    
    // 성능 최적화 옵션
    flushUpdates: processBatchUpdates, // 즉시 모든 대기 중인 업데이트 처리
    setDebounceDelay: (newDelay) => {
      // 사용자가 필요에 따라 디바운스 지연 시간 조정 가능
      if (typeof newDelay === 'number' && newDelay >= 0) {
        return newDelay;
      }
      return debounceDelay;
    },
    toggleBatchUpdates: (enabled) => {
      // 배치 처리 활성화/비활성화
      return typeof enabled === 'boolean' ? enabled : batchUpdates;
    }
  };
}