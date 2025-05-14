/**
 * Enhanced transaction submission API endpoint
 * Provides better error handling and reporting for staking transactions
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createApiResponse } from '../../../shared';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

/**
 * Enhanced error parser for Solana transaction errors
 * Attempts to extract more useful information from error objects
 */
function parseTransactionError(error) {
  if (!error) return { message: 'Unknown error', code: 'unknown' };
  
  try {
    // For VersionedTransaction simulation errors
    if (error.logs) {
      const logs = error.logs || [];
      
      // Look for Anchor program errors in logs
      const anchorErrorLog = logs.find(log => log.includes('AnchorError'));
      if (anchorErrorLog) {
        const errorMatch = anchorErrorLog.match(/Error Code: (\d+)\. Error Message: (.+)$/);
        if (errorMatch) {
          return {
            message: errorMatch[2],
            code: errorMatch[1],
            anchorError: true,
            causedBy: anchorErrorLog.match(/caused by account: ([a-zA-Z0-9_]+)/)?.[1] || 'unknown account',
            logs
          };
        }
      }
      
      // Look for token program errors
      const tokenErrorLog = logs.find(log => 
        log.includes('Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') && 
        log.includes('failed')
      );
      if (tokenErrorLog) {
        return {
          message: 'Token program error: ' + tokenErrorLog,
          code: 'token_program_error',
          logs
        };
      }
      
      // Look for system program errors
      const systemErrorLog = logs.find(log => 
        log.includes('Program 11111111111111111111111111111111') && 
        log.includes('failed')
      );
      if (systemErrorLog) {
        return {
          message: 'System program error: ' + systemErrorLog,
          code: 'system_program_error',
          logs
        };
      }
      
      // General custom program error
      const customErrorLog = logs.find(log => log.includes('Program log: Error:'));
      if (customErrorLog) {
        return {
          message: customErrorLog.replace('Program log: Error:', 'Program error:').trim(),
          code: 'program_error',
          logs
        };
      }
      
      // Return all logs if we couldn't identify a specific error
      return {
        message: 'Transaction simulation failed with logs',
        code: 'simulation_failed',
        logs
      };
    }
    
    // For JSON RPC errors
    if (error.code && typeof error.code === 'number') {
      return {
        message: error.message || 'JSON RPC error',
        code: `rpc_error_${error.code}`,
        data: error.data
      };
    }
    
    // For SendTransactionError 
    if (error.message && error.message.includes('Transaction simulation failed')) {
      // Extract any error info from the message
      const simulationMatch = error.message.match(/Transaction simulation failed: (.+)/);
      if (simulationMatch) {
        return {
          message: simulationMatch[1],
          code: 'simulation_failed',
          raw: error.message
        };
      }
    }
    
    // Default error parsing
    return {
      message: error.message || 'Unknown transaction error',
      code: error.code || 'unknown',
      raw: typeof error === 'object' ? JSON.stringify(error) : String(error)
    };
    
  } catch (parsingError) {
    // If error parsing itself fails, return what we can
    return {
      message: 'Error parsing transaction error: ' + parsingError.message,
      code: 'error_parsing_failed',
      originalError: String(error)
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    const { transaction, type = 'generic' } = req.body;
    
    if (!transaction) {
      return res.status(400).json(
        createApiResponse(false, 'Transaction is required', null, 'MissingTransaction')
      );
    }
    
    console.log(`트랜잭션 제출 요청 받음 (타입: ${type})`);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Deserialize the transaction
    const transactionBuffer = Buffer.from(transaction, 'base64');
    const tx = Transaction.from(transactionBuffer);
    
    // Get serialized transaction with all required signatures
    const rawTransaction = tx.serialize();
    
    // Submit transaction
    let signature;
    try {
      signature = await connection.sendRawTransaction(rawTransaction, {
        // skipPreflight 옵션 제거됨 - IDL 업데이트로 인해 더 이상 필요하지 않음
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      console.log(`트랜잭션 제출됨 (${type}): ${signature}`);
      
      // Wait for confirmation (optional, might timeout on slow networks)
      try {
        const confirmation = await connection.confirmTransaction(
          { signature, blockhash: tx.recentBlockhash, lastValidBlockHeight: 150 }, 
          'confirmed'
        );
        
        if (confirmation.value.err) {
          const parsedError = parseTransactionError(confirmation.value.err);
          console.error(`트랜잭션 확인 오류 (${type}):`, parsedError);
          
          return res.status(400).json(
            createApiResponse(false, `Transaction failed: ${parsedError.message}`, { 
              signature,
              error: parsedError
            }, parsedError)
          );
        }
        
        console.log(`트랜잭션 확인됨 (${type}): ${signature}`);
      } catch (confirmError) {
        // Don't fail the request just because confirmation timed out
        console.warn(`트랜잭션 확인 타임아웃 (${type}): ${signature}`, confirmError.message);
      }
      
    } catch (submitError) {
      const parsedError = parseTransactionError(submitError);
      console.error(`트랜잭션 제출 오류 (${type}):`, parsedError);
      
      return res.status(400).json(
        createApiResponse(false, `Failed to send transaction: ${parsedError.message}`, { 
          error: parsedError 
        }, submitError)
      );
    }
    
    // Return success response with signature
    return res.status(200).json(
      createApiResponse(true, `Transaction submitted successfully (${type})`, {
        signature,
        message: `Transaction of type ${type} was submitted and confirmed`,
        transactionType: type
      })
    );
    
  } catch (error) {
    console.error('일반 트랜잭션 처리 오류:', error);
    return res.status(500).json(
      createApiResponse(false, 'Failed to process transaction request', null, error)
    );
  }
}