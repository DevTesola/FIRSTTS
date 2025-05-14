/**
 * Token Account Initialization API endpoint
 * This endpoint specifically handles the initialization of token accounts
 * before staking to ensure they are properly initialized on-chain.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createSerializedTransaction, createTokenAccountInstruction, createApiResponse } from '../../../shared';
import { validateTokenAccount, checkReinitializationNeeded } from '../../../shared/utils/token-validator';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * API handler for token account initialization
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
    const { wallet, mintAddress } = req.body;
    
    // Validate required parameters
    if (!wallet || !mintAddress) {
      return res.status(400).json(
        createApiResponse(false, 'Wallet address and mint address are required parameters', null, 'MissingParameters')
      );
    }
    
    // Convert string addresses to PublicKey objects
    let walletPubkey, mintPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, 'Invalid address format', null, err)
      );
    }
    
    console.log('Token account initialization request received:', { wallet, mintAddress });
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Get user token account address
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    // Perform comprehensive token account validation
    console.log('Performing comprehensive token account validation...');
    const validationResult = await validateTokenAccount(connection, walletPubkey, mintPubkey);

    // Determine if the account needs initialization based on validation results
    const reinitInfo = checkReinitializationNeeded(validationResult);
    const needsInitialization = reinitInfo.needsInitialization;

    console.log('Token account validation result:', {
      isValid: validationResult.isValid,
      needsInitialization,
      reason: reinitInfo.reason,
      message: reinitInfo.message
    });
    
    // If initialization is not needed, return success immediately
    if (!needsInitialization) {
      return res.status(200).json(
        createApiResponse(true, 'Token account is already properly initialized', {
          userTokenAccount: userTokenAccount.toString(),
          needsInitialization: false
        })
      );
    }
    
    // Otherwise, create initialization transaction
    console.log('Creating token account initialization transaction');
    
    // Create token account initialization instruction
    const createTokenAccountIx = await createTokenAccountInstruction(
      walletPubkey,
      mintPubkey
    );
    
    // Get recent blockhash
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    
    // Create transaction with just the initialization instruction
    const transaction = new Transaction();
    transaction.add(createTokenAccountIx);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    
    // Serialize transaction for client signing
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    
    // Create response object
    const response = {
      wallet,
      mintAddress,
      userTokenAccount: userTokenAccount.toString(),
      needsInitialization: true,
      transactionBase64: Buffer.from(serializedTx).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(Date.now() + 120000).toISOString(), // 2 minute expiry
      diagnosticInfo: {
        accountExists: validationResult.accountExists,
        hasToken: validationResult.hasToken,
        hasCorrectOwner: validationResult.hasCorrectOwner,
        hasCorrectMint: validationResult.hasCorrectMint,
        validationDetails: validationResult.diagnosticInfo
      }
    };
    
    // Return success response
    return res.status(200).json(
      createApiResponse(true, 'Token account initialization transaction prepared', response)
    );
  } catch (error) {
    console.error('Token account initialization error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to prepare token account initialization', null, error)
    );
  }
}