/**
 * Token Account Reinitialization API Endpoint
 * Creates a transaction to reinitialize improperly initialized token accounts
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createSerializedTransaction, createTokenAccountInstruction, createApiResponse } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * Token Account Reinitialization API Handler
 */
export default async function handler(req, res) {
  // Check POST method
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    // Extract request parameters
    const { wallet, mintAddress } = req.body;

    // Validate required parameters
    if (!wallet || !mintAddress) {
      return res.status(400).json(
        createApiResponse(false, 'Wallet address and mint address are required parameters', null, 'MissingParameters')
      );
    }

    // Convert and validate PublicKeys
    let walletPubkey, mintPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, 'Invalid address format', null, err)
      );
    }

    console.log('Token account reinitialization request received:', { wallet, mintAddress });

    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // Get user token account address
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );

    // Check current account state
    const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
    const accountExists = !!userTokenAccountInfo;
    const accountInitialized = accountExists && userTokenAccountInfo.data.length >= 165;

    console.log('Token account status:', {
      address: userTokenAccount.toString(),
      exists: accountExists,
      initialized: accountInitialized,
      dataLength: accountExists ? userTokenAccountInfo.data.length : 0
    });

    // Create reinitialization instruction
    const createTokenAccountIx = await createTokenAccountInstruction(
      walletPubkey,
      mintPubkey
    );

    // Get recent blockhash
    console.log('Getting recent blockhash...');
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;

    // Create and serialize transaction
    const serializedTx = createSerializedTransaction(
      [createTokenAccountIx],
      walletPubkey,
      blockhash,
      lastValidBlockHeight
    );

    // Prepare response object
    const response = {
      wallet,
      mintAddress,
      userTokenAccount: userTokenAccount.toString(),
      accountExists,
      accountInitialized,
      dataLength: accountExists ? userTokenAccountInfo.data.length : 0,
      transactionBase64: serializedTx,
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(Date.now() + 120000).toISOString()
    };

    // Return response
    return res.status(200).json(
      createApiResponse(true, 'Token account reinitialization transaction prepared', response)
    );
  } catch (error) {
    console.error('Error preparing token account reinitialization transaction:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to prepare token account reinitialization transaction', null, error)
    );
  }
}