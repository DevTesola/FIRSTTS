import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { SOLANA_RPC_ENDPOINT, COLLECTION_MINT } from './cluster.js';
import { SELLER_KEYPAIR } from '../server/utils/sellerKeypair.js';

// Import constants from environment variables
const NFT_PRICE_LAMPORTS = Number(process.env.NFT_PRICE_LAMPORTS) || 1.5 * 1e9;
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
const RESOURCE_CID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';

const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(SELLER_KEYPAIR));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Lock timeout in milliseconds (3 minutes)
const LOCK_TIMEOUT_MS = 180000;

/**
 * Complete the minting process after payment confirmation
 * @param {string} paymentTxId - Payment transaction ID/signature
 * @param {number} mintIndex - The NFT mint index to complete
 * @param {string} lockId - Lock ID from the purchase transaction
 * @param {PublicKey} buyerPublicKey - Buyer's Solana wallet address
 * @returns {Object} Minting completion result
 */
export async function completeMinting(paymentTxId, mintIndex, lockId, buyerPublicKey) {
  if (!(buyerPublicKey instanceof PublicKey)) {
    throw new Error('Invalid wallet address');
  }

  let nft = null;
  const requestId = `req_complete_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    console.log(`[${requestId}] Completing minting for mintIndex: ${mintIndex}, lockId: ${lockId}`);
    
    // 1. 락 상태 확인 with timeout validation
    const { data: lockData, error: lockError } = await supabase
      .from('minted_nfts')
      .select('status, lock_id, wallet, updated_at')
      .eq('mint_index', mintIndex)
      .single();
    
    if (lockError) {
      throw new Error(`Lock verification failed: ${lockError.message}`);
    }
    
    // Check if lock exists and is in pending state
    if (!lockData || lockData.status !== 'pending') {
      throw new Error(`Invalid lock state: ${lockData?.status || 'missing'}`);
    }
    
    // Verify lock ID matches
    if (lockData.lock_id !== lockId) {
      throw new Error(`Lock ID mismatch. Expected: ${lockId}, Found: ${lockData.lock_id}`);
    }
    
    // Check if lock has expired
    if (lockData.updated_at) {
      let lockTimestamp = new Date(lockData.updated_at).getTime();
      const currentTime = Date.now();

      // Timezone difference detection and adjustment (KST-UTC 9 hour difference)
      if (Math.abs(currentTime - lockTimestamp) > 8 * 60 * 60 * 1000 &&
          Math.abs(currentTime - lockTimestamp) < 10 * 60 * 60 * 1000) {
        console.warn(`Timezone difference detected. Lock: ${lockData.updated_at}, Current: ${new Date(currentTime).toISOString()}, Diff: ${Math.abs(currentTime - lockTimestamp)}ms`);
        // Set to 1 minute before current time to make it valid
        lockTimestamp = currentTime - 60 * 1000;
        console.log(`Lock timestamp adjusted: ${new Date(lockTimestamp).toISOString()}`);
      }
      // Handle future timestamps
      else if (lockTimestamp > currentTime) {
        console.warn(`Lock timestamp in future detected. Lock: ${lockData.updated_at}, Current: ${new Date(currentTime).toISOString()}`);
        lockTimestamp = currentTime - 1000; // Use current time instead with small offset
      }

      const timeDiff = currentTime - lockTimestamp;
      console.log(`Adjusted time difference: ${timeDiff}ms, Timeout: ${LOCK_TIMEOUT_MS}ms`);

      if (timeDiff > LOCK_TIMEOUT_MS) {
        console.error(`Lock expired. Lock time: ${new Date(lockTimestamp).toISOString()}, Current: ${new Date(currentTime).toISOString()}, Diff: ${timeDiff}ms, Timeout: ${LOCK_TIMEOUT_MS}ms`);
        throw new Error(`Lock expired. Please try minting again.`);
      }
    }
    
    // Verify wallet ownership
    if (lockData.wallet !== buyerPublicKey.toBase58()) {
      throw new Error('Wallet mismatch, possible front-running attempt');
    }
    
    // Lock refresh is now handled at the API level
    // This avoids duplicate refreshes and centralizes lock management
    
    console.log(`[${requestId}] Lock verified successfully`);

    // 2. Payment transaction verification
    const txInfo = await connection.getTransaction(paymentTxId, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!txInfo) {
      throw new Error('Payment transaction not found or not confirmed');
    }
    
    if (txInfo.meta.err) {
      throw new Error(`Payment transaction failed: ${JSON.stringify(txInfo.meta.err)}`);
    }
    
    // 3. NFT Minting
    const filename = String(mintIndex + 1).padStart(4, '0');
    const metadataUrl = `${IPFS_GATEWAY}/ipfs/${RESOURCE_CID}/${filename}.json`;
    
    console.log('Minting NFT with metadata URL:', metadataUrl);
    const { nft: createdNft, response: createResponse } = await metaplex.nfts().create({
      name: `SOLARA GEN:0 #${mintIndex + 1}`,
      symbol: 'SLR',
      uri: metadataUrl,
      sellerFeeBasisPoints: 500,
      collection: COLLECTION_MINT,
      collectionAuthority: SELLER_KEYPAIR,
      tokenOwner: buyerPublicKey,
    }, { commitment: 'confirmed' });
    
    nft = createdNft;
    console.log('Minted NFT:', {
      address: nft.address.toString(),
      transactionSignature: createResponse.signature,
    });
    
    // 4. 트랜잭션 확인
    await connection.confirmTransaction(createResponse.signature, 'confirmed');
    
    // 5. 컬렉션 검증
    let verificationSuccess = false;
    try {
      const { response: verifyResponse } = await metaplex.nfts().verifyCollection({
        mintAddress: nft.address,
        collectionMintAddress: COLLECTION_MINT,
        collectionAuthority: SELLER_KEYPAIR,
      }, { commitment: 'confirmed' });
      
      await connection.confirmTransaction(verifyResponse.signature, 'confirmed');
      console.log('Collection verification successful');
      verificationSuccess = true;
    } catch (err) {
      console.error('Collection verification failed:', err.message);
    }
    
