import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// 중요: PublicKey를 반드시 가장 먼저 임포트하여 가용성 보장
import * as web3 from '@solana/web3.js';
const { PublicKey } = web3;
import { subscribeToStakeAccount, subscribeToUserStakingInfo, unsubscribe, unsubscribeAll } from '../../services/eventSubscriptionService';
import { isClient } from '../clientSideUtils';

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
  onStakeAccountUpdate = null
} = {}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [eventUpdates, setEventUpdates] = useState([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Handle stake account updates
  const handleStakeUpdate = useCallback((update) => {
    // Add the update to the event updates array
    setEventUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep only the last 20 updates
    
    // Call the custom handler if provided
    if (onStakeAccountUpdate && typeof onStakeAccountUpdate === 'function') {
      onStakeAccountUpdate(update);
    }
  }, [onStakeAccountUpdate]);
  
  // Handle user staking updates
  const handleUserStakingUpdate = useCallback((update) => {
    // Add the update to the event updates array
    setEventUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep only the last 20 updates
    
    // Call the custom handler if provided
    if (onUserStakingUpdate && typeof onUserStakingUpdate === 'function') {
      onUserStakingUpdate(update);
    }
  }, [onUserStakingUpdate]);
  
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
    clearEvents: () => setEventUpdates([])
  };
}