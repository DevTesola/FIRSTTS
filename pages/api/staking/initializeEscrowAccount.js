/**
 * Escrow Token Account Initialization API endpoint
 * This endpoint specifically handles the initialization of Escrow token accounts
 * before staking to ensure they are properly initialized on-chain.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import { createApiResponse } from '../../../shared';
import { findEscrowAuthorityPDA } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * API handler for escrow token account initialization
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
    
    console.log('Escrow token account initialization request received:', { wallet, mintAddress });
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Generate escrow authority PDA
    const [escrowAuthorityPDA] = findEscrowAuthorityPDA(mintPubkey);
    console.log('Escrow authority PDA:', escrowAuthorityPDA.toString());
    
    // Get escrow token account address
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true // allow owner off curve
    );
    console.log('Escrow token account:', escrowTokenAccount.toString());
    
    // Check if escrow token account already exists
    const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
    const escrowAccountExists = !!escrowAccountInfo;
    
    console.log('Escrow token account exists:', escrowAccountExists);
    
    // If account already exists, return success immediately
    if (escrowAccountExists) {
      return res.status(200).json(
        createApiResponse(true, 'Escrow token account is already initialized', {
          escrowTokenAccount: escrowTokenAccount.toString(),
          escrowAuthority: escrowAuthorityPDA.toString(),
          needsInitialization: false
        })
      );
    }
    
    // Otherwise, create initialization transaction
    console.log('Creating escrow token account initialization transaction');
    
    // Create escrow token account initialization instruction
    const createEscrowTokenAccountIx = createAssociatedTokenAccountInstruction(
      walletPubkey,  // payer
      escrowTokenAccount, // associated token account
      escrowAuthorityPDA, // owner
      mintPubkey // mint
    );
    
    // Get recent blockhash
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    
    // Create transaction with just the initialization instruction
    const transaction = new Transaction();
    transaction.add(createEscrowTokenAccountIx);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    
    // Serialize transaction for client signing
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    
    // Create response object
    const response = {
      wallet,
      mintAddress,
      escrowTokenAccount: escrowTokenAccount.toString(),
      escrowAuthority: escrowAuthorityPDA.toString(),
      needsInitialization: true,
      transactionBase64: Buffer.from(serializedTx).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(Date.now() + 120000).toISOString() // 2 minute expiry
    };
    
    // Return success response
    return res.status(200).json(
      createApiResponse(true, 'Escrow token account initialization transaction prepared', response)
    );
  } catch (error) {
    console.error('Escrow token account initialization error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to prepare escrow token account initialization', null, error)
    );
  }
}