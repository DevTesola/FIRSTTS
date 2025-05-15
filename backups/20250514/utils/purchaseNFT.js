import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { SOLANA_RPC_ENDPOINT, COLLECTION_MINT } from './cluster.js';
import { SELLER_KEYPAIR } from '../server/utils/sellerKeypair.js';

const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(SELLER_KEYPAIR));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Get IPFS gateway from env - only log if explicitly enabled
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
if (process.env.LOG_SERVICE_INFO === 'true') {
  console.log('IPFS Gateway being used:', IPFS_GATEWAY);
}

// Maintain gateway array for fallbacks
const IPFS_GATEWAYS = [
  IPFS_GATEWAY,
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud',
  'https://dweb.link'
];

const RESOURCE_CID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';
const NFT_PRICE_LAMPORTS = Number(process.env.NFT_PRICE_LAMPORTS) || 1.5 * 1e9;
const SELLER_PUBLIC_KEY = process.env.NEXT_PUBLIC_SELLER_PUBLIC_KEY || 'qNfZ9QHYyu5dDDMvVAZ1hE55JX4GfUYQyfvLzZKBZi3';

// Lock timeout in milliseconds (3 minutes)
const LOCK_TIMEOUT_MS = 180000;

/**
 * Purchase NFT with improved lock mechanism and timeout handling
 * @param {PublicKey} buyerPublicKey - Buyer's Solana wallet public key
 * @returns {Object} Transaction details for signing by client
 */
