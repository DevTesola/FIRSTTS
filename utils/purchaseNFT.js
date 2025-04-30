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
  'https://dweb.link',
  'https://ipfs.fleek.co',
  'https://ipfs.infura.io'
];

const RESOURCE_CID = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';
const NFT_PRICE_LAMPORTS = Number(process.env.NFT_PRICE_LAMPORTS) || 1.5 * 1e9;
const SELLER_PUBLIC_KEY = process.env.NEXT_PUBLIC_SELLER_PUBLIC_KEY || 'qNfZ9QHYyu5dDDMvVAZ1hE55JX4GfUYQyfvLzZKBZi3';

export async function purchaseNFT(buyerPublicKey) {
  if (!(buyerPublicKey instanceof PublicKey)) {
    throw new Error('Invalid wallet address');
  }

  let randIndex = null;
  let lockId = null;

  try {
    console.log('Selecting random NFT index...');
    
    // Create transaction lock (prevent double minting)
    lockId = `lock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const { data, error } = await supabase.rpc('select_random_nft_index');
    if (error) throw new Error(`Failed to select random NFT index: ${error.message}`);
    if (!data || data.length === 0) throw new Error('No available NFT indices returned');
    randIndex = data[0].mint_index;
    console.log('Selected random index:', randIndex);

    // Reserve NFT record and lock
    const lockResult = await supabase
      .from('minted_nfts')
      .update({
        wallet: buyerPublicKey.toBase58(),
        lock_id: lockId,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('mint_index', randIndex)
      .eq('status', 'available');
    
    if (lockResult.error) {
      throw new Error(`Failed to lock record: ${lockResult.error.message}`);
    }

    // Create payment transaction
    console.log('Creating SOL transfer transaction...');
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        toPubkey: new PublicKey(SELLER_PUBLIC_KEY),
        lamports: NFT_PRICE_LAMPORTS,
      })
    );
    transferTx.feePayer = buyerPublicKey;
    transferTx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

    const serializedTx = transferTx.serialize({ requireAllSignatures: false });
    if (serializedTx.length > 1232) {
      throw new Error(`Transaction size exceeds limit: ${serializedTx.length} bytes`);
    }

    // Create payment ID
    const paymentId = `pending_${randIndex}_${Date.now()}`;
    
    // Update payment_tx_signature field
    await supabase
      .from('minted_nfts')
      .update({
        payment_tx_signature: paymentId
      })
      .eq('mint_index', randIndex)
      .eq('lock_id', lockId);

    const filename = String(randIndex + 1).padStart(4, '0');
    console.log('Transaction prepared successfully:', { 
      randIndex, 
      filename, 
      paymentId, 
      lockId
    });

    // Important: return serialized transaction as base64 string
    return {
      transaction: serializedTx.toString('base64'),
      filename,
      mintIndex: randIndex,
      lockId: lockId,
      paymentId: paymentId
    };
  } catch (err) {
    console.error('Purchase NFT error:', err);
    if (randIndex !== null) {
      console.log('Preparation failed, rolling back record for mint_index:', randIndex);
      const { error: resetError } = await supabase
        .from('minted_nfts')
        .update({
          wallet: 'none',
          status: 'available',
          lock_id: null,
          payment_tx_signature: null,
          updated_at: new Date().toISOString()
        })
        .eq('mint_index', randIndex);
      if (resetError) console.error('Failed to reset record:', resetError);
      else console.log('Successfully reset record for mint_index:', randIndex);
    }
    throw err;
  }
}