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
    
    let signature;
    
    try {
      // 트랜잭션 시뮬레이션으로 유효성 확인
      const simulation = await connection.simulateTransaction(tx);
      
      // 시뮬레이션 결과 확인
      if (simulation.value.err) {
        const errorMsg = simulation.value.err.toString();
        console.error(`Transaction simulation failed: ${errorMsg}`);
        
        // 이미 처리된 트랜잭션인 경우 특별 처리
        if (errorMsg.includes("already been processed")) {
          return res.status(409).json(
            createApiResponse(false, 'Transaction has already been processed', { 
              error: errorMsg,
              type: 'DUPLICATE_TRANSACTION'
            })
          );
        }
        
        throw new Error(`Simulation failed: ${errorMsg}`);
      }
      
      // 시뮬레이션 통과 후 트랜잭션 제출
      signature = await connection.sendRawTransaction(transactionBuffer, {
        preflightCommitment: 'confirmed',
        skipPreflight: false // 시뮬레이션을 이미 했으므로 preflightCheck는 필요 없음
      });
    } catch (simError) {
      // 시뮬레이션 자체가 실패한 경우
      if (simError.message && simError.message.includes("already been processed")) {
        return res.status(409).json(
          createApiResponse(false, 'Transaction has already been processed', { 
            error: simError.message,
            type: 'DUPLICATE_TRANSACTION'
          })
        );
      }
      throw simError; // 다시 던져서 아래 catch 블록에서 처리
    }
    
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