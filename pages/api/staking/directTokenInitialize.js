/**
 * Direct Token Account Initialization API
 * For handling edge cases where standard ATA initialization fails
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { createApiResponse } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    // Extract parameters from request body
    const { wallet, mintAddress, forceRecreate } = req.body;
    
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
    
    console.log('Direct token account initialization request received:', { wallet, mintAddress, forceRecreate });
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Get user token account address
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey,
      false // allowOwnerOffCurve = false
    );
    
    console.log('User token account address:', userTokenAccount.toString());
    
    // Create new transaction
    const transaction = new Transaction();
    
    // Using enhanced token account validation for advanced diagnostics
    const { validateTokenAccount, checkReinitializationNeeded } = require('../../../shared/utils/token-validator');

    // Perform comprehensive token account validation
    console.log('Performing comprehensive token account validation...');
    const validationResult = await validateTokenAccount(connection, walletPubkey, mintPubkey);

    // Determine if the account needs recreation based on validation results and forceRecreate flag
    const reinitInfo = checkReinitializationNeeded(validationResult);
    const accountExists = validationResult.accountExists;

    // Determine if forced recreation is needed (either explicit or due to validation)
    const needsRecreation = forceRecreate ||
      (reinitInfo.needsInitialization && accountExists);

    console.log('Token account validation result:', {
      isValid: validationResult.isValid,
      accountExists,
      reason: reinitInfo.reason,
      needsRecreation,
      forceRecreate,
      diagnosticSummary: {
        hasProperSize: validationResult.hasProperSize,
        hasCorrectOwner: validationResult.hasCorrectOwner,
        hasCorrectMint: validationResult.hasCorrectMint,
        hasSufficientBalance: validationResult.hasSufficientBalance
      }
    });
    
    // For account recreation, we use a special approach
    if (needsRecreation && accountExists) {
      console.log('Will attempt recreation of token account');
      
      // We cannot easily close an existing account, so instead we'll try 
      // to reinitialize it with proper parameters
      
      // Create a fresh ATA instruction - this will fail if the account exists,
      // but we include it for when we might need to handle complete recreation
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletPubkey,         // payer
          userTokenAccount,     // associatedToken
          walletPubkey,         // owner
          mintPubkey            // mint
        )
      );
    } else if (!accountExists) {
      // Normal ATA creation if account doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletPubkey,         // payer
          userTokenAccount,     // associatedToken
          walletPubkey,         // owner
          mintPubkey            // mint
        )
      );
    } else {
      console.log('Account exists and appears valid, sending empty transaction for validation only');
      // Send an empty transaction just to verify account is usable
    }
    
    // Get recent blockhash
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    
    // Configure transaction
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    
    // Serialize transaction for client signing
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    
    // Create response object with detailed diagnostic info
    const response = {
      wallet,
      mintAddress,
      userTokenAccount: userTokenAccount.toString(),
      accountExists,
      needsRecreation,
      transactionBase64: Buffer.from(serializedTx).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(Date.now() + 120000).toISOString(), // 2 minute expiry
      diagnosticInfo: {
        tokenProgramId: TOKEN_PROGRAM_ID.toString(),
        accountExists,
        accountSize: accountExists ? userTokenAccountInfo.data.length : 0,
        accountOwner: accountExists ? userTokenAccountInfo.owner.toString() : null,
        isOwnerTokenProgram: accountExists ? 
          userTokenAccountInfo.owner.equals(TOKEN_PROGRAM_ID) : false
      }
    };
    
    // Return success response
    return res.status(200).json(
      createApiResponse(true, 'Direct token account initialization prepared', response)
    );
  } catch (error) {
    console.error('Direct token account initialization error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to prepare token account initialization', null, error)
    );
  }
}