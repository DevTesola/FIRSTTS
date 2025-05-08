import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';
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

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
const RESOURCE_CID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';

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
      const lockTimestamp = new Date(lockData.updated_at).getTime();
      const currentTime = Date.now();
      
      if (currentTime - lockTimestamp > LOCK_TIMEOUT_MS) {
        throw new Error(`Lock expired. Lock time: ${lockData.updated_at}, Timeout: ${LOCK_TIMEOUT_MS}ms`);
      }
    }
    
    // Verify wallet ownership
    if (lockData.wallet !== buyerPublicKey.toBase58()) {
      throw new Error('Wallet mismatch, possible front-running attempt');
    }
    
    // Refresh lock timestamp to prevent expiration during minting
    await supabase
      .from('minted_nfts')
      .update({ updated_at: new Date().toISOString() })
      .eq('mint_index', mintIndex)
      .eq('lock_id', lockId)
      .eq('status', 'pending');
    
    console.log(`[${requestId}] Lock verified and refreshed successfully`);
    
    // 2. 결제 트랜잭션 확인
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
    // 민팅 실패 시 상태 리셋 - 결제는 이미 완료되었기 때문에 주의 필요
    if (!nft) {
      console.log('Minting failed after payment, marking as failed:', mintIndex);
      try {
        const { error: updateError } = await supabase
          .from('minted_nfts')
          .update({
            status: 'payment_received_mint_failed',  // 특수 상태로 표시하여 나중에 확인
            updated_at: new Date().toISOString(),
            payment_tx_signature: paymentTxId
            // error_log 필드 사용 시도하지 않음 - 스키마에 없을 수 있음
          })
          .eq('mint_index', mintIndex)
          .eq('lock_id', lockId);
        
        if (updateError) {
          console.error('Failed to update error state:', updateError);
        } else {
          console.log('Successfully reset record for mint_index:', mintIndex);
        }
      } catch (resetErr) {
        console.error('Exception during error state update:', resetErr);
      }
    }
    throw err;
  }
}