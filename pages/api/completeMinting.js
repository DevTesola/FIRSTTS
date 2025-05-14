import { PublicKey } from '@solana/web3.js';
import { completeMinting } from '../../utils/completeMinting';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, paymentTxId, mintIndex, lockId } = req.body;

    if (!wallet || !paymentTxId || mintIndex === undefined || !lockId) {
      return res.status(400).json({
        error: 'Missing required parameters. wallet, paymentTxId, mintIndex, and lockId are all required.'
      });
    }

    let publicKey;
    try {
      publicKey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Refresh the lock before proceeding with minting
    const { error: refreshError } = await supabase
      .from('minted_nfts')
      .update({ updated_at: new Date().toISOString() })
      .eq('mint_index', mintIndex)
      .eq('lock_id', lockId)
      .eq('wallet', wallet);

    if (refreshError) {
      console.warn(`Warning: Failed to refresh lock before minting: ${refreshError.message}`);
      // Continue anyway since completeMinting will check lock validity
    } else {
      console.log(`Successfully refreshed lock for mint_index ${mintIndex} before proceeding`);
    }

    const result = await completeMinting(paymentTxId, mintIndex, lockId, publicKey);

    res.status(200).json(result);
  } catch (err) {
    console.error('Complete minting API error:', err);

    // Improved error response with more context
    let statusCode = 500;
    let errorMessage = err.message;

    // Format user-friendly error messages based on error type
    if (err.message.includes('Lock expired')) {
      statusCode = 400;
      errorMessage = 'Your minting session has expired. Please try again. A refund will be processed if payment was completed.';
    } else if (err.message.includes('Payment transaction not found')) {
      statusCode = 400;
      errorMessage = 'Payment transaction could not be verified. Please check your wallet and try again.';
    } else if (err.message.includes('Wallet mismatch')) {
      statusCode = 403;
      errorMessage = 'Wallet authorization failed. Please use the same wallet throughout the minting process.';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}