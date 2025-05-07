// utils/feeEstimator.js
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

/**
 * Estimates the gas fee for a basic Solana transaction
 * This will provide users with an expected transaction cost
 * 
 * @param {string} rpcEndpoint - Solana RPC endpoint (e.g., 'https://api.devnet.solana.com')
 * @param {string} fromAddress - Sender wallet address
 * @param {string} toAddress - Recipient wallet address (optional)
 * @returns {Promise<Object>} Fee estimates in different formats
 */
export async function estimateTransactionFee(
  rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  fromAddress,
  toAddress = null
) {
  try {
    if (!fromAddress) {
      throw new Error('Sender address is required');
    }
    
    // Connect to Solana
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Create a sample transaction similar to what we'd use for minting
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = toAddress ? new PublicKey(toAddress) : fromPubkey;
    
    // Create a minimal transaction (we'll just use a 0 SOL transfer to estimate fees)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 0, // Just for estimation, no actual transfer
      })
    );
    
    // Get blockhash for transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;
    
    // Get the fee for this transaction
    const fee = await connection.getFeeForMessage(
      transaction.compileMessage(),
      'confirmed'
    );
    
    if (!fee || !fee.value) {
      throw new Error('Failed to estimate transaction fee');
    }
    
    const feeInLamports = fee.value;
    const feeInSol = feeInLamports / 1_000_000_000; // Convert lamports to SOL
    
    // Get current SOL price (in mock implementation, just return a hardcoded value)
    // In production, you would call a price API
    const solPriceUsd = await getMockSolPrice();
    
    // Calculate USD value
    const feeInUsd = feeInSol * solPriceUsd;
    
    return {
      feeInLamports,
      feeInSol,
      feeInUsd,
      solPriceUsd,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error estimating transaction fee:', error);
    throw error;
  }
}

/**
 * Mock function to get SOL price
 * In a production environment, this would call a price API
 * 
 * @returns {Promise<number>} SOL price in USD
 */
async function getMockSolPrice() {
  // In production, replace this with an actual API call
  // e.g., to CoinGecko, Binance, etc.
  return 21.47; // Example SOL price in USD
}

/**
 * Estimates the total cost of minting an NFT (transaction fee + mint price)
 * 
 * @param {string} rpcEndpoint - Solana RPC endpoint
 * @param {string} walletAddress - User's wallet address
 * @param {number} mintPriceSol - Mint price in SOL
 * @returns {Promise<Object>} Total cost estimates
 */
export async function estimateMintCost(
  rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  walletAddress,
  mintPriceSol = 1.5
) {
  try {
    // Get transaction fee estimate
    const feeEstimate = await estimateTransactionFee(
      rpcEndpoint,
      walletAddress
    );
    
    // Calculate total cost
    const totalCostSol = mintPriceSol + feeEstimate.feeInSol;
    const totalCostUsd = totalCostSol * feeEstimate.solPriceUsd;
    
    return {
      mintPriceSol,
      mintPriceUsd: mintPriceSol * feeEstimate.solPriceUsd,
      transactionFeeSol: feeEstimate.feeInSol,
      transactionFeeUsd: feeEstimate.feeInUsd,
      totalCostSol,
      totalCostUsd,
      solPriceUsd: feeEstimate.solPriceUsd,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error estimating mint cost:', error);
    throw error;
  }
}