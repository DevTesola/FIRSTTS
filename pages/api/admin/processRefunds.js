import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { SOLANA_RPC_ENDPOINT } from '../../../utils/cluster.js';
import { SELLER_KEYPAIR } from '../../../server/utils/sellerKeypair.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Initialize Solana connection
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// Admin auth check function
const isAdmin = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7, authHeader.length);
  if (!token) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('admin_level')
    .eq('api_token', token)
    .single();

  if (error || !data) return false;
  return data.admin_level >= 2; // Require admin level 2 or higher
};

export default async function handler(req, res) {
  const requestId = `req_refund_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  console.log(`[${requestId}] Admin refund processing request received`);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check admin authentication
  if (!await isAdmin(req)) {
    console.error(`[${requestId}] Unauthorized access attempt`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get pending refunds
    const { data: refunds, error: refundsError } = await supabase
      .from('refund_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process up to 10 refunds at a time

    if (refundsError) {
      console.error(`[${requestId}] Error fetching refunds:`, refundsError);
      return res.status(500).json({ error: 'Failed to fetch refunds' });
    }

    if (!refunds || refunds.length === 0) {
      return res.status(200).json({ message: 'No pending refunds to process', processed: 0 });
    }

    console.log(`[${requestId}] Found ${refunds.length} pending refunds to process`);

    // Process each refund
    const results = [];
    for (const refund of refunds) {
      try {
        console.log(`[${requestId}] Processing refund for wallet ${refund.wallet.slice(0, 8)}..., amount: ${refund.amount / 1e9} SOL`);

        // Validate wallet address
        let receiverPublicKey;
        try {
          receiverPublicKey = new PublicKey(refund.wallet);
        } catch (err) {
          throw new Error(`Invalid wallet address: ${refund.wallet}`);
        }

        // Create refund transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: SELLER_KEYPAIR.publicKey,
            toPubkey: receiverPublicKey,
            lamports: refund.amount,
          })
        );

        // Set recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = SELLER_KEYPAIR.publicKey;

        // Sign and send transaction
        const signature = await connection.sendTransaction(transaction, [SELLER_KEYPAIR]);
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`[${requestId}] Refund transaction sent successfully: ${signature}`);

        // Update refund status in database
        const { error: updateError } = await supabase
          .from('refund_queue')
          .update({
            status: 'completed',
            refund_tx_signature: signature,
            processed_at: new Date().toISOString()
          })
          .eq('id', refund.id);

        if (updateError) {
          console.error(`[${requestId}] Error updating refund status:`, updateError);
          throw new Error(`Refund transaction successful but failed to update database: ${updateError.message}`);
        }

        // Log the refund in transaction log
        await supabase
          .from('transaction_logs')
          .insert([{
            wallet: refund.wallet,
            transaction_type: 'refund',
            amount: refund.amount / 1e9,
            signature: signature,
            mint_index: refund.mint_index,
            status: 'completed',
            timestamp: new Date().toISOString(),
            notes: `Refund for failed mint: ${refund.error_reason}`
          }]);

        results.push({
          id: refund.id,
          wallet: refund.wallet,
          amount: refund.amount / 1e9,
          signature: signature,
          status: 'completed'
        });
      } catch (err) {
        console.error(`[${requestId}] Error processing refund ${refund.id}:`, err);

        // Mark as failed but keep in queue
        await supabase
          .from('refund_queue')
          .update({
            status: 'failed',
            error_message: err.message,
            retry_count: (refund.retry_count || 0) + 1,
            last_attempt: new Date().toISOString()
          })
          .eq('id', refund.id);

        results.push({
          id: refund.id,
          wallet: refund.wallet,
          amount: refund.amount / 1e9,
          error: err.message,
          status: 'failed'
        });
      }
    }

    // Return results
    return res.status(200).json({
      message: `Processed ${results.length} refunds`,
      processed: results.length,
      results: results
    });
  } catch (err) {
    console.error(`[${requestId}] Error in refund processing:`, err);
    return res.status(500).json({ error: err.message });
  }
}