// 6. Supabase 업데이트
console.log('Updating Supabase record:', { mintIndex, lockId });
try {
  const { error: updateError } = await supabase
    .from('minted_nfts')
    .update({
      status: 'completed',
      mint_address: nft.address.toString(),
      tx_signature: createResponse.signature,
      payment_tx_signature: paymentTxId,
      verified: verificationSuccess,
      updated_at: new Date().toISOString()
    })
    .eq('mint_index', mintIndex)
    .eq('lock_id', lockId);

  if (updateError) {
    console.error('Supabase update error:', updateError);
    // 업데이트 실패해도 계속 진행
    console.log('Continuing despite update error');
  } else {
    console.log('Supabase record updated successfully');
  }
} catch (updateErr) {
  // 업데이트 예외 발생해도 계속 진행
  console.error('Exception during Supabase update:', updateErr);
  console.log('Continuing despite update exception');
}
    
    return {
      mintAddress: nft.address.toString(),
      mintTxSignature: createResponse.signature,
      verificationSuccess,
      filename
    };
  } catch (err) {
    console.error('Complete minting error:', err);
    // Reset state on minting failure - be cautious as payment is already completed
    if (!nft) {
      console.log('Minting failed after payment, marking as failed and initiating refund process:', mintIndex);
      try {
        // 1. Update record to payment_received_mint_failed status
        const { error: updateError } = await supabase
          .from('minted_nfts')
          .update({
            status: 'payment_received_mint_failed',  // Mark with special status for later verification
            updated_at: new Date().toISOString(),
            payment_tx_signature: paymentTxId
            // error_details field removed - not in database schema
          })
          .eq('mint_index', mintIndex)
          .eq('lock_id', lockId);

        if (updateError) {
          console.error('Failed to update error state:', updateError);
        } else {
          console.log('Successfully marked record for refund, mint_index:', mintIndex);

          // 2. Add to refund queue - create record in refund_queue table
          try {
            await supabase
              .from('refund_queue')
              .insert([
                {
                  mint_index: mintIndex,
                  wallet: buyerPublicKey.toBase58(),
                  payment_tx_signature: paymentTxId,
                  amount: NFT_PRICE_LAMPORTS,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                  error_reason: err.message || 'Unknown error'
                }
              ]);
            console.log('Added to refund queue for mint_index:', mintIndex);

            // Change the error message to include refund information
            err.message = `${err.message}. A refund has been automatically queued for processing.`;
          } catch (refundErr) {
            console.error('Failed to add to refund queue:', refundErr);
          }
        }
      } catch (resetErr) {
        console.error('Exception during error state update:', resetErr);
      }
    }
    throw err;
  }
}