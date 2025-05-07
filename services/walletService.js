/**
 * Wallet Service
 * 
 * Provides an abstraction layer for wallet interactions and blockchain
 * operations. This service handles connecting to wallets, signing
 * transactions, and managing wallet state.
 */

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { api, endpoints } from './api';

/**
 * Truncate wallet address for display
 * 
 * @param {string} address - Wallet address
 * @param {number} start - Characters to show at start (default: 4)
 * @param {number} end - Characters to show at end (default: 4)
 * @returns {string} - Truncated address
 */
export function truncateAddress(address, start = 4, end = 4) {
  if (!address || address.length < (start + end)) {
    return address || '';
  }
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Validate a Solana wallet address
 * 
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - Whether the address is valid
 */
export function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Custom React hook for working with wallet
 * 
 * @returns {Object} - Enhanced wallet object with additional methods
 */
export function useEnhancedWallet() {
  const wallet = useWallet();
  
  /**
   * Sign and send a pre-built transaction
   * 
   * @param {Object} transaction - Transaction object
   * @returns {Promise<string>} - Transaction signature
   */
  const signAndSendTransaction = async (transaction) => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Convert to Transaction object if it's not already
      const txn = transaction instanceof Transaction 
        ? transaction 
        : Transaction.from(transaction);
      
      // Set recent blockhash if not already set
      if (!txn.recentBlockhash) {
        // This would typically use a connection object
        // For simplicity, we're assuming transaction already has this
        // or will be handled by the caller
      }
      
      // Sign the transaction
      const signedTx = await wallet.signTransaction(txn);
      
      // Send the transaction
      // This would typically use a connection object to sendRawTransaction
      // For simplicity, we're returning the signed transaction
      // The caller should handle sending it
      return signedTx;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  };
  
  /**
   * Get wallet's transaction history
   * 
   * @returns {Promise<Array>} - Transaction history
   */
  const getTransactionHistory = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await api.get(`${endpoints.transaction.getAll}?wallet=${wallet.publicKey.toString()}`);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw error;
    }
  };
  
  /**
   * Sign a message for verification
   * 
   * @param {string} message - Message to sign
   * @returns {Promise<Uint8Array>} - Signed message 
   */
  const signMessage = async (message) => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signMessage) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const messageBytes = new TextEncoder().encode(message);
      return await wallet.signMessage(messageBytes);
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  };
  
  /**
   * Get all wallets in storage with connection info
   * 
   * @returns {Array} - Array of previously connected wallets
   */
  const getPreviouslyConnectedWallets = () => {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      const walletKey = 'walletConnectionHistory';
      const storedWallets = localStorage.getItem(walletKey);
      
      if (!storedWallets) {
        return [];
      }
      
      return JSON.parse(storedWallets);
    } catch (error) {
      console.error('Failed to get wallet history:', error);
      return [];
    }
  };
  
  /**
   * Store current wallet in connection history
   */
  const storeWalletConnection = () => {
    if (!wallet.connected || !wallet.publicKey || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const walletKey = 'walletConnectionHistory';
      const walletAddress = wallet.publicKey.toString();
      const walletName = wallet.wallet?.adapter?.name || 'Unknown Wallet';
      
      const walletsHistory = getPreviouslyConnectedWallets();
      
      // Check if wallet already exists in history
      const existingIndex = walletsHistory.findIndex(w => w.address === walletAddress);
      
      if (existingIndex >= 0) {
        // Update existing entry
        walletsHistory[existingIndex].lastConnected = Date.now();
        walletsHistory[existingIndex].name = walletName;
      } else {
        // Add new entry
        walletsHistory.push({
          address: walletAddress,
          name: walletName,
          lastConnected: Date.now()
        });
      }
      
      // Store updated history
      localStorage.setItem(walletKey, JSON.stringify(walletsHistory));
    } catch (error) {
      console.error('Failed to store wallet connection:', error);
    }
  };
  
  // Enhanced wallet object
  return {
    ...wallet,
    truncatedAddress: wallet.publicKey ? truncateAddress(wallet.publicKey.toString()) : '',
    signAndSendTransaction,
    getTransactionHistory,
    signMessage,
    getPreviouslyConnectedWallets,
    storeWalletConnection,
    isValidAddress: isValidSolanaAddress
  };
}

/**
 * Get account SOL balance
 * 
 * @param {string} address - Wallet address
 * @returns {Promise<number>} - SOL balance
 */
export async function getSolBalance(address) {
  // This would typically use a Solana web3 connection object
  // For simplicity, we're mocking this with an API call
  try {
    const response = await api.get(`/api/getBalance?wallet=${address}`);
    return response.balance;
  } catch (error) {
    console.error('Failed to get SOL balance:', error);
    throw error;
  }
}

export default {
  truncateAddress,
  isValidSolanaAddress,
  useEnhancedWallet,
  getSolBalance
};