export async function purchaseNFT(buyerPublicKey) {
  if (!(buyerPublicKey instanceof PublicKey)) {
    throw new Error('Invalid wallet address');
  }

  let randIndex = null;
  let lockId = null;
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    console.log(`[${requestId}] Starting NFT purchase process...`);
    
    // First, clean up any expired locks to free up available NFTs
    try {
      const { data: cleanupData, error: cleanupError } = await supabase.rpc('clean_expired_locks');
      if (cleanupError) {
        console.warn(`[${requestId}] Warning: Failed to clean expired locks: ${cleanupError.message}`);
      } else if (cleanupData) {
        console.log(`[${requestId}] Cleaned up ${cleanupData} expired locks`);
      }
    } catch (cleanupErr) {
      // Non-critical error, just log and continue
      console.warn(`[${requestId}] Warning: Error during lock cleanup: ${cleanupErr.message}`);
    }
    
    // Create transaction lock with timestamp for timeout tracking
    lockId = `lock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log(`[${requestId}] Selecting random NFT index...`);
    
    // Use enhanced random NFT selection function
    const { data, error } = await supabase.rpc('select_random_nft_index');
    if (error) throw new Error(`Failed to select random NFT index: ${error.message}`);
    if (!data || data.length === 0) throw new Error('No available NFT indices returned');
    randIndex = data[0].mint_index;
    console.log(`[${requestId}] Selected random index: ${randIndex}`);

    // Reserve NFT record and lock with timestamp
    // Include explicit timestamp for lock timeout tracking
    const lockTimestamp = new Date().toISOString();
    const lockResult = await supabase
      .from('minted_nfts')
      .update({
        wallet: buyerPublicKey.toBase58(),
        lock_id: lockId,
        status: 'pending',
        updated_at: lockTimestamp
      })
      .eq('mint_index', randIndex)
      .eq('status', 'available');
    
    if (lockResult.error) {
      throw new Error(`Failed to lock record: ${lockResult.error.message}`);
    }
    
    // Verify lock was successfully acquired
    const { count } = lockResult;
    if (!count || count === 0) {
      throw new Error(`Failed to acquire lock: NFT #${randIndex} may have been selected by another user`);
    }

    // Create payment transaction
    console.log(`[${requestId}] Creating SOL transfer transaction...`);
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        toPubkey: new PublicKey(SELLER_PUBLIC_KEY),
        lamports: NFT_PRICE_LAMPORTS,
      })
    );
    transferTx.feePayer = buyerPublicKey;
    
    // Get latest blockhash with retry logic for better reliability
    let recentBlockhash;
    try {
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      recentBlockhash = blockhash;
    } catch (bhError) {
      console.error(`[${requestId}] Error getting blockhash, retrying once: ${bhError.message}`);
      // Wait briefly and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      recentBlockhash = blockhash;
    }
    
    transferTx.recentBlockhash = recentBlockhash;

    const serializedTx = transferTx.serialize({ requireAllSignatures: false });
    if (serializedTx.length > 1232) {
      throw new Error(`Transaction size exceeds limit: ${serializedTx.length} bytes`);
    }

    // Create payment ID with request ID for traceability
    const paymentId = `pending_${randIndex}_${requestId}_${Date.now()}`;
    
    // Update payment_tx_signature field with retry logic
    const updateResult = await supabase
      .from('minted_nfts')
      .update({
        payment_tx_signature: paymentId,
        // Also refresh the updated_at timestamp to maintain the lock
        updated_at: new Date().toISOString()
      })
      .eq('mint_index', randIndex)
      .eq('lock_id', lockId)
      .eq('status', 'pending'); // Additional safety check
    
    if (updateResult.error) {
      console.warn(`[${requestId}] Warning: Failed to update payment ID: ${updateResult.error.message}`);
      // Continue anyway as this is not critical
    }

    const filename = String(randIndex + 1).padStart(4, '0');
    console.log(`[${requestId}] Transaction prepared successfully:`, { 
      randIndex, 
      filename, 
      paymentId, 
      lockId,
      timeElapsedMs: Date.now() - startTime
    });

    // Add lock expiry information to help client-side timeout handling
    const lockExpiryTime = new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString();
    
    // Important: return serialized transaction as base64 string
    return {
      transaction: serializedTx.toString('base64'),
      filename,
      mintIndex: randIndex,
      lockId: lockId,
      paymentId: paymentId,
      requestId: requestId,
      lockExpiresAt: lockExpiryTime
    };
  } catch (err) {
    console.error(`[${requestId}] Purchase NFT error:`, err);
    
    // Enhanced rollback with detailed logging
    if (randIndex !== null) {
      console.log(`[${requestId}] Preparation failed, rolling back record for mint_index: ${randIndex}`);
      
      // First, check if the lock still belongs to us to avoid race conditions
      const { data: checkData, error: checkError } = await supabase
        .from('minted_nfts')
        .select('lock_id, status')
        .eq('mint_index', randIndex)
        .single();
      
      if (checkError) {
        console.error(`[${requestId}] Failed to check record before rollback:`, checkError);
      } else if (checkData.lock_id !== lockId) {
        console.warn(`[${requestId}] Lock ID mismatch during rollback. Current: ${checkData.lock_id}, Expected: ${lockId}`);
        // Continue with rollback anyway as this is likely our lock that changed
      }
      
      // Proceed with rollback - reset the record status
      const { error: resetError } = await supabase
        .from('minted_nfts')
        .update({
          wallet: 'none',
          status: 'available',
          lock_id: null,
          payment_tx_signature: null,
          updated_at: new Date().toISOString()
        })
        .eq('mint_index', randIndex)
        .eq('lock_id', lockId); // Only reset if lock still matches to avoid race conditions
      
      if (resetError) {
        console.error(`[${requestId}] Failed to reset record:`, resetError);
      } else {
        console.log(`[${requestId}] Successfully reset record for mint_index: ${randIndex}`);
        
        // Optionally log to a separate table for auditing purposes
        try {
          await supabase
            .from('mint_transaction_logs')
            .insert({
              mint_index: randIndex,
              request_id: requestId,
              action: 'rollback',
              error_message: err.message,
              lock_id: lockId,
              wallet: buyerPublicKey.toBase58(),
              timestamp: new Date().toISOString()
            })
            .select();
        } catch (logError) {
          // Non-critical, just for logging
          console.warn(`[${requestId}] Failed to log rollback:`, logError);
        }
      }
    }
    
    // Enhance error message with request ID for traceability
    const enhancedError = new Error(`[${requestId}] ${err.message}`);
    enhancedError.originalError = err;
    enhancedError.requestId = requestId;
    enhancedError.mintIndex = randIndex;
    throw enhancedError;
  }
}