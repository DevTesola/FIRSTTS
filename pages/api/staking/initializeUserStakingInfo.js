/**
 * User Staking Info Initialization API endpoint
 * This endpoint specifically handles the initialization of User Staking Info account
 * before staking to ensure it is properly initialized on-chain.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createApiResponse } from '../../../shared';
import { findUserStakingInfoPDA, createInitUserStakingInfoInstruction } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * API handler for user staking info initialization
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    // Extract parameters from request body
    const { wallet } = req.body;
    
    // Validate required parameters
    if (!wallet) {
      return res.status(400).json(
        createApiResponse(false, 'Wallet address is required', null, 'MissingParameters')
      );
    }
    
    // Convert string address to PublicKey object
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, 'Invalid wallet address format', null, err)
      );
    }
    
    console.log('User staking info initialization request received:', { wallet });
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Generate user staking info PDA
    const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
    console.log('User staking info PDA:', userStakingInfoPDA.toString());
    
    // Check if user staking info account already exists
    const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
    const userStakingInfoExists = !!userStakingInfoAccount;
    
    console.log('User staking info account exists:', userStakingInfoExists);
    
    // If account already exists, return success immediately
    if (userStakingInfoExists) {
      return res.status(200).json(
        createApiResponse(true, 'User staking info account is already initialized', {
          userStakingInfo: userStakingInfoPDA.toString(),
          needsInitialization: false
        })
      );
    }
    
    // Otherwise, create initialization transaction
    console.log('Creating user staking info initialization transaction');
    
    // Create user staking info initialization instruction
    const initUserStakingInfoIx = createInitUserStakingInfoInstruction(
      walletPubkey,
      userStakingInfoPDA
    );
    
    // Get recent blockhash
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    
    // Create transaction with just the initialization instruction
    const transaction = new Transaction();
    transaction.add(initUserStakingInfoIx);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    
    // Serialize transaction for client signing
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    
    // Create response object
    const response = {
      wallet,
      userStakingInfo: userStakingInfoPDA.toString(),
      needsInitialization: true,
      transactionBase64: Buffer.from(serializedTx).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(Date.now() + 120000).toISOString() // 2 minute expiry
    };
    
    // Return success response
    return res.status(200).json(
      createApiResponse(true, 'User staking info initialization transaction prepared', response)
    );
  } catch (error) {
    console.error('User staking info initialization error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to prepare user staking info initialization', null, error)
    );
  }
}