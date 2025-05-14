/**
 * API endpoint for submitting signed transactions to the blockchain
 * Used for token account initialization and other operations
 */

import { Connection, Transaction } from '@solana/web3.js';
import { createApiResponse } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * Transaction submission handler
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    // Extract parameters from request
    const { transaction, type } = req.body;
    
    // Validate parameters
    if (!transaction) {
      return res.status(400).json(
        createApiResponse(false, 'Missing required parameters', null, 'MissingParameters')
      );
    }
    
    // Parse transaction type (for logging)
    const transactionType = type || 'unknown';
    console.log(`Submitting ${transactionType} transaction`);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Decode transaction
    const transactionBuffer = Buffer.from(transaction, 'base64');
    const tx = Transaction.from(transactionBuffer);
    
    // Submit transaction - IDL 업데이트로 인해 skipPreflight가 더 이상 필요하지 않음
    const signature = await connection.sendRawTransaction(transactionBuffer, {
      preflightCommitment: 'confirmed'
    });
    
    console.log(`Transaction submitted successfully: ${signature}`);
    
    // Optional: Wait for confirmation
    try {
      await connection.confirmTransaction(signature, 'confirmed');
      console.log(`Transaction confirmed: ${signature}`);
    } catch (confirmError) {
      console.warn(`Warning: Could not confirm transaction: ${confirmError.message}`);
      // Continue anyway, as the transaction has been submitted
    }
    
    // Return success
    return res.status(200).json(
      createApiResponse(true, 'Transaction submitted successfully', {
        signature,
        type: transactionType
      })
    );
  } catch (error) {
    console.error('Transaction submission error:', error);
    
    // Return error
    return res.status(500).json(
      createApiResponse(false, 'Failed to submit transaction', null, error)
    );
  }
}