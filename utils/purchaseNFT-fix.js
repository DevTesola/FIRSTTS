import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
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
const NFT_PRICE_LAMPORTS = Number(process.env.NFT_PRICE_LAMPORTS) || 1.5 * LAMPORTS_PER_SOL;
const SELLER_PUBLIC_KEY = process.env.NEXT_PUBLIC_SELLER_PUBLIC_KEY || 'qNfZ9QHYyu5dDDMvVAZ1hE55JX4GfUYQyfvLzZKBZi3';

// Lock timeout in milliseconds (3 minutes)
const LOCK_TIMEOUT_MS = 180000;

/**
 * Enhanced function to clean all expired locks
 * @param {number} timeoutMinutes - Time in minutes to consider as expired (default: 60 minutes)
 * @returns {Promise<boolean>} Success status
 */
async function cleanAllExpiredLocks(timeoutMinutes = 60) {
  try {
    console.log(`[LOCK] Starting cleanup of all locks older than ${timeoutMinutes} minutes...`);
    
    // 직접 SQL 쿼리를 사용하여 모든 만료된 락 정리
    const { data, error } = await supabase
      .from('minted_nfts')
      .update({
        wallet: 'none',
        status: 'available',
        lock_id: null,
        payment_tx_signature: null,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('updated_at', new Date(Date.now() - (timeoutMinutes * 60 * 1000)).toISOString())
      .select('mint_index');
    
    if (error) {
      console.warn(`[LOCK] Cleanup error: ${error.message}`);
      return false;
    }
    
    const cleanedCount = data?.length || 0;
    console.log(`[LOCK] Cleaned ${cleanedCount} expired locks`);
    
    if (cleanedCount > 0) {
      console.log(`[LOCK] Cleaned mint indices: ${data.map(r => r.mint_index).join(', ')}`);
    }
    
    // 이중 안전장치: 오래된 lock_id가 있는 레코드도 정리
    const { data: idCleanData, error: idCleanError } = await supabase
      .from('minted_nfts')
      .update({
        wallet: 'none', 
        status: 'available',
        lock_id: null,
        payment_tx_signature: null,
        updated_at: new Date().toISOString()
      })
      .not('lock_id', 'is', null)
      .lt('updated_at', new Date(Date.now() - (timeoutMinutes * 60 * 1000)).toISOString())
      .select('mint_index');
    
    if (idCleanError) {
      console.warn(`[LOCK] ID-based cleanup error: ${idCleanError.message}`);
    } else {
      const idCleanCount = idCleanData?.length || 0;
      if (idCleanCount > 0) {
        console.log(`[LOCK] Cleaned additional ${idCleanCount} records with old lock_id`);
        console.log(`[LOCK] Additional cleaned mint indices: ${idCleanData.map(r => r.mint_index).join(', ')}`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('[LOCK] Lock cleanup exception:', err);
    return false;
  }
}

/**
 * Create NFT purchase transaction - improved lock mechanism solves concurrent access issues
 * @param {PublicKey} buyerPublicKey - Buyer's Solana wallet public key
 * @returns {Object} Transaction details for client signing
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

    // Clean expired locks at session start
    await cleanAllExpiredLocks(60); // Clean all locks older than 60 minutes

    // Create transaction lock with timestamp for timeout tracking
    lockId = `lock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Use atomic selection and lock setting function (improved approach)
    console.log(`[${requestId}] Starting atomic NFT selection and lock setup...`);
    const { data: selectedNft, error: selectError } = await supabase.rpc(
      'atomic_select_and_lock_nft',
      {
        p_wallet: buyerPublicKey.toBase58(),
        p_lock_id: lockId
      }
    );

    if (selectError) throw new Error(`NFT selection and lock setup failed: ${selectError.message}`);
    if (!selectedNft || selectedNft.length === 0) throw new Error('No available NFTs');

    randIndex = selectedNft[0].mint_index;
    console.log(`[${requestId}] NFT #${randIndex} atomic selection and lock setup successful`);

    // Double safety verification - verify lock was successfully acquired
    const { data: nftCheck, error: nftCheckError } = await supabase
      .from('minted_nfts')
      .select('status, lock_id')
      .eq('mint_index', randIndex)
      .single();

    if (nftCheckError) {
      console.warn(`[${requestId}] Warning: NFT verification failed: ${nftCheckError.message}`);
      // Continue anyway - we already acquired the lock
    } else if (nftCheck.lock_id !== lockId) {
      console.error(`[${requestId}] Error: Lock ID mismatch. Found: ${nftCheck.lock_id}, Expected: ${lockId}`);
      throw new Error(`Lock ID mismatch - internal state error`);
    }

    // Create payment transaction
    console.log(`[${requestId}] Creating SOL transfer transaction...`);
    
    // Create SystemProgram transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      toPubkey: new PublicKey(SELLER_PUBLIC_KEY),
      lamports: NFT_PRICE_LAMPORTS,
    });
    
    // Create memo instruction for better wallet display
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(`💰 SOLARA NFT Price: ${NFT_PRICE_LAMPORTS/LAMPORTS_PER_SOL} SOL - Minting Payment`, 'utf8'),
    });
    
    // Add both instructions to transaction
    const transferTx = new Transaction()
      .add(transferInstruction)
      .add(memoInstruction);
      
    transferTx.feePayer = buyerPublicKey;
    
    // Get latest blockhash (with retry logic)
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

    // 결제 ID (추적 가능성을 위한 요청 ID 포함)
    const paymentId = `pending_${randIndex}_${requestId}_${Date.now()}`;
    
    // payment_tx_signature 필드 업데이트 (재시도 로직 포함)
    const updateResult = await supabase
      .from('minted_nfts')
      .update({
        payment_tx_signature: paymentId,
        // 락을 유지하기 위해 updated_at 타임스탬프도 새로고침
        updated_at: new Date().toISOString()
      })
      .eq('mint_index', randIndex)
      .eq('lock_id', lockId)
      .eq('status', 'pending');
    
    if (updateResult.error) {
      console.warn(`[${requestId}] Warning: Failed to update payment ID: ${updateResult.error.message}`);
      // 이것은 중요하지 않으므로 계속 진행
    }

    const filename = String(randIndex + 1).padStart(4, '0');
    console.log(`[${requestId}] Transaction prepared successfully:`, { 
      randIndex, 
      filename, 
      paymentId, 
      lockId,
      timeElapsedMs: Date.now() - startTime
    });

    // 클라이언트측 타임아웃 처리를 돕기 위해 락 만료 정보 추가
    const lockExpiryTime = new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString();
    
    // 중요: 직렬화된 트랜잭션을 base64 문자열로 반환
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
    
    // 향상된 롤백 (상세 로깅 포함)
    if (randIndex !== null) {
      console.log(`[${requestId}] Preparation failed, rolling back record for mint_index: ${randIndex}`);
      
      // 먼저 락이 여전히 우리에게 속해 있는지 확인하여 경쟁 조건 방지
      const { data: checkData, error: checkError } = await supabase
        .from('minted_nfts')
        .select('lock_id, status')
        .eq('mint_index', randIndex)
        .single();
      
      if (checkError) {
        console.error(`[${requestId}] Failed to check record before rollback:`, checkError);
      } else if (checkData.lock_id !== lockId) {
        console.warn(`[${requestId}] Lock ID mismatch during rollback. Current: ${checkData.lock_id}, Expected: ${lockId}`);
        // 이것은 우리 락이 변경되었을 가능성이 높으므로 어쨌든 롤백은 계속
      }
      
      // 롤백 진행 - 레코드 상태 재설정
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
        .eq('lock_id', lockId); // 락이 여전히 일치하는 경우에만 재설정하여 경쟁 조건 방지
      
      if (resetError) {
        console.error(`[${requestId}] Failed to reset record:`, resetError);
      } else {
        console.log(`[${requestId}] Successfully reset record for mint_index: ${randIndex}`);
        
        // 선택적으로 감사 목적으로 별도 테이블에 로깅
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
          // 로깅용이므로 중요하지 않음
          console.warn(`[${requestId}] Failed to log rollback:`, logError);
        }
      }
    }
    
    // 추적 가능성을 위해 요청 ID로 오류 메시지 향상
    const enhancedError = new Error(`[${requestId}] ${err.message}`);
    enhancedError.originalError = err;
    enhancedError.requestId = requestId;
    enhancedError.mintIndex = randIndex;
    throw enhancedError;
  }
}